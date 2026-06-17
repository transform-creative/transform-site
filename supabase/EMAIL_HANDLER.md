# Email handler — setup & next steps

The `email-handler` edge function drains a pgmq queue (`general_email_queue`)
and ships each message through a react-email template via Maileroo. It mirrors
the Ping-Pong-A-Thon pattern: producers (Postgres triggers) shove a JSON
message onto the queue, the function pulls a small batch every minute, and
archives each message as it succeeds.

Two templates are wired up to start:

| `type`                       | Template                          | Goes to                                  | Fires when                          |
| ---------------------------- | --------------------------------- | ---------------------------------------- | ----------------------------------- |
| `issue.created`              | `NewIssueDeveloperEmail.tsx`      | `support@transformcreative.org.au`       | a new row lands in `issues`         |
| `issue.ready_for_review`     | `IssueForReviewClientEmail.tsx`   | a member of the reporting client's org   | `issues.updated_at` flips from null |

---

## 1. One-time Supabase setup

Run these in the SQL editor (or as a migration) **before** wiring up any
triggers. They install pgmq + create the queue, install the cron + http
extensions used by the producer/consumer triggers, and store the function URL
and headers as Vault secrets.

```sql
-- Extensions
create extension if not exists pgmq          with schema extensions;
create extension if not exists pg_cron       with schema extensions;
create extension if not exists pg_net        with schema extensions;

-- Queue
select pgmq.create('general_email_queue');

-- Allow the public API surface to use pgmq (Supabase pgmq_public wrapper).
grant usage on schema pgmq_public to service_role;
```

---

## 2. Edge function secrets

```bash
supabase link --project-ref hzfjmmakqwsmucxorhlb
supabase secrets set \
  MAILEROO_SENDING_KEY="<maileroo api key>"
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied automatically.

supabase functions deploy email-handler
```

> Verified senders matter: make sure `no-reply@transformcreative.org.au` is
> verified in Maileroo (SPF + DKIM) before pointing real traffic at it,
> otherwise everything bounces. Swap the `SENDING_EMAIL` constant in
> `generateEmailBody.ts` if you'd rather send from a different verified
> address.

---

## 3. Drain the queue on a schedule

The function only runs when invoked, so schedule it via `pg_cron` once the
function is deployed. Adjust the interval to taste — every minute keeps mail
feeling instant without thrashing Maileroo.

```sql
-- Replace <function-url> with the deployed URL,
--   e.g. https://hzfjmmakqwsmucxorhlb.functions.supabase.co/email-handler
-- Replace <service-role-jwt> with the project's service-role key.

select cron.schedule(
  'drain-general-email-queue',
  '* * * * *',                       -- every minute
  $$
  select net.http_post(
    url     := '<function-url>',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <service-role-jwt>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

---

## 4. Producer trigger — `issue.created`

Fires on every `INSERT` into `public.issues` and pushes a fully-hydrated
message onto the queue. Pulls the reporting client's name + email from
`profiles` + `auth.users`, and the business name from `businesses`, so the
edge function never has to look anything up.

```sql
create or replace function public.notify_issue_created_email()
returns trigger
language plpgsql
security definer
as $$
declare
  reporter_name  text;
  reporter_email text;
  business_name  text;
begin
  select coalesce(p.first_name || ' ' || p.last_name, p.first_name, p.last_name),
         u.email
    into reporter_name, reporter_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = new.client_id;

  select b.name into business_name
  from public.businesses b
  where b.id = new.business_id;

  perform pgmq.send(
    'general_email_queue',
    jsonb_build_object(
      'type',           'issue.created',
      'issue_id',       new.id,
      'title',          new.title,
      'description',    new.description,
      'severity',       new.severity,
      'issue_type',     new.issue_type,
      'more_info',      new.more_info,
      'created_at',     new.created_at,
      'reporter_name',  reporter_name,
      'reporter_email', reporter_email,
      'business_id',    new.business_id,
      'business_name',  business_name,
      'ai_status',      new.ai_status
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_issue_created_email on public.issues;
create trigger trg_notify_issue_created_email
  after insert on public.issues
  for each row
  execute function public.notify_issue_created_email();
```

---

## 5. Producer trigger — `issue.ready_for_review`

Fires when an admin marks an issue ready for the client to review — i.e.
`updated_at` transitions from `null` to a value (per the `deriveIssueStatus`
contract in `~/business/commonBL.tsx`). Sends to **the reporting client**
(the user who opened the issue). If you'd rather email every member of the
client's organisation, swap the lookup for a loop over `profiles_to_businesses`
joined to the owning business — left as a follow-up.

```sql
create or replace function public.notify_issue_ready_for_review_email()
returns trigger
language plpgsql
security definer
as $$
declare
  recipient_name  text;
  recipient_email text;
  business_name   text;
begin
  -- Only fire on the transition into "awaiting_approval".
  if new.updated_at is null then return new; end if;
  if old.updated_at is not null then return new; end if;
  if new.approved_at is not null then return new; end if;

  select coalesce(p.first_name, ''),
         u.email
    into recipient_name, recipient_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = new.client_id;

  select b.name into business_name
  from public.businesses b
  where b.id = new.business_id;

  perform pgmq.send(
    'general_email_queue',
    jsonb_build_object(
      'type',            'issue.ready_for_review',
      'issue_id',        new.id,
      'title',           new.title,
      'description',     new.description,
      'severity',        new.severity,
      'issue_type',      new.issue_type,
      'more_info',       new.more_info,
      'created_at',      new.created_at,
      'updated_at',      new.updated_at,
      'business_name',   business_name,
      'recipient_name',  recipient_name,
      'recipient_email', recipient_email,
      'pr_url',          new.ai_pr_url
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_issue_ready_for_review_email on public.issues;
create trigger trg_notify_issue_ready_for_review_email
  after update on public.issues
  for each row
  execute function public.notify_issue_ready_for_review_email();
```

---

## 6. Smoke test

```sql
-- Push a fake message straight onto the queue:
select pgmq.send(
  'general_email_queue',
  jsonb_build_object(
    'type', 'issue.created',
    'issue_id', 9999,
    'title', 'Test issue from SQL editor',
    'description', 'Just confirming the email handler is wired up.',
    'severity', 'moderate',
    'issue_type', 'bug',
    'created_at', now(),
    'reporter_name', 'Isaac',
    'reporter_email', 'idrury@transformcreative.com.au',
    'business_name', 'Transform Creative'
  )
);

-- Then invoke the function manually:
--   curl -X POST '<function-url>' -H 'Authorization: Bearer <service-role-jwt>'
```

If support@transformcreative.org.au receives the email, the chain is healthy
and the cron job will keep draining the queue from there.

---

## Env vars summary

| Where               | Name                       | Purpose                                     |
| ------------------- | -------------------------- | ------------------------------------------- |
| Edge function       | `MAILEROO_SENDING_KEY`     | Maileroo HTTP API key                       |
| Edge function (auto)| `SUPABASE_URL`             | Read off the queue                          |
| Edge function (auto)| `SUPABASE_SERVICE_ROLE_KEY`| Read off the queue, archive messages        |
| pg_cron             | `<function-url>`           | The deployed email-handler URL              |
| pg_cron             | `<service-role-jwt>`       | Auth header so the function accepts the POST|
