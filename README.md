# Kalro Sericulture

[![Flutter Version](https://img.shields.io/badge/Flutter-3.16+-02569B.svg?logo=flutter)](https://flutter.dev)
[![Dart Version](https://img.shields.io/badge/Dart-3.0+-0175C2.svg?logo=dart)](https://dart.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Linux%20%7C%20Windows-brightgreen.svg)](#)

**Kalro Sericulture** is a production-grade, offline-first digital farm management companion developed for Kenyan silkworm farmers rearing **Eri** (*Samia cynthia ricini*) and Mulberry (*Bombyx mori*) silkworms. Engineered for rural rearing environments with intermittent connectivity, the platform combines biological calendar models, commercial reeling analytics, inventory forecasting, and hands-free voice guidance into an accessible, sunlight-readable mobile application.

---

## Key Features

### 1. Biological Lifecycle Modeling & Predictive Calendars
* **Dual Species Profiles**: Comprehensive instar scheduling for *Bombyx mori* (approx. 40 days to harvest) and *Eri* (approx. 39 days to adult moth).
* **Dynamic Milestone Adjustment**: Predicts transitions between 1st through 5th instars, spinning dates, and cocoon harvest windows, adjusting dynamically based on recorded rearing room temperatures, humidity, and feeding logs.
* **Moult & Spinning Guidance**: Visual and audio reminders notifying farmers when worms enter moult rest (feeding stop) and when spinning signs appear.

### 2. Commercial Reeling Analytics & Quality Grading
* **Renditta Calculation**: Real-time evaluation of raw silk conversion efficiency:
  $$\text{Renditta} = \frac{\text{Fresh Cocoon Weight (kg)}}{\text{Raw Silk Yield (kg)}}$$
* **Defect Classification**: Tracks commercial defect breakdown including double cocoons, uzi fly pierced cocoons, stained/soiled shells, flimsy shells, and melted cocoons.
* **Commercial Quality Grading**: Evaluates batches into **Grade A**, **Grade B**, or **Grade C** adhering to sericulture standards and KALRO market guidelines.

### 3. Sericulture Formula Engine
* Custom mathematical formula evaluator with recursive-descent parsing, operator precedence, and sericulture presets (feed scaling, space requirements, survival rate curves, and yield expectations).

### 4. Multi-Sheet Excel Workbook Export (`.xlsx`)
* Generates comprehensive offline Excel workbooks exported through native Android/system share sheets:
  1. **Batches**: Batch metadata, species, source, live counts, dates, and status.
  2. **Feeding_Ledger**: Daily feeding weights (grams/kg), leaf types, and suggested vs. actual feeds.
  3. **Health_Mortality**: Cumulative and daily mortality rates, symptom notes, and photo references.
  4. **Environment**: Temperature, relative humidity, ventilation quality, and lighting logs.
  5. **Cocoon_Harvest**: Harvest weights, pupation rates, renditta, reelability %, and defect breakdown.
  6. **Financial_Ledger**: Leaf procurement expenses, egg purchase costs, and cocoon sale revenue.

### 5. Leaf Stock Depletion Forecasting
* **Multi-Forage Inventory**: Tracks Mulberry leaf stocks alongside Eri forage alternatives (Castor and Kesseru).
* **Velocity & Runout Forecasting**: Computes daily consumption velocity (kg/day) against active larvae requirements, calculating days until stock depletion with intuitive urgency indicators (*Adequate*, *Warning*, *Critical*).

### 6. Hardware & Usability Integrations
* **Batch Tray QR Tags**: Generates scan-ready QR code labels for rearing trays encoding batch IDs, species, instar, and population counts.
* **Hands-Free Bilingual Voice Guidance**: Integrated Text-To-Speech (TTS) delivering daily feeding instructions, moult alerts, and task guides in **Swahili** and **English** so farmers can listen hands-free while working in the rearing house.
* **BLE & Simulated Microclimate Sync**: Connects to rearing room environmental sensors to read temperature and humidity, flagging readings outside optimal species limits.

### 7. Offline-First & High-Contrast Field UI
* **Zero Cloud Dependency**: Operates 100% offline using local transactional SQLite storage (`FarmStore`) with indexed queries for instantaneous search and retrieval on budget farm phones.
* **Sunlight-Readable Palette**: High-contrast typography and color schemes calibrated for clear visibility in bright outdoor and greenhouse environments.
* **Frictionless Setup**: Quick onboarding without mandatory password or PIN barriers, while supporting optional PIN authorization for multi-worker farms.

---

## Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [Flutter](https://flutter.dev) (v3.16+) & [Dart](https://dart.dev) (v3.0+) |
| **Local Database** | Transactional SQLite via `sqflite` with indexed queries (`FarmStore`) |
| **Spreadsheet Engine** | `excel` for structured multi-sheet `.xlsx` generation |
| **Hardware & IoT** | `qr_flutter` (tray QR tags), `flutter_tts` (audio guidance), Sensor Manager |
| **Localization** | `flutter_localizations` & `intl` (English & Kiswahili) |
| **Typography** | `google_fonts` (Poppins) with high-contrast accessibility color tokens |
| **Testing** | Comprehensive unit, widget, and integration test suite (>100 automated tests) |

---

## Directory Structure

```text
lib/
├── components/          # Reusable UI widgets
│   ├── batch/           # Batch cards, tray QR dialogs
│   ├── cards/           # Leaf depletion & KPI metric cards
│   ├── dashboard/       # Farm summary cards & charts
│   ├── health/          # Mortality & environmental logging sections
│   ├── layout/          # Toolbars, backgrounds, navigation bars
│   └── lifecycle/       # Today's plan, floor actions, milestone strips
├── l10n/                # Localization catalogs (app_en.arb, app_sw.arb, Swahili messages)
├── models/              # Immutable data entities (Batch, Feeding, Harvest, Metrics)
├── screens/             # Primary application views (Today, Batches, Plan, Farm, Reports)
├── services/            # Business logic, repositories & data operations
│   ├── audio_guidance_service.dart   # Bilingual TTS voice instructions
│   ├── cocoon_analytics_service.dart # Renditta, reelability & grading
│   ├── excel_export_service.dart     # Multi-sheet .xlsx generation
│   ├── farm_store.dart               # Indexed SQLite transactional store
│   ├── formula_engine.dart           # Custom mathematical formula parser
│   ├── leaf_ledger_service.dart      # Leaf consumption & depletion forecasting
│   └── sensor_manager_service.dart   # Rearing room microclimate sensor sync
├── theme/               # Kalro brand colors, contrast tokens & Material 3 themes
└── utils/               # File utilities (atomic writes), date formatting, calculators
```

---

## Getting Started

### Prerequisites
* [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.16 or higher)
* [Android SDK](https://developer.android.com/studio) (API 26+) or physical Android device

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dr-Rank1/Kalro-App.git
   cd Kalro-App
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Generate localization files:**
   ```bash
   flutter gen-l10n
   ```

4. **Run the test suite:**
   ```bash
   flutter test
   ```

5. **Launch on a connected device:**
   ```bash
   flutter run
   ```

---

## Verification & Quality Assurance

* **Static Analysis**: Verified with `flutter analyze` (**0 issues**).
* **Automated Tests**: Over 100 tests verifying lifecycle predictions, formula evaluation, Excel export integrity, SQLite indexed queries, and UI smoke flows.

---

## License

Developed for KALRO (Kenya Agricultural and Livestock Research Organization) Sericulture operations. Licensed under the MIT License.
