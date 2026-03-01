import type { FlightProvider, ProviderSnapshot } from './provider.types';

export class OpenSkyClient implements FlightProvider {
    async snapshot(): Promise<ProviderSnapshot> {
        const res = await fetch('/api/flights/snapshot');
        if (!res.ok) {
            throw new Error(`OpenSky proxy error: ${res.status}`);
        }
        const data = await res.json();
        return { states: data.states || [], timestamp: data.timestamp || Date.now() };
    }

    async track(icao24: string): Promise<unknown> {
        const res = await fetch(`/api/flights/track/${icao24}`);
        if (!res.ok) {
            if (res.status === 404) return null; // No track found
            throw new Error(`OpenSky track error: ${res.status}`);
        }
        return await res.json();
    }
}
