import { AircraftState } from '../../types/flights';
import { Cache } from '../cache';
import { aircraftDb } from '../aircraft_db';

const CACHE_TTL = 3000;
const openskyCache = new Cache<AircraftState[]>(CACHE_TTL);

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string | null> {
    if (!process.env.OPENSKY_CLIENT_ID || !process.env.OPENSKY_CLIENT_SECRET) {
        return null;
    }

    if (cachedAccessToken && Date.now() < tokenExpiresAt) {
        return cachedAccessToken;
    }

    const authUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.OPENSKY_CLIENT_ID);
    params.append('client_secret', process.env.OPENSKY_CLIENT_SECRET);

    try {
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            console.error(`OpenSky Auth Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        cachedAccessToken = data.access_token;
        // Expire token slightly before its actual expiration (usually expires in 1800s)
        tokenExpiresAt = Date.now() + ((data.expires_in || 1800) - 60) * 1000;
        return cachedAccessToken;
    } catch (err) {
        console.error('Failed to retrieve OpenSky access token:', err);
        return null;
    }
}

export async function fetchStates(): Promise<AircraftState[]> {
    const cached = openskyCache.get();
    if (cached) return cached;

    let url = 'https://opensky-network.org/api/states/all';
    if (process.env.OPENSKY_BBOX) {
        url += `?${process.env.OPENSKY_BBOX}`;
    }

    const headers: Record<string, string> = {
        'User-Agent': 'IntelMap-Dev/1.0',
    };

    const accessToken = await getAccessToken();

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
        const auth = Buffer.from(`${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        // If we hit a rate limit (429) or server error, but we have ANY old data cached,
        // return the stale data instead of breaking the app.
        const staleCached = openskyCache.get();
        if (staleCached && staleCached.length > 0) {
            console.warn(`[OpenSky API] ${response.status} ${response.statusText}. Using stale cache fallback.`);
            return staleCached;
        }
        throw new Error(`OpenSky API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const states = data.states || [];

    const parsed: AircraftState[] = states.map((s: any) => {
        const icao24 = String(s[0] || 'unknown').toLowerCase();
        const baseState: AircraftState = {
            icao24,
            callsign: s[1] ? s[1].trim() : null,
            originCountry: s[2] || null,
            lastContact: s[4] || s[3] || 0,
            lon: typeof s[5] === 'number' ? s[5] : 0,
            lat: typeof s[6] === 'number' ? s[6] : 0,
            baroAltitude: typeof s[7] === 'number' ? s[7] : null,
            onGround: !!s[8],
            velocity: typeof s[9] === 'number' ? s[9] : null,
            heading: typeof s[10] === 'number' ? s[10] : null,
            verticalRate: typeof s[11] === 'number' ? s[11] : null,
            geoAltitude: typeof s[13] === 'number' ? s[13] : null,
            squawk: s[14] || null,
            spi: !!s[15],
            positionSource: typeof s[16] === 'number' ? s[16] : 0,
            category: typeof s[17] === 'number' ? s[17] : 0,
        };

        const details = aircraftDb.getDetails(icao24);
        if (details) {
            if (details.registration) baseState.registration = details.registration;
            if (details.manufacturerName) baseState.manufacturerName = details.manufacturerName;
            if (details.model) baseState.model = details.model;
            if (details.operator) baseState.operator = details.operator;
            if (details.typecode) baseState.typecode = details.typecode;
            if (details.built) baseState.built = details.built;
        }

        return baseState;
    }).filter((a: AircraftState) => a.lat !== 0 && a.lon !== 0);

    openskyCache.set(parsed);
    return parsed;
}

export async function fetchTrack(icao24: string): Promise<any> {
    const url = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`;
    const headers: Record<string, string> = {
        'User-Agent': 'IntelMap-Dev/1.0',
    };

    const accessToken = await getAccessToken();

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
        const auth = Buffer.from(`${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`OpenSky Tracks API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
