import { FlightProvider, ProviderSnapshot } from './provider.types';
import { AircraftState } from '../../modules/flights/lib/flights.types';

export class MockClient implements FlightProvider {
    async snapshot(): Promise<ProviderSnapshot> {
        const res = await fetch('/mock/flights_sample.json');
        if (!res.ok) throw new Error('Failed to load mock data');
        const data = await res.json();

        // Simulate network delay
        await new Promise(r => setTimeout(r, 200));

        const states: AircraftState[] = (data.states || []).map((s: any) => ({
            icao24: String(s[0] || 'unknown'),
            callsign: s[1] ? String(s[1]).trim() : null,
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
        }));

        return { states, timestamp: Date.now() };
    }

    async track(_icao24: string): Promise<any> {
        // Mock doesn't carry full track history yet, could simulate fake ones
        return null;
    }
}
