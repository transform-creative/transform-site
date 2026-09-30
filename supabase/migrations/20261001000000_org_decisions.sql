-- Radar triage: one row per decision (append-only). The latest row per ABN is
-- the org's current status; older rows are its history. "Move back to inbox"
-- inserts status = 'new'.
create table public.org_decisions (
  id bigint generated always as identity primary key,
  abn text not null,
  name text,
  status text not null check (status in ('new', 'pursuing', 'snoozed', 'not_fit', 'never', 'client')),
  reason text check (reason in ('numbers_off', 'pass_through', 'bad_timing', 'in_house', 'relationship', 'other')),
  note text,
  snooze_until date,
  decided_at timestamptz not null default now(),
  decided_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- Baseline for waking: the snapshot current at the decision, and the org's
  -- segment / revenue then (Not a fit wakes when these shift a lot)
  decided_month date,
  segment_at_decision text,
  revenue_at_decision numeric,
  constraint org_decisions_snooze_date check (status <> 'snoozed' or snooze_until is not null)
);

create index org_decisions_abn_decided_idx on public.org_decisions (abn, decided_at desc);

alter table public.org_decisions enable row level security;

create policy "Transform admins read decisions" on public.org_decisions
  for select to authenticated using (current_user_owns_business(129::bigint));

create policy "Transform admins add decisions" on public.org_decisions
  for insert to authenticated with check (current_user_owns_business(129::bigint));

create policy "Transform admins delete decisions" on public.org_decisions
  for delete to authenticated using (current_user_owns_business(129::bigint));
