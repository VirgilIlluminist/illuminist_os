# ILLUMINIST OS — MASTER CONTEXT FOR CLAUDE CODE

> Baca file ini sepenuhnya sebelum melakukan apapun.
> File ini adalah satu-satunya sumber kebenaran untuk project ini.

---

## SIAPA KAMU

Kamu adalah:
- Principal Software Architect
- ERP Architect / SaaS Architect / AI Systems Architect
- CTO + Product Architect
- Senior TypeScript Engineer
- Senior UX Designer

Kamu membangun **ILLUMINIST OS** — AI-Powered Multi-Business Operating System.

---

## APA INI

**ILLUMINIST OS** bukan ERP biasa. Ini adalah Chief Operating System untuk:
- Founder yang punya banyak bisnis
- Holding company
- Multi-brand entrepreneur

**Satu owner. Satu login. Satu dashboard. Banyak bisnis.**

Contoh struktur user:
```
ILLUMINIST HOLDING
├── NEVAEH (Fashion)
├── Coffee Business
├── Retail Business
├── Agency
├── Property
├── Personal Finance
└── Future Ventures
```

---

## STATUS PROJECT SAAT INI

### Nama project di repo: NEVAEH AI OS v12
### Repo: https://github.com/VirgilIlluminist/illuminist_os

### Sudah ada (jangan diulang, diperdalam saja):
- ✅ React 19 + TypeScript strict + Vite + TailwindCSS v4
- ✅ Express backend (server/index.ts)
- ✅ Multi-AI Gateway (Gemini, OpenAI, Claude, OpenRouter)
- ✅ SmartTable dengan formula engine + CSV export
- ✅ Shared components (Modal, Toast, Tabs, Button, Badge, FormField, dll)
- ✅ AI Chat UI + AIInsightPanel + AISettingsPanel
- ✅ 10 Business Tools untuk AI
- ✅ ERPContext (state management)
- ✅ Translations (EN + ID)
- ✅ Supabase client (belum aktif)
- ✅ Migration service (localStorage → Supabase)
- ✅ Database schema SQL (001_initial_schema.sql)

### Belum ada (ini yang harus dibangun):
- ❌ Multi-Business Engine (masih single fashion brand)
- ❌ React Router (navigasi belum proper)
- ❌ Supabase aktif (masih pakai localStorage)
- ❌ Multi-tenant architecture
- ❌ Business Templates (Fashion, Coffee, Retail, Agency, dll)
- ❌ Executive Command Center (lintas bisnis)
- ❌ Transaction Engine (double-entry otomatis)
- ❌ HR System lengkap
- ❌ Multi-store system

### Priority urutan pengerjaan:
1. React Router — navigasi proper dulu
2. Multi-Business Engine — core identity product
3. Supabase Migration — data persistent
4. Business Templates — Fashion, Coffee, dll
5. Transaction Engine — double-entry otomatis
6. Executive Command Center — dashboard holding
7. HR System
8. AI Chief of Staff upgrade

---

## TECH STACK

```
Frontend:     React 19, TypeScript strict, Vite, TailwindCSS v4
Backend:      Express (server/index.ts)
Database:     Supabase + PostgreSQL (belum aktif — masih localStorage)
AI:           Multi-provider gateway (Gemini default, OpenAI, Claude, OpenRouter)
Architecture: Repository Pattern, Service Layer, Multi-tenant, RLS
```

---

## ARSITEKTUR — WAJIB DIIKUTI

```
UI Layer
  ↓  (tidak boleh akses storage langsung)
Repository Layer
  ↓
Service Layer
  ↓
Database (Supabase / localStorage sebagai fallback)
```

**UI tidak boleh:**
- Baca localStorage langsung
- Query database langsung
- Taruh business logic

---

## STRUKTUR FOLDER

```
illuminist_os/
├── server/
│   ├── config/env.ts
│   ├── middleware/          (auth, rateLimit, audit, errorHandler)
│   ├── routes/api/          (health, audit)
│   ├── routes/ai/           (chat, providers, memory)
│   ├── services/ai/         (AIGateway, ProviderManager, MemoryManager)
│   │   └── providers/       (Gemini, OpenAI, Claude, OpenRouter)
│   ├── tools/index.ts       (10 business tools)
│   ├── db/migrations/       (001_initial_schema.sql)
│   └── index.ts
│
├── src/
│   ├── components/
│   │   ├── shared/          (10 reusable components)
│   │   ├── table/           (SmartTable)
│   │   └── ai/              (AIChat, AIInsightPanel, AISettingsPanel)
│   ├── context/
│   │   ├── ERPContext.tsx   (main state — localStorage)
│   │   └── hooks/
│   ├── db/
│   │   ├── supabase.ts
│   │   └── database.types.ts
│   ├── hooks/useAI.ts
│   ├── services/
│   │   ├── api.client.ts
│   │   ├── ai.service.ts
│   │   └── migration.service.ts
│   └── utils/
│       ├── translations.ts  (702 keys EN+ID)
│       ├── storage.ts
│       └── animations.ts
│
├── CLAUDE.md                ← kamu sedang baca ini
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

---

## CODE QUALITY — NON-NEGOTIABLE

**WAJIB:**
- TypeScript strict mode — ZERO error
- Semua test harus PASS
- Semua route harus hidup
- Semua import harus valid
- Tidak ada broken page
- Tidak ada circular dependency

**DILARANG:**
- `any` berlebihan
- `console.log` (gunakan logger)
- Duplicate code
- Copy-paste component
- Business logic di UI
- Mock data / placeholder
- Komponen setengah jadi

---

## DESIGN SYSTEM

**Inspirasi:** Apple × Linear × Stripe × Arc

**Karakter:** Minimalis, Premium, Cepat, Bersih, Modern

**Gunakan:**
- Whitespace besar
- Typography jelas dan hierarkis
- Border radius halus
- Shadow tipis
- Color palette konsisten

**Jangan:**
- Tampilan ERP jadul
- Seperti spreadsheet
- Terlalu padat / cramped
- Notion clone

---

## MULTI-BUSINESS ENGINE

Setiap bisnis punya:
- Dashboard berbeda
- Modul berbeda
- Sidebar berbeda
- KPI berbeda

### Business Templates:
| # | Template | Modul Utama |
|---|----------|-------------|
| 1 | Fashion | Materials, BOM, Production, QC, Products, Sales, Purchasing |
| 2 | Coffee Shop | Ingredients, Recipes, Menu Costing, Daily Closing, Waste |
| 3 | Retail | Inventory, Stock Adjustment, Goods Receiving, Reorder Point |
| 4 | Agency | Clients, Projects, Team, Timesheets |
| 5 | Service | — |
| 6 | Property | Properties, Units, Tenants, Rent Collection, Maintenance |
| 7 | Personal Finance | Income, Expenses, Assets, Investments, Savings Goals |
| 8 | Investment | — |
| 9 | Holding | Consolidated view semua bisnis |
| 10 | Blank | Custom |

---

## FINANCIAL CORE — WAJIB ADA

- Chart of Accounts
- Journal Entries (double-entry otomatis)
- General Ledger
- Trial Balance
- P&L Statement
- Balance Sheet
- Cash Flow Statement

---

## TRANSACTION ENGINE

Setiap business event harus lewat Transaction Engine:

```
Business Event
(Sale / Production / Payroll / Rent / Purchase)
         ↓
Transaction Engine
         ↓
├── Update Inventory
├── Update Accounting (double-entry)
├── Update Dashboard KPIs
├── Update Cash Flow
└── Create Audit Log
```

---

## EXECUTIVE COMMAND CENTER

Owner melihat lintas semua bisnis:
- Revenue total
- Profit total
- Cash position
- Payroll obligations
- Inventory levels
- Accounts Receivable / Payable
- Store performance ranking
- Employee performance

AI Executive Summary otomatis:
- "Revenue naik 12% minggu ini"
- "Margin turun di NEVAEH"
- "Stok bahan baku menipis"
- "Payroll jatuh tempo 3 hari lagi"

---

## AI CHIEF OF STAFF

ILLUMINIST AI bukan chatbot biasa — dia adalah Chief of Staff.

AI memahami konteks bisnis secara menyeluruh:
sales, inventory, accounting, HR, payroll, stores, assets, cashflow

AI capabilities:
- Executive summaries
- Strategic recommendations
- Forecasting
- Proactive alerts

---

## HR SYSTEM

Employee: contract, salary, commission, bonus
Attendance: check-in, check-out, shift
Payroll: allowance, overtime, deduction
Performance: KPI, OKR, ranking

---

## RULES SAAT MENGIMPLEMENTASI FITUR

Urutan wajib:
1. Pahami arsitektur dan dampaknya
2. Pahami business workflow
3. Buat/modifikasi database schema
4. Buat/modifikasi Repository
5. Buat/modifikasi Service layer
6. Buat UI components
7. Wire integration
8. Tulis tests

Saat menjelaskan yang sudah dibuat, selalu sebutkan:
1. Fitur yang ditambahkan
2. Database yang berubah
3. Repository yang ditambah/diubah
4. Service yang ditambah/diubah
5. Business workflow yang berubah
6. Test yang ditambahkan

---

## PRIORITY ORDER

1. Perdalam workflow bisnis
2. Tambah automation
3. Tambah AI capability
4. Tambah integrasi
5. Perbaiki UX
6. Tingkatkan performa

**BUKAN:** audit, skor, laporan, placeholder, mock data.

---

## FINAL GOAL

> ILLUMINIST OS harus menjadi AI-Powered Business Operating System
> untuk founder yang menjalankan banyak bisnis dalam satu platform.

**Target kualitas: Apple × Linear × Stripe × Arc**

Bukan ERP tradisional.
Bukan admin dashboard.
Bukan aplikasi pencatatan.

**ILLUMINIST OS adalah Chief Operating System.**

