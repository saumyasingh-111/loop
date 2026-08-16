import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '!',
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback((message, type = 'info', duration = 4200) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = useRef({
    success: (msg, d) => push(msg, 'success', d),
    error: (msg, d) => push(msg, 'error', d),
    info: (msg, d) => push(msg, 'info', d),
    warning: (msg, d) => push(msg, 'warning', d),
    dismiss,
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              className={`toast-item toast-${t.type}`}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={() => dismiss(t.id)}
            >
              <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
              <span className="toast-msg">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail-soft fallback so a missing provider never crashes the app
    return { success: () => {}, error: () => {}, info: () => {}, warning: () => {}, dismiss: () => {} };
  }
  return ctx;
}
