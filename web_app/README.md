# KALRO Sericulture — Web Application Dashboard

[![React Version](https://img.shields.io/badge/React-19.3+-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?logo=vite)](https://vitejs.dev)
[![Google Chrome Modern Web Guidance](https://img.shields.io/badge/Chrome_Guidance-Compliant-brightgreen.svg)](https://github.com/GoogleChrome/modern-web-guidance-src)

The **KALRO Sericulture Web Application** is a high-contrast, progressive web application (PWA) tailored for silkworm farmers, station agronomists, research technicians, and agricultural extension officers across Kenya. It digitizes the complete sericulture value chain for both *Bombyx mori* (Mulberry silkworm) and *Samia cynthia ricini* / *Philosamia ricini* (Eri silkworm), adhering strictly to verified protocols established by the **Kenya Agricultural and Livestock Research Organization (KALRO)** and the **National Sericulture Research Centre (NSRC)**.

---

## High-Contrast Monochromatic Design System

The web dashboard is styled with an intentional, high-contrast black-and-white theme (`light-dark(#000000, #FFFFFF)`), engineered specifically for rural agricultural environments:
* **Sunlight Legibility**: High glare in direct equatorial sunlight often renders low-contrast colors illegible on outdoor mobile devices and field laptops. Pure black and white ensure maximum contrast (WCAG AAA compliant).
* **Low-Distraction Floor Operations**: Technicians and farmers can immediately distinguish critical data points (temperature alerts, feeding weights, mortality counts, defect ratios) without cognitive fatigue.
* **Modern Grayscale Tokens**: Uses neutral zinc/slate shades (`#FAFAFA`, `#F4F4F5`, `#E4E4E7`, `#27272A`, `#18181B`, `#09090B`) for cards, borders, and input surfaces, maintaining clean visual hierarchy across both light and dark operating system modes.

---

## Google Chrome Modern Web Guidance Standards

The web client integrates modern web platform recommendations from [Google Chrome Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance-src):

1. **`dark-mode` & Native Color Tokens**:
   * Declares `<meta name="color-scheme" content="light dark" />` in [`index.html`](file:///c:/Users/Ian/Documents/Apps/Kalro-App/web_app/index.html).
   * Enforces root CSS `color-scheme: light dark;`.
   * Implements native CSS `light-dark()` functions in [`src/index.css`](file:///c:/Users/Ian/Documents/Apps/Kalro-App/web_app/src/index.css) for dynamic, flash-free theme adaptation.
2. **`browser-ui-theming`**:
   * Uses standard W3C `scrollbar-color: light-dark(#D4D4D8, #3F3F46) transparent;` and `scrollbar-width: thin;` with progressive fallback.
   * High-contrast `::selection` highlight theming.
3. **`improve-text-layout-and-legibility`**:
   * Applies `text-wrap: balance;` on all card headers, modal titles, and station metrics.
   * Applies `text-wrap: pretty;` across long-form descriptions and agronomic advice to prevent typographically jarring orphan words.
4. **`soft-edge-content-fade`**:
   * Uses CSS linear gradient masks (`mask-image: linear-gradient(...)`) on horizontal scrolling navigation tabs to give users an intuitive visual indicator of overflow.
5. **`defer-rendering-heavy-content`**:
   * Implements `content-visibility: auto;` with `contain-intrinsic-size: auto none auto 240px;` on below-the-fold cards and diagnostic trees to minimize paint time and speed up initial page rendering.
6. **`required-field-feedback`**:
   * Uses `:user-invalid` and `:required:user-valid` pseudo-classes to ensure input validation errors appear only after direct user interaction.

---

## Core Modules & Features

### 1. Rearing Routine (`Today`)
* **Live Batch Overview**: Active batches, total larvae population, daily feed consumption, survival rate %, and cumulative cocoon yields.
* **Batch Work Cards**: Daily stage, suggested feed rations, and direct feed action logger.
* **Critical Alerts**: Instant alerts for forage stock exhaustion, temperature/humidity stress, and moult rest periods.
* **Microclimate Sensor Sync**: Manual reading and BLE simulation for rearing house temperature (°C) and relative humidity (%).

### 2. Batch Lifecycle Management (`Batches`)
* **Cycle Tracking**: Support for *Bombyx mori* and *Eri* silkworms.
* **Instar Progress Bar**: Real-time progress tracking through 5 instars and 4 moults.
* **Print-Ready QR Tags**: Dynamic modal generating physical QR codes with embedded batch metadata for rearing tray identification.
* **Batch Registration**: Streamlined batch entry with initial egg counts, strains, and shed locations.

### 3. Station Agronomy Hub (`Station Agronomy`)
A specialized research and extension workstation featuring 5 dedicated tabs:
* **Mulberry Germplasm (11 Cultivars)**: Trait profiles, leaf yield (ton/ha/yr), leaf moisture %, rooting %, and rearing suitability for V1, Thika, Embu, Ithaanga, Limuru, Thailand, Ichinose, Kanva 2, S54, S36, and Unknown 2.
* **Castor Varieties (7 Cultivars)**: Leaf biomass, maturity cycles, and drought resilience for Nuu 70, KC6, KC14, KC2, KC24, KC15, and KMC8.
* **Research Blocks & Genebanks**: Inventory tracking across Old Genebank, New Genebank, Centre Genebank, Blocks C2–C4, D1–D4 (98 accessions), and Highway Farm sectors.
* **Silkworm Strains & Heterosis**: Pedigree profiles for KSK, ATK, ICIPE, Kinshoshowa, and Eri, featuring mid-parent heterosis calculations ($H\%$).
* **5-Instar Feeding & Bed Space Calculator**: Exact feeding tables (300g up to 200kg per 20,000 larvae), bed space expansion ($0.4\text{--}1.0\,\text{m}^2 \to 34.0\,\text{m}^2$), and slaked lime dusting ($50\text{--}100\,\text{g/m}^2$) during moult rests.

### 4. Farm Work & Commercial Analytics (`Farm Work`)
* **Daily Feeding Logger**: Log exact feed quantities in grams or kilograms with skipped-feed categorization.
* **4-Stage Hot-Air Drying Guide & Timer**: Interactive controller implementing the NSRC staged curve ($115^\circ\text{C}\to 100^\circ\text{C}\to 95^\circ\text{C}\to 90^\circ\text{C}$) to prevent sericin UV degradation and reach the target $40\%$ dry cocoon weight.
* **Cocoon Defect Triage & Market Valuation**: Sorts thin, framed, irregular, melted, double, and stained cocoons; calculates Shell Ratio %, Renditta, Reelability %, and assigns commercial grades (**Grade A**, **Grade B**, **Grade C**, or **Reject**).
* **Disease Diagnostic Biosecurity Sheet**: Visual symptom checklists and containment SOPs for Grasserie (NPV), Pebrine (*Nosema bombycis*), Flacherie (bacterial/viral), and Muscardine (*Beauveria bassiana*).
* **Leaf Inventory & Runout Forecaster**: Dynamic 14-day forward consumption modeling for Mulberry, Castor, and Kesseru stocks.
* **Financial Ledger**: Sales receipts, egg box expenses, disinfectant costs, and net farm margin tracking.
* **Data Export & Signed Backup**: Structured CSV download and SHA-256 verified JSON farm backup and restore.

### 5. Audit & Traceability (`Audit`)
* Verification records for batch inspections, disease quarantines, and cocoon delivery weighing.
* Historical compliance logs and lot quality certificates for export traceability.

### 6. Profile, Multi-Tenancy & Settings (`You`)
* **Multi-Tenant User Isolation**: Coexistence of multiple farmer and technician profiles on a single shared device using IndexedDB.
* **Kenyan County Registry**: Murang'a, Machakos, Kitui, Kirinyaga, Embu, Kakamega, Bungoma, and others.
* **Role Switcher**: Station Agronomist, Extension Officer, Farm Manager, Chawki Specialist, Silkworm Rearer.
* **Bilingual Parity**: Full instant localization between English and Kiswahili.
* **Secure Profile Purging**: Safe deletion of individual profile databases.

---

## Directory Layout

```text
web_app/
├── index.html                          # PWA shell with color-scheme & metadata
├── package.json                        # Scripts and dependencies (React 19, Lucide, Vite)
├── tsconfig.json                       # TypeScript compiler configuration
├── vite.config.ts                      # Vite build configuration
└── src/
    ├── main.tsx                        # Application entrypoint
    ├── App.tsx                         # Main shell, routing tabs, and modal controller
    ├── index.css                       # Monochromatic Modern Web Guidance stylesheet
    ├── constants.ts                    # Germplasm data, feeding tables, user roles
    ├── storage.ts                      # Multi-tenant IndexedDB & LocalStorage engine
    ├── types.ts                        # TypeScript domain model interfaces
    ├── translations.ts                 # Complete English & Kiswahili dictionary
    ├── components/                     # Modular component views
    │   ├── Header.tsx                  # Top navigation bar with monochromatic theme
    │   ├── TodayView.tsx               # Daily routine cards and urgent alert banners
    │   ├── BatchesView.tsx             # Active batch list and lifecycle progress
    │   ├── BatchRegistrationForm.tsx   # Streamlined batch creation form
    │   ├── PlanView.tsx                # 40-day visual lifecycle roadmap
    │   ├── StationAgronomyView.tsx     # 5-tab Station Agronomy Hub
    │   ├── FarmToolsView.tsx           # Feeding, drying, grading, disease & finance
    │   ├── AuditDashboardView.tsx      # Audit inspection & quality verification
    │   ├── ProfileView.tsx             # Multi-tenant profile management & settings
    │   ├── ProfileFormModal.tsx        # Profile creation & edit modal
    │   ├── QuickLogModal.tsx           # Quick feed & environment logger
    │   ├── QrCodeModal.tsx             # Printable tray QR code dialog
    │   └── DryingTimerModal.tsx        # 4-stage hot-air drying countdown modal
    └── utils/                          # Helper utilities
        ├── formulaEngine.ts            # Shunting-yard RPN custom formula parser
        ├── exportPdf.ts                # Executive vector PDF report generator
        └── dateUtils.ts                # Date formatting and instar calculations
```

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) (v18.0.0 or higher)
* `npm` (v9.0.0 or higher) or `yarn`

### Installation & Development

1. Navigate to the web application directory:
   ```bash
   cd web_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

### Production Build & Verification

To verify TypeScript types and generate the optimized production bundle:
```bash
npm run build
```
The output will be placed in `web_app/dist/`, fully static and ready for hosting on Cloud Storage, Firebase Hosting, Netlify, Vercel, or GitHub Pages.

---

## Technical Specifications

| Feature | Specification |
|---|---|
| **Language & Typings** | TypeScript 5.9+ (Strict Mode) |
| **UI Framework** | React 19.3+ with React Hooks |
| **Icons** | Lucide React |
| **Bundler** | Vite 8.3+ |
| **Storage Architecture** | IndexedDB (`IDBDatabase`) with fallback to LocalStorage |
| **Design Standard** | Google Chrome Modern Web Guidance |
| **Color Scheme** | Monochromatic Black & White (`light-dark(#000000, #FFFFFF)`) |
| **Offline Support** | Fully functional offline with persistent client storage |
| **Accessibility** | High-contrast WCAG AAA compliance |

---
*Developed for the Kenya Agricultural and Livestock Research Organization (KALRO) and the National Sericulture Research Centre (NSRC).*
