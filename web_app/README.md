# KALRO Sericulture — Web Application

Web version of the **KALRO Sericulture Farm Management System** for Kenyan farmers rearing **Eri** (*Samia cynthia ricini*) and Mulberry (*Bombyx mori*) silkworms.

This application maintains the exact branding, high-contrast sunlight-readable palette, and biological models as the mobile Flutter app, built with **React 19 + TypeScript + Vite**.

---

## Key Features

1. **Rearing Dashboard (`Today`)**:
   - Active batches overview, live silkworm population, daily feed consumption, survival rate, and total cocoon harvests.
   - Urgency alerts for low leaf inventory, temperature/humidity stress, and moult rest periods.
   - Microclimate sensor sync simulation.

2. **Batch Management (`Batches`)**:
   - Lifecycle tracking for Bombyx mori and Eri silkworms.
   - Instar progress bars, starting eggs vs. live larvae counts.
   - Print-ready Tray QR tag generator with embedded lot metadata.
   - Batch creation and cycle archive.

3. **Lifecycle Calendar Roadmap (`Plan`)**:
   - 40-day *Bombyx mori* and 39-day *Eri* calendar roadmap.
   - Step-by-step guidance for Incubation, 1st - 5th Instars, Moult rest days, Spinning/Mounting, and Cocoon Harvest.
   - Specific temperature and relative humidity targets per stage.

4. **Farm Work & Tools (`Farm Work`)**:
   - **Daily Feeding**: Feed logger with skipped feed tracking & reason logs.
   - **Disease Diagnostic Sheet**: Interactive symptom-based diagnosis for Pebrine, Grasserie (NPV), Flacherie (IFV), Muscardine, Bacterial wilt, and Uzi fly, with immediate treatment actions.
   - **Cocoon Harvest & Reeling Analytics**: Calculates Renditta, Shell Ratio %, Reelability %, Defect rate %, and assigns commercial grades (**Grade A**, **Grade B**, **Grade C**).
   - **Leaf & Forage Ledger**: Mulberry, Castor, and Kesseru stock balances, harvest additions, and days-of-cover runout forecasting.
   - **Financial Ledger**: Sales revenue, egg purchases, input costs, and net margins.
   - **Field Guide**: Best practice cheat sheets for Kenyan farmers.
   - **Offline Reports**: Batches CSV download and signed JSON farm backup.

5. **Farm Profile & Offline Data (`You`)**:
   - Farm identity, County selection (Murang'a, Machakos, Kirinyaga, etc.), rearing house counts, and KALRO sync codes.
   - Operator role switcher (Farm Manager, Silkworm Rearer, Chawki Specialist).
   - Bilingual language toggle (English / Kiswahili).
   - Night Rearing Dark Mode toggle.
   - SHA-256 verified JSON farm backup and restore.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Run

1. **Navigate to the web_app folder:**
   ```bash
   cd web_app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```
   The production files will be output to `web_app/dist/`, ready to be deployed to any static host (Vercel, Netlify, Firebase Hosting, Cloud Storage, or GitHub Pages).
