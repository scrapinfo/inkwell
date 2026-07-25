-- =============================================================================
-- Inkwell — multi-author revenue-share blog
-- Schema: tables, Row Level Security, and supporting functions/triggers
-- Target: Supabase Postgres (15+) — gen_random_uuid() is built into core,
-- no extensions required.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- Postgres has no native `create type if not exists`, so these are wrapped
-- to make the whole file safe to run more than once (e.g. if you re-paste
-- it into the SQL editor after it already succeeded — a very easy thing to
-- do by accident, and otherwise the only error you'd see is a confusing
-- "type already exists" on line 1 with no indication the rest is fine).
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'author');
  end if;
  if not exists (select 1 from pg_type where typname = 'article_status') then
    create type public.article_status as enum ('draft', 'pending', 'published');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- users — one row per authenticated person, keyed to auth.users
-- `email` is duplicated from auth.users because the `auth` schema isn't
-- exposed to PostgREST, so we can't embed/join against it from the client.
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text not null,
  role              public.user_role not null default 'author',
  balance           numeric(12, 4) not null default 0 check (balance >= 0),
  stripe_account_id text,
  created_at        timestamptz not null default now()
);

comment on table public.users is 'Author/admin profiles. balance accrues from PPV views and is only ever mutated by track_article_view() or an admin.';

-- -----------------------------------------------------------------------------
-- is_admin() — SECURITY DEFINER helper so RLS policies can check role
-- without recursively re-evaluating RLS on public.users (which would
-- otherwise infinite-loop: a policy on `users` that queries `users`).
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- articles
-- -----------------------------------------------------------------------------
create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.users (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) > 0),
  -- TipTap/ProseMirror JSON document. This is the single source of truth for
  -- content — public HTML is derived from it at render time (see
  -- lib/tiptap-extensions.ts), so there's no separate HTML copy to keep in sync.
  content      jsonb not null default '{"type": "doc", "content": []}'::jsonb,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status       public.article_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

comment on table public.articles is 'status: draft (author-only, editable) -> pending (submitted, editable) -> published (admin-approved, locked from direct author edits).';

-- -----------------------------------------------------------------------------
-- views — one row per (article, IP) that counted toward the PPV balance.
-- Rows are only ever written by track_article_view() below.
-- -----------------------------------------------------------------------------
create table if not exists public.views (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  ip_address text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_articles_author_id on public.articles (author_id);
create index if not exists idx_articles_status on public.articles (status);
create index if not exists idx_views_article_ip_time on public.views (article_id, ip_address, created_at desc);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.users enable row level security;
alter table public.articles enable row level security;
alter table public.views enable row level security;

-- ---------------------------------------------------------------- users -----

drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

-- No INSERT policy: rows are created exclusively by handle_new_user() below,
-- which runs as SECURITY DEFINER and therefore bypasses RLS. Regular clients
-- can never insert a users row directly (and so can never self-assign a role).

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
  on public.users for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Belt-and-suspenders: even though the update policy above lets an author
-- update their *own* row (needed so they can set stripe_account_id), this
-- trigger stops a non-admin *end user* from smuggling a role or balance
-- change through that same UPDATE.
--
-- The `auth.uid() is not null` guard matters: it's what lets this trigger
-- tell a real logged-in user apart from a privileged, session-less context
-- (the SQL editor doing the admin-promotion step below, or
-- track_article_view()'s own balance credit) — both of the latter have no
-- JWT and therefore no auth.uid(). Without this guard, the trigger blocks
-- *everyone*, including the one command that's supposed to create your
-- first admin, and the anti-fraud function this whole app exists for.
-- (Verified empirically against a real local Postgres instance, not just
-- read — see the notes in the project README.)
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change a user role';
    end if;
    if new.balance is distinct from old.balance then
      raise exception 'balance can only be changed by the system';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_prevent_privilege_escalation
  before update on public.users
  for each row execute function public.prevent_privilege_escalation();

-- Auto-create a profile row (role defaults to 'author') whenever someone
-- signs up via Supabase Auth. Promote a user to admin manually, e.g.:
--   update public.users set role = 'admin' where email = 'you@example.com';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- articles ----

drop policy if exists "articles_select_published_or_own_or_admin" on public.articles;
create policy "articles_select_published_or_own_or_admin"
  on public.articles for select
  using (status = 'published' or author_id = auth.uid() or public.is_admin());

drop policy if exists "articles_insert_own_draft_or_pending" on public.articles;
create policy "articles_insert_own_draft_or_pending"
  on public.articles for insert
  to authenticated
  with check (author_id = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "articles_update_own_unpublished" on public.articles;
create policy "articles_update_own_unpublished"
  on public.articles for update
  to authenticated
  using (author_id = auth.uid() and status <> 'published')
  with check (author_id = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "articles_update_admin" on public.articles;
create policy "articles_update_admin"
  on public.articles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "articles_delete_own_draft" on public.articles;
create policy "articles_delete_own_draft"
  on public.articles for delete
  to authenticated
  using (author_id = auth.uid() and status = 'draft');

drop policy if exists "articles_delete_admin" on public.articles;
create policy "articles_delete_admin"
  on public.articles for delete
  to authenticated
  using (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create or replace trigger trg_articles_published_at
  before update on public.articles
  for each row execute function public.set_published_at();

-- ----------------------------------------------------------------- views ----

-- Authors can read view counts for their own articles (powers the "views"
-- column on the dashboard); admins can read all. Nobody can INSERT directly —
-- every row is written by track_article_view(), which runs as SECURITY
-- DEFINER via the service-role key inside /api/track-view.
drop policy if exists "views_select_own_article_or_admin" on public.views;
create policy "views_select_own_article_or_admin"
  on public.views for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.articles a
      where a.id = views.article_id and a.author_id = auth.uid()
    )
  );

-- =============================================================================
-- Anti-fraud view tracking (atomic, race-safe)
-- =============================================================================
-- Called exclusively from app/api/track-view/route.ts using the Supabase
-- service-role key (never granted to anon/authenticated — see below), so the
-- IP address always comes from a header the server read itself, never from a
-- client-supplied value.
--
-- pg_advisory_xact_lock serializes concurrent calls for the same
-- (article, ip) pair so two near-simultaneous requests can't both pass the
-- "have they viewed in the last 24h" check before either has inserted —
-- otherwise a single reader hitting refresh twice quickly could double-credit
-- the author.
create or replace function public.track_article_view(
  p_article_id  uuid,
  p_ip_address  text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
  v_already_viewed boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_article_id::text || '|' || p_ip_address, 0));

  select author_id into v_author_id
  from public.articles
  where id = p_article_id and status = 'published';

  if v_author_id is null then
    return false; -- unknown or unpublished article — never pay out
  end if;

  select exists (
    select 1 from public.views
    where article_id = p_article_id
      and ip_address = p_ip_address
      and created_at > now() - interval '24 hours'
  ) into v_already_viewed;

  if v_already_viewed then
    return false;
  end if;

  insert into public.views (article_id, ip_address) values (p_article_id, p_ip_address);

  update public.users set balance = balance + 0.002 where id = v_author_id;

  return true;
end;
$$;

-- Deliberately NOT granted to anon/authenticated. Only the service_role
-- (which already bypasses grants) can call this — see app/api/track-view.
revoke execute on function public.track_article_view(uuid, text) from public, anon, authenticated;

-- =============================================================================
-- Public platform stats (for the homepage)
-- =============================================================================
-- Returns aggregate-only numbers — never a per-user row, never a balance for
-- any specific person, never an email. Safe to expose to anonymous visitors,
-- unlike broadening the `users` SELECT policy would be.
create or replace function public.platform_stats()
returns table (total_articles bigint, total_authors bigint, total_earned numeric)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*) from public.articles where status = 'published'),
    (select count(distinct author_id) from public.articles where status = 'published'),
    (select coalesce(sum(balance), 0) from public.users);
$$;

grant execute on function public.platform_stats() to anon, authenticated;

-- =============================================================================
-- Public author bylines (for the homepage, article pages, and author profiles)
-- =============================================================================
-- IMPORTANT: articles.author_id resolves to a real author via a foreign key
-- to public.users, and it's tempting to fetch it with a PostgREST embed like
-- `articles.select('..., author:users(email)')`. Don't — RLS on `users`
-- (correctly) denies anonymous SELECT on that table entirely, so an embed
-- like that silently returns a null author for every anonymous visitor. This
-- function is the safe alternative: SECURITY DEFINER, and it returns emails
-- *only* for authors who have at least one published article (so an author
-- with nothing public yet never leaks an email via this path either).
create or replace function public.author_bylines(p_author_ids uuid[])
returns table (id uuid, email text)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email
  from public.users u
  where u.id = any(p_author_ids)
    and exists (
      select 1 from public.articles a
      where a.author_id = u.id and a.status = 'published'
    );
$$;

grant execute on function public.author_bylines(uuid[]) to anon, authenticated;

-- =============================================================================
-- View data retention
-- =============================================================================
-- Raw IP addresses in `views` only need to exist for the 24h anti-fraud
-- window; keeping them indefinitely is unnecessary retention (the kind
-- data-minimization principles in GDPR/India's DPDPA/CCPA all call out).
-- This does NOT touch the aggregate counts anywhere else — those are
-- unaffected because nothing in the app derives a running total from row
-- *count over time*; earnings are already durably reflected in
-- `users.balance`, which this never touches.
--
-- Not scheduled automatically (pg_cron availability varies by Supabase
-- plan) — run manually or wire up to a scheduled job/Edge Function:
--   select public.purge_old_views(90);
create or replace function public.purge_old_views(retention_days int default 90)
returns bigint
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from public.views
    where created_at < now() - (retention_days || ' days')::interval
    returning 1
  )
  select count(*) from deleted;
$$;

-- =============================================================================
-- Categories
-- =============================================================================
create table if not exists public.categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

alter table public.articles
  add column if not exists category_id uuid references public.categories (id) on delete set null;

create index if not exists idx_articles_category_id on public.articles (category_id);

alter table public.categories enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
  on public.categories for select
  using (true);

-- No insert/update/delete policy for anon/authenticated — categories are
-- curated, not user-generated. Add new ones via the SQL editor:
--   insert into public.categories (name, slug) values ('Design', 'design');
insert into public.categories (name, slug) values
  ('Technology', 'technology'),
  ('Culture', 'culture'),
  ('Business', 'business'),
  ('Life', 'life'),
  ('Opinion', 'opinion')
on conflict (name) do nothing;

-- =============================================================================
-- Newsletter subscribers
-- =============================================================================
-- Capture-only: this table stores addresses, it does not send anything.
-- No RLS SELECT policy at all — nobody can read the list back through the
-- API (anon/authenticated included), so it can't be scraped via the same
-- key that's sitting in your public bundle. Export it yourself from the SQL
-- editor when you're ready to actually send something, using whatever
-- email service you connect later.
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

drop policy if exists "subscribers_insert_anyone" on public.subscribers;
create policy "subscribers_insert_anyone"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

-- =============================================================================
-- Media library (images) — uploaded from the article editor, managed from
-- /admin/media
-- =============================================================================
-- Metadata table. The actual file bytes live in Supabase Storage (below);
-- this table is what makes tagging/search/admin-management possible, since
-- Storage alone has no concept of tags.
create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  url          text not null,
  filename     text not null,
  alt_text     text,
  tags         text[] not null default '{}',
  uploaded_by  uuid not null references public.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists idx_media_uploaded_by on public.media (uploaded_by);
create index if not exists idx_media_tags on public.media using gin (tags);

alter table public.media enable row level security;

drop policy if exists "media_select_own_or_admin" on public.media;
create policy "media_select_own_or_admin"
  on public.media for select
  to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

drop policy if exists "media_insert_own" on public.media;
create policy "media_insert_own"
  on public.media for insert
  to authenticated
  with check (uploaded_by = auth.uid());

drop policy if exists "media_update_own_or_admin" on public.media;
create policy "media_update_own_or_admin"
  on public.media for update
  to authenticated
  using (uploaded_by = auth.uid() or public.is_admin())
  with check (uploaded_by = auth.uid() or public.is_admin());

drop policy if exists "media_delete_own_or_admin" on public.media;
create policy "media_delete_own_or_admin"
  on public.media for delete
  to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Supabase Storage bucket + policies.
--
-- IMPORTANT: unlike every other statement in this file, the block below
-- touches `storage.objects`/`storage.buckets`, which are provided by
-- Supabase's Storage service, not by plain Postgres. I could verify
-- everything above this line against a real local Postgres instance; I
-- could NOT do that for this part, because a vanilla `apt install
-- postgresql` box doesn't have the Storage extension. This follows
-- Supabase's documented pattern closely, but test it for real (upload an
-- image, confirm a non-owner/non-admin genuinely can't delete it) before
-- you rely on it.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_storage_insert_own_folder" on storage.objects;
create policy "media_storage_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "media_storage_select_public" on storage.objects;
create policy "media_storage_select_public"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media_storage_delete_own_or_admin" on storage.objects;
create policy "media_storage_delete_own_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
