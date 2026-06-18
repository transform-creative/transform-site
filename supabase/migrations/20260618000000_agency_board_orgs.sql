-- Admins log issues against an organisation, not an individual client.
--
-- Two changes that go together:
--
-- 1. agency_board_orgs(board_id): list *every* organisation belonging to an
--    agency board for the admin "log issue" picker. Unlike agency_board_org_names
--    (which only surfaces orgs that already have an issue), this returns all of
--    the board's orgs so an admin can lodge the first issue for one. An org is a
--    `business` with no client members whose admin member is a client of the
--    board. Runs security definer, gated to admins of the board.
--
-- 2. notify_issue_ready_for_review_email(): suppress the "ready for review" email
--    when its recipient (the issue's client_id) is an agency admin of the board
--    the issue was lodged to. Admin-logged issues now record the posting admin as
--    client_id, so without this they would email themselves about their own
--    update.
--
-- Already applied to the live project via the Supabase MCP migration; kept here
-- for repo parity (matching the convention in the 2026061702/03 email migrations).

-- 1. All organisations belonging to an agency board --------------------------
create or replace function public.agency_board_orgs(p_board_id bigint)
returns table(id bigint, name text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct b.id, b.name
  from public.businesses b
  join public.profiles_to_businesses org_admin
    on org_admin.business_id = b.id and org_admin.role = 'admin'
  join public.profiles_to_businesses board_client
    on board_client.profile_id = org_admin.profile_id
   and board_client.business_id = p_board_id
   and board_client.role = 'client'
  where current_user_owns_business(p_board_id)        -- gate: caller is a board admin
    and not exists (                                  -- exclude agency boards (orgs only)
      select 1 from public.profiles_to_businesses c
      where c.business_id = b.id and c.role = 'client'
    );
$$;

-- 2. Don't email the agency admin about an update to their own logged issue --
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

  -- Skip self-notifications: when an agency admin logs an issue for an org, the
  -- reporter (client_id) is that admin. Emailing them about their own update is
  -- pointless.
  if exists (
    select 1 from public.profiles_to_businesses pb
    where pb.profile_id = new.client_id
      and pb.business_id = new.business_id   -- the agency board (e.g. 129)
      and pb.role = 'admin'
  ) then
    return new;
  end if;

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
