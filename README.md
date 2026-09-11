# Kalro Sericulture App 🐛🍃

[![Flutter Version](https://img.shields.io/badge/Flutter-3.16+-blue.svg)](https://flutter.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Kalro Sericulture** is a comprehensive, offline-first digital farm assistant designed exclusively for Kenyan farmers managing **Eri** and **Bombyx mori** rearing cycles. By bringing modern tracking, AI-powered milestone predictions, and rigorous metric-based logging to the rural edge, Kalro empowers silkworm farmers to maximize yield and eliminate manual logbooks.

---

## 🌟 Key Features

* **Offline-First Architecture**: Built for rural Kenya. All data is persisted locally via encrypted JSON and can be securely synced to the cloud via Zip exports.
* **Dual Language Support (i18n)**: Instantly switch between **English** and **Swahili** within the app. No restarts required.
* **AI Lifecycle Predictions**: Uses algorithmic models to predict the exact date your larvae will transition between instars, begin spinning, and be ready for harvest based on feeding data and temperature logs.
* **KPI Dashboard & Analytics**: A beautiful "Command Center" dashboard that visualizes active batches, total live larvae, historical survival rates, and lifetime yield in kilograms.
* **Metric Logging**: Log leaf consumption (grams/kg), mortality rates, and temperature/humidity. 
* **Guided Onboarding Walkthrough**: Seamless, educational first-time setup for rural farmers.

---

## 📸 Screenshots & UI

*(Insert screenshots here showcasing the Farm Identity Hero Card, the tabbed Batch Details, and the Horizontal KPI lists)*

---

## 🛠 Tech Stack

* **Framework:** Flutter & Dart
* **Architecture:** Custom MVC with localized offline Repositories.
* **State Management:** Native `StatefulWidget` & `ValueNotifier` for blistering fast offline performance.
* **Localization:** `flutter_localizations` & `intl` (English + Swahili).
* **Storage:** `path_provider` for secure JSON persistence.

---

## 🚀 Getting Started

### Prerequisites
* Flutter SDK (3.16 or higher)
* Dart SDK
* An Android/iOS Emulator or physical device for testing.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dr-Rank1/Kalro-App.git
   cd Kalro-App
   ```

2. **Fetch dependencies & Generate Localizations:**
   ```bash
   flutter pub get
   flutter gen-l10n
   ```

3. **Run the app:**
   ```bash
   flutter run
   ```

### Default Credentials
For development testing, a default offline session can be established using:
* **Username:** `admin`
* **PIN:** `1234`

---

## 🌍 Contributing & Localization

We welcome contributions! To add a new language:
1. Navigate to `lib/l10n/`.
2. Duplicate `app_en.arb` and rename it (e.g., `app_fr.arb`).
3. Translate the JSON keys.
4. Run `flutter gen-l10n` to rebuild the delegates.

---

## 📝 License

This project is proprietary for KALRO Sericulture operations. Please refer to the specific licensing guidelines provided by Dr-Rank1.
