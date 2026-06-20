/**
 * repositories/index.ts — Repository Architecture V5.2
 * BaseRepository interface, LocalStorage impl, Factory.
 * UI tidak perlu tahu sumber data.
 */
import { supabase, isSupabaseEnabled } from '../../infra/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BaseRecord {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: { column: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
  search?: { columns: string[]; query: string };
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface Repo<T extends BaseRecord> {
  findAll(companyId: string, opts?: QueryOptions): Promise<PageResult<T>>;
  findById(companyId: string, id: string): Promise<T | null>;
  create(companyId: string, data: Partial<T>): Promise<T | null>;
  update(companyId: string, id: string, data: Partial<T>): Promise<T | null>;
  remove(companyId: string, id: string): Promise<boolean>;
  count(companyId: string, where?: Record<string, any>): Promise<number>;
}

// ─── LocalStorage Repository ──────────────────────────────────────────────────

function lsKey(companyId: string, table: string) {
  return `illum_repo_${companyId}_${table}`;
}

function lsLoad<T extends BaseRecord>(companyId: string, table: string): T[] {
  try {
    const raw = localStorage.getItem(lsKey(companyId, table));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function lsSave<T extends BaseRecord>(companyId: string, table: string, data: T[]): void {
  try { localStorage.setItem(lsKey(companyId, table), JSON.stringify(data)); } catch {}
}

function lsId(table: string): string {
  return `${table}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
}

class LocalStorageRepo<T extends BaseRecord> implements Repo<T> {
  constructor(private table: string) {}

  async findAll(companyId: string, opts: QueryOptions = {}): Promise<PageResult<T>> {
    let data = lsLoad<T>(companyId, this.table).filter(r => !r.deleted_at);
    if (opts.where) {
      data = data.filter(r => Object.entries(opts.where!).every(([k,v]) =>
        v === undefined || v === '' || v === null || (r as any)[k] === v));
    }
    if (opts.search?.query) {
      const q = opts.search.query.toLowerCase();
      data = data.filter(r => opts.search!.columns.some(c => String((r as any)[c] ?? '').toLowerCase().includes(q)));
    }
    if (opts.orderBy) {
      const { column, direction } = opts.orderBy;
      data = [...data].sort((a,b) => {
        const av = (a as any)[column], bv = (b as any)[column];
        const an = Number(av), bn = Number(bv);
        const cmp = !isNaN(an) && !isNaN(bn) ? an-bn : String(av??'').localeCompare(String(bv??''));
        return direction === 'asc' ? cmp : -cmp;
      });
    }
    const total = data.length;
    const perPage = opts.limit || 50;
    const offset = opts.offset || 0;
    return { data: data.slice(offset, offset+perPage), total, page: Math.floor(offset/perPage)+1, perPage };
  }

  async findById(companyId: string, id: string): Promise<T | null> {
    return lsLoad<T>(companyId, this.table).find(r => r.id === id && !r.deleted_at) ?? null;
  }

  async create(companyId: string, data: Partial<T>): Promise<T | null> {
    const now = new Date().toISOString();
    const record = { id: lsId(this.table), company_id: companyId, created_at: now, updated_at: now, ...data } as T;
    const all = lsLoad<T>(companyId, this.table);
    all.unshift(record);
    lsSave(companyId, this.table, all);
    return record;
  }

  async update(companyId: string, id: string, data: Partial<T>): Promise<T | null> {
    const all = lsLoad<T>(companyId, this.table);
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data, updated_at: new Date().toISOString() };
    lsSave(companyId, this.table, all);
    return all[idx];
  }

  async remove(companyId: string, id: string): Promise<boolean> {
    const all = lsLoad<T>(companyId, this.table);
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return false;
    all[idx] = { ...all[idx], deleted_at: new Date().toISOString() };
    lsSave(companyId, this.table, all);
    return true;
  }

  async count(companyId: string, where?: Record<string,any>): Promise<number> {
    let data = lsLoad<T>(companyId, this.table).filter(r => !r.deleted_at);
    if (where) data = data.filter(r => Object.entries(where).every(([k,v]) => (r as any)[k] === v));
    return data.length;
  }

  seed(companyId: string, rows: Partial<T>[]): void {
    if (lsLoad<T>(companyId, this.table).length > 0) return;
    const now = new Date().toISOString();
    const seeded = rows.map((r,i) => ({ id: `${this.table}_seed_${i}`, company_id: companyId, created_at: now, updated_at: now, ...r } as T));
    lsSave(companyId, this.table, seeded);
  }
}

// ─── Supabase Repository ──────────────────────────────────────────────────────

class SupabaseRepo<T extends BaseRecord> implements Repo<T> {
  constructor(private table: string) {}

  async findAll(companyId: string, opts: QueryOptions = {}): Promise<PageResult<T>> {
    if (!supabase) return { data:[], total:0, page:1, perPage:50 };
    let q = (supabase as any).from(this.table).select('*', { count:'exact' })
      .eq('company_id', companyId).is('deleted_at', null);
    if (opts.where) Object.entries(opts.where).forEach(([k,v]) => { if (v != null && v !== '') q = q.eq(k,v); });
    if (opts.search?.query) {
      const expr = opts.search.columns.map(c => `${c}.ilike.%${opts.search!.query}%`).join(',');
      q = q.or(expr);
    }
    if (opts.orderBy) q = q.order(opts.orderBy.column, { ascending: opts.orderBy.direction === 'asc' });
    const perPage = opts.limit || 50;
    const offset = opts.offset || 0;
    q = q.range(offset, offset+perPage-1);
    const { data, count } = await q;
    const total = count ?? 0;
    return { data: (data || []) as T[], total, page: Math.floor(offset/perPage)+1, perPage };
  }

  async findById(companyId: string, id: string): Promise<T | null> {
    if (!supabase) return null;
    const { data } = await (supabase as any).from(this.table).select('*').eq('id',id).eq('company_id',companyId).single();
    return data as T ?? null;
  }

  async create(companyId: string, data: Partial<T>): Promise<T | null> {
    if (!supabase) return null;
    const { data: created } = await (supabase as any).from(this.table).insert({ ...data, company_id: companyId }).select().single();
    return created as T ?? null;
  }

  async update(companyId: string, id: string, data: Partial<T>): Promise<T | null> {
    if (!supabase) return null;
    const { data: updated } = await (supabase as any).from(this.table)
      .update({ ...data, updated_at: new Date().toISOString() }).eq('id',id).eq('company_id',companyId).select().single();
    return updated as T ?? null;
  }

  async remove(companyId: string, id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await (supabase as any).from(this.table)
      .update({ deleted_at: new Date().toISOString() }).eq('id',id).eq('company_id',companyId);
    return !error;
  }

  async count(companyId: string, where?: Record<string,any>): Promise<number> {
    if (!supabase) return 0;
    let q = (supabase as any).from(this.table).select('*', { count:'exact', head:true })
      .eq('company_id', companyId).is('deleted_at', null);
    if (where) Object.entries(where).forEach(([k,v]) => { if (v != null) q = q.eq(k,v); });
    const { count } = await q;
    return count ?? 0;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const _cache = new Map<string, Repo<any>>();

export function getRepo<T extends BaseRecord>(table: string): Repo<T> {
  if (_cache.has(table)) return _cache.get(table) as Repo<T>;
  const repo: Repo<T> = isSupabaseEnabled
    ? new SupabaseRepo<T>(table)
    : new LocalStorageRepo<T>(table);
  _cache.set(table, repo);
  return repo;
}

export function getSeedableRepo<T extends BaseRecord>(table: string): LocalStorageRepo<T> {
  return new LocalStorageRepo<T>(table);
}

export const storageMode = (): 'supabase' | 'localStorage' =>
  isSupabaseEnabled ? 'supabase' : 'localStorage';
