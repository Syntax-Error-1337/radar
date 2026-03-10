# INTELMAP — Geospatial Intelligence Platform

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)
![MapLibre](https://img.shields.io/badge/MapLibre_GL_JS-5.x-396CB2?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

**A real-time geospatial intelligence platform for tracking aircraft, maritime vessels, GPS interference, conflict zones, and active threat alerts.**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API](#-api-reference) • [Contributing](CONTRIBUTING.md)

</div>

---

## Overview

**INTELMAP** is a full-stack geospatial intelligence dashboard that aggregates real-time data from multiple sources to provide comprehensive situational awareness across six intelligence domains:

- **✈️ Flight Tracking** — Live aircraft positions via ADS-B data
- **🚢 Maritime Tracking** — Global vessel tracking via AIS streams
- **🛡️ Cyber Intelligence** — Internet security metrics via Cloudflare Radar
- **🌍 OSINT Monitor** — Geo-located news feeds and AI-powered intelligence briefs
- **📡 GPS Jamming** — Global GPS interference heatmap using H3 hex cells
- **🚨 Threat Alerts** — Live rocket/UAV alerts (Israel) and UAE regional threat alerts (GulfWatch)

Built with React 19, TypeScript, Express.js, and MapLibre GL JS — delivering a high-performance, military-styled interface with three visual modes (EO/FLIR/CRT).

---

## ✨ Features

### ✈️ Flight Tracking Module

- **Live ADS-B data** from ADSB.lol (community-fed, no auth required) or OpenSky Network
- **Rich telemetry** — altitude (barometric/geometric), speed, heading, vertical rate, squawk codes, Mach, IAS, TAS, roll angle, wind speed/direction, OAT/TAT, navigation modes, RSSI
- **Aircraft enrichment** — registration, manufacturer, model, operator, type code, year built (DuckDB + Parquet database)
- **Route history visualization** with origin airport data
- **Geographic filtering** via configurable bounding box
- **On-ground/airborne detection** with visual distinction
- **Emergency squawk highlighting** (7500, 7600, 7700)
- **Globe & Mercator projections** — toggle between 3D and flat views

### 🚢 Maritime Tracking Module

- **Live AIS streams** via persistent WebSocket to `wss://stream.aisstream.io`
- **Full AIS message support** — Position Reports (Class A/B), Ship Static Data, Base Station Reports, SAR Aircraft, Aids to Navigation, Safety Broadcasts
- **Vessel details** — MMSI, name, call sign, ship type, destination, SOG, COG, heading, navigational status
- **Historical trail rendering** — last 150 position points per vessel
- **Stale vessel purging** — automatic cleanup after 30 minutes of inactivity
- **Auto-reconnect** — 5-second backoff on WebSocket disconnect
- **Status endpoint** — live connection health, vessel count, message stats

### 📡 GPS Jamming Module

- **Global interference heatmap** using H3 resolution-4 hex cells
- **Daily datasets** auto-downloaded from GPSJam.org (local CSV cache)
- **Interference ratio visualization** — good vs. bad aircraft signal counts per cell
- **Date selector** — browse historical datasets going back weeks
- **Auto-backfill** — server downloads missing daily datasets on startup
- **Stats endpoint** — per-date summary (total cells, suspect flag, high-interference cell count)

### 🚨 Threat Alerts — OSINT Monitor Module

A live threat monitoring dashboard with four real-time intelligence panels:

#### GPS Jamming Widget

- Real-time interference stats from latest dataset
- High-interference cell count and coverage area

#### Rocket Alert Widget (Israel)

- **Source**: `agg.rocketalert.live` — live rocket and UAV alert bursts
- Shows active areas, alert type (rocket vs. UAV), countdown seconds, Hebrew and English names
- **Map layer**: Circle markers positioned by alert coordinates, colored red (rocket) / orange (UAV)
- Click any marker for full popup: EN/HE names, area, countdown, coordinates, timestamp
- 24-hour totals and 7-day daily trend chart

#### GulfWatch Widget (UAE)

- **Source**: `gulfwatch-api.onrender.com` — regional threat alerts for UAE emirates
- Shows active emirate, alert type, severity (warning/watch), description, start/expiry time
- **Map layer**: Emirate polygon fills + centroid markers; colored by severity
- Click any polygon or marker for full popup: EN/AR names, description, severity, source count, timeline

#### AI Insights Panel

- **LLM-powered intelligence briefs** via OpenRouter API
- Generates military-styled summaries from intercepted news headlines
- Regional context-aware analysis using Google Gemini 2.5 Flash

#### Live News Panel

- **Geo-located RSS feeds** from a 56,000+ line database (190+ countries)
- Fetches region-specific news (geopolitical, defense, local sources)
- Falls back to international feeds (Reuters, AP, BBC) if no local match

### 🛡️ Cyber Intelligence Module

Powered by **Cloudflare Radar API**:

- **DDoS attack origins** — top countries launching Layer 7 attacks
- **Traffic anomalies** — internet routing anomalies and BGP events
- **Top domains** — most popular websites by traffic
- **Attack vectors** — HTTP method distributions, bot classifications
- **ASN rankings** — autonomous system activity
- **Time-series visualization** — interactive charts and heatmaps

### 🎨 Display Modes

Three visual themes selectable from the navigation bar:

| Mode     | Description                                       |
| -------- | ------------------------------------------------- |
| **EO**   | Electro-optical — clean dark interface (default)  |
| **FLIR** | Forward-looking infrared — thermal color palette  |
| **CRT**  | Cathode-ray tube — retro phosphor green aesthetic |

---

## 🏗️ Architecture

### Project Structure

```
intelmap/
├── client/               # React 19 + Vite frontend (port 5173)
│   └── src/
│       ├── app/          # Entry point, routes, providers
│       ├── modules/
│       │   ├── flights/        # ADS-B aircraft tracking
│       │   ├── maritime/       # AIS vessel tracking
│       │   ├── monitor/        # OSINT + threat alert hub
│       │   │   ├── components/ # Map layers & widgets
│       │   │   │   ├── GPSJammingLayer.tsx
│       │   │   │   ├── RocketAlertLayer.tsx
│       │   │   │   ├── GulfWatchLayer.tsx
│       │   │   │   ├── layerIds.ts        # shared layer ID constants
│       │   │   │   └── widgets/           # dashboard panel components
│       │   │   └── hooks/      # React Query data hooks
│       │   ├── cyber/          # Cloudflare Radar integration
│       │   └── osint/          # Shared OSINT components
│       ├── ui/
│       │   ├── layout/         # TopNav, shell components
│       │   └── theme/          # EO/FLIR/CRT mode + projection state
│       └── core/               # Query client, providers
│
└── server/               # Express.js backend (port 3001)
    └── src/
        ├── core/
        │   ├── source/
        │   │   ├── adsblol.ts       # ADSB.lol polling + cache
        │   │   ├── opensky.ts       # OpenSky fallback
        │   │   ├── aisstream.ts     # AISStream WebSocket singleton
        │   │   ├── cloudflare.ts    # Cloudflare Radar API client
        │   │   ├── gpsjam.ts        # GPSJam CSV ingestion + H3 query
        │   │   ├── rocketalert.ts   # Rocket/UAV alert polling
        │   │   └── gulfwatch.ts     # UAE GulfWatch alert polling
        │   ├── aircraft_db.ts       # DuckDB/Parquet aircraft enrichment
        │   ├── scheduler.ts         # Cron-like job runner for data ingestion
        │   └── cache.ts             # TTL cache utility
        ├── routes/
        │   ├── flights.ts           # GET /api/flights/*
        │   ├── maritime.ts          # GET /api/maritime/*
        │   ├── monitor.ts           # GET /api/monitor/* (GPS jamming, alerts)
        │   ├── geo.ts               # GET /api/geo/* (news, intel briefs)
        │   └── cyber.ts             # GET /api/cyber/* (Cloudflare proxy)
        ├── Data/
        │   └── gpsjam/              # Daily GPS interference CSVs + manifest
        ├── types/                   # TypeScript definitions
        ├── news_feeds.json          # 56k+ line RSS database (190+ countries)
        └── index.ts                 # Server entry point + scheduler bootstrap
```

### Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| Frontend framework | React 19 + Vite 7 + TypeScript 5.9   |
| Map rendering      | MapLibre GL JS 5 via react-map-gl 8  |
| State management   | Zustand 5                            |
| Data fetching      | TanStack Query v5                    |
| Styling            | Tailwind CSS v4                      |
| Icons              | Lucide React                         |
| Backend runtime    | Node.js 20 + Express 4               |
| Aircraft database  | DuckDB + Parquet                     |
| Maritime stream    | WebSocket (`ws` library)             |
| H3 spatial index   | H3-js (Uber H3 hex grid)             |
| RSS parsing        | rss-parser                           |
| Geolocation        | which-country + i18n-iso-countries   |
| Build tooling      | `concurrently` (monorepo dev runner) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20 or later
- **npm** v9 or later

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both `client` and `server` workspaces.

### 2. Configure Environment Variables

#### Server — `server/.env`

```bash
cp server/.env.example server/.env
nano server/.env
```

**Required API Keys:**

| Service          | Variable                 | Where to get                 | Cost          |
| ---------------- | ------------------------ | ---------------------------- | ------------- |
| AISStream        | `AISSTREAM_API_KEY`      | https://aisstream.io         | Free tier     |
| OpenRouter (LLM) | `OPENROUTER_API_KEY`     | https://openrouter.ai/keys   | Pay as you go |
| Cloudflare Radar | `CLOUDFLARE_RADAR_TOKEN` | https://dash.cloudflare.com/ | Free          |

**Optional:**

```ini
# Flight data source (default: adsblol — no key required)
FLIGHT_DATA_SOURCE=adsblol

# Geographic center for ADSB.lol queries
ADSB_LOL_LAT=0
ADSB_LOL_LON=0
ADSB_LOL_RADIUS=25000  # nautical miles (25000 ≈ global)

# OpenSky fallback (optional, requires account)
# OPENSKY_CLIENT_ID=your_email@example.com
# OPENSKY_CLIENT_SECRET=your_secret_here
```

> **Note:** GPS jamming data is fetched automatically from GPSJam.org — no API key required.
> Rocket alerts and GulfWatch alerts are fetched from public endpoints — no key required.

#### Client — `client/.env`

```bash
cp client/.env.example client/.env
```

```ini
# Flight data provider: "adsblol" | "opensky" | "mock"
VITE_FLIGHT_PROVIDER=adsblol
```

### 3. Run Development Server

```bash
npm run dev
```

This starts:

- **Frontend** → http://localhost:5173
- **Backend** → http://localhost:3001
- **Health check** → http://localhost:3001/health

---

## 🌐 API Reference

All routes served by Express backend on port `3001`.

### Flights

| Method | Endpoint                     | Description                                    |
| ------ | ---------------------------- | ---------------------------------------------- |
| `GET`  | `/api/flights/states`        | All tracked aircraft as `AircraftState[]`      |
| `GET`  | `/api/flights/track/:icao24` | Route path for specific aircraft by ICAO24 hex |

### Maritime

| Method | Endpoint                     | Description                                     |
| ------ | ---------------------------- | ----------------------------------------------- |
| `GET`  | `/api/maritime/snapshot`     | All live vessels (position/heading, no history) |
| `GET`  | `/api/maritime/vessel/:mmsi` | Full vessel detail including position history   |
| `GET`  | `/api/maritime/status`       | WebSocket health, vessel count, message stats   |

### Monitor — GPS Jamming

| Method | Endpoint                            | Description                                                   |
| ------ | ----------------------------------- | ------------------------------------------------------------- |
| `GET`  | `/api/monitor/gps-jamming`          | H3 interference cells (`?date=`, `?minInterference=`, `?h3=`) |
| `GET`  | `/api/monitor/gps-jamming/dates`    | Available dataset dates                                       |
| `GET`  | `/api/monitor/gps-jamming/stats`    | Per-date interference statistics (`?date=`)                   |
| `POST` | `/api/monitor/gps-jamming/backfill` | Manually trigger dataset backfill (`{limit?}`)                |

### Monitor — Rocket Alerts

| Method | Endpoint                             | Description                                         |
| ------ | ------------------------------------ | --------------------------------------------------- |
| `GET`  | `/api/monitor/rocket-alerts`         | Live burst summary + 24h total + 7-day daily counts |
| `GET`  | `/api/monitor/rocket-alerts/history` | Per-alert records (`?hours=24&alertTypeId=-1`)      |
| `GET`  | `/api/monitor/rocket-alerts/daily`   | Per-day counts (`?days=7&alertTypeId=-1`)           |

### Monitor — GulfWatch (UAE)

| Method | Endpoint                                 | Description                          |
| ------ | ---------------------------------------- | ------------------------------------ |
| `GET`  | `/api/monitor/gulf-watch/alerts`         | Active UAE threat alert summary      |
| `GET`  | `/api/monitor/gulf-watch/alerts/history` | Alert history (`?limit=50&offset=0`) |
| `GET`  | `/api/monitor/gulf-watch/geojson`        | UAE emirates GeoJSON (1-hour cache)  |

### Geo (OSINT)

| Method | Endpoint               | Description                                                         |
| ------ | ---------------------- | ------------------------------------------------------------------- |
| `GET`  | `/api/geo/news`        | Geo-located RSS news feeds (`?lat=&lon=&category=`)                 |
| `POST` | `/api/geo/intel-brief` | LLM intelligence brief from news headlines (`{news: [], lat, lon}`) |

### Cyber

| Method | Endpoint             | Description                                                            |
| ------ | -------------------- | ---------------------------------------------------------------------- |
| `GET`  | `/api/cyber/radar/*` | Proxy for Cloudflare Radar API (e.g., `/attacks/layer7/top/locations`) |

### System

| Method | Endpoint  | Description                |
| ------ | --------- | -------------------------- |
| `GET`  | `/health` | Returns `{ status: "ok" }` |

---

## 🔌 Data Sources

### ADSB.lol (Flights)

- **URL**: `https://api.adsb.lol/v2/point/{lat}/{lon}/{radius}`
- **Auth**: None required (community-operated, free)
- **Polling**: 3-second TTL cache on backend

### AISStream.io (Maritime)

- **URL**: `wss://stream.aisstream.io/v0/stream`
- **Auth**: API key required (free tier)
- **Coverage**: Global bounding box `[[-90, -180], [90, 180]]`
- **Memory**: Up to 150 history points per vessel; stale vessels purged after 30 min

### GPSJam.org (GPS Jamming)

- **URL**: `https://gpsjam.org/data/{date}-h3_4.csv`
- **Auth**: None required (public dataset)
- **Format**: CSV with H3 hex index, good/bad aircraft counts per cell
- **Schedule**: New dataset auto-downloaded daily via server scheduler

### Rocket Alert Live (Threat Alerts — Israel)

- **URL**: `https://agg.rocketalert.live/api/v1/`
- **Auth**: None required (public API)
- **Data**: Live rocket and UAV alert bursts with coordinates, Hebrew/English names, countdown

### GulfWatch (Threat Alerts — UAE)

- **Alerts API**: `https://gulfwatch-api.onrender.com/api`
- **GeoJSON**: `https://gulfwatch.ai/data/uae-emirates.geojson`
- **Auth**: None required
- **Data**: Active emirate-level threat alerts with severity, type, description

### Cloudflare Radar (Cyber)

- **URL**: `https://api.cloudflare.com/client/v4/radar/*`
- **Auth**: Bearer token (free)
- **Endpoints**: 50+ metrics (DDoS, BGP, DNS, HTTP, email security)

### RSS News Feeds (OSINT)

- **Source**: `server/src/news_feeds.json` (56,934 lines)
- **Coverage**: 190+ countries, categorized by defense, geopolitical, economic, local
- **Fallback**: Reuters, AP, BBC for uncovered regions

---

## 🐳 Docker Deployment

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
npm run docker:compose:build
```

```yaml
services:
  intelmap:
    build: .
    ports:
      - '3001:3001'
    env_file:
      - ./server/.env
    restart: unless-stopped
```

---

## 🛠️ Available Scripts

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `npm run dev`            | Start both client and server in development mode |
| `npm run install:all`    | Install all workspace dependencies               |
| `npm run build`          | Build production bundles (client + server)       |
| `npm run build:client`   | Build frontend only                              |
| `npm run build:server`   | Build backend only                               |
| `npm run start`          | Run production server (after building)           |
| `npm run lint`           | Run ESLint on client                             |
| `npm run format`         | Format all files with Prettier                   |
| `npm run type-check`     | Run TypeScript type checking (no emit)           |
| `npm run docker:build`   | Build Docker image                               |
| `npm run docker:compose` | Start with docker-compose                        |

---

## 📁 Key Files

| File                         | Description                             |
| ---------------------------- | --------------------------------------- |
| `package.json`               | Monorepo workspace configuration        |
| `client/.env.example`        | Frontend environment template           |
| `server/.env.example`        | Backend environment template            |
| `server/src/news_feeds.json` | 56k+ line RSS database (190+ countries) |
| `server/src/Data/gpsjam/`    | Daily GPS interference CSV datasets     |
| `Dockerfile`                 | Multi-stage production build            |
| `docker-compose.yml`         | Orchestration config                    |

---

## 🧪 Mock/Offline Mode

To run the flight module without API dependencies:

1. Edit `client/.env`:
   ```ini
   VITE_FLIGHT_PROVIDER=mock
   ```
2. Restart dev server. Uses bundled `flights_sample.json` fixture.

**Note:** Maritime, GPS jamming, alert, and cyber modules require live API connections.

---

## 🗺️ Map Projections

Toggle between two rendering modes via the **VIEW** button:

- **Mercator** — Standard flat 2D projection (best for regional detail)
- **Globe** — 3D spherical projection (best for global awareness)

---

## 🔒 Security Notes

- **Never commit `.env` files** — use `.env.example` templates only
- **All secrets are server-side** — the frontend receives pre-processed data only
- **CORS**: Currently permissive for development; restrict in production
- **Rate limiting**: Not yet implemented; add middleware before public deployment
- **Rotate keys immediately** if you accidentally expose them in git history

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick checklist:**

- Fork the repo
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Commit changes (`git commit -m 'feat: add amazing feature'`)
- Push to branch (`git push origin feature/amazing-feature`)
- Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **ADSB.lol** — Community-fed ADS-B network
- **AISStream.io** — Free maritime AIS WebSocket API
- **GPSJam.org** — Open GPS interference dataset
- **Rocket Alert Live** — Real-time Israeli alert API
- **GulfWatch** — UAE regional threat monitoring
- **Cloudflare Radar** — Internet security metrics
- **MapLibre GL JS** — Open-source map rendering

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Syntax-Error-1337/INTELMAP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Syntax-Error-1337/INTELMAP/discussions)

---

<div align="center">

**Built for the open-source OSINT community**

[⬆ Back to top](#intelmap--geospatial-intelligence-platform)

</div>
