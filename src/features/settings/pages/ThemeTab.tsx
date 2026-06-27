import React from 'react';
import { useTheme, ThemeId, WallpaperType } from '../../../shared/hooks/useTheme';
import { useERP } from '../../../app/store/ERPContext';
import { ACCENT_PRESETS, normalizeHex } from '../../../shared/theme/accent';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeTab — Settings → Theme. Preset picker, glass transparency sliders, and
// custom background (solid colour / image URL). All token-driven via useTheme.
// ─────────────────────────────────────────────────────────────────────────────

const THEMES: { id: ThemeId; label: string; preview: string }[] = [
  { id: 'midnight', label: 'Midnight', preview: 'linear-gradient(135deg, #1a0f3d, #0a0a1a)' },
  { id: 'ocean',    label: 'Ocean',    preview: 'linear-gradient(135deg, #0a3d6e, #051525)' },
  { id: 'forest',   label: 'Forest',   preview: 'linear-gradient(135deg, #0a5e34, #041208)' },
  { id: 'rose',     label: 'Rose',     preview: 'linear-gradient(135deg, #9e1239, #1a0608)' },
  { id: 'light',    label: 'Light',    preview: 'linear-gradient(135deg, #f8fafc, #cbd5e1)' },
];

const label: React.CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
  display: 'block', marginBottom: '10px', letterSpacing: '0.02em',
};

const section: React.CSSProperties = { marginBottom: '28px' };

export default function ThemeTab() {
  const { settings, updateTheme } = useTheme();
  const { config, updateConfig } = useERP();
  const accent = config?.customAccentColor || '#7c3aed';

  const setAccent = (hex: string) => {
    const norm = normalizeHex(hex);
    if (norm) updateConfig({ customAccentColor: norm });
  };

  return (
    <div style={{ maxWidth: '620px', fontFamily: 'Inter, sans-serif' }}>

      {/* Accent colour — the single colour used across the whole app */}
      <div style={section}>
        <label style={label}>Accent Color</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {ACCENT_PRESETS.map(p => {
            const active = accent.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                onClick={() => setAccent(p.hex)}
                title={p.name}
                style={{
                  width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer',
                  background: p.hex, padding: 0,
                  border: active ? '2px solid var(--text-primary)' : '2px solid transparent',
                  boxShadow: active ? `0 0 0 2px ${p.hex}` : 'none',
                  outline: 'none', transition: 'var(--transition-base)',
                }}
              />
            );
          })}
          {/* Custom hex */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '4px 8px 4px 4px', cursor: 'pointer',
          }}>
            <input
              type="color"
              value={normalizeHex(accent) ?? '#7c3aed'}
              onChange={e => setAccent(e.target.value)}
              style={{ width: '24px', height: '24px', border: 'none', borderRadius: '6px', background: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {(normalizeHex(accent) ?? accent).toUpperCase()}
            </span>
          </label>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', margin: '10px 0 0', lineHeight: 1.5 }}>
          Satu warna aksen ini dipakai di seluruh aplikasi — sidebar, tombol, grafik, dan setiap bisnis.
        </p>
      </div>

      {/* Preset picker */}
      <div style={section}>
        <label style={label}>Wallpaper Theme</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {THEMES.map(thm => {
            const active = settings.themeId === thm.id;
            return (
              <button
                key={thm.id}
                onClick={() => updateTheme({ themeId: thm.id })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  padding: '8px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: active ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                  border: active ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  transition: 'var(--transition-base)',
                }}
              >
                <div style={{
                  width: '54px', height: '36px', borderRadius: 'var(--radius-sm)',
                  background: thm.preview, border: '1px solid rgba(255,255,255,0.12)',
                }} />
                <span style={{ fontSize: '11px', color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {thm.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content transparency */}
      <div style={section}>
        <label style={label}>Content Solidity — {settings.glassOpacity}%</label>
        <input
          type="range" min={70} max={100} value={settings.glassOpacity}
          onChange={e => updateTheme({ glassOpacity: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          <span>Lebih tembus</span><span>Solid</span>
        </div>
      </div>

      {/* Sidebar transparency */}
      <div style={section}>
        <label style={label}>Sidebar Solidity — {settings.sidebarOpacity}%</label>
        <input
          type="range" min={50} max={99} value={settings.sidebarOpacity}
          onChange={e => updateTheme({ sidebarOpacity: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* Custom background */}
      <div style={section}>
        <label style={label}>Custom Background</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['gradient', 'color', 'image'] as WallpaperType[]).map(wt => {
            const active = settings.wallpaperType === wt;
            return (
              <button
                key={wt}
                onClick={() => updateTheme({ wallpaperType: wt })}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', cursor: 'pointer',
                  background: active ? 'var(--accent-primary-muted)' : 'var(--bg-surface)',
                  border: active ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  transition: 'var(--transition-base)',
                }}
              >
                {wt === 'gradient' ? 'Preset' : wt === 'color' ? 'Solid Color' : 'Image URL'}
              </button>
            );
          })}
        </div>

        {settings.wallpaperType === 'color' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="color"
              value={settings.customColor || '#0a0a0f'}
              onChange={e => updateTheme({ customColor: e.target.value })}
              style={{ width: '40px', height: '36px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
            />
            <input
              type="text"
              value={settings.customColor || ''}
              onChange={e => updateTheme({ customColor: e.target.value })}
              placeholder="#0a0a0f"
              style={{
                flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>
        )}

        {settings.wallpaperType === 'image' && (
          <input
            type="text"
            value={settings.customImageUrl || ''}
            onChange={e => updateTheme({ customImageUrl: e.target.value })}
            placeholder="https://example.com/background.jpg"
            style={{
              width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
              fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}

        {settings.wallpaperType === 'gradient' && (
          <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            Menggunakan gradient bawaan dari tema yang dipilih di atas.
          </p>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-quaternary)', marginTop: '8px', lineHeight: 1.5 }}>
        Perubahan tema tersimpan otomatis di perangkat ini.
      </p>
    </div>
  );
}
