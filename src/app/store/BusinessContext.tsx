/**
 * BusinessContext.tsx
 * Global state untuk business switcher.
 * Tracks: active business, all businesses user can access, create business flow.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../../infra/supabase/client';
import { getNavGroupsForType, getKPIsForType, getColorForType, calcHealthScore } from '../../core/constants/businessConstants';
import { toast } from '../../shared/ui/Toast';

export interface Business {
  id:            string;
  parent_id:     string | null;
  name:          string;
  slug:          string;
  type:          string;
  business_type: string;
  logo_url:      string | null;
  plan:          string;
  country:       string;
  currency:      string;
  currency_symbol: string;
  description:   string | null;
  is_active:     boolean;
  children?:     Business[];
}

export interface BusinessType {
  id:          string;
  label:       string;
  description: string;
  icon:        string;
  color:       string;
  modules:     string[];
}

interface BusinessContextValue {
  businesses:       Business[];
  activeBusiness:   Business | null;
  businessTypes:    BusinessType[];
  loading:          boolean;
  switchBusiness:   (id: string) => void;
  createBusiness:   (data: CreateBusinessData) => Promise<Business | null>;
  refreshBusinesses:() => Promise<void>;
  isHolding:        boolean;
  currentModules:   string[];
  currentNavGroups: Record<string, string[]>;
  currentKPIs:      { key:string; label:string; icon:string; color:string }[];
  currentColor:     string;
  childBusinesses:  any[];
}

export interface CreateBusinessData {
  name:          string;
  business_type: string;
  parent_id?:    string;
  currency:      string;
  currency_symbol:string;
  country:       string;
  timezone:      string;
  description?:  string;
  logo_url?:     string;
}

const BusinessContext = createContext<BusinessContextValue>({
  businesses: [], activeBusiness: null, businessTypes: [],
  loading: true, isHolding: false, currentModules: [],
  currentNavGroups: {}, currentKPIs: [], currentColor: '#0071e3', childBusinesses: [],
  switchBusiness: () => {}, createBusiness: async () => null,
  refreshBusinesses: async () => {},
});

// Business type modules mapping
const BUSINESS_MODULES: Record<string, string[]> = {
  fashion:          ['Dashboard','Material Library','Sample Development','Production','Master Products','Size Variant Inventory','Sales Tracking','Operational Cost','Ads Analytics','KOL Tracking','Purchase Orders','Supplier Database','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics','Dynamic HPP Engine'],
  coffee:           ['Dashboard','Sales Tracking','Operational Cost','Assets & Equipment','Cashflow','Reports & Analytics','Customer Database','Supplier Database'],
  restaurant:       ['Dashboard','Sales Tracking','Operational Cost','Assets & Equipment','Cashflow','Reports & Analytics','Customer Database'],
  retail:           ['Dashboard','Master Products','Size Variant Inventory','Sales Tracking','Operational Cost','Purchase Orders','Supplier Database','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics'],
  agency:           ['Dashboard','Sales Tracking','Operational Cost','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics'],
  manufacturing:    ['Dashboard','Material Library','Production','Master Products','Sales Tracking','Operational Cost','Purchase Orders','Supplier Database','Assets & Equipment','Cashflow','Reports & Analytics'],
  service:          ['Dashboard','Sales Tracking','Operational Cost','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics'],
  personal_finance: ['Dashboard','Cashflow','Assets & Equipment','Reports & Analytics'],
  investment:       ['Dashboard','Assets & Equipment','Cashflow','Reports & Analytics'],
  holding:          ['Dashboard','Reports & Analytics'],
  custom:           ['Dashboard','Sales Tracking','Cashflow','Reports & Analytics'],
};

// Default businesses kalau Supabase belum ada
const DEFAULT_BUSINESSES: Business[] = [
  { id: '00000000-0000-0000-0000-000000000001', parent_id: null,  name: 'ILLUMINIST', slug: 'illuminist',       type: 'holding', business_type: 'holding', logo_url: null, plan: 'enterprise', country: 'Indonesia', currency: 'IDR', currency_symbol: 'Rp', description: 'Holding Company', is_active: true },
  { id: '00000000-0000-0000-0000-000000000002', parent_id: '00000000-0000-0000-0000-000000000001', name: 'NEVAEH', slug: 'nevaeh', type: 'business', business_type: 'fashion', logo_url: null, plan: 'pro', country: 'Indonesia', currency: 'IDR', currency_symbol: 'Rp', description: 'Fashion Brand', is_active: true },
  { id: '00000000-0000-0000-0000-000000000003', parent_id: '00000000-0000-0000-0000-000000000001', name: 'Personal Finance', slug: 'personal-finance', type: 'personal', business_type: 'personal_finance', logo_url: null, plan: 'starter', country: 'Indonesia', currency: 'IDR', currency_symbol: 'Rp', description: null, is_active: true },
  { id: '00000000-0000-0000-0000-000000000004', parent_id: '00000000-0000-0000-0000-000000000001', name: 'Future Ventures', slug: 'future-ventures', type: 'venture', business_type: 'investment', logo_url: null, plan: 'starter', country: 'Indonesia', currency: 'IDR', currency_symbol: 'Rp', description: null, is_active: true },
];

const ACTIVE_KEY    = 'illuminist_active_business';
const BUSINESSES_KEY = 'illuminist_businesses_offline';

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    // Muat bisnis offline dari localStorage jika ada
    try {
      const saved = localStorage.getItem(BUSINESSES_KEY);
      if (saved) {
        const parsed: Business[] = JSON.parse(saved);
        if (parsed.length > 0) {
          // Merge: default + saved (hindari duplikat by id)
          const defaultIds = new Set(DEFAULT_BUSINESSES.map(b => b.id));
          const extra = parsed.filter(b => !defaultIds.has(b.id));
          return [...DEFAULT_BUSINESSES, ...extra];
        }
      }
    } catch {}
    return DEFAULT_BUSINESSES;
  });
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(DEFAULT_BUSINESSES[1]); // NEVAEH default
  const [businessTypes,  setBusinessTypes]  = useState<BusinessType[]>([]);
  const [loading,        setLoading]        = useState(false);

  // Load dari Supabase
  const refreshBusinesses = async () => {
    if (!isSupabaseEnabled || !supabase) return;
    setLoading(true);
    try {
      const { data: biz } = await supabase.from('companies').select('*').eq('is_active', true).order('name');
      if (biz && biz.length > 0) setBusinesses(biz as Business[]);

      const { data: types } = await supabase.from('business_types').select('*').order('label');
      if (types) setBusinessTypes(types as BusinessType[]);
    } finally {
      setLoading(false);
    }
  };

  // Restore active business dari localStorage
  useEffect(() => {
    refreshBusinesses();
    const saved = localStorage.getItem(ACTIVE_KEY);
    if (saved) {
      const found = DEFAULT_BUSINESSES.find(b => b.id === saved);
      if (found) setActiveBusiness(found);
    }
  }, []);

  // Sync active business kalau businesses berubah
  useEffect(() => {
    if (businesses.length > 0 && activeBusiness) {
      const updated = businesses.find(b => b.id === activeBusiness.id);
      if (updated) setActiveBusiness(updated);
    }
  }, [businesses]);

  const switchBusiness = (id: string) => {
    const biz = businesses.find(b => b.id === id);
    if (!biz) return;
    setActiveBusiness(biz);
    localStorage.setItem(ACTIVE_KEY, id);
    toast.success(`Beralih ke ${biz.name}`);
  };

  const createBusiness = async (data: CreateBusinessData): Promise<Business | null> => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!isSupabaseEnabled || !supabase) {
      // Mode offline: tambah ke local state
      const newBiz: Business = {
        id:              `local-${Date.now()}`,
        parent_id:       data.parent_id || '00000000-0000-0000-0000-000000000001',
        name:            data.name,
        slug,
        type:            'business',
        business_type:   data.business_type,
        logo_url:        data.logo_url || null,
        plan:            'starter',
        country:         data.country,
        currency:        data.currency,
        currency_symbol: data.currency_symbol,
        description:     data.description || null,
        is_active:       true,
      };
      setBusinesses(prev => {
        const next = [...prev, newBiz];
        // Persist ke localStorage — survive refresh
        try {
          const toSave = next.filter(b => !b.id.startsWith('00000000'));
          localStorage.setItem(BUSINESSES_KEY, JSON.stringify(toSave));
        } catch {}
        return next;
      });
      toast.success(`${data.name} berhasil dibuat`);
      return newBiz;
    }

    try {
      const { data: newBiz, error } = await (supabase.from('companies') as any).insert({
        name:            data.name,
        slug,
        type:            'business',
        business_type:   data.business_type,
        parent_id:       data.parent_id || '00000000-0000-0000-0000-000000000001',
        country:         data.country,
        currency:        data.currency,
        currency_symbol: data.currency_symbol,
        description:     data.description,
        logo_url:        data.logo_url,
        plan:            'starter',
        is_active:       true,
      }).select().single();

      if (error) throw error;

      // Buat default settings
      await (supabase.from('app_settings') as any).insert({
        company_id:      (newBiz as Business).id,
        language:        'id',
        currency:        data.currency,
        currency_symbol: data.currency_symbol,
        system_name:     data.name,
        brand_monogram:  data.name[0].toUpperCase(),
      }).select();

      await refreshBusinesses();
      toast.success(`${data.name} berhasil dibuat`);
      return newBiz as Business;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat bisnis');
      return null;
    }
  };

  const isHolding = activeBusiness?.business_type === 'holding';
  const currentModules = BUSINESS_MODULES[activeBusiness?.business_type || 'fashion'] || BUSINESS_MODULES.fashion;

  return (
    <BusinessContext.Provider value={{
      businesses, activeBusiness, businessTypes, loading,
      switchBusiness, createBusiness, refreshBusinesses,
      isHolding, currentModules,
      currentNavGroups: getNavGroupsForType(activeBusiness?.business_type || 'custom'),
      currentKPIs:      getKPIsForType(activeBusiness?.business_type || 'custom'),
      currentColor:     getColorForType(activeBusiness?.business_type || 'custom'),
      childBusinesses:  businesses.filter((b: any) => b.parent_id),
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
