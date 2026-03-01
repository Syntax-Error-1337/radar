# INTELMAP — Geospatial Intelligence Dashboard

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs)
![MapLibre](https://img.shields.io/badge/MapLibre_GL_JS-5.x-396CB2?style=flat-square)

**A real-time geospatial intelligence dashboard for live flight and maritime vessel tracking, rendered on an interactive 3D globe.**

</div>

---

## ⚠️ Legal & Ethical Notice

This application uses **exclusively public data sources**:
- [ADSB.lol](https://adsb.lol) — community-fed ADS-B flight data (no auth required)
- [AISStream.io](https://aisstream.io) — public AIS maritime data over WebSocket

No proprietary, classified, or unauthorized surveillance data is used. The "intelligence" aesthetic is strictly a UI theme.

---

## ✨ Features

### 🛩️ Flight Tracking Module
- **Live aircraft positions** sourced from ADSB.lol, refreshed every 3 seconds
- **Rich telemetry panel** — altitude (baro/geo), speed, heading, vertical rate, squawk, Mach, IAS, TAS, roll, wind direction/speed, OAT/TAT, nav modes, RSSI
- **Aircraft database enrichment** — registration, manufacturer, model, operator, type code, year built (powered by DuckDB + Parquet DB)
- **Route history trail** — origin airport stub fetched from ADSB.lol routeset API
- **Configurable bounding box** — target a geographic region to reduce API load
- **On-ground / airborne** state detection with distinct visual treatment
- **Emergency squawk detection** (highlighted in UI)
- **Globe & Mercator projection** toggle in the top nav

### 🚢 Maritime Tracking Module
- **Live vessel positions** via a persistent WebSocket connection to `wss://stream.aisstream.io/v0/stream`
- **Full AIS message type support**: PositionReport, StandardClassB, ExtendedClassB, ShipStaticData, StaticDataReport, BaseStationReport, SAR Aircraft, AidsToNavigation, SafetyBroadcastMessage
- **Vessel detail panel** — MMSI, name, call sign, type, destination, SOG, COG, heading, navigational status
- **Route history trail** — last 150 position points per vessel, rendered as a line layer on the map
- **Stale vessel purging** — vessels not seen in 30 minutes are automatically removed from memory
- **Auto-reconnect** — WebSocket reconnects automatically on disconnect (5 s backoff)

### 🎨 Display Modes
Three visual themes selectable from the top navigation bar:

| Mode | Description |
|------|-------------|
| **EO** | Standard electro-optical — clean dark interface |
| **FLIR** | Forward-looking infrared — thermal color palette |
| **CRT** | Cathode-ray tube — retro phosphor green aesthetic |

---

## 🏗️ Architecture

```
intelligence-dashboard/
├── client/          # React 19 + Vite frontend (port 5173)
│   └── src/
│       ├── modules/
│       │   ├── flights/     # ADS-B flight tracking module
│       │   └── maritime/    # AIS vessel tracking module
│       ├── ui/
│       │   ├── layout/      # TopNav, shell components
│       │   └── theme/       # EO / FLIR / CRT theme store
│       ├── core/            # Shared providers, query client
│       └── utils/
└── server/          # Express.js backend proxy (port 3001)
    └── src/
        ├── core/
        │   ├── adsblol.ts       # ADSB.lol REST poller + cache
        │   ├── aisstream.ts     # AISStream WebSocket singleton
        │   ├── aircraft_db.ts   # DuckDB/Parquet aircraft database
        │   └── cache.ts         # TTL cache utility
        ├── routes/
        │   ├── flights.ts       # GET /api/flights/states, /track/:icao24
        │   └── maritime.ts      # GET /api/maritime/snapshot
        └── types/
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + Vite 7 + TypeScript 5.9 |
| Map rendering | MapLibre GL JS 5 via react-map-gl 8 |
| State management | Zustand 5 |
| Data fetching | TanStack Query v5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Backend runtime | Node.js + Express 4 |
| Aircraft database | DuckDB + Parquet |
| Maritime stream | WebSocket (`ws` library) |
| Build tooling | `concurrently` (monorepo dev runner) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or later
- **npm** v9 or later

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both `client` and `server` workspaces in one step.

### 2. Configure Environment Variables

#### Server — `server/.env`

```ini
# --- Flights: ADSB.lol (no API key required) ---
FLIGHT_DATA_SOURCE=adsblol

# Geographic center for the radial query
ADSB_LOL_LAT=0
ADSB_LOL_LON=0
ADSB_LOL_RADIUS=25000      # Radius in nautical miles (max ~25000 for global)

# --- Maritime: AISStream.io (free account required) ---
# Get your key at https://aisstream.io
AISSTREAM_API_KEY=your_api_key_here

# --- Optional: OpenSky fallback ---
# OPENSKY_CLIENT_ID=your_client_id
# OPENSKY_CLIENT_SECRET=your_client_secret
```

#### Client — `client/.env`

```ini
# Which flight data provider the frontend targets
# Options: "adsblol" | "opensky" | "mock"
VITE_FLIGHT_PROVIDER=adsblol
```

### 3. Run the Development Server

```bash
npm run dev
```

This concurrently starts:
- **Frontend** → [http://localhost:5173](http://localhost:5173)
- **Backend proxy** → [http://localhost:3001](http://localhost:3001)
- **Health check** → [http://localhost:3001/health](http://localhost:3001/health)

---

## 🌐 API Reference

All routes are served by the Express backend on port `3001`.

### Flights

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flights/states` | Returns all currently tracked aircraft as `AircraftState[]` |
| `GET` | `/api/flights/track/:icao24` | Returns the route path for a specific aircraft by ICAO24 hex |

### Maritime

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/maritime/snapshot` | Returns all live vessels as `VesselState[]`, including position history |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Returns `{ status: "ok" }` |

---

## 🔌 Data Sources

### ADSB.lol (Flights)
- **URL**: `https://api.adsb.lol/v2/point/{lat}/{lon}/{radius}`
- **Auth**: None required — community-operated, free to use
- **Polling interval**: 3-second TTL cache on the backend
- **Enrichment**: Aircraft registration/model data is joined from a local DuckDB/Parquet database at server startup

### AISStream.io (Maritime)
- **URL**: `wss://stream.aisstream.io/v0/stream`
- **Auth**: API key required (free tier available at [aisstream.io](https://aisstream.io))
- **Coverage**: Global bounding box `[[-90, -180], [90, 180]]`
- **Memory management**: Up to 150 history points per vessel; stale vessels purged every 5 minutes after 30 minutes of inactivity

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run install:all` | Install all workspace dependencies |
| `npm run build` (in `client/`) | Build the production frontend bundle |
| `npm run build` (in `server/`) | Compile TypeScript to `server/dist/` |
| `npm run start` (in `server/`) | Run the compiled production server |
| `npm run lint` (in `client/`) | Run ESLint on the frontend codebase |

---

## 🗺️ Map Projections

Toggle between two rendering modes from the **VIEW** button in the top navigation bar:

- **Mercator** — standard flat 2D map projection, ideal for detailed regional views
- **Globe** — 3D spherical projection powered by MapLibre GL JS, ideal for global situational awareness

---

## 🧪 Offline / Mock Mode

To run the flight tracking module without any API dependencies:

1. Edit `client/.env`:
   ```ini
   VITE_FLIGHT_PROVIDER=mock
   ```
2. Restart the dev server. The app will replay the bundled `flights_sample.json` fixture.

Maritime tracking requires a live AISStream connection and has no offline mock at this time.

---

## 📁 Project Structure (Detailed)

```
client/src/
├── modules/
│   ├── flights/
│   │   ├── FlightsPage.tsx          # Root page component
│   │   ├── components/              # Map layers, sidebars, toolbars
│   │   ├── hooks/                   # useFlights, useSelectedFlight, etc.
│   │   ├── lib/                     # Data adapters, type guards
│   │   └── state/                   # Zustand flight store
│   └── maritime/
│       ├── MaritimePage.tsx         # Root page component
│       ├── components/              # Vessel layers, right drawer
│       ├── hooks/                   # useVessels, useVesselSelection, etc.
│       ├── lib/                     # AIS data adapters
│       └── state/                   # Zustand maritime store
└── ui/
    ├── layout/
    │   └── TopNav.tsx               # Global navigation bar
    └── theme/
        └── theme.store.ts           # EO/FLIR/CRT mode + map projection state

server/src/
├── core/
│   ├── source/
│   │   ├── adsblol.ts        # ADSB.lol polling + 3s TTL cache
│   │   ├── aisstream.ts      # AISStream WebSocket service (singleton)
│   │   └── opensky.ts        # OpenSky fallback logic
│   ├── aircraft_db.ts    # DuckDB Parquet loader + ICAO24 lookup
│   └── cache.ts          # Generic TTL cache
├── routes/
│   ├── flights.ts        # /api/flights/* route handlers
│   └── maritime.ts       # /api/maritime/* route handlers
├── types/
│   └── flights.ts        # AircraftState, extended telemetry types
└── index.ts              # App entry point
```
