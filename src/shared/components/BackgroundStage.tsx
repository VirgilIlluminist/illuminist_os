/**
 * BackgroundStage — full-screen wallpaper layer with adjustable blur/overlay.
 *
 * Architecture (same rule as the template):
 *  - Wallpaper   → fixed, no filter
 *  - Dark overlay → fixed, adjustable opacity
 *  - App shell   → glass-panel (ONE backdrop-filter for the whole shell)
 *  - Inner cards → glass-card / glass-inset (solid fill, NO nested blur)
 *
 * Settings are persisted in localStorage so they survive page reload.
 */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImagePlus, Upload, RotateCcw, X, ImageIcon, Link2 } from 'lucide-react';

type FitMode = 'cover' | 'contain' | 'fill';

const LS_KEY = 'illuminist_bg_stage';
const DEFAULT_BG = '';        // empty = use CSS gradient wallpaper
const DEFAULT_OVERLAY = 45;
const DEFAULT_BLUR = 24;
const DEFAULT_FIT: FitMode = 'cover';

interface StageState {
  bg: string;
  fit: FitMode;
  overlay: number;
  blur: number;
}

function loadState(): StageState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...{ bg: DEFAULT_BG, fit: DEFAULT_FIT, overlay: DEFAULT_OVERLAY, blur: DEFAULT_BLUR }, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { bg: DEFAULT_BG, fit: DEFAULT_FIT, overlay: DEFAULT_OVERLAY, blur: DEFAULT_BLUR };
}

function saveState(s: StageState) {
  try {
    // Don't persist base64 images (can be huge) — only URLs
    const toSave = s.bg.startsWith('data:') ? { ...s, bg: '' } : s;
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
  } catch { /* quota */ }
}

const fitOptions: { value: FitMode; label: string }[] = [
  { value: 'cover',   label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill',    label: 'Stretch' },
];

export function BackgroundStage({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StageState>(loadState);
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { bg, fit, overlay, blur } = state;

  const patch = useCallback((updates: Partial<StageState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      saveState(next);
      return next;
    });
  }, []);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (typeof e.target?.result === 'string') patch({ bg: e.target.result });
    };
    reader.readAsDataURL(file);
  }, [patch]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const applyUrl = useCallback(() => {
    const url = urlInput.trim();
    if (url) { patch({ bg: url }); }
  }, [urlInput, patch]);

  const reset = useCallback(() => {
    const s = { bg: DEFAULT_BG, fit: DEFAULT_FIT, overlay: DEFAULT_OVERLAY, blur: DEFAULT_BLUR };
    setState(s);
    saveState(s);
    setUrlInput('');
  }, []);

  // Expose blur to children via CSS var on a wrapper
  const shellStyle = { '--dash-blur': `${blur}px` } as React.CSSProperties;

  return (
    <div
      className="bg-stage-root"
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      style={{ position: 'relative', minHeight: '100vh', width: '100%' }}
    >
      {/* ── Wallpaper ─────────────────────────────────────────────────── */}
      {bg ? (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 0,
            backgroundImage: `url("${bg}")`,
            backgroundSize: fit === 'fill' ? '100% 100%' : fit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : (
        /* Fall back to the CSS gradient wallpaper defined in tokens.css */
        <div
          aria-hidden="true"
          className="app-wallpaper"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
      )}

      {/* ── Dark overlay ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 1,
          background: '#000',
          opacity: overlay / 100,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}
      />

      {/* ── App shell — glass-panel = only blur layer ─────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, ...shellStyle }}>
        {children}
      </div>

      {/* ── Floating customize button + panel ─────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{
                width: 300,
                borderRadius: 20,
                padding: 20,
                background: 'rgba(13, 10, 24, 0.88)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <ImageIcon size={15} style={{ color: 'var(--accent-primary, #7c3aed)' }} />
                  Customize Background
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Upload zone */}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '20px 16px', borderRadius: 14,
                  border: '1px dashed rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 13,
                  transition: 'all 0.15s',
                }}
              >
                <Upload size={18} style={{ color: 'rgba(255,255,255,0.35)' }} />
                <span style={{ fontWeight: 500 }}>Upload image</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>or drag & drop anywhere — any size</span>
              </button>

              {/* URL input */}
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Paste image URL</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0 10px' }}>
                    <Link2 size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyUrl()}
                      placeholder="https://..."
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(255,255,255,0.8)', padding: '8px 0' }}
                    />
                  </div>
                  <button
                    onClick={applyUrl}
                    style={{ background: 'var(--accent-primary, #7c3aed)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Fit mode */}
              <div style={{ marginTop: 14 }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Image fit</span>
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
                  {fitOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => patch({ fit: opt.value })}
                      style={{
                        flex: 1, padding: '6px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        background: fit === opt.value ? 'var(--accent-primary, #7c3aed)' : 'transparent',
                        color: fit === opt.value ? '#fff' : 'rgba(255,255,255,0.45)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur slider */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Glass blur</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{blur}px</span>
                </div>
                <input type="range" min={0} max={48} value={blur} onChange={e => patch({ blur: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary, #7c3aed)', cursor: 'pointer' }}
                />
              </div>

              {/* Overlay slider */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Darken overlay</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{overlay}%</span>
                </div>
                <input type="range" min={0} max={85} value={overlay} onChange={e => patch({ overlay: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary, #7c3aed)', cursor: 'pointer' }}
                />
              </div>

              {/* Reset */}
              <button
                onClick={reset}
                style={{
                  marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <RotateCcw size={12} /> Reset to default
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen(v => !v)}
          title="Customize background"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 9999,
            background: 'rgba(13, 10, 24, 0.80)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ImagePlus size={16} style={{ color: 'var(--accent-primary, #7c3aed)' }} />
          <span>Wallpaper</span>
        </motion.button>
      </div>
    </div>
  );
}
