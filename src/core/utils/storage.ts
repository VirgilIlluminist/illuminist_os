/**
 * storage.ts — Centralized localStorage key management
 *
 * ARCH-02 FIX: Sebelumnya 24+ localStorage keys tersebar di 5 file berbeda
 * dengan naming convention berbeda-beda. File ini menjadi single source of truth.
 *
 * Cara pakai:
 *   import { STORAGE_KEYS, storageGet, storageSet } from '../utils/storage';
 *   storageSet(STORAGE_KEYS.materials, data);
 *   const data = storageGet<Material[]>(STORAGE_KEYS.materials, []);
 */

// ─── Namespace prefix ─────────────────────────────────────────────────────────
const NS = 'nevaeh_erp_state_v2_idr';

// ─── All localStorage keys in one place ──────────────────────────────────────
export const STORAGE_KEYS = {
  // ERPContext state
  suppliers:     `${NS}_suppliers`,
  materials:     `${NS}_materials`,
  products:      `${NS}_products`,
  samples:       `${NS}_samples`,
  production:    `${NS}_production`,
  variants:      `${NS}_variants`,
  sales:         `${NS}_sales`,
  ops:           `${NS}_ops`,
  ads:           `${NS}_ads`,
  kols:          `${NS}_kols`,
  pos:           `${NS}_pos`,
  customers:     `${NS}_customers`,
  assets:        `${NS}_assets`,
  cash:          `${NS}_cash`,
  notifications: `${NS}_notifications`,
  config:        `${NS}_config`,
  moodboard:     `${NS}_moodboard`,

  // Dashboard
  dashboardCards: 'erp_dashboard_cards',

  // Sidebar
  sidebarLayout:  'nevaeh_sidebar_layout_v2',

  // Finance row order
  financeRowOrder: 'nevaeh_manual_row_orders',

  // SmartTable per-table keys (dynamic — gunakan helpers di bawah)
  smartTableData:    (id: string) => `smarttable_${id}_data`,
  smartTableColumns: (id: string) => `smarttable_${id}_columns`,
  smartTableFilters: (id: string) => `smarttable_${id}_saved_filters`,
  smartTableAudit:   (id: string) => `smarttable_${id}_audit_logs`,
} as const;

// ─── Safe get dengan fallback ─────────────────────────────────────────────────
export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ─── Safe set dengan QuotaExceededError handling ──────────────────────────────
export function storageSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[Nevaeh Storage] Quota exceeded — key: "${key}". Data tidak disimpan.`);
    return false;
  }
}

// ─── Safe delete ──────────────────────────────────────────────────────────────
export function storageDelete(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
}

// ─── Clear semua Nevaeh keys ──────────────────────────────────────────────────
export function storageClearAll(): void {
  const allKeys = Object.values(STORAGE_KEYS).filter(
    (v) => typeof v === 'string'
  ) as string[];
  allKeys.forEach(k => storageDelete(k));
  // Dynamic SmartTable keys
  Object.keys(localStorage)
    .filter(k => k.startsWith('smarttable_'))
    .forEach(k => storageDelete(k));
}

// ─── Export size info untuk debugging ─────────────────────────────────────────
export function storageDebugSize(): Record<string, string> {
  const sizes: Record<string, string> = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    if (typeof key !== 'string') return;
    const item = localStorage.getItem(key);
    if (item) {
      const kb = (new Blob([item]).size / 1024).toFixed(1);
      sizes[name] = `${kb} KB`;
    }
  });
  return sizes;
}
