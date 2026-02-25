# IntelMap Dashboard

A geospatial intelligence dashboard featuring real-time flight tracking.

## Legal and Safety

**IMPORTANT:** This application uses exclusively public data sources (OpenSky Network) and mock data. It does not perform any unauthorized surveillance, and no proprietary or classified data is used. The "classified" look and feel is strictly a UI theme.

## Architecture Overview

- **Frontend:** Vite, React, Tailwind CSS V4, MapLibre GL JS, Zustand, TanStack Query.
- **Backend:** Node.js (Express proxy for OpenSky with basic TTL caching).

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Environment Variables (optional, for OpenSky auth):
   Create a `.env` in the `/server` directory:
   ```ini
   # Recommended: OAuth2 Client Credentials Flow (new accounts)
   OPENSKY_CLIENT_ID=your_client_id
   OPENSKY_CLIENT_SECRET=your_client_secret
   
   # Legacy Basic Auth (for old accounts)
   OPENSKY_USERNAME=your_username
   OPENSKY_PASSWORD=your_password
   
   # Optional: save API credits by using a bounding box
   # OPENSKY_BBOX=lamin=45.8&lomin=5.9&lamax=47.8&lomax=10.5
   ```
   Create a `.env` in the `/client` directory:
   ```ini
   VITE_FLIGHT_PROVIDER=opensky # or "mock"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Mock Mode

To run entirely offline with no API keys, change your `.env` in the client directory to:
`VITE_FLIGHT_PROVIDER=mock`

Then restart the development server. The app will replay `flights_sample.json`.
