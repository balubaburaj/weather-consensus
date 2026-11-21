# WeatherConsensus (TrueCast AI) 🌤️

> **Multi-Provider Weather Forecast Aggregator & Real-Time Accuracy Engine**
> 
> *Tired of checking 5 different weather apps that all give conflicting predictions? WeatherConsensus puts them side-by-side, compares their predictions against recorded ground truth observations to find out who is actually reliable, and blends them into a self-calibrating consensus forecast.*

---

## 💡 The Core Problem & The TrueCast Solution

1. **The Multi-App Dilemma**:
   - Every weather app relies on a different underlying numerical model (e.g. Apple Weather, AccuWeather, Carrot, Weather Channel, etc.).
   - 24 to 48 hours in advance, models can disagree wildly (e.g. one model predicts 80% heavy rain, another predicts sunny skies).
   - Near the event time (nowcast/radar), models update to match reality.
2. **Empirical Verification**:
   - By capturing what each provider forecasted hours earlier and comparing it against actual recorded ground-truth weather, we calculate **empirical accuracy (Mean Absolute Error and Rain Hit Rates)** for your exact location.
3. **Smart Ensemble ("An App of Our Own")**:
   - Instead of trusting one app blindly or taking an unweighted average, **TrueCast AI** assigns higher voting power to models that have proven most accurate in your region, eliminates single-model phantom storm outliers via trimmed medians, and provides an actionable **Model Agreement & Divergence Confidence Score**.

---

## 🚀 Key Features

- **Global City Search with Autocomplete**: Search any town, city, or coordinate in the world (with GPS auto-locate and quick preset cities like London, Tokyo, New York, Paris, Berlin, Sydney, Singapore, Dubai).
- **7 World-Class Operational Meteorological Models**:
  - 🇪🇺 **ECMWF IFS** (European Centre for Medium-Range Weather Forecasts) — World benchmark 25km resolution.
  - 🇺🇸 **NOAA GFS** (US National Weather Service Global Forecast System) — 13km operational standard.
  - 🇩🇪 **DWD ICON** (German Weather Service) — Icosahedral grid, specialized in convective rain.
  - 🇬🇧 **UK Met Office** — Renowned radar and maritime precipitation modeling.
  - 🇫🇷 **Météo-France ARPEGE** — High-resolution Atlantic and European front modeling.
  - 🇨🇦 **GEM / CMC** (Environment Canada) — Polar and cold air-mass dynamics.
  - 🇯🇵 **JMA GSM** (Japan Meteorological Agency) — High precision Pacific dynamics.
- **Side-by-Side Hourly Matrix**:
  - Horizontal scrolling grid with all 7 models aligned hour-by-hour (00:00 to 23:00).
  - Color-coded rain probability badges, temperature readings, and weather icons.
  - Click any column for the **Hourly Model Showdown Modal**.
- **Interactive Synchronized Curve Chart**:
  - Multi-line curve charts for **Temperature**, **Rain Chance %**, **Precipitation Volume**, and **Wind Speed**.
  - Synchronized hover crosshair comparing all models at that exact hour.
  - Toggle individual models ON/OFF with quick filter chips.
- **Accuracy Leaderboard & Truth Verification**:
  - Live Podium (🥇 #1, 🥈 #2, 🥉 #3) ranking the most reliable providers for the current city.
  - Temperature MAE (Mean Absolute Error in °C/°F) and Temperature Bias.
  - Rain Hit Rate (%) and False Alarm Rate (%).
  - Expandable **Ground Truth Audit Log** showing actual recorded weather vs each model's prediction.
- **TrueCast Consensus Barometer**:
  - Agreement percentage (e.g. 92% High Agreement vs ⚠️ Split Divergence Alert).
  - Peak rain window detection (e.g. "Precipitation expected between 15:00 and 18:00").
  - Customizable ensemble weighting strategies (Dynamic Accuracy, Benchmark Priority, or Equal Weight).

---

## 🛠️ Quick Start

### 1. Requirements
- Node.js (v18+)
- npm or yarn

### 2. Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🔬 Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Plus Jakarta Sans & JetBrains Mono
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (ComposedChart, Line, Area, Tooltip)
- **Data APIs**: Open-Meteo High-Resolution Multi-Model NWP API & Geocoding API (100% free, no key required)
