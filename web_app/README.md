# KALRO Sericulture — Web Application Dashboard

[![React Version](https://img.shields.io/badge/React-19.3+-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![RxDB](https://img.shields.io/badge/RxDB-Offline_First-red.svg)](https://rxdb.info/)
[![PowerSync](https://img.shields.io/badge/PowerSync-Replication-purple.svg)](https://powersync.com/)

The **KALRO Sericulture Web Application** is a high-albedo, executive institutional progressive web application (PWA) tailored for station agronomists, research technicians, extension officers, and commercial silkworm rearers across Kenya. It digitizes the complete sericulture value chain for *Bombyx mori* (Mulberry silkworm) and *Samia cynthia ricini* / *Philosamia ricini* (Eri silkworm), adhering strictly to protocols established by the **Kenya Agricultural and Livestock Research Organization (KALRO)** and the **National Sericulture Research Centre (NSRC)** in Thika.

---

## Executive Institutional Design System

The web dashboard is styled with an executive high-albedo institutional theme:
* **Clean White Canvas (`#FFFFFF`) & Subtle Canvas (`#F8FAFC`)**: Delivers an airy, breathable SaaS aesthetic eliminating dark-mode visual clutter and eye strain in bright laboratory and rearing hut environments.
* **Institutional Mulberry Green (`#16A34A`) & Raw Silk Gold (`#D97706`)**: Distinctive agricultural research branding representing fresh mulberry foliage and raw bivoltine silk cocoons.
* **Strict WCAG AAA Legibility**: All data points, active navigation tabs, status badges, and alert cards use high-contrast foreground colors (e.g. deep forest green `#15803D` on `#DCFCE7`, deep amber `#B45309` on `#FEF3C7`, and deep red `#B91C1C` on `#FEE2E2`) ensuring minimum 7:1 contrast ratios.
* **Unified Executive Operations Command Card**: In `TodayView`, eliminates previous vertical stacking syndrome by consolidating rearing operations, localized date, current shift guidance (`Morning Rations`), next ration countdowns (`In 3h 13m`), action buttons, and rotating operator duty assignments into a single cohesive command center.

---

## Architecture: Bulletproof Feature-Based Organization

The codebase strictly adheres to the `bulletproof-react` architecture, cleanly separating global infrastructure from self-contained business domains:

```text
web_app/src/
├── features/                           # Independent Domain Feature Modules
│   ├── batches/                        # Silkworm rearing batch management
│   │   ├── components/                 # Batch cards, creation modals, QR tag generators
│   │   ├── hooks/                      # RxDB batch query observables
│   │   └── types/                      # Domain-specific batch models
│   ├── agronomy/                       # StationAgronomyView & field research
│   │   ├── components/                 # Genebank plots, calculators, drying timers
│   │   ├── hooks/                      # Cultivar & soil condition observables
│   │   └── types/                      # Germplasm & evaluation accession types
│   ├── finance/                        # Farmer disbursements & sales ledger
│   │   ├── components/                 # M-PESA B2C payout UI & cash ledger
│   │   ├── hooks/                      # Financial balance & payment observables
│   │   └── types/                      # Payout & transaction types
│   └── health/                         # Biosecurity & disease triage
│       ├── components/                 # Pathology symptom checklist & disinfectant calculators
│       └── types/                      # Disease & pest taxonomy definitions
│
├── lib/                                # Core Third-Party Library Wrappers
│   └── rxdb/                           # RxDB offline database configuration
│       ├── database.ts                 # Database factory & Dexie storage engine
│       ├── schemas.ts                  # Typed RxDB JSON schemas
│       └── sync.ts                     # PowerSync PostgreSQL replication hooks
│
├── components/                         # Global Reusable UI Components
│   ├── Header.tsx                      # Brand header & PowerSync sync status indicator
│   ├── Navigation.tsx                  # Main tab navigation bar
│   └── TodayView.tsx                   # Executive Operations Command Center
│
├── utils/                              # Mathematical formulas, dates, PDF generation
├── constants.ts                        # Kenyan germplasm registry & NSRC feeding tables
└── index.css                           # High-albedo institutional theme & Tailwind v4
```

### Dependency Rules:
1. Feature modules may import from global `components/`, `utils/`, `lib/`, and `constants.ts`.
2. Cross-feature imports are strictly forbidden (e.g. `features/batches` cannot import directly from `features/finance`). Shared domain logic is hoisted to global stores or utility libraries.

---

## Offline-First Synchronization Engine (RxDB + PowerSync)

* **Local Data Layer**: Powered by **RxDB** with the **Dexie.js (IndexedDB)** storage adapter, ensuring 100% functionality when rural network connections drop.
* **Reactive UI**: Data changes propagate instantaneously via RxJS observables, automatically updating counters, feeding logs, and microclimate feeds.
* **Central Replication**: Integrates with **PowerSync** for bi-directional replication with the central NSRC PostgreSQL database, seamlessly buffering pending edits locally and syncing automatically upon reconnection.

---

## Core Modules & Features

### 1. Operations Today (`TodayView`)
* **Executive Command Card**: High-level station overview displaying localized date, active rearing shift guidance, next ration countdown, and logged-in duty operator.
* **Floating KPI Grid**: 5 elevated stat cards tracking Live Silkworms, Feed Dispatched, Forage Buffer Runway, Average Survival, and Chamber Climate.
* **Active Station Notices**: Dynamic biosecurity and feed deficit warnings with integrated one-click resolution actions.
* **Batch Command Cards**: Single-lot or multi-lot command cards featuring stage progress bars, target cultivar guidance (e.g. *V1 Mulberry*), operational stats, and staff audit attribution.

### 2. Silkworm Batches (`features/batches`)
* **Cycle Tracking**: Support for *Bombyx mori* and *Samia cynthia ricini* (Eri).
* **Instar Progress Bar**: Real-time progress through 5 instars and 4 moults.
* **Print-Ready QR Tags**: Vector QR codes for physical rearing tray identification.
* **Batch Registration**: Certified egg box intake tracking (20,000 eggs/box).

### 3. Station & Agronomy Hub (`features/agronomy`)
An 8-subtab agronomic research workstation styled with Tailwind CSS v4:
1. **Genebank & Plots**: Characterized cultivars (11 Mulberry, 7 Castor), field evaluation blocks (C2–C4, D1–D4), and Highway Farm plots.
2. **Biomass & Spacing Calculator**: Planting geometry (Standard 1,798 bushes/ac vs. Paired-Row 4,996 bushes/ac), annual foliage capacity, and non-overlapping pruning sync slider.
3. **Cocoon Quality & Defect Sorter**: 50-cocoon random sample evaluation across 7 defect categories with 48x48px touch controls, shell ratio % (SR), renditta estimation, and commercial price fixation.
4. **4-Stage Hot-Air Drying Controller**: Step progression cards, countdown timer with audio chime, and 40% target dry weight verification.
5. **Bed Area & Slaked Lime Dosing**: Instar floor space expansion ($0.4\text{--}34.0\,\text{m}^2$) and NSRC Table 4 agricultural lime dosing ($50\,\text{g/m}^2$).
6. **Disease & Pest Diagnostic Triage**: Pathogen checklists and chemical disinfectant dilution calculator (2% Formalin, 5% Bleaching powder).
7. **Safaricom Daraja M-PESA B2C Payout Simulator**: Disburse mobile money payments for cocoon deliveries with simulated Daraja receipts.
8. **USSD *384# Simulator**: Dial *384# on a simulated feature phone for offline rural farmer reporting.

---

## Build & Development

```bash
# Navigate to web_app
cd web_app

# Install dependencies
npm install

# Start development server (Tailwind CSS v4 + Vite)
npm run dev

# Compile production bundle
npm run build
```

## Quality Assurance

* **TypeScript Type Checking**: `tsc -b` passes with zero type errors.
* **Vite Production Bundler**: Compiles in **~1.4s** with optimized code-splitting and asset compression.
