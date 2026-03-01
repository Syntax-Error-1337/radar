import { Router } from 'express';
import { fetchStates as fetchOpenSkyStates, fetchTrack as fetchOpenSkyTrack } from '../core/opensky';
import { fetchStates as fetchAdsbLolStates, fetchTrack as fetchAdsbLolTrack } from '../core/adsblol';

const router = Router();

// Simple in-memory TTL cache for the snapshot endpoint.
// OpenSky anonymous rate limit is 10 req / 10 s; the client polls every 5 s,
// so without caching multiple browser tabs will quickly exhaust the quota.
let snapshotCache: { data: object; ts: number } | null = null;
const SNAPSHOT_TTL_MS = 5_000;

router.get('/snapshot', async (req, res) => {
    const now = Date.now();
    if (snapshotCache && now - snapshotCache.ts < SNAPSHOT_TTL_MS) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(snapshotCache.data);
    }

    try {
        const useAdsbLol = process.env.FLIGHT_DATA_SOURCE === 'adsblol';
        const fetchStates = useAdsbLol ? fetchAdsbLolStates : fetchOpenSkyStates;

        const states = await fetchStates();
        const payload = { states, timestamp: now };
        snapshotCache = { data: payload, ts: now };
        res.setHeader('X-Cache', 'MISS');
        res.json(payload);
    } catch (error: any) {
        console.warn(`[API Failed] ${error.message} - Serving Mock Fallback Data`);

        // Generate a deterministic mock dataset based on current time
        // This ensures the dashboard always has moving planes to show
        const fallbackStates = Array.from({ length: 400 }).map((_, i) => {
            // Seed random values to create spread out flights over Europe
            const seed = i * 1.6180339887;
            const speed = 150 + (seed % 100);

            // Generate a moving coordinate (cycles smoothly over hours)
            const timeOffset = Date.now() / 1000;
            const latMove = Math.sin(timeOffset * 0.001 + seed) * 5;
            const lonMove = Math.cos(timeOffset * 0.001 + seed) * 5;

            const baseLat = 45 + (seed % 20); // 45 to 65 (Europe)
            const baseLon = -10 + (seed % 40); // -10 to 30

            // Calculate a plausible heading based on movement vector
            const nextLatMove = Math.sin((timeOffset + 1) * 0.001 + seed) * 5;
            const nextLonMove = Math.cos((timeOffset + 1) * 0.001 + seed) * 5;
            let heading = Math.atan2(nextLonMove - lonMove, nextLatMove - latMove) * (180 / Math.PI);
            if (heading < 0) heading += 360;

            return {
                icao24: `mock${i.toString(16).padStart(4, '0')}`,
                callsign: `FLT${1000 + i}`,
                originCountry: 'Mockland',
                lastContact: Math.floor(now / 1000),
                lat: baseLat + latMove,
                lon: baseLon + lonMove,
                baroAltitude: 5000 + (seed % 30000),
                geoAltitude: 5000 + (seed % 30000),
                onGround: false,
                velocity: speed,
                heading: heading,
                verticalRate: 0,
                squawk: null,
                spi: false,
                positionSource: 0,
                category: 1
            };
        });

        const payload = { states: fallbackStates, timestamp: now };

        // Brief 5-second cache for the fallback too
        snapshotCache = { data: payload, ts: now };
        res.setHeader('X-Cache', 'FALLBACK');
        res.json(payload);
    }
});

router.get('/track/:icao24', async (req, res) => {
    try {
        const useAdsbLol = process.env.FLIGHT_DATA_SOURCE === 'adsblol';
        const fetchTrack = useAdsbLol ? fetchAdsbLolTrack : fetchOpenSkyTrack;

        const track = await fetchTrack(req.params.icao24);
        res.json(track);
    } catch (error: any) {
        console.error('Track error:', error.message);
        if (error.message.includes('404')) {
            return res.status(404).json({ error: 'Not Found' });
        }
        res.status(502).json({ error: 'Upstream Provider Error', details: error.message });
    }
});

export default router;
