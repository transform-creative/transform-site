-- Carry the explanatory comment through status-change emails.
--
-- Two communication gaps closed alongside the new "comment on Finish / Reject"
-- portal prompts:
--
-- 1. notify_issue_ready_for_review_email() now also picks up the issue's most
--    recent comment as `latest_comment`, so the client's "ready for review"
--    email can show what the team actually changed. The portal posts the admin's
--    Finish comment immediately before flipping updated_at, so the latest comment
--    is that note.
--
-- 2. New notify_issue_rejected_email() + trigger: when a client sends an issue
--    back (rejected_at goes from null → set), email the dev/support inbox with
--    the reporter, org and the client's feedback (again the latest comment, which
--    the portal forces on reject) so devs know what's still wrong.
--
-- Follows the security-definer trigger pattern in 20260617020000_org_names_and_email_org.sql.
-- Already applied to the live project via the Supabase MCP migration; kept here
-- for repo parity.

-- 1. Ready-for-review email now carries the latest comment --------------------
create or replace function public.notify_issue_ready_for_review_email()
returns trigger
language plpgsql
security definer
as $$
declare
  recipient_name  text;
  recipient_email text;
  business_name   text;
  latest_comment  text;
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

  -- The organisation the issue belongs to (its org board), with a fallback to
  -- the agency board for legacy rows.
  select b.name into business_name
  from public.businesses b
  where b.id = coalesce(new.client_business_id, new.business_id);

  -- The team's note on what changed (posted just before this update).
  select ic.body into latest_comment
  from public.issue_comments ic
  where ic.issue_id = new.id
  order by ic.created_at desc
  limit 1;

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
      'latest_comment',  latest_comment,
      'pr_url',          new.ai_pr_url
    )
  );

  return new;
end;
$$;

-- 2. Reject email to the dev/support inbox -----------------------------------
create or replace function public.notify_issue_rejected_email()
returns trigger
language plpgsql
security definer
as $$
declare
  reporter_name  text;
  reporter_email text;
  business_name  text;
  latest_comment text;
begin
  -- Only fire on the transition into "rejected".
  if new.rejected_at is null then return new; end if;
  if old.rejected_at is not null then return new; end if;

  select coalesce(p.first_name || ' ' || p.last_name, p.first_name, p.last_name),
         u.email
    into reporter_name, reporter_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = new.client_id;

  select b.name into business_name
  from public.businesses b
  where b.id = coalesce(new.client_business_id, new.business_id);

  -- The client's feedback explaining what's still wrong (forced on reject).
  select ic.body into latest_comment
  from public.issue_comments ic
  where ic.issue_id = new.id
  order by ic.created_at desc
  limit 1;

  perform pgmq.send(
    'general_email_queue',
    jsonb_build_object(
      'type',           'issue.rejected',
      'issue_id',       new.id,
      'title',          new.title,
      'description',    new.description,
      'severity',       new.severity,
      'issue_type',     new.issue_type,
      'more_info',      new.more_info,
      'created_at',     new.created_at,
      'rejected_at',    new.rejected_at,
      'reporter_name',  reporter_name,
      'reporter_email', reporter_email,
      'business_name',  business_name,
      'latest_comment', latest_comment
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_issue_rejected_email on public.issues;
create trigger trg_notify_issue_rejected_email
  after update on public.issues
  for each row execute function public.notify_issue_rejected_email();
