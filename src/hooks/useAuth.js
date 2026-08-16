import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getProfile } from '../lib/api';

export default function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.error('Failed to load profile:', err.message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) loadProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => {
    if (session?.user) loadProfile(session.user.id);
  }, [session, loadProfile]);

  return {
    session,
    user: session?.user || null,
    profile,
    loading,
    refreshProfile,
  };
}
