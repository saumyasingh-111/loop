-- ═══════════════════════════════════════════════════════════════════════════
-- Loop — Sample Data Seed Script
-- Run AFTER supabase_schema.sql, once, in the Supabase SQL Editor.
--
-- This populates profiles, events, assets, sneakers, and fit_polls so the
-- dashboard looks vibrant and fully active on first load.
--
-- Safe to re-run: every insert uses "on conflict do nothing" or checks for
-- existing rows first.
--
-- NOTE on profiles: `profiles.id` is a foreign key into `auth.users`, so we
-- can't insert a profile without a matching auth user. This script inserts
-- directly into `auth.users` with fixed demo UUIDs (works from the Supabase
-- SQL Editor, which runs with elevated privileges). That insert fires the
-- existing `handle_new_user()` trigger, which auto-creates the matching
-- `profiles` row — we then just enrich those rows with bios/avatars/aura.
-- These seed accounts use the password "loop-demo-2026" if you ever want to
-- sign in as one of them locally.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. DEMO USERS → PROFILES
-- ───────────────────────────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111101', 'authenticated', 'authenticated', 'aanya.sharma@loop.campus', crypt('loop-demo-2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Aanya Sharma","hostel_block":"Block B, Room 214"}', false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111102', 'authenticated', 'authenticated', 'rohan.mehta@loop.campus',  crypt('loop-demo-2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Rohan Mehta","hostel_block":"Block C, Room 108"}', false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111103', 'authenticated', 'authenticated', 'zara.khan@loop.campus',    crypt('loop-demo-2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Zara Khan","hostel_block":"Block A, Room 301"}', false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111104', 'authenticated', 'authenticated', 'kabir.singh@loop.campus',  crypt('loop-demo-2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Kabir Singh","hostel_block":"Block D, Room 22"}',  false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111105', 'authenticated', 'authenticated', 'ishita.rao@loop.campus',   crypt('loop-demo-2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ishita Rao","hostel_block":"Block B, Room 19"}',   false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111106', 'authenticated', 'authenticated', 'dev.patel@loop.campus',    crypt('loop-demo-2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Dev Patel","hostel_block":"Block C, Room 245"}',   false)
on conflict (id) do nothing;

-- Enrich the auto-created profile rows with bios, avatars, aura points.
update profiles set
  bio = 'Design student. Always down to lend a fit for a good cause.',
  avatar_url = 'https://i.pravatar.cc/150?img=47',
  contact_number = '+91 98765 43201',
  aura_points = 340
where id = '11111111-1111-1111-1111-111111111101';

update profiles set
  bio = 'Sneakerhead. Rotating my collection so it never sits idle.',
  avatar_url = 'https://i.pravatar.cc/150?img=12',
  contact_number = '+91 98765 43202',
  aura_points = 610
where id = '11111111-1111-1111-1111-111111111102';

update profiles set
  bio = 'Event organizer for the campus fest committee.',
  avatar_url = 'https://i.pravatar.cc/150?img=32',
  contact_number = '+91 98765 43203',
  aura_points = 480
where id = '11111111-1111-1111-1111-111111111103';

update profiles set
  bio = 'CS major, lending out lab tools and gaming gear.',
  avatar_url = 'https://i.pravatar.cc/150?img=51',
  contact_number = '+91 98765 43204',
  aura_points = 220
where id = '11111111-1111-1111-1111-111111111104';

update profiles set
  bio = 'Bookworm — exam notes archive is basically a small library.',
  avatar_url = 'https://i.pravatar.cc/150?img=25',
  contact_number = '+91 98765 43205',
  aura_points = 390
where id = '11111111-1111-1111-1111-111111111105';

update profiles set
  bio = 'Music & speakers guy. Also runs the campus badminton meetups.',
  avatar_url = 'https://i.pravatar.cc/150?img=15',
  contact_number = '+91 98765 43206',
  aura_points = 275
where id = '11111111-1111-1111-1111-111111111106';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. EVENTS
-- ───────────────────────────────────────────────────────────────────────────
insert into events (title, category, vibe, description, event_date, location, slots, host_id)
select * from (values
  ('Freshers Night 2026', 'Social', 'Chic Indo-Western', 'Kick off the semester with music, food stalls, and a runway moment.', now() + interval '5 days', 'Main Auditorium', 220, '11111111-1111-1111-1111-111111111103'::uuid),
  ('Campus Hackathon: BuildLoop', 'Academic', 'Smart Casual', '24-hour build sprint — ship something wild, win campus clout.', now() + interval '9 days', 'Innovation Lab, Block E', 80, '11111111-1111-1111-1111-111111111104'::uuid),
  ('Valorant Campus Cup', 'Gaming', 'Streetwear', 'Squad up and battle it out for the campus gaming trophy.', now() + interval '3 days', 'Esports Arena', 60, '11111111-1111-1111-1111-111111111102'::uuid),
  ('Sunrise 5K Run Club', 'Sports', 'Athleisure', 'Casual weekend run around the campus loop — all paces welcome.', now() + interval '2 days', 'Front Gate Track', 100, '11111111-1111-1111-1111-111111111106'::uuid),
  ('Open Mic & Chill', 'Social', 'Relaxed Streetwear', 'Poetry, acoustic sets, and campus talent under the stars.', now() + interval '7 days', 'Amphitheatre Lawn', 150, '11111111-1111-1111-1111-111111111101'::uuid)
) as v(title, category, vibe, description, event_date, location, slots, host_id)
where not exists (select 1 from events e where e.title = v.title);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. ASSETS (rental marketplace)
-- ───────────────────────────────────────────────────────────────────────────
insert into assets (title, description, category, condition, location, daily_price, security_deposit, status, renter_id, contact_number, image_url)
select * from (values
  ('DSLR Camera — Canon 200D', 'Great for event photography, comes with an 18-55mm kit lens.', 'Tools', 'Good', 'Block C, Room 108', 150, 2000, 'available', '11111111-1111-1111-1111-111111111102'::uuid, '+91 98765 43202', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600'),
  ('Formal Blazer — Navy, M', 'Perfect for placement interviews and formal fests.', 'Wardrobe', 'Brand New', 'Block B, Room 214', 80, 500, 'available', '11111111-1111-1111-1111-111111111101'::uuid, '+91 98765 43201', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'),
  ('Semester 3 DSA Notes (Handwritten)', 'Full topic-wise notes with solved problem sets.', 'Notes', 'Good', 'Block B, Room 19', 20, 100, 'available', '11111111-1111-1111-1111-111111111105'::uuid, '+91 98765 43205', 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600'),
  ('Bluetooth Party Speaker (JBL)', 'Loud, punchy bass — great for room parties and events.', 'Speakers', 'Fairly Used', 'Block C, Room 245', 100, 800, 'rented', '11111111-1111-1111-1111-111111111106'::uuid, '+91 98765 43206', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'),
  ('PS5 Console + 2 Controllers', 'Comes with FIFA 26 and Spider-Man 2.', 'Gaming', 'Good', 'Block D, Room 22', 250, 3000, 'available', '11111111-1111-1111-1111-111111111104'::uuid, '+91 98765 43204', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600'),
  ('Electric Kettle + Cookware Set', 'Basic hostel cooking kit — kettle, pan, ladle.', 'Utensils', 'Good', 'Block A, Room 301', 30, 150, 'available', '11111111-1111-1111-1111-111111111103'::uuid, '+91 98765 43203', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600'),
  ('Mountain Bicycle', 'Well-maintained 21-speed bike, great for campus commutes.', 'Vehicles', 'Good', 'Block D, Room 22', 60, 1000, 'available', '11111111-1111-1111-1111-111111111104'::uuid, '+91 98765 43204', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600'),
  ('Traditional Kurti Set — L', 'Festive wear, worn once, dry-cleaned.', 'Wardrobe', 'Good', 'Block B, Room 214', 70, 400, 'available', '11111111-1111-1111-1111-111111111101'::uuid, '+91 98765 43201', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600')
) as v(title, description, category, condition, location, daily_price, security_deposit, status, renter_id, contact_number, image_url)
where not exists (select 1 from assets a where a.title = v.title);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. SNEAKERS
-- ───────────────────────────────────────────────────────────────────────────
insert into sneakers (brand, model, size, condition, description, image_url, starting_bid, current_bid, top_bidder, seller_id)
select * from (values
  ('Nike', 'Air Jordan 1 Retro High OG "Chicago"', 'UK 9', 'VNDS', 'Worn twice indoors, box included, no creasing.', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600', 8000, 9500, '11111111-1111-1111-1111-111111111105'::uuid, '11111111-1111-1111-1111-111111111102'::uuid),
  ('Adidas', 'Yeezy Boost 350 V2 "Zebra"', 'UK 8', 'DS', 'Deadstock, still in original packaging with tags.', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600', 12000, 12000, null, '11111111-1111-1111-1111-111111111106'::uuid),
  ('New Balance', '550 "White Green"', 'UK 10', 'Good', 'Light wear, super comfortable, clean colourway.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 4500, 5200, '11111111-1111-1111-1111-111111111101'::uuid, '11111111-1111-1111-1111-111111111104'::uuid),
  ('Nike', 'Dunk Low "Panda"', 'UK 7', 'Fair', 'Visible sole wear but structurally solid, priced accordingly.', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', 3000, 3000, null, '11111111-1111-1111-1111-111111111103'::uuid)
) as v(brand, model, size, condition, description, image_url, starting_bid, current_bid, top_bidder, seller_id)
where not exists (select 1 from sneakers s where s.model = v.model);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. FIT_POLLS + POLL_OPTIONS
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare
  v_poll_id bigint;
  v_asset_blazer bigint;
  v_asset_kurti bigint;
begin
  if not exists (select 1 from fit_polls where title = 'Freshers Night — which fit wins?') then
    select id into v_asset_blazer from assets where title = 'Formal Blazer — Navy, M' limit 1;
    select id into v_asset_kurti  from assets where title = 'Traditional Kurti Set — L' limit 1;

    insert into fit_polls (title, created_by, expires_at, linked_item_id)
    values ('Freshers Night — which fit wins?', '11111111-1111-1111-1111-111111111103', now() + interval '24 hours', v_asset_blazer)
    returning id into v_poll_id;

    insert into poll_options (poll_id, name, image_url, vibe, linked_item_id) values
      (v_poll_id, 'Sharp Navy Blazer', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', 'Sharp & Corporate-Chic', v_asset_blazer),
      (v_poll_id, 'Festive Kurti Set', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600', 'Elegant & Traditional', v_asset_kurti);
  end if;

  if not exists (select 1 from fit_polls where title = 'Hackathon comfort fit check') then
    insert into fit_polls (title, created_by, expires_at)
    values ('Hackathon comfort fit check', '11111111-1111-1111-1111-111111111104', now() + interval '20 hours')
    returning id into v_poll_id;

    insert into poll_options (poll_id, name, image_url, vibe) values
      (v_poll_id, 'Hoodie + Joggers', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', 'Cozy Grind Mode'),
      (v_poll_id, 'Graphic Tee + Cargos', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600', 'Streetwear Focus');
  end if;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Done. Refresh the Loop dashboard to see the seeded data.
-- ───────────────────────────────────────────────────────────────────────────
