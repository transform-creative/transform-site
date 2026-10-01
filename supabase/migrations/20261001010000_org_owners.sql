-- Radar: manual Jenny / Phil tags. One row per ABN; when present it overrides
-- the automatic segment (at least one of jenny / phil is set). Deleting the
-- row puts the org back on the automatic classification.
create table public.org_owners (
  abn text primary key,
  name text,
  jenny boolean not null default false,
  phil boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  constraint org_owners_someone check (jenny or phil)
);

alter table public.org_owners enable row level security;

create policy "Transform admins read owners" on public.org_owners
  for select to authenticated using (current_user_owns_business(129::bigint));

create policy "Transform admins add owners" on public.org_owners
  for insert to authenticated with check (current_user_owns_business(129::bigint));

create policy "Transform admins update owners" on public.org_owners
  for update to authenticated
  using (current_user_owns_business(129::bigint))
  with check (current_user_owns_business(129::bigint));

create policy "Transform admins delete owners" on public.org_owners
  for delete to authenticated using (current_user_owns_business(129::bigint));
