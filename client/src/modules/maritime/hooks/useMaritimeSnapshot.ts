import { useQuery } from '@tanstack/react-query';

export interface VesselState {
    mmsi: number;
    name: string;
    lat: number;
    lon: number;
    sog: number;
    cog: number;
    heading: number;
    navigationalStatus: number;
    lastUpdate: number;
    type?: number;
    callsign?: string;
    dimension?: { a: number; b: number; c: number; d: number };
    destination?: string;
    altitude?: number;
    textMessage?: string;
    history?: [number, number][]; // Array of [longitude, latitude]
}

interface MaritimeSnapshotResponse {
    timestamp: number;
    vessels: VesselState[];
}

export function useMaritimeSnapshot() {
    return useQuery<MaritimeSnapshotResponse>({
        queryKey: ['maritime', 'snapshot'],
        queryFn: async () => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${API_URL}/maritime/snapshot`);
            if (!res.ok) {
                throw new Error('Network error fetching maritime snapshot');
            }
            return res.json();
        },
        refetchInterval: 5000, // Poll every 5 seconds
        staleTime: 2000,
    });
}
