/**
 * accent.ts — SINGLE SOURCE OF TRUTH for the app accent colour.
 *
 * The app historically had TWO disconnected colour systems:
 *   A) tokens.css `--accent-primary` (driven by the [data-theme] preset)
 *   B) `config.customAccentColor` read inline by ~40 components, hardcoded purple
 * They never synced, so picking a colour only repainted half the UI.
 *
 * `applyAccent(hex)` resolves ONE user-chosen hex into EVERY accent CSS variable
 * both systems consume. Call it whenever `config.customAccentColor` changes
 * (see AppLayoutInner). Inline components keep reading `customAccentColor`;
 * var-based components read the synced vars — both now follow the same value.
 */

export const ACCENT_PRESETS: { hex: string; name: string }[] = [
  { hex: '#7c3aed', name: 'Violet'  },
  { hex: '#6366f1', name: 'Indigo'  },
  { hex: '#3b82f6', name: 'Blue'    },
  { hex: '#06b6d4', name: 'Cyan'    },
  { hex: '#14b8a6', name: 'Teal'    },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#eab308', name: 'Gold'    },
  { hex: '#f59e0b', name: 'Amber'   },
  { hex: '#ef4444', name: 'Red'     },
  { hex: '#ec4899', name: 'Pink'    },
  { hex: '#64748b', name: 'Slate'   },
];

const HEX_RE = /^#?[0-9a-fA-F]{6}$|^#?[0-9a-fA-F]{3}$/;

export function normalizeHex(hex: string): string | null {
  if (!hex || !HEX_RE.test(hex.trim())) return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return `#${h.toLowerCase()}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const norm = normalizeHex(hex) ?? '#7c3aed';
  const n = parseInt(norm.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = ([r, g, b]: [number, number, number], a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

/** Mix toward white by `amt` (0..1) — used for hover / text-accent tints. */
function lighten(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

/**
 * Write the chosen accent into every accent CSS variable the app reads.
 * Runtime inline styles on <html> override the stylesheet preset, so the
 * user's pick always wins regardless of which wallpaper theme is active.
 */
export function applyAccent(hexInput: string): void {
  const hex = normalizeHex(hexInput);
  if (!hex) return;
  const rgb = hexToRgb(hex);
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  // ── New token system (src/shared/styles/tokens.css) ──────────────────────
  set('--accent-primary',        hex);
  set('--accent-primary-hover',  lighten(hex, 0.18));
  set('--accent-primary-muted',  rgba(rgb, 0.18));
  set('--accent-primary-glow',   rgba(rgb, 0.30));
  set('--border-accent',         rgba(rgb, 0.35));
  set('--border-focus',          rgba(rgb, 0.60));
  set('--text-accent',           lighten(hex, 0.35));
  set('--shadow-accent',         `0 0 20px ${rgba(rgb, 0.22)}`);
  set('--bg-surface-active',     rgba(rgb, 0.16));

  // ── Legacy --color-* system (src/index.css) used by tables & older pages ──
  set('--color-accent-highlight', hex);
  set('--color-accent-muted',     rgba(rgb, 0.15));
  set('--color-accent-border',    rgba(rgb, 0.30));
}
