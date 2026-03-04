import { Router } from 'express';
// We import flight data sources here because the StrategicPosturePanel 
// (via the GET /api/monitor/posture endpoint) tracks military aircraft 
// (e.g., bombers, tankers, AWACS) to assess military alert levels globally.
import { fetchStates as fetchOpenSkyStates } from '../core/source/opensky';
import { fetchStates as fetchAdsbLolStates } from '../core/source/adsblol';
import { fetchAcledCached, AcledRawEvent } from '../core/source/acled';
import { aircraftDb } from '../core/aircraft_db';

const router = Router();

// ========================================================================
// CIA & Posture Configs
// ========================================================================

const TIER1_COUNTRIES: Record<string, string> = {
    US: 'United States', RU: 'Russia', CN: 'China', UA: 'Ukraine', IR: 'Iran',
    IL: 'Israel', TW: 'Taiwan', KP: 'North Korea', SA: 'Saudi Arabia', TR: 'Turkey',
    PL: 'Poland', DE: 'Germany', FR: 'France', GB: 'United Kingdom', IN: 'India',
    PK: 'Pakistan', SY: 'Syria', YE: 'Yemen', MM: 'Myanmar', VE: 'Venezuela',
};

const BASELINE_RISK: Record<string, number> = {
    US: 5, RU: 35, CN: 25, UA: 50, IR: 40, IL: 45, TW: 30, KP: 45,
    SA: 20, TR: 25, PL: 10, DE: 5, FR: 10, GB: 5, IN: 20, PK: 35,
    SY: 50, YE: 50, MM: 45, VE: 40,
};

const EVENT_MULTIPLIER: Record<string, number> = {
    US: 0.3, RU: 2.0, CN: 2.5, UA: 0.8, IR: 2.0, IL: 0.7, TW: 1.5, KP: 3.0,
    SA: 2.0, TR: 1.2, PL: 0.8, DE: 0.5, FR: 0.6, GB: 0.5, IN: 0.8, PK: 1.5,
    SY: 0.7, YE: 0.7, MM: 1.8, VE: 1.8,
};

const COUNTRY_KEYWORDS: Record<string, string[]> = {
    US: ['united states', 'usa', 'america', 'washington', 'biden', 'trump', 'pentagon'],
    RU: ['russia', 'moscow', 'kremlin', 'putin'],
    CN: ['china', 'beijing', 'xi jinping', 'prc'],
    UA: ['ukraine', 'kyiv', 'zelensky', 'donbas'],
    IR: ['iran', 'tehran', 'khamenei', 'irgc'],
    IL: ['israel', 'tel aviv', 'netanyahu', 'idf', 'gaza'],
    TW: ['taiwan', 'taipei'],
    KP: ['north korea', 'pyongyang', 'kim jong'],
    SA: ['saudi arabia', 'riyadh'],
    TR: ['turkey', 'ankara', 'erdogan'],
    PL: ['poland', 'warsaw'],
    DE: ['germany', 'berlin'],
    FR: ['france', 'paris', 'macron'],
    GB: ['britain', 'uk', 'london'],
    IN: ['india', 'delhi', 'modi'],
    PK: ['pakistan', 'islamabad'],
    SY: ['syria', 'damascus'],
    YE: ['yemen', 'sanaa', 'houthi'],
    MM: ['myanmar', 'burma'],
    VE: ['venezuela', 'caracas', 'maduro'],
};

// Posture Theaters
const POSTURE_THEATERS = [
    {
        id: 'europe', name: 'European Theater',
        bounds: { north: 66, south: 35, east: 40, west: -10 },
        thresholds: { normal: 0, elevated: 20, critical: 50 },
        strikeIndicators: { minTankers: 2, minAwacs: 1, minFighters: 4 }
    },
    {
        id: 'middle_east', name: 'Middle East',
        bounds: { north: 35, south: 12, east: 63, west: 34 },
        thresholds: { normal: 0, elevated: 10, critical: 25 },
        strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 2 }
    },
    {
        id: 'indo_pacific', name: 'Indo-Pacific',
        bounds: { north: 45, south: -10, east: 153, west: 100 },
        thresholds: { normal: 0, elevated: 15, critical: 40 },
        strikeIndicators: { minTankers: 2, minAwacs: 1, minFighters: 4 }
    }
];

const MILITARY_PREFIXES = [
    'RCH', 'REACH', 'MOOSE', 'EVAC', 'DUSTOFF', 'PEDRO', 'DUKE', 'HAVOC', 'KNIFE', 'WARHAWK', 'VIPER', 'RAGE', 'FURY',
    'SHELL', 'TEXACO', 'ARCO', 'ESSO', 'PETRO', 'SENTRY', 'AWACS', 'MAGIC', 'DISCO', 'DARKSTAR',
    'COBRA', 'PYTHON', 'RAPTOR', 'EAGLE', 'HAWK', 'TALON', 'BOXER', 'OMNI', 'TOPCAT', 'SKULL', 'REAPER', 'HUNTER',
    'ARMY', 'NAVY', 'USAF', 'USMC', 'USCG', 'CNV', 'EXEC', 'NATO', 'GAF', 'RRF', 'RAF', 'FAF', 'IAF', 'RNLAF', 'BAF', 'DAF', 'HAF', 'PAF',
    'SWORD', 'LANCE', 'ARROW', 'SPARTAN', 'RSAF', 'EMIRI', 'UAEAF', 'KAF', 'QAF', 'BAHAF', 'OMAAF', 'IRIAF', 'IRGC', 'TUAF', 'RSD', 'RFF', 'VKS', 'CHN', 'PLAAF', 'PLA',
];

// ========================================================================
// Helpers
// ========================================================================

function normalizeCountryName(text: string): string | null {
    const lower = text.toLowerCase();
    for (const [code, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) return code;
    }
    return null;
}

function isMilitaryFlight(icao24: string, callsign?: string): boolean {
    if (callsign) {
        const cs = callsign.toUpperCase().trim();
        for (const prefix of MILITARY_PREFIXES) {
            if (cs.startsWith(prefix)) return true;
        }
    }
    const details = aircraftDb.getDetails(icao24);
    if (details?.operator) {
        const op = details.operator.toLowerCase();
        if (op.includes('air force') || op.includes('military') || op.includes('navy') || op.includes('army')) {
            return true;
        }
    }
    return false;
}

function detectAircraftType(callsign?: string): string {
    if (!callsign) return 'unknown';
    const cs = callsign.toUpperCase().trim();
    if (/^(SHELL|TEXACO|ARCO|ESSO|PETRO|KC|STRAT)/.test(cs)) return 'tanker';
    if (/^(SENTRY|AWACS|MAGIC|DISCO|DARKSTAR|E3|E8|E6)/.test(cs)) return 'awacs';
    if (/^(RCH|REACH|MOOSE|EVAC|C17|C5|C130|C40)/.test(cs)) return 'transport';
    if (/^(HOMER|OLIVE|JAKE|PSEUDO|GORDO|RC|U2|SR)/.test(cs)) return 'reconnaissance';
    if (/^(RQ|MQ|REAPER|PREDATOR|GLOBAL)/.test(cs)) return 'drone';
    if (/^(DEATH|BONE|DOOM|B52|B1|B2)/.test(cs)) return 'bomber';
    if (/^(VIPER|FURY|RAGE|COBRA|RAPTOR|EAGLE|HAWK)/.test(cs)) return 'fighter';
    return 'unknown';
}

// ========================================================================
// Cache System
// ========================================================================

let ciiCache: any = null;
let ciiCacheTs = 0;
let postureCache: any = null;
let postureCacheTs = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

// ========================================================================
// API Routes
// ========================================================================

router.get('/cii', async (req, res) => {
    if (ciiCache && Date.now() - ciiCacheTs < CACHE_TTL) {
        return res.json(ciiCache);
    }

    try {
        const token = process.env.ACLED_ACCESS_TOKEN;
        let protests: any[] = [];

        if (token) {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const params = new URLSearchParams({
                event_type: 'Protests|Riots',
                event_date: `${startDate}|${endDate}`,
                event_date_where: 'BETWEEN',
                limit: '500',
                _format: 'json',
            });

            const resp = await fetch(`https://acleddata.com/api/acled/read?${params}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (resp.ok) {
                const data = await resp.json();
                protests = data.data || [];
            }
        }

        const countryEvents = new Map<string, { protests: number; riots: number }>();
        for (const event of protests) {
            const code = normalizeCountryName(event.country || '');
            if (code && TIER1_COUNTRIES[code]) {
                const count = countryEvents.get(code) || { protests: 0, riots: 0 };
                if (event.event_type === 'Riots') count.riots++;
                else count.protests++;
                countryEvents.set(code, count);
            }
        }

        const scores = [];
        for (const [code, _name] of Object.entries(TIER1_COUNTRIES)) {
            const events = countryEvents.get(code) || { protests: 0, riots: 0 };
            const baseline = BASELINE_RISK[code] || 20;
            const multiplier = EVENT_MULTIPLIER[code] || 1.0;
            const unrest = Math.min(100, Math.round((events.protests + events.riots * 2) * multiplier * 2));
            const security = Math.min(100, baseline + events.riots * multiplier * 5);
            const information = Math.min(100, (events.protests + events.riots) * multiplier * 3);
            const composite = Math.min(100, Math.round(baseline + (unrest * 0.4 + security * 0.35 + information * 0.25) * 0.5));

            scores.push({
                region: code,
                staticBaseline: baseline,
                dynamicScore: composite - baseline,
                combinedScore: composite,
                trend: 'TREND_DIRECTION_STABLE',
                components: {
                    newsActivity: information,
                    ciiContribution: unrest,
                    geoConvergence: 0,
                    militaryActivity: 0,
                },
                computedAt: Date.now(),
            });
        }

        scores.sort((a, b) => b.combinedScore - a.combinedScore);

        ciiCache = { ciiScores: scores };
        ciiCacheTs = Date.now();
        res.json(ciiCache);

    } catch (e: any) {
        // Fallback to static baselines if ACLED is dead or token is missing
        console.error('CII ACLED Error:', e.message);

        const scores = Object.entries(TIER1_COUNTRIES).map(([code]) => {
            const baseline = BASELINE_RISK[code] || 20;
            return {
                region: code,
                staticBaseline: baseline,
                dynamicScore: 0,
                combinedScore: baseline,
                trend: 'TREND_DIRECTION_STABLE',
                components: { newsActivity: 0, ciiContribution: 0, geoConvergence: 0, militaryActivity: 0 },
                computedAt: Date.now(),
            };
        }).sort((a, b) => b.combinedScore - a.combinedScore);

        res.json({ ciiScores: scores });
    }
});

router.get('/posture', async (req, res) => {
    if (postureCache && Date.now() - postureCacheTs < CACHE_TTL) {
        return res.json(postureCache);
    }

    try {
        const useAdsbLol = process.env.FLIGHT_DATA_SOURCE === 'adsblol';
        const states = useAdsbLol ? await fetchAdsbLolStates() : await fetchOpenSkyStates();

        let activeMilitaryCount = 0;

        const theaters = POSTURE_THEATERS.map((theater) => {
            const theaterFlights = states.filter((f: any) => {
                if (!f.lat || !f.lon || f.onGround) return false;
                if (!isMilitaryFlight(f.icao24, f.callsign)) return false;

                return f.lat >= theater.bounds.south && f.lat <= theater.bounds.north &&
                    f.lon >= theater.bounds.west && f.lon <= theater.bounds.east;
            });

            activeMilitaryCount += theaterFlights.length;

            const byType = {
                tankers: theaterFlights.filter((f: any) => detectAircraftType(f.callsign) === 'tanker').length,
                awacs: theaterFlights.filter((f: any) => detectAircraftType(f.callsign) === 'awacs').length,
                fighters: theaterFlights.filter((f: any) => detectAircraftType(f.callsign) === 'fighter').length,
            };

            const total = theaterFlights.length;
            const postureLevel = total >= theater.thresholds.critical
                ? 'critical'
                : total >= theater.thresholds.elevated
                    ? 'elevated'
                    : 'normal';

            const strikeCapable =
                byType.tankers >= theater.strikeIndicators.minTankers &&
                byType.awacs >= theater.strikeIndicators.minAwacs &&
                byType.fighters >= theater.strikeIndicators.minFighters;

            const ops: string[] = [];
            if (strikeCapable) ops.push('strike_capable');
            if (byType.tankers > 0) ops.push('aerial_refueling');
            if (byType.awacs > 0) ops.push('airborne_early_warning');

            return {
                theater: theater.id,
                postureLevel,
                activeFlights: total,
                trackedVessels: 0,
                activeOperations: ops,
                assessedAt: Date.now(),
            };
        });

        postureCache = { theaters };
        postureCacheTs = Date.now();
        res.json(postureCache);
    } catch (e: any) {
        console.error('Posture Error:', e.message);
        res.json({ theaters: [] });
    }
});

router.get('/acled', async (req, res) => {
    try {
        const nowMs = Date.now();
        const startMs = nowMs - 7 * 24 * 60 * 60 * 1000; // Last 7 days by default

        const end = typeof req.query.end === 'string' ? parseInt(req.query.end, 10) : nowMs;
        const start = typeof req.query.start === 'string' ? parseInt(req.query.start, 10) : startMs;
        const country = typeof req.query.country === 'string' ? req.query.country : undefined;

        const startDate = new Date(start).toISOString().split('T')[0];
        const endDate = new Date(end).toISOString().split('T')[0];

        const rawEvents = await fetchAcledCached({
            eventTypes: 'Battles|Explosions/Remote violence|Violence against civilians',
            startDate,
            endDate,
            country,
            limit: 500
        });

        const events = rawEvents
            .filter((e: AcledRawEvent) => {
                const lat = parseFloat(e.latitude || '');
                const lon = parseFloat(e.longitude || '');
                return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
            })
            .map((e: AcledRawEvent) => ({
                id: `acled-${e.event_id_cnty}`,
                eventType: e.event_type || '',
                country: e.country || '',
                location: {
                    latitude: parseFloat(e.latitude || '0'),
                    longitude: parseFloat(e.longitude || '0'),
                },
                occurredAt: new Date(e.event_date || '').getTime(),
                fatalities: parseInt(e.fatalities || '', 10) || 0,
                actors: [e.actor1, e.actor2].filter(Boolean) as string[],
                source: e.source || '',
                admin1: e.admin1 || '',
            }));

        res.json({ events });
    } catch (e: any) {
        console.error('ACLED Route Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch ACLED data', events: [] });
    }
});

export default router;
