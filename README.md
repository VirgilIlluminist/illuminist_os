# ILLUMINIST AI OS v12

> Enterprise Business Operating System untuk Fashion Brand  
> React 19 · TypeScript · Vite · TailwindCSS v4 · Express · Supabase-ready · Multi-AI

---

## Cara Jalankan

```bash
# 1. Clone & install
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env — minimal tambahkan 1 AI API key

# 3. Jalankan (development)
npm run dev          # V12 server (server/index.ts)
npm run dev:legacy   # V11 fallback (server.ts)
```

Buka http://localhost:3000

---

## Struktur Project

```
nevaeh-ai-os/
├── server/                        Backend V12
│   ├── config/env.ts              Environment config
│   ├── middleware/                auth, rateLimit, audit, errorHandler
│   ├── routes/api/                health, audit endpoints
│   ├── routes/ai/                 AI chat, providers, memory
│   ├── services/ai/               AIGateway, ProviderManager, MemoryManager
│   │   └── providers/             Gemini, OpenAI, Claude, OpenRouter
│   ├── tools/index.ts             Tool Registry (10 business tools)
│   └── index.ts                   Entry point (V11 backward compat)
│
├── src/                           Frontend React
│   ├── components/
│   │   ├── shared/                10 reusable components
│   │   │   ├── Modal.tsx          Animated modal (Escape + overlay close)
│   │   │   ├── Toast.tsx          toast.success/error/confirm()
│   │   │   ├── Tabs.tsx           Animated tab navigation
│   │   │   ├── Button.tsx         5 variants (primary/ghost/danger/success/outline)
│   │   │   ├── Badge.tsx          Status badges + StatusBadge
│   │   │   ├── FormField.tsx      text/number/select/textarea/currency
│   │   │   ├── PageHeader.tsx     Standard page header
│   │   │   ├── ConfirmDialog.tsx  Async confirm modal
│   │   │   ├── EmptyState.tsx     Empty state illustration
│   │   │   └── LoadingSpinner.tsx Full page + inline spinner
│   │   ├── table/
│   │   │   ├── tableTypes.ts      All SmartTable TypeScript types
│   │   │   └── tableUtils.ts      Formula engine + CSV export
│   │   └── ai/
│   │       ├── AIChat.tsx         Full chat UI (markdown, quick prompts)
│   │       ├── AIInsightPanel.tsx Auto business insights
│   │       └── AISettingsPanel.tsx Provider config + test connection
│   ├── context/
│   │   ├── ERPContext.tsx         Main state (localStorage, V11 compat)
│   │   └── hooks/
│   │       ├── useFormatters.ts   formatMoney/Number/Percent standalone
│   │       └── useInitialData.ts  Seed data terpisah dari context
│   ├── db/
│   │   ├── supabase.ts            Supabase client (aktifkan saat siap)
│   │   └── database.types.ts     TypeScript types untuk DB schema
│   ├── hooks/
│   │   └── useAI.ts               React hook untuk AI chat
│   ├── services/
│   │   ├── api.client.ts          Base fetch client (auth headers, timeout)
│   │   ├── ai.service.ts          AI API calls (chat, providers, memory)
│   │   └── migration.service.ts   localStorage → Supabase migration
│   └── utils/
│       ├── translations.ts        702 keys (351 EN + 351 ID)
│       ├── storage.ts             Centralized localStorage keys
│       └── animations.ts         Standar motion variants
│
├── server/db/migrations/
│   └── 001_initial_schema.sql    Schema PostgreSQL lengkap
│
├── .env.example                  Template environment variables
├── package.json                  v12.0.0
└── tsconfig.json                 Include src/ + server/
```

---

## Fitur Utama

### Business Modules
| Modul | Keterangan |
|-------|-----------|
| Dashboard | Widget drag/resize + KPI + chart |
| Material Library | Stok bahan baku + PO + supplier |
| Sample Development | Lab sampel + pola |
| Production | Batch produksi + BOM |
| Master Products | Katalog + HPP engine |
| Size Variant Inventory | SKU per ukuran |
| Sales Tracking | Order + channel + platform fee |
| Operational Cost | Fixed/Variable expenses |
| Ads Analytics | Campaign ROAS |
| KOL Tracking | Influencer ROI |
| Finance | Asset + cashflow + ledger |
| Dynamic HPP Engine | Simulasi HPP multi-skenario |
| Smart Databases | SmartTable custom databases |
| AI Assistant | Chat bisnis multi-provider |

### SmartTable Features
- Resize, reorder, hide/show, rename column
- Sort, filter, search, group
- Freeze column, inline edit, drag rows
- Export CSV/XLSX, import CSV/XLSX
- Formula engine (`=SUM`, `=AVG`, `=COUNT`, dll.)
- Audit log per cell change
- Virtual scroll (react-window)

---

## AI Setup

Tambahkan minimal **1 API key** ke `.env`:

```env
GEMINI_API_KEY=   # Gratis — https://aistudio.google.com
OPENAI_API_KEY=   # https://platform.openai.com
CLAUDE_API_KEY=   # https://console.anthropic.com
```

Lalu restart server. AI otomatis aktif. Tanpa API key, sistem tetap berjalan normal (manual-first principle).

### AI Tools yang Tersedia
- `getInventoryStatus()` — stok + low stock alerts
- `getProductMargins()` — HPP + margin per produk
- `getSalesPerformance()` — revenue + channel breakdown
- `getCashflowSummary()` — income vs expenses
- `getAdsROAS()` — ROAS per kampanye
- `getSupplierRanking()` — ranking supplier
- `getCustomerInsights()` — segmentasi pelanggan
- `getKOLPerformance()` — ROI per KOL
- `getProductionStatus()` — status batch produksi
- `getBusinessSummary()` — ringkasan semua modul

---

## Database Migration (Supabase)

```bash
# 1. Buat project di https://supabase.com (gratis)
# 2. Copy URL + anon key ke .env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# 3. Jalankan SQL migration di Supabase SQL Editor:
# Copy-paste isi server/db/migrations/001_initial_schema.sql

# 4. Install Supabase client:
npm install @supabase/supabase-js

# 5. Aktifkan di src/db/supabase.ts (hapus komentar)
```

---

## Roadmap

### V1 — Foundation (4-6 minggu)
- [ ] React Router v6 (router.tsx sudah siap)
- [ ] Supabase Auth + RBAC 8 roles
- [ ] Business API endpoints
- [ ] Form validation (react-hook-form + zod)
- [ ] Lazy loading per route

### V2 — Features (6-8 minggu)
- [ ] Multi-company support
- [ ] File upload (Cloudflare R2/S3)
- [ ] AI write tools + approval workflow
- [ ] PDF reports
- [ ] Telegram integration
- [ ] Tax system (PPN/PPh)

### V3 — Enterprise (3-4 bulan)
- [ ] Multi-agent AI (CFO, Inventory, Finance agents)
- [ ] Knowledge Base (RAG + vector search)
- [ ] Whiteboard workspace
- [ ] ERP integrations (Shopify, TikTok Shop)
- [ ] Mobile native app

---

## Scripts

```bash
npm run dev          # Development (V12 backend)
npm run dev:legacy   # Development (V11 backend fallback)
npm run build        # Production build
npm run start        # Production server
npm run lint         # TypeScript check
npm run clean        # Hapus dist/
```

---

**NEVAEH AI OS v12** · Built with ❤️ for Fashion Brands
