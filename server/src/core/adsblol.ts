import { AircraftState } from '../types/flights';
import { Cache } from './cache';
import { aircraftDb } from './aircraft_db';

const CACHE_TTL = 3000;
const adsblolCache = new Cache<AircraftState[]>(CACHE_TTL);

export async function fetchStates(): Promise<AircraftState[]> {
    const cached = adsblolCache.get();
    if (cached) return cached;

    const lat = process.env.ADSB_LOL_LAT || '51.5';
    const lon = process.env.ADSB_LOL_LON || '-0.12';
    const radius = process.env.ADSB_LOL_RADIUS || '250';

    const url = `https://api.adsb.lol/v2/point/${lat}/${lon}/${radius}`;

    const headers: Record<string, string> = {
        'User-Agent': 'IntelMap-Dev/1.0',
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            const staleCached = adsblolCache.get();
            if (staleCached && staleCached.length > 0) {
                console.warn(`[ADSB.lol API] ${response.status} ${response.statusText}. Using stale cache fallback.`);
                return staleCached;
            }
            throw new Error(`ADSB.lol API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const ac = data.ac || [];
        const nowSec = data.now !== undefined ? Math.floor(data.now / 1000) : Math.floor(Date.now() / 1000);

        const parsed: AircraftState[] = ac.map((s: any) => {
            const icao24 = String(s.hex || 'unknown').toLowerCase();
            const baseState: AircraftState = {
                icao24,
                callsign: s.flight ? s.flight.trim() : null,
                originCountry: null,
                lastContact: nowSec - (s.seen || 0),
                lon: typeof s.lon === 'number' ? s.lon : 0,
                lat: typeof s.lat === 'number' ? s.lat : 0,
                baroAltitude: typeof s.alt_baro === 'number' ? s.alt_baro : (s.alt_baro === 'ground' ? 0 : null),
                onGround: s.alt_baro === 'ground' || (typeof s.gs === 'number' && s.gs < 10 && typeof s.alt_baro === 'number' && s.alt_baro < 1000),
                velocity: typeof s.gs === 'number' ? s.gs : null,
                heading: typeof s.track === 'number' ? s.track : null,
                verticalRate: typeof s.baro_rate === 'number' ? s.baro_rate : null,
                geoAltitude: typeof s.alt_geom === 'number' ? s.alt_geom : null,
                squawk: s.squawk || null,
                spi: s.spi === 1,
                positionSource: 0,
                category: typeof s.category === 'string' ? parseInt(s.category.replace(/[^0-9]/g, '')) || 0 : 0,

                // Extended telemetry
                mach: typeof s.mach === 'number' ? s.mach : undefined,
                true_heading: typeof s.true_heading === 'number' ? s.true_heading : undefined,
                mag_heading: typeof s.mag_heading === 'number' ? s.mag_heading : undefined,
                oat: typeof s.oat === 'number' ? s.oat : undefined,
                tat: typeof s.tat === 'number' ? s.tat : undefined,
                roll: typeof s.roll === 'number' ? s.roll : undefined,
                ias: typeof s.ias === 'number' ? s.ias : undefined,
                tas: typeof s.tas === 'number' ? s.tas : undefined,
                wd: typeof s.wd === 'number' ? s.wd : undefined,
                ws: typeof s.ws === 'number' ? s.ws : undefined,
                nav_altitude_mcp: typeof s.nav_altitude_mcp === 'number' ? s.nav_altitude_mcp : undefined,
                nav_heading: typeof s.nav_heading === 'number' ? s.nav_heading : undefined,
                nav_qnh: typeof s.nav_qnh === 'number' ? s.nav_qnh : undefined,
                nav_modes: Array.isArray(s.nav_modes) ? s.nav_modes : undefined,
                rc: typeof s.rc === 'number' ? s.rc : undefined,
                rssi: typeof s.rssi === 'number' ? s.rssi : undefined,
                emergency: typeof s.emergency === 'string' && s.emergency !== 'none' ? s.emergency : undefined,
            };

            const details = aircraftDb.getDetails(icao24);
            if (details) {
                if (details.registration) baseState.registration = details.registration;
                if (details.manufacturerName) baseState.manufacturerName = details.manufacturerName;
                if (details.model) baseState.model = details.model;
                if (details.operator) baseState.operator = details.operator;
                if (details.typecode) baseState.typecode = details.typecode;
                if (details.built) baseState.built = details.built;
            } else if (s.r || s.t) {
                if (s.r) baseState.registration = s.r;
                if (s.t) baseState.typecode = s.t;
                if (s.desc) baseState.model = s.desc;
            }

            return baseState;
        }).filter((a: AircraftState) =>
            a.lat !== 0 && a.lon !== 0 &&
            a.lat != null && a.lon != null &&
            !Number.isNaN(a.lat) && !Number.isNaN(a.lon)
        );

        adsblolCache.set(parsed);
        return parsed;
    } catch (e: any) {
        throw e;
    }
}

export async function fetchTrack(icao24: string): Promise<any> {
    const url = `https://api.adsb.lol/v2/icao/${icao24}`;
    const headers: Record<string, string> = {
        'User-Agent': 'IntelMap-Dev/1.0',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`ADSB.lol Tracks API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const ac = data.ac || [];
    if (ac.length === 0) {
        throw new Error('404');
    }

    const s = ac[0];
    const time = data.now !== undefined ? Math.floor(data.now / 1000) : Math.floor(Date.now() / 1000);

    const path: any[] = [];

    // Attempt to get route start from routeset API to provide a "tail"
    if (s.flight && s.flight.trim() && s.lat !== undefined && s.lon !== undefined) {
        try {
            const callsign = s.flight.trim();
            const routeRes = await fetch('https://api.adsb.lol/api/0/routeset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': 'IntelMap-Dev/1.0' },
                body: JSON.stringify({ planes: [{ callsign, lat: s.lat, lng: s.lon }] })
            });

            if (routeRes.ok) {
                const routeData = await routeRes.json();
                if (Array.isArray(routeData) && routeData.length > 0) {
                    const planeRoute = routeData[0];
                    if (planeRoute._airports && planeRoute._airports.length > 0) {
                        const origin = planeRoute._airports[0];
                        path.push([
                            time - 3600, // dummy historical time 1 hour ago
                            origin.lat,
                            origin.lon,
                            (origin.alt_meters || 0) * 3.28084, // convert meters to ft
                            0, // track unknown at origin
                            true // on ground at origin
                        ]);
                    }
                }
            }
        } catch (e) {
            console.warn(`[ADSB.lol] Failed to fetch route for callsign ${s.flight}:`, e);
        }
    }

    // Add current position as the latest point (only if valid)
    if (s.lat != null && s.lon != null && !Number.isNaN(s.lat) && !Number.isNaN(s.lon)) {
        path.push([
            time,
            s.lat,
            s.lon,
            s.alt_baro === 'ground' ? 0 : s.alt_baro,
            s.track || 0,
            s.alt_baro === 'ground'
        ]);
    }

    if (path.length === 0) {
        throw new Error('404, no valid coordinates found');
    }

    return {
        icao24: icao24,
        startTime: path[0][0],
        endTime: path[path.length - 1][0],
        path: path
    };
}
