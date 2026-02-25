import { useQuery } from '@tanstack/react-query';
import { OpenSkyClient } from '../../../core/providers/opensky.client';
import { MockClient } from '../../../core/providers/mock.client';
import type { FlightProvider } from '../../../core/providers/provider.types';

// Memoize provider instantiation
const provider: FlightProvider = import.meta.env.VITE_FLIGHT_PROVIDER === 'opensky'
    ? new OpenSkyClient()
    : new MockClient();

export function useFlightTrack(icao24: string | null) {
    return useQuery({
        queryKey: ['flightTrack', icao24],
        queryFn: async () => {
            if (!icao24) return null;
            try {
                return await provider.track(icao24);
            } catch (err) {
                console.warn(`Failed to track ${icao24}, falling back to null.`);
                return null;
            }
        },
        enabled: !!icao24,
        refetchInterval: 30000,
        staleTime: 15000,
    });
}
