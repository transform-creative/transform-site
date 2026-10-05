-- /church — Church Creative Partner: plan-builder leads + activity logging.
--
-- 1. audit_logs — the activity/event log, same shape as the Ping Pong-A-Thon
--    table. Rows are written only by the `insert-logs` edge function (service
--    role, rate-limited per IP), so there is deliberately no INSERT policy.
--    Agency admins (Transform Creative, business 129) can read them for the
--    admin dashboard and mark them read.
--
-- 2. "Email me this plan" — the page saves the lead into `responses` (as
--    /forms does) with metadata.formId = 'church-plan'. This trigger queues a
--    `church_plan.requested` email on general_email_queue; email-handler
--    renders it and attaches the plan PDF.
--
-- NOT YET APPLIED to the live project. Before applying, check whether
-- `audit_logs` already exists there (it isn't in the generated types) and
-- that anon INSERT on `responses` is allowed (/forms relies on it).

-- 1. audit_logs ---------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  "timestamp" timestamptz not null default now(),
  user_id     uuid,
  event_type  text not null,
  severity    text check (severity in ('info', 'warning', 'error', 'critical')),
  metadata    jsonb default '{}'::jsonb,
  ip_address  text,
  is_read     boolean default false
);

alter table public.audit_logs enable row level security;

create index if not exists audit_logs_event_type_timestamp_idx
  on public.audit_logs (event_type, "timestamp" desc);

drop policy if exists "Agency admins read audit logs" on public.audit_logs;
create policy "Agency admins read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.current_user_owns_business(129));

drop policy if exists "Agency admins mark audit logs read" on public.audit_logs;
create policy "Agency admins mark audit logs read"
  on public.audit_logs for update
  to authenticated
  using (public.current_user_owns_business(129))
  with check (public.current_user_owns_business(129));

-- 2. Church plan email --------------------------------------------------------
create or replace function public.notify_church_plan_requested_email()
returns trigger
language plpgsql
security definer
as $$
declare
  meta  jsonb := new.metadata::jsonb;
  email text  := lower(trim(meta->>'email'));
begin
  if meta->>'formId' is distinct from 'church-plan' then return new; end if;

  -- Honeypot filled in: a bot. Keep the row, send nothing.
  if coalesce(meta->>'website', '') <> '' then return new; end if;

  if email is null or email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return new;
  end if;

  -- One plan email per address every 10 minutes, so the public form can't be
  -- used to spam an inbox.
  if exists (
    select 1
    from public.responses r
    where r.id <> new.id
      and r.metadata::jsonb->>'formId' = 'church-plan'
      and lower(trim(r.metadata::jsonb->>'email')) = email
      and r.created_at > now() - interval '10 minutes'
  ) then
    return new;
  end if;

  perform pgmq.send(
    'general_email_queue',
    (meta - 'website') || jsonb_build_object(
      'type',        'church_plan.requested',
      'response_id', new.id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_church_plan_requested_email on public.responses;
create trigger trg_notify_church_plan_requested_email
  after insert on public.responses
  for each row execute function public.notify_church_plan_requested_email();
