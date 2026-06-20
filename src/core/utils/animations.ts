/**
 * animations.ts — POLISH-02
 * Sistem animasi terpusat agar semua komponen pakai variasi yang sama.
 * Sebelumnya: sebagian pakai motion library, sebagian CSS animate-fadeIn saja.
 *
 * Cara pakai:
 *   import { ANIM, SPRING } from '../utils/animations';
 *   <motion.div {...ANIM.fadeUp}>...</motion.div>
 *   <motion.div {...ANIM.scale}>...</motion.div>
 */

// ─── Variants untuk motion components ────────────────────────────────────────

/** Fade up dari bawah — untuk card/panel baru muncul */
export const ANIM = {
  fadeUp: {
    initial:    { opacity: 0, y: 12 },
    animate:    { opacity: 1, y: 0  },
    exit:       { opacity: 0, y: 6  },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },

  /** Scale in — untuk modal/popup */
  scale: {
    initial:    { opacity: 0, scale: 0.96 },
    animate:    { opacity: 1, scale: 1    },
    exit:       { opacity: 0, scale: 0.97 },
    transition: { duration: 0.2,  ease: [0.16, 1, 0.3, 1] },
  },

  /** Fade saja — untuk overlay, tooltip */
  fade: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: { duration: 0.18 },
  },

  /** Slide dari kiri — untuk sidebar */
  slideLeft: {
    initial:    { opacity: 0, x: -16 },
    animate:    { opacity: 1, x: 0   },
    exit:       { opacity: 0, x: -8  },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },

  /** Slide dari kanan — untuk panel detail */
  slideRight: {
    initial:    { opacity: 0, x: 16 },
    animate:    { opacity: 1, x: 0  },
    exit:       { opacity: 0, x: 8  },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },

  /** Stagger container — untuk list item */
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.05 } },
  },

  /** Child item dari stagger */
  staggerItem: {
    initial:    { opacity: 0, y: 8 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.22 },
  },
} as const;

// ─── Spring presets ────────────────────────────────────────────────────────────
export const SPRING = {
  gentle:  { type: 'spring', stiffness: 200, damping: 25 },
  bouncy:  { type: 'spring', stiffness: 400, damping: 20 },
  slow:    { type: 'spring', stiffness: 100, damping: 30 },
} as const;

// ─── CSS-only animation classes ────────────────────────────────────────────────
// Pakai ini jika tidak ingin import motion library
export const CSS_ANIM = {
  fadeIn:       'animate-fadeIn',
  pulse:        'animate-pulse',
  spin:         'animate-spin',
} as const;

// ─── Transition duration tokens ────────────────────────────────────────────────
export const DURATION = {
  fast:   0.15,
  normal: 0.25,
  slow:   0.4,
} as const;

// ─── Easing functions ─────────────────────────────────────────────────────────
export const EASE = {
  smooth:  [0.16, 1, 0.3, 1],
  linear:  'linear',
  easeOut: [0, 0, 0.2, 1],
} as const;
