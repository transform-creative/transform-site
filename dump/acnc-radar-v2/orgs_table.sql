-- Supabase: run once in the SQL editor. The GitHub Action loads a snapshot every month.
--
-- One row per charity per monthly snapshot, keyed on (abn, snapshot_month).
-- Re-running a month replaces that month (the loader does it in one transaction).
-- Never truncate - old months are the history.
--
-- Keep your own notes/signals in separate tables keyed on abn, not in here.
--
-- If you already created an earlier version of orgs, drop it first:
--   drop view if exists public.org_changes;
--   drop view if exists public.sa_shortlist;
--   drop table if exists public.orgs;

create table if not exists public.orgs (
  snapshot_month            date not null,   -- first of the month, e.g. 2026-10-01
  abn                       text not null,
  name                      text not null,
  other_names               text,
  website                   text,
  town                      text,
  state                     text,
  postcode                  text,
  operates_in_sa            boolean,
  charity_size              text,
  segment                   text,            -- jenny | phil | both | phil_review
  jenny_fit                 boolean,
  phil_fit                  boolean,
  phil_review               boolean,
  excluded                  boolean,
  excluded_reason           text,            -- name_pattern (e.g. Lutheran)
  revenue_total             numeric,
  donations_bequests        numeric,
  revenue_gov               numeric,
  total_expenses            numeric,
  gov_share                 numeric,
  donations_share           numeric,
  revenue_total_prev        numeric,
  donations_bequests_prev   numeric,
  revenue_growth            numeric,
  donations_growth          numeric,
  net_surplus               numeric,
  grants_made               numeric,
  grants_share              numeric,         -- grants out / total expenses
  pass_through              boolean,         -- money mostly flows straight back out
  fte                       numeric,
  volunteers                numeric,
  fundraising_online        boolean,
  fundraising_sa            boolean,
  pbi                       boolean,
  hpc                       boolean,
  advancing_religion        boolean,
  advancing_education       boolean,
  advancing_welfare         boolean,
  advancing_health          boolean,
  benefits_children         boolean,
  benefits_youth            boolean,
  basic_religious_charity   boolean,
  consolidated_report       boolean,
  established_date          date,
  established_year          int,
  anniversary_year          int,
  anniversary_label         text,
  financial_year_end        text,
  fy_end_month              int,
  responsible_persons_count int,
  ais_period_end            date,
  how_purposes_pursued      text,
  created_at                timestamptz not null default now(),  -- audit only, not in the CSV
  primary key (abn, snapshot_month),
  check (extract(day from snapshot_month) = 1)
);

create index if not exists orgs_month_state_segment_idx on public.orgs (snapshot_month, state, segment);

-- Private data: lock it down (no anon access)
alter table public.orgs enable row level security;


-- Latest month only: SA shortlist, best prospects first
create or replace view public.sa_shortlist with (security_invoker = true) as
select abn, name, website, segment, revenue_total, donations_bequests, donations_growth,
       fte, pass_through, fundraising_online, anniversary_label, anniversary_year, fy_end_month
from public.orgs
where snapshot_month = (select max(snapshot_month) from public.orgs)
  and state = 'SA' and segment is not null and not excluded
order by (segment = 'both') desc, donations_bequests desc nulls last;


-- What changed since the previous month's snapshot.
-- A new website URL, a name change or a board-size change is often a rebuild or new-leader trigger.
-- Empty until the second monthly load.
create or replace view public.org_changes with (security_invoker = true) as
with months as (
  select max(snapshot_month) as cur,
         max(snapshot_month) filter (where snapshot_month < (select max(snapshot_month) from public.orgs)) as prev
  from public.orgs
)
select c.abn, c.name, c.state, c.segment, c.snapshot_month,
       (p.abn is null)                                          as new_in_snapshot,
       c.website is distinct from p.website                     as website_changed,
       p.website                                                as website_before,
       c.name is distinct from p.name                           as name_changed,
       p.name                                                   as name_before,
       c.responsible_persons_count - p.responsible_persons_count as board_size_change,
       c.charity_size is distinct from p.charity_size           as size_changed,
       p.charity_size                                           as size_before,
       c.segment is distinct from p.segment                     as segment_changed,
       p.segment                                                as segment_before,
       c.ais_period_end is distinct from p.ais_period_end       as new_financials_lodged,
       c.donations_bequests - p.donations_bequests              as donations_change,
       c.revenue_total - p.revenue_total                        as revenue_change
from public.orgs c
cross join months m
left join public.orgs p on p.abn = c.abn and p.snapshot_month = m.prev
where c.snapshot_month = m.cur and not c.excluded;
