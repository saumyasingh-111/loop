import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

import useAuth from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import FloatingActionButton from './components/FloatingActionButton';
import ErrorBoundary from './components/ErrorBoundary';
import SkeletonGrid from './components/Skeleton';
import { useToast } from './components/Toast';

import EventsView from './views/EventsView';
import RentalsView from './views/RentalsView';
import ItemDetailView from './views/ItemDetailView';
import SneakerBidsView from './views/SneakerBidsView';
import PollsView from './views/PollsView';
import MyRequestsView from './views/MyRequestsView';
import LenderPortalView from './views/LenderPortalView';
import NotificationsView from './views/NotificationsView';
import SuggestionsView from './views/SuggestionsView';

import ProfileModal from './components/modals/ProfileModal';
import ListAssetModal from './components/modals/ListAssetModal';
import ListSneakerModal from './components/modals/ListSneakerModal';
import HostEventModal from './components/modals/HostEventModal';
import CreatePollModal from './components/modals/CreatePollModal';
import BookingModal from './components/modals/BookingModal';

import {
  signOut,
  listAssets, listEvents, listSneakers, listPolls, listSuggestions,
  listAllReviews, allEventRegistrationCounts, myEventRegistrations, registerForEvent,
  myBookings as apiMyBookings, incomingBookings as apiIncomingBookings, updateBookingStatus, setAssetStatus,
  getProfilesByIds, myUpvotedSuggestionIds, myBidSneakerIds,
} from './lib/api';

export default function App() {
  const { session, user, profile, loading: authLoading, refreshProfile } = useAuth();
  const toast = useToast();

  // ── Navigation ─────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useCallback((view) => { setCurrentView(view); setSidebarOpen(false); }, []);

  // ── Core datasets ──────────────────────────────────────────────────────
  const [assets, setAssets] = useState([]);
  const [events, setEvents] = useState([]);
  const [sneakers, setSneakers] = useState([]);
  const [polls, setPolls] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [reviewsRaw, setReviewsRaw] = useState([]);
  const [registrationCounts, setRegistrationCounts] = useState({});
  const [myRegisteredEventIds, setMyRegisteredEventIds] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [incomingBookingsList, setIncomingBookingsList] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [myUpvotedIds, setMyUpvotedIds] = useState([]);
  const [myBidSneakerIdSet, setMyBidSneakerIdSet] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Selection / ephemeral UI state ────────────────────────────────────
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedRentalCategory, setSelectedRentalCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibeFilter, setSelectedVibeFilter] = useState('All');
  const [bidAmounts, setBidAmounts] = useState({});

  // ── Modal state ─────────────────────────────────────────────────────────
  const [activeFabModal, setActiveFabModal] = useState(null); // 'list-asset' | 'list-sneaker' | 'host-event' | 'create-poll'
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const cacheProfiles = useCallback(async (ids) => {
    const missing = [...new Set(ids.filter(Boolean))].filter(id => !profilesById[id]);
    if (missing.length === 0) return;
    const fetched = await getProfilesByIds(missing);
    setProfilesById(prev => {
      const next = { ...prev };
      fetched.forEach(p => { next[p.id] = p; });
      return next;
    });
  }, [profilesById]);

  // ── Load everything once authenticated ─────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [assetsData, eventsData, sneakersData, pollsData, suggestionsData, reviewsData, regCounts, myRegs, mine, upvoted, bidSneakerIds] = await Promise.all([
        listAssets(), listEvents(), listSneakers(), listPolls(), listSuggestions(),
        listAllReviews(), allEventRegistrationCounts(), myEventRegistrations(user.id),
        apiMyBookings(user.id), myUpvotedSuggestionIds(user.id), myBidSneakerIds(user.id),
      ]);
      setAssets(assetsData);
      setEvents(eventsData);
      setSneakers(sneakersData);
      setPolls(pollsData);
      setSuggestions(suggestionsData);
      setReviewsRaw(reviewsData);
      setRegistrationCounts(regCounts);
      setMyRegisteredEventIds(myRegs);
      setMyBookings(mine);
      setMyUpvotedIds(upvoted);
      setMyBidSneakerIdSet(bidSneakerIds);

      const idsToCache = [
        ...eventsData.map(e => e.host_id),
        ...assetsData.map(a => a.renter_id),
        ...sneakersData.map(s => s.top_bidder).filter(Boolean),
        ...sneakersData.map(s => s.seller_id),
      ];
      await cacheProfiles(idsToCache);
    } catch (err) {
      console.error('Failed to load app data:', err.message);
    } finally {
      setDataLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Lender portal data (only when needed) ──────────────────────────────
  const loadLenderData = useCallback(async () => {
    if (!user) return;
    const myAssetIds = assets.filter(a => a.renter_id === user.id).map(a => a.id);
    const bookings = await apiIncomingBookings(myAssetIds);
    const withTitles = bookings.map(b => ({ ...b, assetTitle: assets.find(a => a.id === b.item_id)?.title || 'Item' }));
    setIncomingBookingsList(withTitles);
    await cacheProfiles(bookings.map(b => b.renter_id));
  }, [user, assets, cacheProfiles]);

  useEffect(() => { if (currentView === 'lender') loadLenderData(); }, [currentView, loadLenderData]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const reviewCounts = useMemo(() => {
    const counts = {};
    reviewsRaw.forEach(r => { counts[r.asset_id] = (counts[r.asset_id] || 0) + 1; });
    return counts;
  }, [reviewsRaw]);

  const avgRatings = useMemo(() => {
    const sums = {};
    reviewsRaw.forEach(r => {
      if (!sums[r.asset_id]) sums[r.asset_id] = { total: 0, count: 0 };
      sums[r.asset_id].total += r.stars;
      sums[r.asset_id].count += 1;
    });
    const out = {};
    Object.keys(sums).forEach(id => { out[id] = sums[id].total / sums[id].count; });
    return out;
  }, [reviewsRaw]);

  const assetsById = useMemo(() => Object.fromEntries(assets.map(a => [a.id, a])), [assets]);
  const myAssets = useMemo(() => assets.filter(a => user && a.renter_id === user.id), [assets, user]);

  const notifications = useMemo(() => {
    const list = [];
    myBookings.forEach(b => {
      const asset = assetsById[b.item_id];
      if (b.status === 'accepted') list.push({ id: `book-acc-${b.id}`, text: `✅ Your request for "${asset?.title || 'an item'}" was accepted!`, time: new Date(b.created_at).toLocaleDateString() });
      else if (b.status === 'declined') list.push({ id: `book-dec-${b.id}`, text: `❌ Your request for "${asset?.title || 'an item'}" was declined.`, time: new Date(b.created_at).toLocaleDateString() });
      else list.push({ id: `book-pend-${b.id}`, text: `⏳ Your request for "${asset?.title || 'an item'}" is pending approval.`, time: new Date(b.created_at).toLocaleDateString() });
    });
    incomingBookingsList.filter(b => b.status === 'pending').forEach(b => {
      list.push({ id: `incoming-${b.id}`, text: `📥 New rental request for "${b.assetTitle}".`, time: new Date(b.created_at).toLocaleDateString() });
    });
    sneakers.forEach(sn => {
      if (myBidSneakerIdSet.includes(sn.id)) {
        if (sn.top_bidder === user?.id) list.push({ id: `bid-win-${sn.id}`, text: `🏆 You're the top bidder on "${sn.model}"!`, time: '' });
        else list.push({ id: `bid-out-${sn.id}`, text: `⚠️ You've been outbid on "${sn.model}".`, time: '' });
      }
    });
    return list;
  }, [myBookings, incomingBookingsList, sneakers, myBidSneakerIdSet, assetsById, user]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRegisterEvent = async (eventId) => {
    try {
      await registerForEvent(eventId, user.id);
      const [counts, myRegs] = await Promise.all([allEventRegistrationCounts(), myEventRegistrations(user.id)]);
      setRegistrationCounts(counts);
      setMyRegisteredEventIds(myRegs);
      toast.success('You\'re registered! See you there ✦');
    } catch (err) {
      toast.error(err.message || 'Failed to register.');
    }
  };

  const toggleAssetStatus = async (asset) => {
    const next = asset.status === 'available' ? 'rented' : 'available';
    try {
      const updated = await setAssetStatus(asset.id, next);
      setAssets(prev => prev.map(a => a.id === asset.id ? updated : a));
      toast.success(next === 'rented' ? 'Marked as rented out.' : 'Marked as available.');
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleAcceptBooking = async (booking) => {
    try {
      const updated = await updateBookingStatus(booking.id, 'accepted');
      setIncomingBookingsList(prev => prev.map(b => b.id === booking.id ? { ...b, ...updated } : b));
      const updatedAsset = await setAssetStatus(booking.item_id, 'rented');
      setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
      toast.success('Request accepted.');
    } catch (err) {
      toast.error(err.message || 'Failed to accept request.');
    }
  };

  const handleDeclineBooking = async (booking) => {
    try {
      const updated = await updateBookingStatus(booking.id, 'declined');
      setIncomingBookingsList(prev => prev.map(b => b.id === booking.id ? { ...b, ...updated } : b));
      toast.info('Request declined.');
    } catch (err) {
      toast.error(err.message || 'Failed to decline request.');
    }
  };

  const openBookingModal = () => setBookingModalOpen(true);

  // ── FAB → modal wiring (context-aware by page) ──────────────────────────
  const handleFabAction = () => {
    if (currentView === 'rentals') setActiveFabModal('list-asset');
    else if (currentView === 'sneaker-bids') setActiveFabModal('list-sneaker');
    else if (currentView === 'events') setActiveFabModal('host-event');
    else if (currentView === 'polls') setActiveFabModal('create-poll');
  };

  const refreshPolls = async () => setPolls(await listPolls());
  const refreshSuggestions = async () => {
    const [list, upvoted] = await Promise.all([listSuggestions(), myUpvotedSuggestionIds(user.id)]);
    setSuggestions(list);
    setMyUpvotedIds(upvoted);
  };
  const refreshSneakers = async () => {
    const [list, bidIds] = await Promise.all([listSneakers(), myBidSneakerIds(user.id)]);
    setSneakers(list);
    setMyBidSneakerIdSet(bidIds);
    await cacheProfiles(list.map(s => s.top_bidder).filter(Boolean));
  };
  const refreshBookingsAfterRequest = async () => {
    const mine = await apiMyBookings(user.id);
    setMyBookings(mine);
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="app-boot-screen">
        <div className="boot-orb boot-orb-a" />
        <div className="boot-orb boot-orb-b" />
        <div className="boot-mark">Loop</div>
        <p className="boot-sub">Loading your loop…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!profile) {
    return (
      <div className="app-boot-screen">
        <div className="boot-orb boot-orb-a" />
        <div className="boot-orb boot-orb-b" />
        <div className="boot-mark">Loop</div>
        <p className="boot-sub">Setting up your profile…</p>
      </div>
    );
  }

  const unreadCount = notifications.length;

  return (
    <div className="dashboard-layout">
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb mesh-orb-indigo" />
        <div className="mesh-orb mesh-orb-violet" />
        <div className="mesh-orb mesh-orb-lime" />
        <div className="mesh-grain" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(v => !v)}>
          <span /><span /><span />
        </button>
        <span className="mobile-brand">Loop</span>
        <button className="notif-topbar-btn" onClick={() => navigate('notifications')}>
          🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>
      </div>

      <Sidebar
        profile={profile}
        currentView={currentView}
        sidebarOpen={sidebarOpen}
        unreadCount={unreadCount}
        myRequestsCount={myBookings.length}
        navigate={navigate}
        onLogout={() => signOut()}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      <main className="dashboard-main">
        {dataLoading ? (
          <SkeletonGrid count={6} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {currentView === 'events' && (
                <ErrorBoundary label="Events">
                  <EventsView
                    events={events}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    selectedVibeFilter={selectedVibeFilter} setSelectedVibeFilter={setSelectedVibeFilter}
                    registrationCounts={registrationCounts}
                    myRegisteredEventIds={myRegisteredEventIds}
                    handleRegisterEvent={handleRegisterEvent}
                    setSelectedRentalCategory={setSelectedRentalCategory}
                    navigate={navigate}
                  />
                </ErrorBoundary>
              )}

              {currentView === 'rentals' && (
                <ErrorBoundary label="Marketplace">
                  <RentalsView
                    assets={assets}
                    selectedRentalCategory={selectedRentalCategory}
                    setSelectedRentalCategory={setSelectedRentalCategory}
                    reviewCounts={reviewCounts}
                    avgRatings={avgRatings}
                    setSelectedAsset={setSelectedAsset}
                    navigate={navigate}
                  />
                </ErrorBoundary>
              )}

              {currentView === 'item-detail' && selectedAsset && (
                <ErrorBoundary label="Item Detail">
                  <ItemDetailView
                    selectedAsset={selectedAsset}
                    currentUserId={user.id}
                    navigate={navigate}
                    onOpenBooking={openBookingModal}
                  />
                </ErrorBoundary>
              )}

              {currentView === 'sneaker-bids' && (
                <ErrorBoundary label="Sneaker Bidding">
                  <SneakerBidsView
                    sneakers={sneakers}
                    bidAmounts={bidAmounts}
                    setBidAmounts={setBidAmounts}
                    profilesById={profilesById}
                    onBidPlaced={refreshSneakers}
                    currentUserId={user.id}
                  />
                </ErrorBoundary>
              )}

              {currentView === 'polls' && (
                <ErrorBoundary label="FitCheck Polls">
                  <PollsView
                    polls={polls}
                    currentUserId={user.id}
                    assets={assets}
                    setSelectedAsset={setSelectedAsset}
                    navigate={navigate}
                    onVoted={refreshPolls}
                  />
                </ErrorBoundary>
              )}

              {currentView === 'requests' && (
                <ErrorBoundary label="My Requests">
                  <MyRequestsView bookings={myBookings} assetsById={assetsById} navigate={navigate} />
                </ErrorBoundary>
              )}

              {currentView === 'lender' && (
                <ErrorBoundary label="Lender Portal">
                  <LenderPortalView
                    myAssets={myAssets}
                    toggleAssetStatus={toggleAssetStatus}
                    incomingBookings={incomingBookingsList}
                    renterProfilesById={profilesById}
                    onAccept={handleAcceptBooking}
                    onDecline={handleDeclineBooking}
                  />
                </ErrorBoundary>
              )}

              {currentView === 'notifications' && (
                <ErrorBoundary label="Notifications">
                  <NotificationsView notifications={notifications} />
                </ErrorBoundary>
              )}

              {currentView === 'suggestions' && (
                <ErrorBoundary label="Suggestions">
                  <SuggestionsView
                    suggestions={suggestions}
                    myUpvotedIds={myUpvotedIds}
                    currentUserId={user.id}
                    onChanged={refreshSuggestions}
                  />
                </ErrorBoundary>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <FloatingActionButton currentView={currentView} onAction={handleFabAction} />

      {activeFabModal === 'list-asset' && (
        <ListAssetModal userId={user.id} onClose={() => setActiveFabModal(null)} onCreated={async () => setAssets(await listAssets())} />
      )}
      {activeFabModal === 'list-sneaker' && (
        <ListSneakerModal userId={user.id} onClose={() => setActiveFabModal(null)} onCreated={refreshSneakers} />
      )}
      {activeFabModal === 'host-event' && (
        <HostEventModal userId={user.id} onClose={() => setActiveFabModal(null)} onCreated={async () => setEvents(await listEvents())} />
      )}
      {activeFabModal === 'create-poll' && (
        <CreatePollModal userId={user.id} assets={assets} onClose={() => setActiveFabModal(null)} onCreated={refreshPolls} />
      )}

      {profileModalOpen && (
        <ProfileModal
          profile={profile}
          userId={user.id}
          onClose={() => setProfileModalOpen(false)}
          onUpdated={refreshProfile}
        />
      )}

      {bookingModalOpen && selectedAsset && (
        <BookingModal
          asset={selectedAsset}
          userId={user.id}
          onClose={() => setBookingModalOpen(false)}
          onBooked={async () => { await refreshBookingsAfterRequest(); navigate('requests'); }}
        />
      )}
    </div>
  );
}
