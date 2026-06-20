/**
 * supabase.ts — Supabase client aktif
 * Terhubung ke Supabase jika VITE_SUPABASE_URL ada di .env
 * Fallback ke localStorage jika env tidak ada (backward compat V11)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Mode detection — dipakai di seluruh app
export const STORAGE_MODE: 'supabase' | 'localStorage' =
  supabaseUrl && supabaseKey ? 'supabase' : 'localStorage';

export const isSupabaseEnabled = STORAGE_MODE === 'supabase';

// Buat client hanya jika env tersedia
export const supabase: SupabaseClient<Database> | null = isSupabaseEnabled
  ? createClient<Database>(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (isSupabaseEnabled) {
  console.log('[Supabase] ✅ Connected —', supabaseUrl);
} else {
  console.warn('[Supabase] ⚠ Running in localStorage mode. Add VITE_SUPABASE_URL to .env to enable database.');
}

export default supabase;
