-- ═══════════════════════════════════════════════════════════════════════════
-- CampusAura — Full Supabase Schema
-- Run this ENTIRE file once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
--
-- Safe to re-run: uses "if not exists" / "or replace" everywhere it can.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ───────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
-- 1. PROFILES  (public user profile data, 1:1 with auth.users)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  name              text not null default 'Campus Student',
  bio               text default '',
  hostel_block      text default '',
  contact_number    text default '',
  avatar_url        text,
  aura_points       int not null default 0,
  member_since      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table profiles is 'Editable public profile for every authenticated user (name, bio, hostel block, contact, avatar).';

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, hostel_block, contact_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'hostel_block', ''),
    coalesce(new.raw_user_meta_data->>'contact_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- 2. EVENTS  (campus events)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists events (
  id            bigint generated always as identity primary key,
  title         text not null,
  category      text not null default 'Social',       -- Social | Academic | Gaming | Sports
  vibe          text default 'Smart Casual',
  description   text default '',
  event_date    timestamptz,
  location      text not null default '',
  slots         int not null default 0,                -- total capacity
  slots_taken   int not null default 0,
  host_id       uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_events_host on events(host_id);

-- who has registered for which event (prevents double-booking, tracks slots_taken)
create table if not exists event_registrations (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references events(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. ASSETS  (rental marketplace items)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists assets (
  id                bigint generated always as identity primary key,
  title             text not null,
  description       text default '',
  category          text not null default 'Wardrobe', -- Wardrobe | Notes | Tools | Utensils | Gaming | Speakers | Vehicles
  condition         text default 'Good',
  location          text not null default '',
  daily_price       numeric not null default 0,
  security_deposit  numeric not null default 0,
  status            text not null default 'available', -- available | rented
  renter_id         uuid references profiles(id) on delete cascade, -- the LISTER/owner of the item
  contact_number    text default '',
  image_url         text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_assets_renter on assets(renter_id);
create index if not exists idx_assets_category on assets(category);
create index if not exists idx_assets_status on assets(status);

-- reviews left on assets after a rental
create table if not exists reviews (
  id           bigint generated always as identity primary key,
  asset_id     bigint not null references assets(id) on delete cascade,
  reviewer_id  uuid references profiles(id) on delete set null,
  stars        int not null check (stars between 1 and 5),
  text         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_reviews_asset on reviews(asset_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. SNEAKERS + SNEAKER_BIDS  (bidding marketplace)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists sneakers (
  id              bigint generated always as identity primary key,
  brand           text not null default '',
  model           text not null,
  size            text default '',
  condition       text default 'Good',                 -- DS | VNDS | Good | Fair
  description     text default '',
  image_url       text,
  starting_bid    numeric not null default 0,
  current_bid     numeric not null default 0,
  top_bidder      uuid references profiles(id) on delete set null,
  seller_id       uuid references profiles(id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sneakers_seller on sneakers(seller_id);

-- individual bid history entries
create table if not exists sneaker_bids (
  id            bigint generated always as identity primary key,
  sneaker_id    bigint not null references sneakers(id) on delete cascade,
  bidder_id     uuid not null references profiles(id) on delete cascade,
  amount        numeric not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sneaker_bids_sneaker on sneaker_bids(sneaker_id);

-- Atomic "place a bid" — validates amount beats current_bid, records history,
-- and updates the sneaker row, all in one transaction (avoids race conditions).
create or replace function public.place_sneaker_bid(p_sneaker_id bigint, p_amount numeric)
returns sneakers
language plpgsql
security definer set search_path = public
as $$
declare
  v_sneaker sneakers;
begin
  select * into v_sneaker from sneakers where id = p_sneaker_id for update;
  if v_sneaker is null then
    raise exception 'Sneaker not found';
  end if;
  if p_amount <= v_sneaker.current_bid then
    raise exception 'Bid must be higher than the current bid of %', v_sneaker.current_bid;
  end if;

  insert into sneaker_bids (sneaker_id, bidder_id, amount)
  values (p_sneaker_id, auth.uid(), p_amount);

  update sneakers
    set current_bid = p_amount, top_bidder = auth.uid()
    where id = p_sneaker_id
    returning * into v_sneaker;

  return v_sneaker;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. FIT_POLLS + POLL_OPTIONS + POLL_VOTES
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists fit_polls (
  id            bigint generated always as identity primary key,
  title         text not null,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '24 hours'), -- strict 24h countdown
  linked_item_id bigint references assets(id) on delete set null            -- optional default deep-link target
);

create table if not exists poll_options (
  id              bigint generated always as identity primary key,
  poll_id         bigint not null references fit_polls(id) on delete cascade,
  name            text not null,
  image_url       text,
  vibe            text default '',
  linked_item_id  bigint references assets(id) on delete set null           -- deep-links to Rental Marketplace item
);

create index if not exists idx_poll_options_poll on poll_options(poll_id);

create table if not exists poll_votes (
  id          bigint generated always as identity primary key,
  poll_id     bigint not null references fit_polls(id) on delete cascade,
  option_id   bigint not null references poll_options(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (poll_id, user_id) -- one vote per user per poll
);

create index if not exists idx_poll_votes_poll on poll_votes(poll_id);

-- Cast a vote, +10 aura, one vote per user per poll, blocked once expired
create or replace function public.cast_poll_vote(p_poll_id bigint, p_option_id bigint)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_expires_at timestamptz;
begin
  select expires_at into v_expires_at from fit_polls where id = p_poll_id;
  if v_expires_at is null then
    raise exception 'Poll not found';
  end if;
  if now() > v_expires_at then
    raise exception 'This poll has closed';
  end if;

  insert into poll_votes (poll_id, option_id, user_id)
  values (p_poll_id, p_option_id, auth.uid());

  update profiles set aura_points = aura_points + 10 where id = auth.uid();
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. REQUESTS / BOOKINGS  (linking users to rental items)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id                bigint generated always as identity primary key,
  item_id           bigint not null references assets(id) on delete cascade,
  renter_id         uuid not null references profiles(id) on delete cascade, -- the person requesting to rent
  start_date        date not null,
  end_date          date not null,
  status            text not null default 'pending', -- pending | accepted | declined
  total_price       numeric not null default 0,
  security_deposit  numeric not null default 0,
  created_at        timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_bookings_item on bookings(item_id);
create index if not exists idx_bookings_renter on bookings(renter_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. SUGGESTIONS / HELPDESK
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists suggestions (
  id          bigint generated always as identity primary key,
  text        text not null,
  author_id   uuid references profiles(id) on delete set null,
  type        text not null default 'suggestion',  -- suggestion | helpdesk
  votes       int not null default 0,
  answer      text,
  created_at  timestamptz not null default now()
);

create table if not exists suggestion_votes (
  id             bigint generated always as identity primary key,
  suggestion_id  bigint not null references suggestions(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (suggestion_id, user_id)
);

create or replace function public.sync_suggestion_votes()
returns trigger language plpgsql as $$
begin
  update suggestions set votes = (select count(*) from suggestion_votes where suggestion_id = coalesce(new.suggestion_id, old.suggestion_id))
    where id = coalesce(new.suggestion_id, old.suggestion_id);
  return null;
end;
$$;

drop trigger if exists trg_suggestion_votes on suggestion_votes;
create trigger trg_suggestion_votes
  after insert or delete on suggestion_votes
  for each row execute procedure public.sync_suggestion_votes();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════
alter table profiles             enable row level security;
alter table events               enable row level security;
alter table event_registrations  enable row level security;
alter table assets               enable row level security;
alter table reviews              enable row level security;
alter table sneakers             enable row level security;
alter table sneaker_bids         enable row level security;
alter table fit_polls            enable row level security;
alter table poll_options         enable row level security;
alter table poll_votes           enable row level security;
alter table bookings             enable row level security;
alter table suggestions          enable row level security;
alter table suggestion_votes     enable row level security;

-- PROFILES: everyone can view profiles (needed to show lender info); only the
-- owner can edit their own row. Rows are created automatically by the trigger.
drop policy if exists "profiles select all" on profiles;
create policy "profiles select all" on profiles for select using (true);
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles for update using (auth.uid() = id);

-- EVENTS: public read, only the host can create/edit/delete their own event
drop policy if exists "events select all" on events;
create policy "events select all" on events for select using (true);
drop policy if exists "events insert own" on events;
create policy "events insert own" on events for insert with check (auth.uid() = host_id);
drop policy if exists "events update own" on events;
create policy "events update own" on events for update using (auth.uid() = host_id);
drop policy if exists "events delete own" on events;
create policy "events delete own" on events for delete using (auth.uid() = host_id);

drop policy if exists "event_regs select all" on event_registrations;
create policy "event_regs select all" on event_registrations for select using (true);
drop policy if exists "event_regs insert own" on event_registrations;
create policy "event_regs insert own" on event_registrations for insert with check (auth.uid() = user_id);

-- ASSETS: public read, only the owner (renter_id = lister) can create/edit/delete
drop policy if exists "assets select all" on assets;
create policy "assets select all" on assets for select using (true);
drop policy if exists "assets insert own" on assets;
create policy "assets insert own" on assets for insert with check (auth.uid() = renter_id);
drop policy if exists "assets update own" on assets;
create policy "assets update own" on assets for update using (auth.uid() = renter_id);
drop policy if exists "assets delete own" on assets;
create policy "assets delete own" on assets for delete using (auth.uid() = renter_id);

-- REVIEWS: public read, any authenticated user can review, only author can edit/delete
drop policy if exists "reviews select all" on reviews;
create policy "reviews select all" on reviews for select using (true);
drop policy if exists "reviews insert own" on reviews;
create policy "reviews insert own" on reviews for insert with check (auth.uid() = reviewer_id);
drop policy if exists "reviews delete own" on reviews;
create policy "reviews delete own" on reviews for delete using (auth.uid() = reviewer_id);

-- SNEAKERS: public read, only seller can create/edit/delete their listing.
-- current_bid/top_bidder are updated exclusively via the place_sneaker_bid()
-- function (security definer), so direct client updates to bid fields are blocked.
drop policy if exists "sneakers select all" on sneakers;
create policy "sneakers select all" on sneakers for select using (true);
drop policy if exists "sneakers insert own" on sneakers;
create policy "sneakers insert own" on sneakers for insert with check (auth.uid() = seller_id);
drop policy if exists "sneakers delete own" on sneakers;
create policy "sneakers delete own" on sneakers for delete using (auth.uid() = seller_id);

-- SNEAKER_BIDS: public read (bid history / leaderboard); inserts only via RPC
drop policy if exists "sneaker_bids select all" on sneaker_bids;
create policy "sneaker_bids select all" on sneaker_bids for select using (true);

-- FIT_POLLS: public read, authenticated users can create polls
drop policy if exists "fit_polls select all" on fit_polls;
create policy "fit_polls select all" on fit_polls for select using (true);
drop policy if exists "fit_polls insert own" on fit_polls;
create policy "fit_polls insert own" on fit_polls for insert with check (auth.uid() = created_by);
drop policy if exists "fit_polls delete own" on fit_polls;
create policy "fit_polls delete own" on fit_polls for delete using (auth.uid() = created_by);

drop policy if exists "poll_options select all" on poll_options;
create policy "poll_options select all" on poll_options for select using (true);
drop policy if exists "poll_options insert by poll owner" on poll_options;
create policy "poll_options insert by poll owner" on poll_options for insert
  with check (auth.uid() = (select created_by from fit_polls where id = poll_id));

-- POLL_VOTES: public read (for tallies); inserts only via cast_poll_vote() RPC
drop policy if exists "poll_votes select all" on poll_votes;
create policy "poll_votes select all" on poll_votes for select using (true);

-- BOOKINGS: renter (requester) or the asset owner may view; requester creates;
-- only the asset owner may update status (accept/decline)
drop policy if exists "bookings select participant" on bookings;
create policy "bookings select participant" on bookings for select using (
  auth.uid() = renter_id
  or auth.uid() = (select renter_id from assets where id = item_id)
);
drop policy if exists "bookings insert own" on bookings;
create policy "bookings insert own" on bookings for insert with check (auth.uid() = renter_id);
drop policy if exists "bookings update by owner" on bookings;
create policy "bookings update by owner" on bookings for update using (
  auth.uid() = (select renter_id from assets where id = item_id)
);

-- SUGGESTIONS: public read, authenticated create, author can delete own
drop policy if exists "suggestions select all" on suggestions;
create policy "suggestions select all" on suggestions for select using (true);
drop policy if exists "suggestions insert own" on suggestions;
create policy "suggestions insert own" on suggestions for insert with check (auth.uid() = author_id);
drop policy if exists "suggestions delete own" on suggestions;
create policy "suggestions delete own" on suggestions for delete using (auth.uid() = author_id);

drop policy if exists "suggestion_votes select all" on suggestion_votes;
create policy "suggestion_votes select all" on suggestion_votes for select using (true);
drop policy if exists "suggestion_votes insert own" on suggestion_votes;
create policy "suggestion_votes insert own" on suggestion_votes for insert with check (auth.uid() = user_id);

-- Let authenticated users execute the atomic bidding / voting functions
grant execute on function public.place_sneaker_bid(bigint, numeric) to authenticated;
grant execute on function public.cast_poll_vote(bigint, bigint) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS  (item images, sneaker photos, avatars)
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values
  ('item-images',    'item-images',    true),
  ('sneaker-photos', 'sneaker-photos', true),
  ('avatars',        'avatars',        true)
on conflict (id) do nothing;

-- Public read for all three buckets (images need to render in the app)
drop policy if exists "public read item-images" on storage.objects;
create policy "public read item-images" on storage.objects
  for select using (bucket_id = 'item-images');

drop policy if exists "public read sneaker-photos" on storage.objects;
create policy "public read sneaker-photos" on storage.objects
  for select using (bucket_id = 'sneaker-photos');

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- Authenticated users may upload; the first path segment must be their own
-- user id (e.g. "avatars/<uid>/profile.jpg") so people can't overwrite others' files.
drop policy if exists "user upload item-images" on storage.objects;
create policy "user upload item-images" on storage.objects
  for insert with check (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "user upload sneaker-photos" on storage.objects;
create policy "user upload sneaker-photos" on storage.objects
  for insert with check (
    bucket_id = 'sneaker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "user upload avatars" on storage.objects;
create policy "user upload avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners can update/delete their own uploaded files
drop policy if exists "user manage own item-images" on storage.objects;
create policy "user manage own item-images" on storage.objects
  for update using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "user delete own item-images" on storage.objects;
create policy "user delete own item-images" on storage.objects
  for delete using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "user manage own sneaker-photos" on storage.objects;
create policy "user manage own sneaker-photos" on storage.objects
  for update using (bucket_id = 'sneaker-photos' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "user delete own sneaker-photos" on storage.objects;
create policy "user delete own sneaker-photos" on storage.objects
  for delete using (bucket_id = 'sneaker-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "user manage own avatars" on storage.objects;
create policy "user manage own avatars" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "user delete own avatars" on storage.objects;
create policy "user delete own avatars" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════════════════════════════════
-- Done. Next: in the Supabase dashboard, make sure Authentication → Providers
-- → Email is enabled, and (for local dev) turn OFF "Confirm email" so signup
-- logs the user in immediately. See SUPABASE_SETUP.md for the full checklist.
-- ═══════════════════════════════════════════════════════════════════════════
