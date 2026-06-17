-- Org names on the agency board + email "Organisation" = the issue's org.
--
-- Two follow-ups to the org-shared-issues model:
--
-- 1. agency_board_org_names(board_id): resolve each issue's org
--    (issues.client_business_id) to its name for an agency board. Agency admins
--    are admin members of the *board* (e.g. 129), not of the client orgs, so
--    they can't read those `businesses` rows under RLS. This runs security
--    definer, gated so the caller must be an admin member of the board, and only
--    returns orgs that actually have an issue on that board.
--
-- 2. The email producer triggers now label "Organisation" with the org the
--    issue was created under (issues.client_business_id, the org board) instead
--    of the agency board it was lodged to (issues.business_id). Falls back to the
--    agency board when an issue has no org (legacy rows).
--
-- Already applied to the live project via the Supabase MCP migration; kept here
-- for repo parity.

-- 1. Agency-board org names --------------------------------------------------
create or replace function public.agency_board_org_names(p_board_id bigint)
returns table(id bigint, name text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct b.id, b.name
  from public.issues i
  join public.businesses b on b.id = i.client_business_id
  where i.business_id = p_board_id
    and current_user_owns_business(p_board_id);
$$;

-- 2. Email triggers: "Organisation" = the issue's org -----------------------
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

  -- The organisation the issue was created under (its org board), not the
  -- agency board it was lodged to. Fall back to the agency board for legacy
  -- rows with no client_business_id.
  select b.name into business_name
  from public.businesses b
  where b.id = coalesce(new.client_business_id, new.business_id);

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

  -- The organisation the issue belongs to (its org board), with a fallback to
  -- the agency board for legacy rows.
  select b.name into business_name
  from public.businesses b
  where b.id = coalesce(new.client_business_id, new.business_id);

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
