import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useTheme — wallpaper + glass + accent theme manager.
//   Persists to localStorage('illuminist-theme') and drives the [data-theme]
//   attribute on <html> plus a few runtime CSS-var overrides (glass opacity,
//   custom wallpaper). Token presets live in src/shared/styles/tokens.css.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeId = 'midnight' | 'ocean' | 'forest' | 'rose' | 'light';
export type WallpaperType = 'gradient' | 'color' | 'image';

export interface ThemeSettings {
  themeId: ThemeId;
  wallpaperType: WallpaperType;
  customColor?: string;
  customImageUrl?: string;
  glassOpacity: number;   // 40–99 → content solidity (higher = more solid)
  sidebarOpacity: number; // 50–99 → sidebar solidity
}

const STORAGE_KEY = 'illuminist-theme';

export const DEFAULT_THEME: ThemeSettings = {
  themeId: 'midnight',
  wallpaperType: 'gradient',
  glassOpacity: 96,
  sidebarOpacity: 82,
};

function loadSettings(): ThemeSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// Per-theme solid base colour used when computing content opacity.
const CONTENT_BASE: Record<ThemeId, [number, number, number]> = {
  midnight: [10, 8, 18],
  ocean:    [3, 8, 15],
  forest:   [3, 16, 10],
  rose:     [21, 5, 9],
  light:    [244, 245, 248],
};

const SIDEBAR_BASE: Record<ThemeId, [number, number, number]> = {
  midnight: [13, 10, 24],
  ocean:    [5, 14, 28],
  forest:   [4, 16, 10],
  rose:     [22, 7, 11],
  light:    [248, 250, 252],
};

export function applyThemeSettings(s: ThemeSettings): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', s.themeId);

  // Content stays effectively solid (nested backdrop-filter would white-wash);
  // opacity slider nudges solidity but never drops low enough to blur-bleed.
  const [cr, cg, cb] = CONTENT_BASE[s.themeId] ?? CONTENT_BASE.midnight;
  root.style.setProperty('--bg-content', `rgba(${cr}, ${cg}, ${cb}, ${s.glassOpacity / 100})`);

  const [sr, sg, sb] = SIDEBAR_BASE[s.themeId] ?? SIDEBAR_BASE.midnight;
  root.style.setProperty('--bg-sidebar', `rgba(${sr}, ${sg}, ${sb}, ${s.sidebarOpacity / 100})`);

  // Custom wallpaper overrides the preset gradient.
  if (s.wallpaperType === 'color' && s.customColor) {
    root.style.setProperty('--bg-wallpaper', s.customColor);
  } else if (s.wallpaperType === 'image' && s.customImageUrl) {
    root.style.setProperty('--bg-wallpaper', `url("${s.customImageUrl}") center / cover no-repeat`);
  } else {
    // gradient preset — let the [data-theme] rule supply it
    root.style.removeProperty('--bg-wallpaper');
  }
}

export function useTheme() {
  const [settings, setSettings] = useState<ThemeSettings>(loadSettings);

  useEffect(() => {
    applyThemeSettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage full / unavailable — theme still applied in-memory */
    }
  }, [settings]);

  const updateTheme = useCallback((partial: Partial<ThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  return { settings, updateTheme };
}
