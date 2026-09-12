-- Storyloom core schema for a new Supabase project.
-- Run this file in the Supabase SQL Editor before configuring site/app/config.js.
-- Never put a service_role key in the website.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  is_admin boolean not null default false,
  accepted_terms_at timestamptz not null,
  age_confirmed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  summary text not null check (char_length(summary) between 20 and 1000),
  body text not null check (char_length(body) between 50 and 50000),
  genre text not null check (char_length(genre) between 2 and 50),
  content_rating text not null check (content_rating in ('everyone', 'teen', 'mature')),
  status text not null default 'pending' check (status in ('pending', 'published', 'locked', 'rejected')),
  is_locked boolean not null default false,
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stories_public_shelf_idx on public.stories (status, is_locked, content_rating, published_at desc);
create index stories_author_idx on public.stories (author_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  state text not null default 'visible' check (state in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create index comments_story_idx on public.comments (story_id, created_at asc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) between 2 and 2000),
  state text not null default 'visible' check (state in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, author_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete set null,
  comment_id uuid references public.comments(id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  check (story_id is not null or comment_id is not null)
);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_accepted', '') <> 'yes'
    or coalesce(new.raw_user_meta_data ->> 'age_confirmed', '') <> 'yes' then
    raise exception 'Storyloom requires acceptance of its terms and confirmation that the user is at least 13.';
  end if;

  insert into public.profiles (id, display_name, accepted_terms_at, age_confirmed_at)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Reader'), 40),
    now(),
    now()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stories_set_updated_at before update on public.stories
  for each row execute procedure public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute procedure public.set_updated_at();

-- Security-definer helper keeps the role lookup private while policies stay simple.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.comments enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.user_blocks enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.stories to anon, authenticated;
grant insert, update, delete on public.stories to authenticated;
grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;

create policy "Public profiles are readable"
  on public.profiles for select to anon, authenticated using (true);

create policy "Public can read safe published stories"
  on public.stories for select to anon, authenticated
  using (
    status = 'published' and is_locked = false and content_rating in ('everyone', 'teen')
    and not exists (
      select 1 from public.user_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = author_id
    )
  );
create policy "Authors can read their own stories"
  on public.stories for select to authenticated using (author_id = auth.uid());
create policy "Admins can read all stories"
  on public.stories for select to authenticated using (public.is_admin());
create policy "Authors submit only pending stories"
  on public.stories for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'pending'
    and is_locked = false
    and reviewed_by is null
    and review_note is null
    and published_at is null
  );
create policy "Authors edit only their pending stories"
  on public.stories for update to authenticated
  using (author_id = auth.uid() and status = 'pending')
  with check (
    author_id = auth.uid()
    and status = 'pending'
    and is_locked = false
    and reviewed_by is null
    and review_note is null
    and published_at is null
  );
create policy "Authors delete their pending stories"
  on public.stories for delete to authenticated using (author_id = auth.uid() and status = 'pending');
create policy "Admins moderate stories"
  on public.stories for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads visible comments on safe stories"
  on public.comments for select to anon, authenticated
  using (
    state = 'visible' and exists (
      select 1 from public.stories s
      where s.id = story_id and s.status = 'published' and s.is_locked = false
        and s.content_rating in ('everyone', 'teen')
    ) and not exists (
      select 1 from public.user_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = author_id
    )
  );
create policy "Authors read their own comments"
  on public.comments for select to authenticated using (author_id = auth.uid());
create policy "Admins read all comments"
  on public.comments for select to authenticated using (public.is_admin());
create policy "Signed-in users comment on safe stories"
  on public.comments for insert to authenticated
  with check (
    author_id = auth.uid() and state = 'visible' and exists (
      select 1 from public.stories s
      where s.id = story_id and s.status = 'published' and s.is_locked = false
        and s.content_rating in ('everyone', 'teen')
    )
  );
create policy "Authors delete own comments"
  on public.comments for delete to authenticated using (author_id = auth.uid());
create policy "Admins moderate comments"
  on public.comments for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads visible reviews on safe stories"
  on public.reviews for select to anon, authenticated
  using (
    state = 'visible' and exists (
      select 1 from public.stories s
      where s.id = story_id and s.status = 'published' and s.is_locked = false
        and s.content_rating in ('everyone', 'teen')
    ) and not exists (
      select 1 from public.user_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = author_id
    )
  );
create policy "Authors read their own reviews"
  on public.reviews for select to authenticated using (author_id = auth.uid());
create policy "Admins read all reviews"
  on public.reviews for select to authenticated using (public.is_admin());
create policy "Readers review safe stories once"
  on public.reviews for insert to authenticated
  with check (
    author_id = auth.uid() and state = 'visible' and exists (
      select 1 from public.stories s
      where s.id = story_id and s.author_id <> auth.uid() and s.status = 'published'
        and s.is_locked = false and s.content_rating in ('everyone', 'teen')
    )
  );
create policy "Readers edit their own reviews"
  on public.reviews for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid() and state = 'visible');
create policy "Readers delete their own reviews"
  on public.reviews for delete to authenticated using (author_id = auth.uid());
create policy "Admins moderate reviews"
  on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Reporters read their own reports"
  on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy "Admins read all reports"
  on public.reports for select to authenticated using (public.is_admin());
create policy "Signed-in users file reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'new');
create policy "Admins update reports"
  on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "People manage their own blocks"
  on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy "People create their own blocks"
  on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "People remove their own blocks"
  on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());
