-- Org-shared issues: clients who belong to the same organisation share one
-- issue board — they can see, comment on, and edit each other's issues.
--
-- Model: `profiles_to_businesses` is the single source of truth for org
-- membership. A client is an *admin member* of their own org business;
-- colleagues are additional admin members of the same business. The agency
-- board (`issues.business_id`, e.g. Transform Creative = 129) is untouched, so
-- agency admins keep full oversight.
--
-- `issues.client_business_id` is the org key and the new source of truth for
-- fetching a client's issues. `client_id` is kept only to record *who* posted
-- the issue (and to link them to their org). The org id is resolved client-side
-- and passed in on insert — there is no trigger.
--
-- Already applied to the live project via the Supabase MCP migration
-- `org_shared_issues`; kept here for repo parity.

-- 1. Org key on issues -------------------------------------------------------
alter table public.issues
  add column if not exists client_business_id bigint references public.businesses(id);

create index if not exists issues_client_business_id_idx
  on public.issues (client_business_id);

-- 2. Seed org memberships ----------------------------------------------------
-- Every business owned by a profile who is a client of an agency board becomes
-- that owner's org, with the owner as its first admin member. Idempotent.
insert into public.profiles_to_businesses (profile_id, business_id, role)
select distinct owner.profile_id, owner.business_id, 'admin'
from (
  select coalesce(b.user_id, b.profile) as profile_id, b.id as business_id
  from public.businesses b
  where coalesce(b.user_id, b.profile) is not null
) owner
where exists (
  select 1 from public.profiles_to_businesses c
  where c.profile_id = owner.profile_id and c.role = 'client'
)
and not exists (
  select 1 from public.profiles_to_businesses pb
  where pb.profile_id = owner.profile_id
    and pb.business_id = owner.business_id
    and pb.role = 'admin'
);

-- 3. Backfill issues.client_business_id from the reporter's org --------------
-- The reporter's org = the business they're an admin member of that is NOT an
-- agency board (an agency board has client members; an org does not).
update public.issues i
set client_business_id = org.business_id
from (
  select pb.profile_id, pb.business_id
  from public.profiles_to_businesses pb
  where pb.role = 'admin'
    and not exists (
      select 1 from public.profiles_to_businesses c
      where c.business_id = pb.business_id and c.role = 'client'
    )
) org
where i.client_id = org.profile_id
  and i.client_business_id is null;

-- 4. (No trigger — client_business_id is supplied by the app on insert.)

-- 5. RLS: let org admin members see/edit the org's issues --------------------
-- current_user_owns_business(x) is the existing helper = "am I an admin member
-- of business x". Adding it against client_business_id grants org-wide access.
alter policy issues_select_client_or_business on public.issues
  using (
    (client_id = (select auth.uid()))
    or current_user_owns_business(business_id)
    or current_user_owns_business(client_business_id)
  );

alter policy issues_update_client_or_business on public.issues
  using (
    (client_id = (select auth.uid()))
    or current_user_owns_business(business_id)
    or current_user_owns_business(client_business_id)
  )
  with check (
    (
      (client_id = (select auth.uid()))
      and client_belongs_to_business(client_id, business_id)
      and (client_business_id is null or current_user_owns_business(client_business_id))
    )
    or current_user_owns_business(business_id)
    or current_user_owns_business(client_business_id)
  );

-- A client may only file into their own org; agency admins are unconstrained.
alter policy issues_insert_client_own_only on public.issues
  with check (
    (
      (client_id = (select auth.uid()))
      and client_belongs_to_business(client_id, business_id)
      and (client_business_id is null or current_user_owns_business(client_business_id))
    )
    or current_user_owns_business(business_id)
  );

alter policy issues_delete_client_own_only on public.issues
  using (
    (client_id = (select auth.uid()))
    or current_user_owns_business(client_business_id)
  );

-- issue_comments: org admin members are participants too ---------------------
alter policy issue_comments_select_participants on public.issue_comments
  using (
    exists (
      select 1 from public.issues i
      where i.id = issue_comments.issue_id
        and (
          i.client_id = (select auth.uid())
          or current_user_owns_business(i.business_id)
          or current_user_owns_business(i.client_business_id)
        )
    )
  );

alter policy issue_comments_insert_participants on public.issue_comments
  with check (
    (author_user_id = (select auth.uid()))
    and exists (
      select 1 from public.issues i
      where i.id = issue_comments.issue_id
        and (
          i.client_id = (select auth.uid())
          or current_user_owns_business(i.business_id)
          or current_user_owns_business(i.client_business_id)
        )
    )
  );

alter policy issue_comments_update_own on public.issue_comments
  using (author_user_id = (select auth.uid()))
  with check (
    (author_user_id = (select auth.uid()))
    and exists (
      select 1 from public.issues i
      where i.id = issue_comments.issue_id
        and (
          i.client_id = (select auth.uid())
          or current_user_owns_business(i.business_id)
          or current_user_owns_business(i.client_business_id)
        )
    )
  );

-- 6. profiles: org admin members may view their co-members' profiles ---------
-- So the board can label who posted each issue.
drop policy if exists profiles_select_org_comembers on public.profiles;
create policy profiles_select_org_comembers on public.profiles
  for select
  using (
    exists (
      select 1
      from public.profiles_to_businesses viewer
      join public.profiles_to_businesses target
        on target.business_id = viewer.business_id
      where viewer.profile_id = (select auth.uid())
        and viewer.role = 'admin'
        and target.profile_id = profiles.id
    )
  );

-- 7. grant_client_access now also links the user to their org ----------------
drop function if exists public.grant_client_access(uuid, bigint);
drop function if exists public.grant_client_access(text, bigint);

create or replace function public.grant_client_access(
  p_user_id uuid,
  p_org_id bigint,
  p_business_id bigint default 129
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  -- Must be a real auth user (the invite creates this row).
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then
    raise exception 'No auth user found with id %', p_user_id;
  end if;

  if not exists (select 1 from public.businesses where id = p_business_id) then
    raise exception 'No agency board found with id %', p_business_id;
  end if;
  if not exists (select 1 from public.businesses where id = p_org_id) then
    raise exception 'No org business found with id %', p_org_id;
  end if;

  -- Ensure a profiles row exists (FK target for the memberships).
  insert into public.profiles (id, email)
  values (p_user_id, v_email)
  on conflict (id) do nothing;

  -- Link to the agency board as a client (so they appear on the agency board).
  if not exists (
    select 1 from public.profiles_to_businesses
    where profile_id = p_user_id and business_id = p_business_id and role = 'client'
  ) then
    insert into public.profiles_to_businesses (profile_id, business_id, role)
    values (p_user_id, p_business_id, 'client');
  end if;

  -- Link to the org as an admin member (so they share the org's issue board).
  -- Calling this for two users with the same p_org_id puts them in one org.
  if not exists (
    select 1 from public.profiles_to_businesses
    where profile_id = p_user_id and business_id = p_org_id and role = 'admin'
  ) then
    insert into public.profiles_to_businesses (profile_id, business_id, role)
    values (p_user_id, p_org_id, 'admin');
  end if;
end;
$$;

-- 8. Resolve a client's org business id ---------------------------------------
-- Used when an agency admin logs an issue *for* a client and needs to stamp the
-- right client_business_id (the client's own org is invisible to the agency
-- admin under RLS, so this runs as definer). Gated: the caller must be the
-- client themselves or an agency admin of a board the client belongs to.
create or replace function public.client_org_business_id(p_client_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select o.business_id
  from public.profiles_to_businesses o
  where o.profile_id = p_client_id
    and o.role = 'admin'
    and not exists (
      select 1 from public.profiles_to_businesses c
      where c.business_id = o.business_id and c.role = 'client'
    )
    and (
      p_client_id = (select auth.uid())
      or exists (
        select 1
        from public.profiles_to_businesses board
        join public.profiles_to_businesses cli
          on cli.business_id = board.business_id and cli.role = 'client'
        where board.profile_id = (select auth.uid())
          and board.role = 'admin'
          and cli.profile_id = p_client_id
      )
    )
  limit 1;
$$;
