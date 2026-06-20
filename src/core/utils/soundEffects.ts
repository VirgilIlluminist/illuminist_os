/**
 * soundEffects.ts — Suara feedback + Haptic HP dengan Web Audio API
 * Tidak perlu file audio eksternal — generate dari kode.
 * Toggle di Settings.
 */

const SOUND_KEY   = 'illuminist_sound_enabled';
const HAPTIC_KEY  = 'illuminist_haptic_enabled';

export const isSoundEnabled   = () => { try { return localStorage.getItem(SOUND_KEY)  !== 'false'; } catch { return true; } };
export const isHapticEnabled  = () => { try { return localStorage.getItem(HAPTIC_KEY) !== 'false'; } catch { return true; } };
export const setSoundEnabled  = (v: boolean) => { try { localStorage.setItem(SOUND_KEY,  String(v)); } catch {} };
export const setHapticEnabled = (v: boolean) => { try { localStorage.setItem(HAPTIC_KEY, String(v)); } catch {} };

// ─── Web Audio API context ────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  if (typeof AudioContext === 'undefined') return null;
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

function beep(opts: {
  freq?: number; freq2?: number; type?: OscillatorType;
  duration?: number; vol?: number; attack?: number;
}) {
  const c = ctx();
  if (!c) return;
  const { freq=880, freq2, type='sine', duration=0.12, vol=0.25, attack=0.01 } = opts;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, c.currentTime + duration);
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.05);
}

// ─── Sound presets ────────────────────────────────────────────────────────

/** Sukses — dua nada naik */
export function soundSuccess() {
  beep({ freq: 523, duration: 0.08, vol: 0.20 });
  setTimeout(() => beep({ freq: 784, duration: 0.12, vol: 0.18 }), 80);
}

/** Error — nada turun */
export function soundError() {
  beep({ freq: 440, freq2: 280, duration: 0.20, type: 'sawtooth', vol: 0.15 });
}

/** Warning — dua nada sama */
export function soundWarning() {
  beep({ freq: 660, duration: 0.09, vol: 0.18 });
  setTimeout(() => beep({ freq: 660, duration: 0.09, vol: 0.14 }), 140);
}

/** Notifikasi — lembut seperti iOS */
export function soundNotification() {
  beep({ freq: 1046, duration: 0.06, vol: 0.14 });
  setTimeout(() => beep({ freq: 1318, duration: 0.09, vol: 0.12 }), 65);
}

/** Tap halus untuk klik tombol */
export function soundTap() {
  beep({ freq: 1200, duration: 0.035, vol: 0.07 });
}

/** Cash masuk — menyenangkan */
export function soundCashIn() {
  [523, 659, 784, 1046].forEach((f,i) =>
    setTimeout(() => beep({ freq:f, duration:0.07, vol:0.16 }), i*55)
  );
}

// ─── Haptic patterns ──────────────────────────────────────────────────────

const HAPTIC: Record<string, number[]> = {
  light:   [8],
  medium:  [18],
  heavy:   [40],
  success: [8, 50, 8],
  error:   [25, 30, 25],
  warning: [15, 20, 15],
};

export function haptic(pattern: keyof typeof HAPTIC = 'light') {
  if (!isHapticEnabled()) return;
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try { navigator.vibrate(HAPTIC[pattern] || [10]); } catch {}
}

// ─── Auto-wire: haptic pada setiap klik tombol ───────────────────────────

export function initHapticGlobal() {
  if (typeof document === 'undefined') return;
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement)?.closest('button');
    if (!btn || btn.disabled) return;
    haptic('light');
  }, { passive: true });
}

// ─── Swipe Gesture ─────────────────────────────────────────────────────── */

export function initSwipeGesture(opts: {
  onSwipeRight?: () => void;
  onSwipeLeft?:  () => void;
  threshold?:    number;
  edgeWidth?:    number;
}): () => void {
  const { onSwipeRight, onSwipeLeft, threshold = 65, edgeWidth = 28 } = opts;
  let sx = 0, sy = 0, t0 = 0, fromEdge = false;

  const start = (e: TouchEvent) => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    t0 = Date.now();
    fromEdge = sx < edgeWidth || sx > window.innerWidth - edgeWidth;
  };

  const end = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < threshold) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.75) return;
    if (Date.now() - t0 > 400) return;
    if (!fromEdge) return;
    if (dx > 0 && onSwipeRight) { haptic('light'); onSwipeRight(); }
    if (dx < 0 && onSwipeLeft)  { haptic('light'); onSwipeLeft(); }
  };

  document.addEventListener('touchstart', start, { passive: true });
  document.addEventListener('touchend',   end,   { passive: true });
  return () => {
    document.removeEventListener('touchstart', start);
    document.removeEventListener('touchend',   end);
  };
}
