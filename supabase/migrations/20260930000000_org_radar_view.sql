-- ACNC radar: the latest monthly snapshot's fit orgs (jenny | phil | both | phil_review),
-- joined to the previous snapshot so the dashboard can see what changed.
--
-- Payload stays ~3K rows no matter how much history accumulates: only the latest
-- month is returned. The month lookups are uncorrelated scalar subqueries, so
-- Postgres runs each once (InitPlan) and both joins stay fully index-bound
-- (orgs_month_state_segment_idx for the current month, the PK for the previous one).
-- Date-relative signals (budget season, anniversaries, growth thresholds) are
-- scored client-side in app/business/radarBL.tsx so they're easy to tune.
--
-- security_invoker = the caller's RLS on public.orgs applies (Transform Creative admins only).

create or replace view public.org_radar with (security_invoker = true) as
select c.snapshot_month, c.abn, c.name, c.other_names, c.website, c.town, c.state, c.postcode,
       c.operates_in_sa, c.charity_size, c.segment, c.pass_through,
       c.revenue_total, c.donations_bequests, c.revenue_gov, c.total_expenses,
       c.gov_share, c.donations_share, c.revenue_total_prev, c.donations_bequests_prev,
       c.revenue_growth, c.donations_growth, c.net_surplus, c.grants_made, c.grants_share,
       c.fte, c.volunteers, c.fundraising_online, c.advancing_religion, c.advancing_education,
       c.basic_religious_charity, c.established_year, c.anniversary_year, c.anniversary_label,
       c.fy_end_month, c.responsible_persons_count, c.ais_period_end,
       c.created_at                                                   as loaded_at,
       ((select max(snapshot_month) from public.orgs
          where snapshot_month < (select max(snapshot_month) from public.orgs)) is not null) as has_prev,
       -- Only meaningful once there is a previous month to compare against
       ((select max(snapshot_month) from public.orgs
          where snapshot_month < (select max(snapshot_month) from public.orgs)) is not null
        and p.abn is null)                                            as new_in_snapshot,
       (p.abn is not null and c.website is distinct from p.website)   as website_changed,
       p.website                                                      as website_before,
       (p.abn is not null and c.name is distinct from p.name)         as name_changed,
       p.name                                                         as name_before,
       c.responsible_persons_count - p.responsible_persons_count      as board_size_change,
       (p.abn is not null and c.ais_period_end is distinct from p.ais_period_end) as new_financials_lodged,
       (p.abn is not null and c.charity_size is distinct from p.charity_size)     as size_changed,
       p.charity_size                                                 as size_before,
       p.segment                                                      as segment_before
from public.orgs c
left join public.orgs p
  on p.abn = c.abn
 and p.snapshot_month = (select max(snapshot_month) from public.orgs
                          where snapshot_month < (select max(snapshot_month) from public.orgs))
where c.snapshot_month = (select max(snapshot_month) from public.orgs)
  and c.segment is not null
  and not c.excluded;

grant select on public.org_radar to authenticated;
