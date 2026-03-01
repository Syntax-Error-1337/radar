import { useQuery } from '@tanstack/react-query';
import type { VesselState } from './useMaritimeSnapshot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Fetches full vessel detail — including route history — for the selected vessel.
 * Only fires when an MMSI is selected; uses the /vessel/:mmsi endpoint which
 * returns the complete VesselState (history array included) that the snapshot
 * endpoint strips for bandwidth reasons.
 */
export function useVesselDetail(mmsi: number | null) {
    return useQuery<VesselState>({
        queryKey: ['maritime', 'vessel', mmsi],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/maritime/vessel/${mmsi}`);
            if (!res.ok) throw new Error(`Vessel ${mmsi} not found`);
            return res.json();
        },
        enabled: mmsi !== null,
        // Refresh detail every 10 s — ships move slowly, route history changes rarely
        refetchInterval: 10_000,
        staleTime: 5_000,
    });
}
