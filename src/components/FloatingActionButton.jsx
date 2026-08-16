import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Which views get a floating "+" button, and what it means on each one.
const FAB_CONFIG = {
  rentals: { label: 'List a rental item', icon: '🛍️' },
  'sneaker-bids': { label: 'List a sneaker for bidding', icon: '👟' },
  events: { label: 'Host an event', icon: '🎉' },
  polls: { label: 'Create a FitCheck poll', icon: '✨' },
};

export default function FloatingActionButton({ currentView, onAction }) {
  const config = FAB_CONFIG[currentView];
  if (!config) return null;

  return (
    <div className="fab-wrap">
      <AnimatePresence mode="wait">
        <motion.button
          key={currentView}
          className="context-fab"
          title={config.label}
          onClick={onAction}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          <span className="context-fab-icon">＋</span>
          <span className="context-fab-tooltip">{config.icon} {config.label}</span>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
