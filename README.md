# WeatherConsensus (TrueCast AI) 🌤️

> **Multi-Provider Weather Forecast Aggregator & Real-Time Accuracy Engine**  
> *Tailored for Ireland & Global Locations • Powered by TrueCast AI & Open-Meteo NWP Feeds*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Zero API Keys Required](https://img.shields.io/badge/API%20Keys-Zero%20Required%20(Free%20NWP)-emerald.svg)](https://open-meteo.com/)

---

## 💡 The Problem & The TrueCast Solution

1. **The Multi-App Dilemma**:
   - Every weather app relies on a different underlying numerical model (Apple Weather, AccuWeather, Yr.no, Met Éireann, Met Office, etc.).
   - 24 to 48 hours in advance, models frequently disagree (e.g., one model forecasts 80% heavy rain while another predicts dry overcast).
   - Checking 5 different apps to guess what's true is frustrating and time-consuming.
2. **Empirical Verification Against Ground Truth**:
   - Near the event time, models converge, but historical predictions tell us who was actually right.
   - WeatherConsensus captures each provider's forecast hours in advance and benchmarks it against **actual recorded ground station observations** to calculate empirical accuracy:
     - **MAE (Mean Absolute Error)** in °C/°F
     - **Temperature Bias** (does the model consistently over-warm or run cool?)
     - **Rain Hit Rate & False Alarm Rate** (%)
3. **Smart Ensemble ("An App of Our Own")**:
   - Instead of trusting one app blindly or taking a naive unweighted average, **TrueCast AI** assigns higher voting weight to models that have proven most accurate in your region, trims single-model phantom storm outliers, and provides a clear **Model Agreement & Confidence Score**.

---

## 🌟 The 4 Core Pillars

At a single glance, WeatherConsensus answers the 4 most critical questions:

1. 🌡️ **What's the Temp?** — Clear observed and consensus temperature readings.
2. 💨 **What Does It Feel Like?** — Wind chill and humidity reality (crucial in maritime and coastal Atlantic climates where 11°C with 25 km/h gusts feels like 7°C).
3. 🌧️ **What Kind of Rain?** — Human classification scale, not just abstract millimeters:
   - 🌫️ *Fine Misting Drizzle ("Soft Day")* (<0.25 mm/hr)
   - 🌧️ *Steady Light Rain* (0.25–0.7 mm/hr)
   - 🌦️ *Moderate Rain Showers* (0.8–2.4 mm/hr)
   - ⛈️ *Heavy Downpours ("Lashing Rain")* (2.5–6.0 mm/hr)
   - 🌊 *Torrential Deluge / Cloudburst* (>6.0 mm/hr)
4. 🎯 **How Accurate Are You?** — Real-time reliability rating based on local ground truth audits.

---

## 🚀 Key Features

### 1. 8 World-Class Meteorological NWP Models (Side-by-Side)
- 🇬🇧 **UK Met Office** — High-resolution maritime front & Atlantic radar modeling (~10km).
- 🇳🇴 **MET Norway (Yr.no)** — World-standard Nordic & European coastal precipitation modeling (~2.5–10km).
- 🇪🇺 **ECMWF IFS** — European Centre for Medium-Range Weather Forecasts (global gold standard ~25km).
- 🇩🇪 **DWD ICON-EU** — German Weather Service high-resolution icosahedral grid (~7–13km).
- 🇫🇷 **Météo-France ARPEGE** — High-resolution European & Atlantic front tracking (~11km).
- 🇺🇸 **NOAA GFS** — US National Weather Service Global Forecast System (~13km).
- 🇨🇦 **GEM / CMC** — Environment Canada polar air-mass and arctic boundary modeling (~15km).
- 🇯🇵 **JMA GSM** — Japan Meteorological Agency Pacific & hemispheric modeling (~20km).

### 2. Continuous Multi-Day Hourly Matrix
- **Unbroken 192-Hour Timeline**: Explores past 2 days, today, and future 6 days in a seamless horizontal matrix.
- **Endless Horizontal Flow**: Scroll past 23:00 to glide continuously into tomorrow (00:00, 01:00, etc.) with in-flow, unclipped date headers (`📅 TODAY`, `📅 TOMORROW`, `Nov 22`, etc.).
- **Auto-Landing on Current Time (NOW)**: Automatically measures layout on page load and centers on the current hour column (`00:00 NOW`).
- **Touch & Seek Timeline Scrubber**: Tactile slider with instant quick-seek preset chips (`Current Time (NOW)`, `Yesterday Midday`, `Today 08:00`, `Today 14:00`, `Today 20:00`, `Tomorrow 09:00`, `+2 Days Midday`).
- **Rich 5-in-1 Hourly Cells**: Specific weather icon, condition badge, temperature, feels-like temperature, and precipitation chance + volume. Click any column for the **Hourly Model Showdown Modal**.

### 3. Interactive Synchronized Curve Chart
- Code-split, high-performance Recharts visualization for **Temperature**, **Rain Chance %**, **Precipitation Volume**, and **Wind Speed**.
- Synchronized crosshairs to inspect all 8 provider curves simultaneously at any hour.
- Filter and toggle individual models ON/OFF.

### 4. Accuracy Leaderboard & Truth Verification
- Live Podium (🥇 #1, 🥈 #2, 🥉 #3) ranking the most accurate models for the selected location (e.g. UK Met Office & MET Norway in Cork, Ireland).
- Detailed metrics: MAE, Bias, Rain Hit Rate, and False Alarm Rate.
- Expandable **Ground Truth Audit Log** comparing hour-by-hour forecasts against actual recorded readings.

### 5. What to Wear & Thermal Comfort Stylist Guide
- Multi-layer clothing recommendation engine (Outer, Mid/Base, Pants, Footwear & Accessories).
- "Sunny Deception" alert: accounts for low-angle winter glare requiring sunglasses while requiring a warm windproof coat for Atlantic wind chill.
- Mode switcher: *Everyday*, *Commute / Work*, and *Outdoor / Active*.

### 6. Zero API Keys Required
- Operates out-of-the-box using Open-Meteo's open meteorological data streams without registration or subscription. Custom API keys can optionally be entered for high-volume deployments.

---

## 🛠️ Quick Start

### 1. Requirements
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
git clone https://github.com/balubaburaj/weather-consensus.git
cd weather-consensus
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## ⚡ Performance Optimizations

- **Code-Splitting via `React.lazy` & `Suspense`**: Reduced initial JavaScript bundle from 785 kB to **334 kB** (**100 kB gzipped**), a 57.4% reduction in load weight.
- **Table Memoization**: The 1,728-cell matrix is wrapped in `React.memo`, isolating seek slider updates so dragging the scrubber updates only the preview chip without re-rendering the DOM table.
- **Zero Layout Thrashing**: Column offset caching and `requestAnimationFrame` eliminate synchronous DOM `offsetLeft` queries during scrolling, delivering silky 60/120fps scrolling.

---

## 📜 License

MIT License. Open source and free to use.
