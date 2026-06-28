import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP }      from '../../app/store/ERPContext';
import { useBusiness } from '../../app/store/BusinessContext';
import ProductStatusBadge from './ProductStatusBadge';
import { Search, Plus, Filter, TrendingUp } from 'lucide-react';

type StockFilter  = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type StatusFilter = 'all' | 'active' | 'draft' | 'discontinued' | 'archived';
type SortKey      = 'name' | 'margin_desc' | 'stock_asc' | 'updated_desc';

export default function ProductListView() {
  const navigate             = useNavigate();
  const { config: erpConfig, products, computedProducts, variants: sizeVariants } = useERP();
  const { activeBusiness }   = useBusiness();

  const accent   = erpConfig?.customAccentColor ?? '#7c3aed';
  const currency = erpConfig?.currencySymbol    ?? 'Rp';

  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort,        setSort]        = useState<SortKey>('name');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const enriched = useMemo(() => {
    return computedProducts.map(cp => {
      const variants = sizeVariants.filter(v => v.productId === cp.id);
      const stock    = variants.reduce((s, v) => s + v.currentStock, 0);
      const hpp      = cp.finalHPP ?? 0;
      const margin   = hpp > 0 ? ((cp.sellingPrice - hpp) / cp.sellingPrice * 100) : 0;
      return { ...cp, totalStock: stock, finalHPP: hpp, margin };
    });
  }, [computedProducts, sizeVariants]);

  const filtered = useMemo(() => {
    let data = enriched;

    // Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Status
    if (statusFilter !== 'all') {
      data = data.filter(p => (p.status ?? 'active').toLowerCase() === statusFilter);
    }

    // Category
    if (categoryFilter !== 'all') {
      data = data.filter(p => p.category === categoryFilter);
    }

    // Stock
    if (stockFilter === 'in_stock')    data = data.filter(p => p.totalStock > 10);
    if (stockFilter === 'low_stock')   data = data.filter(p => p.totalStock > 0 && p.totalStock <= 10);
    if (stockFilter === 'out_of_stock')data = data.filter(p => p.totalStock === 0);

    // Sort
    if (sort === 'name')         data = [...data].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'margin_desc')  data = [...data].sort((a, b) => b.margin - a.margin);
    if (sort === 'stock_asc')    data = [...data].sort((a, b) => a.totalStock - b.totalStock);

    return data;
  }, [enriched, search, statusFilter, stockFilter, categoryFilter, sort]);

  const SELECT = 'bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-none cursor-pointer';

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} style={{ color: accent }}/>
          <span className="text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]">Product Intelligence</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)]">Products</h2>
          <button
            onClick={() => navigate('/app/products/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-black cursor-pointer"
            style={{ background: accent }}
          >
            <Plus size={14}/> Produk Baru
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"/>
          <input
            type="text"
            placeholder="Cari produk, SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-[var(--color-text-main)] focus:outline-none"
          />
        </div>

        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer border transition-colors ${showFilters ? 'border-white/30 text-[var(--color-text-main)]' : 'border-[var(--color-border-line)] text-[var(--color-text-muted)]'}`}>
          <Filter size={14}/> Filter
        </button>

        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className={SELECT}>
          <option value="name">Nama A-Z</option>
          <option value="margin_desc">Margin Tertinggi</option>
          <option value="stock_asc">Stok Terendah</option>
        </select>
      </div>

      {showFilters && (
        <div className="flex gap-3 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className={SELECT}>
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="discontinued">Discontinued</option>
            <option value="archived">Archived</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={SELECT}>
            <option value="all">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value as StockFilter)} className={SELECT}>
            <option value="all">Semua Stok</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-[var(--color-text-muted)]">
        {filtered.length} dari {products.length} produk
      </p>

      {/* Product cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-xs font-mono text-[var(--color-text-muted)]">Tidak ada produk ditemukan.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const stockColor = p.totalStock === 0 ? 'text-red-400' : p.totalStock <= 10 ? 'text-yellow-400' : 'text-green-400';
            const stockDot   = p.totalStock === 0 ? 'bg-red-400' : p.totalStock <= 10 ? 'bg-yellow-400' : 'bg-green-400';
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/app/products/${p.id}`)}
                className="group relative rounded-2xl border border-[var(--color-border-line)] bg-white/[0.06] hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer overflow-hidden"
              >
                {/* Cover */}
                <div className="aspect-[4/3] bg-black/20 overflow-hidden">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    : <div className="w-full h-full flex items-center justify-center text-4xl text-white/10 font-display font-bold select-none">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                  }
                </div>

                {/* Status badge top-right */}
                <div className="absolute top-2 right-2">
                  <ProductStatusBadge status={(p.status ?? 'active') as any}/>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--color-text-main)] truncate">{p.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{p.id} · {p.category}</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <p className="text-xs uppercase text-[var(--color-text-muted)]">HPP</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {p.finalHPP > 0 ? `${currency}${Math.round(p.finalHPP / 1000)}k` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[var(--color-text-muted)]">Harga</p>
                      <p className="text-xs text-[var(--color-text-main)] font-semibold">
                        {currency}{Math.round(p.sellingPrice / 1000)}k
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[var(--color-text-muted)]">Margin</p>
                      <p className={`text-xs font-bold ${p.margin < 20 ? 'text-red-400' : p.margin < 35 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {p.finalHPP > 0 ? `${p.margin.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Stock indicator */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${stockDot}`}/>
                    <span className={`text-xs ${stockColor}`}>{p.totalStock} pcs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
