

const ACLED_API_URL = 'https://acleddata.com/api/acled/read';
const ACLED_AUTH_URL = 'https://acleddata.com/oauth/token';
const ACLED_CACHE_TTL = 900 * 1000; // 15 minutes (in ms) for data cache
const ACLED_TIMEOUT_MS = 15_000;

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface AcledRawEvent {
    event_id_cnty?: string;
    event_type?: string;
    sub_event_type?: string;
    country?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    event_date?: string;
    fatalities?: string;
    source?: string;
    actor1?: string;
    actor2?: string;
    admin1?: string;
    notes?: string;
    tags?: string;
}

interface FetchAcledOptions {
    eventTypes: string;
    startDate: string;
    endDate: string;
    country?: string;
    limit?: number;
}

async function getAccessToken(): Promise<string | null> {
    const username = process.env.ACLED_USERNAME;
    const password = process.env.ACLED_PASSWORD;

    if (!username || !password) {
        console.warn('ACLED_USERNAME or ACLED_PASSWORD missing. Cannot authenticate with ACLED API.');
        return null;
    }

    if (cachedAccessToken && Date.now() < tokenExpiresAt) {
        return cachedAccessToken;
    }

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');
    params.append('client_id', 'acled');

    try {
        const response = await fetch(ACLED_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            console.error(`ACLED Auth Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        cachedAccessToken = data.access_token;
        // The token expires_in is usually 86400 (24h). We subtract 5 minutes to be safe.
        tokenExpiresAt = Date.now() + ((data.expires_in || 86400) - 300) * 1000;

        console.log('Successfully acquired ACLED access token.');
        return cachedAccessToken;
    } catch (err: any) {
        console.error('Failed to retrieve ACLED access token:', err.message);
        return null;
    }
}

export async function fetchAcledCached(opts: FetchAcledOptions): Promise<AcledRawEvent[]> {
    return fetchAcledInternal(opts);
}
// Local cache to handle different cache keys
const queryCache = new Map<string, { data: AcledRawEvent[], expiresAt: number }>();

async function fetchAcledInternal(opts: FetchAcledOptions): Promise<AcledRawEvent[]> {
    const cacheKey = `${opts.eventTypes}:${opts.startDate}:${opts.endDate}:${opts.country || 'all'}:${opts.limit || 500}`;
    const cached = queryCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
    }

    const token = await getAccessToken();
    if (!token) {
        return [];
    }

    const params = new URLSearchParams({
        event_type: opts.eventTypes,
        event_date: `${opts.startDate}|${opts.endDate}`,
        event_date_where: 'BETWEEN',
        limit: String(opts.limit || 500),
        _format: 'json',
    });

    if (opts.country) params.set('country', opts.country);

    try {
        const resp = await fetch(`${ACLED_API_URL}?${params}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'User-Agent': 'IntelMap-Dev/1.0',
            },
            signal: AbortSignal.timeout(ACLED_TIMEOUT_MS),
        });

        if (!resp.ok) {
            throw new Error(`ACLED API error: ${resp.status}`);
        }

        const data = (await resp.json()) as { data?: AcledRawEvent[]; message?: string; error?: string };
        if (data.message || data.error) {
            throw new Error(data.message || data.error || 'ACLED API error');
        }

        const events = data.data || [];

        queryCache.set(cacheKey, {
            data: events,
            expiresAt: Date.now() + ACLED_CACHE_TTL
        });

        return events;
    } catch (error: any) {
        console.error('ACLED Fetch Error:', error.message);
        // Fallback to stale data if available
        if (cached?.data) {
            return cached.data;
        }
        return [];
    }
}
