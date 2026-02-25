import { useQuery } from '@tanstack/react-query';
import { OpenSkyClient } from '../../../core/providers/opensky.client';
import { MockClient } from '../../../core/providers/mock.client';

export function useFlightsSnapshot() {
    return useQuery({
        queryKey: ['flights-snapshot'],
        queryFn: async () => {
            const isMock = import.meta.env.VITE_FLIGHT_PROVIDER === 'mock';
            try {
                if (isMock) {
                    const client = new MockClient();
                    return await client.snapshot();
                } else {
                    const client = new OpenSkyClient();
                    return await client.snapshot();
                }
            } catch (e) {
                console.warn('Primary provider failed, falling back to mock');
                const client = new MockClient();
                return await client.snapshot();
            }
        },
        refetchInterval: 5000,
        staleTime: 2000,
    });
}
