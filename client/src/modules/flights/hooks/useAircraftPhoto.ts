import { useQuery } from '@tanstack/react-query';

export interface PlanespottersPhoto {
    id: string;
    thumbnail: { src: string; size: { width: number; height: number } };
    thumbnail_large: { src: string; size: { width: number; height: number } };
    link: string;
    photographer: string;
}

interface PlanespottersResponse {
    photos: PlanespottersPhoto[];
}

export function useAircraftPhoto(icao24: string | null | undefined) {
    return useQuery<PlanespottersPhoto | null>({
        queryKey: ['aircraft-photo', icao24],
        queryFn: async (): Promise<PlanespottersPhoto | null> => {
            if (!icao24) return null;

            try {
                const response = await fetch(`https://api.planespotters.net/pub/photos/hex/${icao24}`);

                if (!response.ok) {
                    return null;
                }

                const data: PlanespottersResponse = await response.json();

                if (data.photos && data.photos.length > 0) {
                    return data.photos[0];
                }

                return null;
            } catch (error) {
                console.error('Failed to fetch aircraft photo:', error);
                return null;
            }
        },
        enabled: !!icao24,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour since photos rarely change
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
        retry: false, // Don't retry on 404s (no photo exists)
    });
}
