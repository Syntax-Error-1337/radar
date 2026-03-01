import { useQuery } from '@tanstack/react-query';
import { OpenSkyClient } from '../../../core/providers/opensky.client';
import { MockClient } from '../../../core/providers/mock.client';
import type { FlightProvider } from '../../../core/providers/provider.types';

// Memoize provider at module level — avoid a new class instance on every 5s refetch
const provider: FlightProvider = import.meta.env.VITE_FLIGHT_PROVIDER === 'mock'
    ? new MockClient()
    : new OpenSkyClient();

export function useFlightsSnapshot() {
    return useQuery({
        queryKey: ['flights-snapshot'],
        queryFn: async () => {
            try {
                return await provider.snapshot();
            } catch {
                console.warn('Primary provider failed, falling back to mock');
                return await new MockClient().snapshot();
            }
        },
        refetchInterval: 5000,
        staleTime: 2000,
    });
}
