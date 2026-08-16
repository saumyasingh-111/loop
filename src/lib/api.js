import { supabase } from '../supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════
export async function signUp({ email, password, name, hostel_block, contact_number }) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name, hostel_block, contact_number } },
  });
}

export async function signIn({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return data.subscription;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════════════════
export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function getProfilesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, fields) {
  const { data, error } = await supabase.from('profiles').update(fields).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE HELPERS (item images / sneaker photos)
// ═══════════════════════════════════════════════════════════════════════════
export async function uploadItemImage(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('item-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('item-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadSneakerPhoto(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('sneaker-photos').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('sneaker-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════
export async function listEvents() {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEvent(fields) {
  const { data, error } = await supabase.from('events').insert([fields]).select().single();
  if (error) throw error;
  return data;
}

export async function registerForEvent(eventId, userId) {
  const { error: regErr } = await supabase.from('event_registrations').insert([{ event_id: eventId, user_id: userId }]);
  if (regErr) throw regErr;
  // Note: slots_taken is only updated by the event host's row-level policy in the
  // full schema; registration itself is tracked authoritatively via event_registrations,
  // and available seats are computed client-side as slots - registrations.length.
}

export async function myEventRegistrations(userId) {
  const { data, error } = await supabase.from('event_registrations').select('event_id').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(r => r.event_id);
}

// map of event_id -> registration count, used to compute seats remaining client-side
export async function allEventRegistrationCounts() {
  const { data, error } = await supabase.from('event_registrations').select('event_id');
  if (error) throw error;
  const counts = {};
  (data || []).forEach(r => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
  return counts;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSETS (rental marketplace)
// ═══════════════════════════════════════════════════════════════════════════
export async function listAssets() {
  const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAsset(fields) {
  const { data, error } = await supabase.from('assets').insert([fields]).select().single();
  if (error) throw error;
  return data;
}

export async function setAssetStatus(assetId, status) {
  const { data, error } = await supabase.from('assets').update({ status }).eq('id', assetId).select().single();
  if (error) throw error;
  return data;
}

export async function getAsset(assetId) {
  const { data, error } = await supabase.from('assets').select('*').eq('id', assetId).single();
  if (error) throw error;
  return data;
}

// ── Reviews ──────────────────────────────────────────────────────────────
export async function listReviews(assetId) {
  const { data, error } = await supabase.from('reviews').select('*').eq('asset_id', assetId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createReview({ asset_id, reviewer_id, stars, text }) {
  const { data, error } = await supabase.from('reviews').insert([{ asset_id, reviewer_id, stars, text }]).select().single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// REVIEW STATS (used to show star ratings on marketplace cards)
// ═══════════════════════════════════════════════════════════════════════════
export async function listAllReviews() {
  const { data, error } = await supabase.from('reviews').select('asset_id, stars');
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// SNEAKERS + BIDS
// ═══════════════════════════════════════════════════════════════════════════
export async function listSneakers() {
  const { data, error } = await supabase.from('sneakers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSneaker(fields) {
  const { data, error } = await supabase.from('sneakers').insert([fields]).select().single();
  if (error) throw error;
  return data;
}

export async function listSneakerBids(sneakerId) {
  const { data, error } = await supabase.from('sneaker_bids').select('*').eq('sneaker_id', sneakerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function myBidSneakerIds(userId) {
  const { data, error } = await supabase.from('sneaker_bids').select('sneaker_id').eq('bidder_id', userId);
  if (error) throw error;
  return [...new Set((data || []).map(r => r.sneaker_id))];
}

export async function placeBid(sneakerId, amount) {
  const { data, error } = await supabase.rpc('place_sneaker_bid', { p_sneaker_id: sneakerId, p_amount: amount });
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIT POLLS
// ═══════════════════════════════════════════════════════════════════════════
export async function listPolls() {
  const { data: polls, error } = await supabase.from('fit_polls').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const { data: options, error: optErr } = await supabase.from('poll_options').select('*');
  if (optErr) throw optErr;
  const { data: votes, error: voteErr } = await supabase.from('poll_votes').select('*');
  if (voteErr) throw voteErr;
  return polls.map(p => ({
    ...p,
    options: options.filter(o => o.poll_id === p.id).map(o => ({
      ...o,
      voteCount: votes.filter(v => v.option_id === o.id).length,
    })),
    myVoteOptionId: null, // filled by caller who knows current user
    allVotes: votes.filter(v => v.poll_id === p.id),
  }));
}

export async function createPoll({ title, created_by, linked_item_id, options }) {
  const { data: poll, error } = await supabase.from('fit_polls').insert([{ title, created_by, linked_item_id }]).select().single();
  if (error) throw error;
  if (options && options.length) {
    const rows = options.map(o => ({ ...o, poll_id: poll.id }));
    const { error: optErr } = await supabase.from('poll_options').insert(rows);
    if (optErr) throw optErr;
  }
  return poll;
}

export async function castVote(pollId, optionId) {
  const { error } = await supabase.rpc('cast_poll_vote', { p_poll_id: pollId, p_option_id: optionId });
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS / REQUESTS
// ═══════════════════════════════════════════════════════════════════════════
export async function createBooking(fields) {
  const { data, error } = await supabase.from('bookings').insert([fields]).select().single();
  if (error) throw error;
  return data;
}

export async function myBookings(userId) {
  const { data, error } = await supabase.from('bookings').select('*').eq('renter_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// bookings for items the current user owns (lender-side)
export async function incomingBookings(ownedAssetIds) {
  if (!ownedAssetIds || ownedAssetIds.length === 0) return [];
  const { data, error } = await supabase.from('bookings').select('*').in('item_id', ownedAssetIds).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTIONS / HELPDESK
// ═══════════════════════════════════════════════════════════════════════════
export async function listSuggestions() {
  const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSuggestion(fields) {
  const { data, error } = await supabase.from('suggestions').insert([fields]).select().single();
  if (error) throw error;
  return data;
}

export async function upvoteSuggestion(suggestionId, userId) {
  const { error } = await supabase.from('suggestion_votes').insert([{ suggestion_id: suggestionId, user_id: userId }]);
  if (error) throw error;
}

export async function myUpvotedSuggestionIds(userId) {
  const { data, error } = await supabase.from('suggestion_votes').select('suggestion_id').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(r => r.suggestion_id);
}
