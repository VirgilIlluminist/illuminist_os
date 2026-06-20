import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { SalesRecord, OperationalCost, AdsCampaign, KolTracking } from '../types';
import SmartTable, { ColumnDef } from '../../../shared/table/SmartTable';
import { 
  Plus, 
  Search, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Megaphone, 
  Users, 
  Receipt,
  CheckCircle,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import CurrencyInput from '../../../shared/components/CurrencyInput';

interface SalesAndCostsViewProps {
  key?: string;
  initialSubTab?: 'sales' | 'ops' | 'ads' | 'kol';
}

export default function SalesAndCostsView({ initialSubTab = 'sales' }: SalesAndCostsViewProps) {
  const {
    products,
    variants,
    computedProducts,
    computedVariants,
    computedSales,
    computedAds,
    computedKols,
    operationalCosts,
    addSale,
    updateSale,
    deleteSale,
    addOperationalCost,
    updateOperationalCost,
    deleteOperationalCost,
    addAdsCampaign,
    updateAdsCampaign,
    deleteAdsCampaign,
    addKol,
    updateKol,
    deleteKol,
    formatMoney, t,
    config
  } = useERP();
  const accentHex = config?.customAccentColor || '#d4af37';

  const currencySymbol = config?.currencySymbol || 'Rp';

  const [activeTab, setActiveTab] = useState<'sales' | 'ops' | 'ads' | 'kol'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdowns
  const channels = ['Shopee', 'TikTok Shop', 'Tokopedia', 'Website', 'Instagram', 'WhatsApp', 'Offline Store', 'Event Booth'];
  const opsCategories = ['TikTok Ads', 'Meta Ads', 'Shopee Ads', 'KOL', 'Endorse', 'Affiliate', 'Shipping', 'Salary', 'Office', 'Equipment', 'Software', 'Event Booth', 'Utilities', 'Packaging'];

  // Input states for Add Sale Modal
  const [showAddSale, setShowAddSale] = useState(false);
  const [newSale, setNewSale] = useState<Omit<SalesRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    productId: products[0]?.id || '',
    variantSku: variants[0]?.sku || '',
    customerName: '',
    channel: 'Website',
    qtySold: 1,
    pricePerPcs: products[0]?.sellingPrice || 100,
    platformFee: 0,
    shippingFee: 0,
    discount: 0,
    status: 'Completed'
  });

  // Input states for Add Operational Cost
  const [showAddOps, setShowAddOps] = useState(false);
  const [newOps, setNewOps] = useState<Omit<OperationalCost, 'id'>>({
    category: 'Meta Ads',
    campaignId: '',
    productId: products[0]?.id || '',
    amount: 500,
    date: new Date().toISOString().split('T')[0],
    platform: 'Facebook Business Manager',
    notes: ''
  });

  // Input states for Add Ads Campaign
  const [showAddAds, setShowAddAds] = useState(false);
  const [newAds, setNewAds] = useState<Omit<AdsCampaign, 'id'>>({
    name: '',
    platform: 'Meta Ads',
    productId: products[0]?.id || '',
    spend: 1000,
    revenue: 3000,
    cpc: 0.50,
    cpm: 10.00,
    ctr: 2.5,
    conversionRate: 1.5
  });

  // Input states for Add KOL
  const [showAddKol, setShowAddKol] = useState(false);
  const [newKol, setNewKol] = useState<Omit<KolTracking, 'id'>>({
    name: '',
    platform: 'Instagram',
    followers: 100000,
    cost: 500,
    revenueGenerated: 1500,
    campaignId: '',
    status: 'Contracted'
  });

  const isIdLng = config?.language === 'id';

  const columnsSales: ColumnDef[] = [
    { key: 'id', label: 'Order ID', type: 'text', isEditable: false },
    { key: 'date', label: isIdLng ? 'Tanggal Order' : 'Order Date', isEditable: true, type: 'date' },
    { key: 'productName', label: isIdLng ? 'Spesifikasi Produk' : 'Product Specs', isEditable: true, type: 'text' },
    { key: 'variantSku', label: isIdLng ? 'SKU Varian' : 'Variant SKU', isEditable: true, type: 'text' },
    { key: 'customerName', label: isIdLng ? 'Nama Pembeli' : 'Buyer Name', isEditable: true, type: 'text' },
    { key: 'channel', label: isIdLng ? 'Saluran Jual' : 'Sales Channel', isEditable: true, type: 'status', selectOptions: channels, align: 'center' },
    { key: 'qtySold', label: isIdLng ? 'Volume (Pcs)' : 'Volume', isEditable: true, type: 'number', align: 'right' },
    { key: 'pricePerPcs', label: isIdLng ? 'Harga Satuan' : 'Unit Price', isEditable: true, type: 'currency', align: 'right' },
    { key: 'grossRevenue', label: isIdLng ? 'Omset Bruto' : 'Gross Revenue', type: 'currency', align: 'right', isEditable: false },
    { key: 'platformFee', label: isIdLng ? 'Biaya Platform' : 'Platform Fee', isEditable: true, type: 'currency', align: 'right' },
    { key: 'shippingFee', label: isIdLng ? 'Biaya Ongkir' : 'Shipping Fee', isEditable: true, type: 'currency', align: 'right' },
    { key: 'discount', label: isIdLng ? 'Diskon' : 'Discount', isEditable: true, type: 'currency', align: 'right' },
    { key: 'netRevenue', label: isIdLng ? 'Omset Bersih' : 'Net Revenue', type: 'currency', align: 'right', isEditable: false },
    { key: 'profit', label: isIdLng ? 'Profit Bersih' : 'Net Profit', type: 'currency', align: 'right', isEditable: false },
    { key: 'status', label: 'Status', isEditable: true, type: 'status', selectOptions: ['Pending', 'Shipped', 'Completed', 'Cancelled'], align: 'center' }
  ];

  const handleDataChangeSales = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedSales.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteSale(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedSales.find(s => s.id === newItem.id);
      if (oldItem) {
        const updates: Partial<SalesRecord> = {};
        if (newItem.date !== oldItem.date) updates.date = newItem.date;
        if (newItem.variantSku !== oldItem.variantSku) updates.variantSku = newItem.variantSku;
        if (newItem.customerName !== oldItem.customerName) updates.customerName = newItem.customerName;
        if (newItem.channel !== oldItem.channel) updates.channel = newItem.channel;
        if (newItem.qtySold !== oldItem.qtySold) updates.qtySold = Number(newItem.qtySold) || 0;
        if (newItem.pricePerPcs !== oldItem.pricePerPcs) updates.pricePerPcs = Number(newItem.pricePerPcs) || 0;
        if (newItem.platformFee !== oldItem.platformFee) updates.platformFee = Number(newItem.platformFee) || 0;
        if (newItem.shippingFee !== oldItem.shippingFee) updates.shippingFee = Number(newItem.shippingFee) || 0;
        if (newItem.discount !== oldItem.discount) updates.discount = Number(newItem.discount) || 0;
        if (newItem.status !== oldItem.status) updates.status = newItem.status as any;

        if (Object.keys(updates).length > 0) {
          updateSale(newItem.id, updates);
        }
      }
    });
  };

  const columnsOps: ColumnDef[] = [
    { key: 'id', label: 'Expense ID', type: 'text', isEditable: false },
    { key: 'category', label: isIdLng ? 'Kategori Biaya' : 'Category', isEditable: true, type: 'status', selectOptions: opsCategories, align: 'center' },
    { key: 'campaignId', label: isIdLng ? 'ID Kampanye' : 'Linked Campaign', isEditable: true, type: 'text' },
    { key: 'productId', label: isIdLng ? 'Produk Terkait' : 'Assigned Product', isEditable: true, type: 'status', selectOptions: products.map(p => p.id) },
    { key: 'amount', label: isIdLng ? 'Biaya Terbayar' : 'Amount Settle', isEditable: true, type: 'currency', align: 'right' },
    { key: 'date', label: isIdLng ? 'Tanggal' : 'Date Value', isEditable: true, type: 'date' },
    { key: 'platform', label: isIdLng ? 'Platform Transaksi' : 'Method / Platform', isEditable: true, type: 'text' },
    { key: 'notes', label: isIdLng ? 'Catatan' : 'Notes', isEditable: true, type: 'longText' }
  ];

  const handleDataChangeOps = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    operationalCosts.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteOperationalCost(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = operationalCosts.find(o => o.id === newItem.id);
      if (oldItem) {
        const updates: Partial<OperationalCost> = {};
        if (newItem.category !== oldItem.category) updates.category = newItem.category;
        if (newItem.campaignId !== oldItem.campaignId) updates.campaignId = newItem.campaignId;
        if (newItem.productId !== oldItem.productId) updates.productId = newItem.productId;
        if (newItem.amount !== oldItem.amount) updates.amount = Number(newItem.amount) || 0;
        if (newItem.date !== oldItem.date) updates.date = newItem.date;
        if (newItem.platform !== oldItem.platform) updates.platform = newItem.platform;
        if (newItem.notes !== oldItem.notes) updates.notes = newItem.notes;

        if (Object.keys(updates).length > 0) {
          updateOperationalCost(newItem.id, updates);
        }
      }
    });
  };

  const columnsAds: ColumnDef[] = [
    { key: 'id', label: 'Campaign ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama Kampanye' : 'Campaign Name', isEditable: true, type: 'text' },
    { key: 'platform', label: 'Platform', isEditable: true, type: 'status', selectOptions: ['Meta Ads', 'TikTok Ads', 'Google Ads', 'Shopee Ads'], align: 'center' },
    { key: 'spend', label: isIdLng ? 'Modal Iklan' : 'Spend', isEditable: true, type: 'currency', align: 'right' },
    { key: 'revenue', label: isIdLng ? 'Hasil Omset' : 'Revenue', isEditable: true, type: 'currency', align: 'right' },
    { key: 'roas', label: 'ROAS Return', type: 'formula', formulaExpr: "{revenue} / {spend}", align: 'right', isEditable: false },
    { key: 'cpc', label: 'CPC', isEditable: true, type: 'currency', align: 'right' },
    { key: 'cpm', label: 'CPM', isEditable: true, type: 'currency', align: 'right' },
    { key: 'ctr', label: 'CTR (%)', isEditable: true, type: 'percentage', align: 'right' },
    { key: 'conversionRate', label: 'Conv. Rate (%)', isEditable: true, type: 'percentage', align: 'right' },
    { key: 'profitability', label: isIdLng ? 'Margin Untung' : 'Profitability', type: 'formula', formulaExpr: "{revenue} - {spend}", align: 'right', isEditable: false }
  ];

  const handleDataChangeAds = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedAds.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteAdsCampaign(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedAds.find(a => a.id === newItem.id);
      if (oldItem) {
        const updates: Partial<AdsCampaign> = {};
        if (newItem.name !== oldItem.name) updates.name = newItem.name;
        if (newItem.platform !== oldItem.platform) updates.platform = newItem.platform;
        if (newItem.spend !== oldItem.spend) updates.spend = Number(newItem.spend) || 0;
        if (newItem.revenue !== oldItem.revenue) updates.revenue = Number(newItem.revenue) || 0;
        if (newItem.cpc !== oldItem.cpc) updates.cpc = Number(newItem.cpc) || 0;
        if (newItem.cpm !== oldItem.cpm) updates.cpm = Number(newItem.cpm) || 0;
        if (newItem.ctr !== oldItem.ctr) updates.ctr = Number(newItem.ctr) || 0;
        if (newItem.conversionRate !== oldItem.conversionRate) updates.conversionRate = Number(newItem.conversionRate) || 0;

        if (Object.keys(updates).length > 0) {
          updateAdsCampaign(newItem.id, updates);
        }
      }
    });
  };

  const columnsKols: ColumnDef[] = [
    { key: 'id', label: 'KOL ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama KOL' : 'KOL Name', isEditable: true, type: 'text' },
    { key: 'platform', label: 'Platform', isEditable: true, type: 'status', selectOptions: ['TikTok', 'Instagram', 'YouTube', 'Twitter'], align: 'center' },
    { key: 'followers', label: isIdLng ? 'Pengikut' : 'Followers', isEditable: true, type: 'number', align: 'right' },
    { key: 'cost', label: isIdLng ? 'Biaya Endorse' : 'Endorse Cost', isEditable: true, type: 'currency', align: 'right' },
    { key: 'revenueGenerated', label: isIdLng ? 'Omset Hasil' : 'Revenue Track', isEditable: true, type: 'currency', align: 'right' },
    { key: 'roas', label: 'ROI ROAS', type: 'formula', formulaExpr: "{revenueGenerated} / {cost}", align: 'right', isEditable: false },
    { key: 'campaignId', label: isIdLng ? 'Kode Promo' : 'Campaign Code', isEditable: true, type: 'text' },
    { key: 'status', label: isIdLng ? 'Tahap Kerja' : 'Negotiate Status', isEditable: true, type: 'priority', selectOptions: ['Negotiation', 'Contracted', 'Content Posted', 'Completed'], align: 'center' }
  ];

  const handleDataChangeKols = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedKols.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteKol(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedKols.find(k => k.id === newItem.id);
      if (oldItem) {
        const updates: Partial<KolTracking> = {};
        if (newItem.name !== oldItem.name) updates.name = newItem.name;
        if (newItem.platform !== oldItem.platform) updates.platform = newItem.platform;
        if (newItem.followers !== oldItem.followers) updates.followers = Number(newItem.followers) || 0;
        if (newItem.cost !== oldItem.cost) updates.cost = Number(newItem.cost) || 0;
        if (newItem.revenueGenerated !== oldItem.revenueGenerated) updates.revenueGenerated = Number(newItem.revenueGenerated) || 0;
        if (newItem.campaignId !== oldItem.campaignId) updates.campaignId = newItem.campaignId;
        if (newItem.status !== oldItem.status) updates.status = newItem.status as any;

        if (Object.keys(updates).length > 0) {
          updateKol(newItem.id, updates);
        }
      }
    });
  };

  // Filters
  const filteredSales = useMemo(() => {
    return computedSales.filter(s => {
      return s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase()) || s.productName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [computedSales, searchQuery]);

  const filteredOps = useMemo(() => {
    return operationalCosts.filter(o => {
      const pName = products.find(p => p.id === o.productId)?.name || 'General';
      return o.category.toLowerCase().includes(searchQuery.toLowerCase()) || pName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [operationalCosts, searchQuery, products]);

  const filteredAds = useMemo(() => {
    return computedAds.filter(a => {
      const pName = products.find(p => p.id === a.productId)?.name || 'General';
      return a.name.toLowerCase().includes(searchQuery.toLowerCase()) || pName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [computedAds, searchQuery, products]);

  const filteredKols = useMemo(() => {
    return computedKols.filter(k => {
      return k.name.toLowerCase().includes(searchQuery.toLowerCase()) || k.campaignId.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [computedKols, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-5">
        <div>
          <span className="text-xs font-mono tracking-widest" style={{color:accentHex}}>{t('sales_page_label')}</span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">{t('sales_page_title')}</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {activeTab === 'sales' && (
            <button 
              onClick={() => {
                if(products.length > 0 && variants.length > 0) {
                  setNewSale(prev => ({
                    ...prev,
                    productId: products[0].id,
                    variantSku: variants[0].sku,
                    pricePerPcs: products[0].sellingPrice
                  }));
                }
                setShowAddSale(true);
              }}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('sales_btn_add_sale')}
            </button>
          )}
          {activeTab === 'ops' && (
            <button 
              onClick={() => setShowAddOps(true)}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('sales_btn_add_ops')}
            </button>
          )}
          {activeTab === 'ads' && (
            <button 
              onClick={() => setShowAddAds(true)}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('sales_btn_add_ads')}
            </button>
          )}
          {activeTab === 'kol' && (
            <button 
              onClick={() => setShowAddKol(true)}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('sales_btn_add_kol')}
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs Selector */}
      <div className="flex border-b border-white/[0.05] gap-6 text-sm">
        <button 
          onClick={() => { setActiveTab('sales'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'sales' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'sales' && <motion.div layoutId="sales-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('sales_tab_sales')} [{computedSales.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('ops'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'ops' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'ops' && <motion.div layoutId="sales-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('sales_tab_ops')} [{operationalCosts.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('ads'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'ads' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'ads' && <motion.div layoutId="sales-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('sales_tab_ads')} [{computedAds.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('kol'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'kol' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'kol' && <motion.div layoutId="sales-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('sales_tab_kol')} [{computedKols.length}]
        </button>
      </div>

      {/* SEARCH CONTROL BAR */}
      <div className="flex bg-[var(--color-background)]/40 border border-white/[0.03] p-4 rounded-lg">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
          <input 
            type="text" 
            placeholder="Search matching entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-card-bg)]/60 border border-white/[0.05] focus:border-white/[0.15] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] rounded text-xs font-mono transition-colors"
          />
        </div>
      </div>

      {/* --- TAB 1: SALES TRACKING --- */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="finance_sales"
            title="Sales Inflow Transactions"
            columns={columnsSales}
            data={filteredSales}
            onDataChange={handleDataChangeSales}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {activeTab === 'ops' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="finance_ops"
            title="Operational Debits & Expenses"
            columns={columnsOps}
            data={filteredOps}
            onDataChange={handleDataChangeOps}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="finance_ads"
            title="Digital Ad Campaigns Performance"
            columns={columnsAds}
            data={filteredAds}
            onDataChange={handleDataChangeAds}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {activeTab === 'kol' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="finance_kol"
            title="KOL Influencer Campaign ROI"
            columns={columnsKols}
            data={filteredKols}
            onDataChange={handleDataChangeKols}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- ADD DIALOG POPUPS --- */}

      {/* 1. Log Order */}
      {showAddSale && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('sales_modal_add_sale')}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Target Product</label>
                <select 
                  value={newSale.productId} 
                  onChange={(e) => {
                    const backingP = products.find(p => p.id === e.target.value);
                    const matchedVar = variants.find(v => v.productId === e.target.value);
                    setNewSale({
                      ...newSale, 
                      productId: e.target.value,
                      pricePerPcs: backingP ? backingP.sellingPrice : 150,
                      variantSku: matchedVar ? matchedVar.sku : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name} ({formatMoney(p.sellingPrice)})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Target Variant Size SKU</label>
                <select 
                  value={newSale.variantSku} 
                  onChange={(e) => setNewSale({...newSale, variantSku: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {computedVariants.filter(v => v.productId === newSale.productId).map(v => (
                    <option key={v.sku} value={v.sku}>{v.sku} | {v.color} size {v.size} (Avail: {v.remainingStock})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase">Buyer Full Name</label>
                <input 
                  type="text" 
                  value={newSale.customerName} 
                  placeholder="e.g. Samuel Sterling"
                  onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">QUANTITY</label>
                <input 
                  type="number" 
                  value={newSale.qtySold === 0 ? '' : newSale.qtySold} 
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setNewSale({...newSale, qtySold: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">RETAIL VALUE ({currencySymbol}/PCS)</label>
                <CurrencyInput
                  value={newSale.pricePerPcs}
                  onChange={(val) => setNewSale({...newSale, pricePerPcs: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Discount Code ({currencySymbol})</label>
                <CurrencyInput
                  value={newSale.discount}
                  onChange={(val) => setNewSale({...newSale, discount: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase font-bold text-[var(--color-accent-highlight)]">Gatekeeper Channel</label>
                <select 
                  value={newSale.channel} 
                  onChange={(e) => setNewSale({...newSale, channel: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                >
                  {channels.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Platform Processing Fees ({currencySymbol})</label>
                <CurrencyInput
                  value={newSale.platformFee}
                  onChange={(val) => setNewSale({...newSale, platformFee: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Shipping Fees charges ({currencySymbol})</label>
                <CurrencyInput
                  value={newSale.shippingFee}
                  onChange={(val) => setNewSale({...newSale, shippingFee: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddSale(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!newSale.customerName) return toast.error('Customer name is required.');
                  addSale(newSale);
                  setShowAddSale(false);
                }}
                className="px-4 py-2 bg-[#d4af37] text-[var(--color-text-main)] font-semibold hover:bg-[#b08e23] transition-colors uppercase rounded"
              >
                Authorize Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Log Ops */}
      {showAddOps && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('sales_modal_add_ops')}</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Expense Category</label>
                <select 
                  value={newOps.category} 
                  onChange={(e) => setNewOps({...newOps, category: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {opsCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase font-bold text-[var(--color-accent-highlight)]">Attribute Product Allocation</label>
                <select 
                  value={newOps.productId} 
                  onChange={(e) => setNewOps({...newOps, productId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                >
                  <option value="">No product linked (Sass/Indirect)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">DEBIT BILLING AMOUNT ({currencySymbol})</label>
                <CurrencyInput
                  value={newOps.amount}
                  onChange={(val) => setNewOps({...newOps, amount: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)]">CAMPAIGN ID</label>
                  <input 
                    type="text" 
                    value={newOps.campaignId} 
                    onChange={(e) => setNewOps({...newOps, campaignId: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)]">PLATFORM TYPE</label>
                  <input 
                    type="text" 
                    value={newOps.platform} 
                    onChange={(e) => setNewOps({...newOps, platform: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">LEDGER COMMENTS</label>
                <textarea 
                  value={newOps.notes} 
                  onChange={(e) => setNewOps({...newOps, notes: e.target.value})}
                  className="w-full h-16 p-3 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddOps(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  addOperationalCost(newOps);
                  setShowAddOps(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Book Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Log Ads */}
      {showAddAds && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('sales_modal_add_ads')}</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Campaign Name</label>
                <input 
                  type="text" 
                  value={newAds.name} 
                  placeholder="e.g. Parka Launch Retargeting"
                  onChange={(e) => setNewAds({...newAds, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase">Product Link</label>
                <select 
                  value={newAds.productId} 
                  onChange={(e) => setNewAds({...newAds, productId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] font-bold text-[var(--color-accent-highlight)]">DEBIT Spend ({currencySymbol})</label>
                  <CurrencyInput
                    value={newAds.spend}
                    onChange={(val) => setNewAds({...newAds, spend: val})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] font-bold text-emerald-400">CREDIT Revenue ({currencySymbol})</label>
                  <CurrencyInput
                    value={newAds.revenue}
                    onChange={(val) => setNewAds({...newAds, revenue: val})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddAds(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!newAds.name) return toast.error('Campaign Name is required.');
                  addAdsCampaign(newAds);
                  setShowAddAds(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Commit Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Log KOL */}
      {showAddKol && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('sales_modal_add_kol')}</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">KOL Handle</label>
                <input 
                  type="text" 
                  value={newKol.name} 
                  placeholder="e.g. @cyberpunk_nomad"
                  onChange={(e) => setNewKol({...newKol, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)]">FOLLOWERS COUNT</label>
                  <input 
                    type="number" 
                    value={newKol.followers === 0 ? '' : newKol.followers} 
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setNewKol({...newKol, followers: isNaN(parsed) ? 0 : parsed});
                    }}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)]">CONTRACT EXPENSE ({currencySymbol})</label>
                  <CurrencyInput
                    value={newKol.cost}
                    onChange={(val) => setNewKol({...newKol, cost: val})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase">Linked Campaign (ID)</label>
                <select 
                  value={newKol.campaignId} 
                  onChange={(e) => setNewKol({...newKol, campaignId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="">No campaign link (Generic brand push)</option>
                  {computedAds.map(a => <option key={a.id} value={a.id}>{a.id} - {a.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Revenue Track Generated ({currencySymbol})</label>
                <CurrencyInput
                  value={newKol.revenueGenerated}
                  onChange={(val) => setNewKol({...newKol, revenueGenerated: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddKol(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!newKol.name) return toast.error('Name required.');
                  addKol(newKol);
                  setShowAddKol(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Commit Contractor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
