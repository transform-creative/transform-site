-- Blog posts credit their author by name (BlogPosting JSON-LD + byline).
--
-- `profiles` is private under RLS, so the public site (and the anon-key
-- prerender) can't join it. Instead the author's display name is copied onto
-- the article whenever author_id is set or changed. Null when there's no
-- author, and the page falls back to crediting Transform Creative.

alter table public.articles add column author_name text;

create or replace function public.articles_set_author_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')
  into new.author_name
  from public.profiles p
  where p.id = new.author_id;

  if new.author_id is null then
    new.author_name := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.articles_set_author_name() from public, anon, authenticated;

create trigger articles_set_author_name
before insert or update of author_id on public.articles
for each row execute function public.articles_set_author_name();

-- Backfill. Triggers are paused so this doesn't bump updated_at (sitemap
-- lastmod) or fire the Vercel rebuild hook; the next deploy picks it up.
alter table public.articles disable trigger user;

-- The first post was inserted outside the editor, so it has no author_id.
-- Isaac wrote both posts.
update public.articles
set author_id = '12bcf487-533f-4c10-ab69-6a0a551637dd'
where author_id is null
  and slug = 'build-vs-rent-fundraising-platform';

update public.articles a
set author_name = nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')
from public.profiles p
where p.id = a.author_id;

-- "raisley" typo in both posts' keywords (shown as tags and in JSON-LD)
update public.articles
set keywords = array_replace(keywords, 'raisley', 'raisely')
where 'raisley' = any (keywords);

alter table public.articles enable trigger user;
