-- Blog articles (/blog and /blog/:slug), written in the admin portal's Blog tab.
--
-- A post is a draft while `published_at` is null. Published posts are public;
-- only admins of the owning business (Transform Creative = 129) can write.
-- `body` is sanitised Quill HTML. The SEO fields feed the page's meta tags,
-- Open Graph card, JSON-LD and the sitemap at build time.

create table public.articles (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  business_id bigint not null default 129 references public.businesses (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  title text not null,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  -- Card summary + meta description
  excerpt text,
  -- Optional <title> override; falls back to `title`
  seo_title text,
  keywords text[] not null default '{}',
  -- Hero + og:image / twitter:image
  cover_image text,
  cover_image_alt text,
  body text not null default ''
);

create index articles_published_at_idx on public.articles (published_at desc)
  where published_at is not null;

-- Keep updated_at honest (drives sitemap <lastmod> and JSON-LD dateModified)
create or replace function public.articles_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger articles_touch_updated_at
before update on public.articles
for each row execute function public.articles_touch_updated_at();

alter table public.articles enable row level security;

create policy "Published articles are public"
on public.articles for select
to anon, authenticated
using (published_at is not null and published_at <= now());

create policy "Business admins read all their articles"
on public.articles for select
to authenticated
using (public.current_user_owns_business(business_id));

create policy "Business admins insert articles"
on public.articles for insert
to authenticated
with check (public.current_user_owns_business(business_id));

create policy "Business admins update articles"
on public.articles for update
to authenticated
using (public.current_user_owns_business(business_id))
with check (public.current_user_owns_business(business_id));

create policy "Business admins delete articles"
on public.articles for delete
to authenticated
using (public.current_user_owns_business(business_id));

-- Article images (cover + inline) live in the public `transform` bucket under
-- articles/. Reads are already public; only Transform Creative admins upload.
create policy "Transform admins upload article images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'transform'
  and (storage.foldername(name))[1] = 'articles'
  and public.current_user_owns_business(129)
);

-- Rebuild the static site when a published post changes, so it gets
-- prerendered (full HTML + meta for crawlers) and added to the sitemap.
-- Reads a Vercel deploy hook URL from Vault; a no-op until that secret exists:
--   select vault.create_secret('<deploy hook url>', 'vercel_deploy_hook');
create or replace function public.articles_trigger_rebuild()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hook_url text;
begin
  if coalesce(new.published_at, old.published_at) is null then
    return null; -- draft-only change, nothing public moved
  end if;

  select decrypted_secret into hook_url
  from vault.decrypted_secrets
  where name = 'vercel_deploy_hook'
  limit 1;

  if hook_url is not null then
    perform net.http_post(url := hook_url);
  end if;
  return null;
end;
$$;

revoke execute on function public.articles_trigger_rebuild() from public, anon, authenticated;

create trigger articles_trigger_rebuild
after insert or update or delete on public.articles
for each row execute function public.articles_trigger_rebuild();
