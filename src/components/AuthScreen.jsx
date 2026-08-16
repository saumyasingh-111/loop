import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp } from '../lib/api';

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', hostel_block: '', contact_number: '' });
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setAuthForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const { error } = await signIn({ email: authForm.email, password: authForm.password });
    setLoading(false);
    if (error) setAuthError(error.message);
    // On success, useAuth's onAuthStateChange listener in App.jsx takes over automatically.
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setAuthNotice('');
    const { data, error } = await signUp({
      email: authForm.email,
      password: authForm.password,
      name: authForm.name,
      hostel_block: authForm.hostel_block,
      contact_number: authForm.contact_number,
    });
    setLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    if (data?.session) {
      // Signed in immediately (email confirmation disabled in Supabase settings)
      return;
    }
    setAuthNotice('Account created! Check your inbox to confirm your email, then log in.');
    setAuthMode('login');
  };

  return (
    <div className="auth-screen">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="auth-brand">
          <div className="brand-dot-auth"></div>
          <h1>L<span>oop</span></h1>
        </div>
        <p className="auth-subtitle">
          {authMode === 'login' ? 'Welcome back! Sign in to keep the loop going.' : 'Join the campus ecosystem.'}
        </p>
        <div className="auth-tabs">
          <button className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setAuthMode('login'); setAuthError(''); setAuthNotice(''); }}>Login</button>
          <button className={authMode === 'signup' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthNotice(''); }}>Sign Up</button>
        </div>
        <AnimatePresence mode="wait">
          <motion.form key={authMode} className="auth-form" onSubmit={authMode === 'login' ? handleLogin : handleSignup}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {authMode === 'signup' && (
              <>
                <label>Full Name *</label>
                <input type="text" placeholder="e.g. Aanya Sharma" value={authForm.name} onChange={handleChange('name')} required />
                <label>Hostel & Block</label>
                <input type="text" placeholder="e.g. Hostel Block B" value={authForm.hostel_block} onChange={handleChange('hostel_block')} />
                <label>WhatsApp / Contact Number</label>
                <input type="tel" placeholder="+91 XXXXXXXXXX" value={authForm.contact_number} onChange={handleChange('contact_number')} />
              </>
            )}
            <label>Email *</label>
            <input type="email" placeholder="yourname@campus.in" value={authForm.email} onChange={handleChange('email')} required />
            <label>Password *</label>
            <input type="password" placeholder="••••••••" value={authForm.password} onChange={handleChange('password')} required minLength={6} />
            {authError && <p className="auth-error">{authError}</p>}
            {authNotice && <p className="auth-hint">{authNotice}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait…' : (authMode === 'login' ? 'Sign In →' : 'Create Account →')}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
