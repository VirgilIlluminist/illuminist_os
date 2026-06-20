/**
 * base.repository.ts
 * Pattern: Repository abstraksi semua akses database.
 * Semua query Supabase lewat sini — bukan langsung di service/controller.
 *
 * Cara pakai:
 *   class MaterialsRepository extends BaseRepository<Material> {
 *     constructor() { super('materials'); }
 *   }
 */
import { ENV } from '../config/env';
import { logger } from '../utils/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy init Supabase server client (pakai service role key)
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = ENV.SUPABASE_URL;
  const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export interface QueryOptions {
  companyId?: string;
  limit?:     number;
  offset?:    number;
  orderBy?:   string;
  ascending?: boolean;
  filters?:   Record<string, unknown>;
}

export interface RepositoryResult<T> {
  data:    T[];
  count:   number;
  error?:  string;
}

export class BaseRepository<T extends Record<string, unknown>> {
  protected table: string;

  constructor(table: string) {
    this.table = table;
  }

  get db(): SupabaseClient | null {
    return getClient();
  }

  get isEnabled(): boolean {
    return Boolean(getClient());
  }

  async findAll(options: QueryOptions = {}): Promise<RepositoryResult<T>> {
    if (!this.db) return { data: [], count: 0, error: 'Database not configured' };

    try {
      let query = this.db.from(this.table).select('*', { count: 'exact' });

      if (options.companyId) query = query.eq('company_id', options.companyId);
      if (options.filters) {
        Object.entries(options.filters).forEach(([k, v]) => {
          query = query.eq(k, v as string);
        });
      }
      if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      if (options.limit)   query = query.limit(options.limit);
      if (options.offset)  query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      return { data: (data || []) as T[], count: count || 0 };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Query failed';
      logger.error(`Repository[${this.table}]`, msg);
      return { data: [], count: 0, error: msg };
    }
  }

  async findById(id: string): Promise<T | null> {
    if (!this.db) return null;
    const { data } = await this.db.from(this.table).select('*').eq('id', id).single();
    return data as T | null;
  }

  async create(payload: Partial<T>): Promise<{ data: T | null; error?: string }> {
    if (!this.db) return { data: null, error: 'Database not configured' };
    try {
      const { data, error } = await this.db.from(this.table).insert(payload as any).select().single();
      if (error) throw error;
      return { data: data as T };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Insert failed' };
    }
  }

  async update(id: string, payload: Partial<T>): Promise<{ data: T | null; error?: string }> {
    if (!this.db) return { data: null, error: 'Database not configured' };
    try {
      const { data, error } = await this.db.from(this.table)
        .update(payload as any).eq('id', id).select().single();
      if (error) throw error;
      return { data: data as T };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }

  async delete(id: string): Promise<{ error?: string }> {
    if (!this.db) return { error: 'Database not configured' };
    try {
      const { error } = await this.db.from(this.table).delete().eq('id', id);
      if (error) throw error;
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Delete failed' };
    }
  }
}
