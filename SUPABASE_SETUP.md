# Loop — Refactor & Supabase Setup Guide

This document covers everything needed to get the refactored app running:
database setup, storage buckets, environment variables, and a summary of
what changed in the codebase.

---

## 1. Run the database schema

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase_schema.sql` (in the project root) and click **Run**.
   - It's safe to re-run — every statement uses `if not exists` / `or replace` / `drop policy if exists`.
   - This single file creates every table, all Row Level Security policies, the
     three storage buckets, and two important database functions:
     - `place_sneaker_bid(sneaker_id, amount)` — validates and records a bid atomically (prevents two people winning the same bid in a race condition).
     - `cast_poll_vote(poll_id, option_id)` — enforces the 24-hour cutoff, one-vote-per-user, and awards +10 Aura, all server-side so it can't be bypassed from the client.

## 2. Configure Authentication

In **Authentication → Providers**, make sure **Email** is enabled.

For local development, it's easiest to go to **Authentication → Settings**
and turn **OFF** "Confirm email" — this lets `supabase.auth.signUp()` log the
user in immediately instead of requiring an email click first. Turn it back
on before you ship to real users.

Every time someone signs up, a Postgres trigger (`handle_new_user`, created
by the schema script) automatically creates their row in `profiles` — you
don't need to do anything extra.

## 3. Environment variables

`.env` now uses the `VITE_`-prefixed names Vite requires to expose values to
browser code:

```
VITE_SUPABASE_URL=https://gebivpqjhqpttuhlnwkk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ZjhLnD8ISBX3ckP-Zzyguw_4-wzNjuV
```

**Important:** the original `.env` only had `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`
(no `VITE_` prefix), so `src/supabaseClient.js` was silently getting
`undefined` for both values — the app was never actually talking to Supabase.
That's fixed now. The `SUPABASE_SECRET_KEY` in `.env` is a service-role key —
it is **not** used anywhere in this frontend project and should never be
prefixed with `VITE_` (that would ship it to every browser). Keep it out of
any client-side code.

## 4. Install & run

```bash
npm install
npm run dev
```

> If `npm run build` fails with `Cannot find module @rollup/rollup-linux-x64-gnu`
> (an npm optional-dependency bug, unrelated to this refactor), delete
> `node_modules` and `package-lock.json` and run `npm install` again on the
> machine/OS you're actually building on.

---

## 2026-refactor summary — what changed and why

### 1. Context-aware Floating Action Button
- The standalone **List New Asset** page is gone.
- A single floating `+` button (`src/components/FloatingActionButton.jsx`) sits
  bottom-right and changes meaning based on the page you're on:
  - **Rental Marketplace** → opens `ListAssetModal`
  - **Sneaker Bidding** → opens `ListSneakerModal`
  - **Explore Events** → opens `HostEventModal`
  - **FitCheck Polls** → opens `CreatePollModal`
  - Elsewhere, it doesn't render at all.
- The embedded AI ChatBot (`ChatBot.jsx`) and its sidebar/nav wiring have been
  fully removed. The sidebar (`Sidebar.jsx`) now has a clean **DISCOVER /
  ACCOUNT** structure and a **Profile** entry.

### 2. Full Supabase integration
Every mock array (`mockRentals`, `mockSneakers`, `mockEvents`,
`mockReviewsDB`, `mockLenders`, the local `users` array) is gone. All reads
and writes go through `src/lib/api.js`, which wraps the Supabase client for:

| Domain | Table(s) |
|---|---|
| Profiles | `profiles` (auto-created on signup via trigger) |
| Events | `events`, `event_registrations` |
| Rentals | `assets`, `reviews` |
| Sneaker bidding | `sneakers`, `sneaker_bids` (+ `place_sneaker_bid()` RPC) |
| FitCheck polls | `fit_polls`, `poll_options`, `poll_votes` (+ `cast_poll_vote()` RPC) |
| Bookings | `bookings` |
| Suggestions/Help | `suggestions`, `suggestion_votes` |

Every table has RLS enabled. The general pattern: **public read**, but you
can only insert/update/delete rows you own (`auth.uid() = <owner column>`).
Bidding and poll-voting go through `security definer` Postgres functions
instead of raw client updates, so a malicious client can't set an arbitrary
`current_bid` or vote twice — the database enforces it, not just the UI.

**Storage**: three public buckets — `item-images`, `sneaker-photos`,
`avatars` — each with an upload policy that only allows a signed-in user to
write into a folder named after their own `auth.uid()` (e.g.
`avatars/<uid>/photo.jpg`), so people can't overwrite each other's files, but
anyone can view images (needed for them to render in the marketplace).

### 3. FitCheck Polls upgrade
- `fit_polls.expires_at` defaults to `now() + interval '24 hours'` at creation
  time — a real, server-side deadline (not just a client-side timer that
  resets on refresh).
- The `cast_poll_vote()` function refuses votes after `expires_at`, so the
  countdown is actually enforced, not just cosmetic.
- Each poll option can optionally be linked to a Rental Marketplace item
  (`poll_options.linked_item_id`). Once the poll closes, the option with the
  most votes is visually marked **🏆 Winning Fit**, and clicking it (if it has
  a linked item) deep-links straight into that item's page in the Rental
  Marketplace (`ItemDetailView`) so the user can rent it immediately.

### 4. Editable profile
- `ProfileModal.jsx`, opened from the sidebar's user card (or the new
  **Profile** nav entry), lets a user edit **Display Name, Bio, Hostel/Room
  Block, Contact Number**, and upload a new **profile picture**.
- Avatar uploads go to the `avatars` storage bucket; the public URL is saved
  to `profiles.avatar_url` and reflected immediately in the sidebar and on
  any item/lender card that shows the user.

### Other notes
- **Notifications** are now computed on the fly from live booking/bid state
  (pending/accepted/declined bookings, current-top-bidder / outbid status)
  instead of a separate mutable table — simpler and always in sync, at the
  cost of not persisting a "read/unread" flag. If you want persisted,
  dismissible notifications later, add a `notifications` table following the
  same RLS pattern as the others in the schema.
- **Reviews** were kept (they existed in the original app and add real value)
  even though they weren't explicitly in your table list — they hang off
  `assets` via `reviews.asset_id`.
- Bookings use `bookings.renter_id` for **the person requesting to rent**;
  `assets.renter_id` is **the person who listed/owns the item** (matching
  your requested column name) — worth double-checking this naming if you
  extend the schema later, since the same column name means different things
  on the two tables.
