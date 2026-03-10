import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type BaseCategory = 'air' | 'naval' | 'ground' | 'hq';

export interface MilitaryBaseProperties {
  name: string;
  description: string;
  category: BaseCategory;
  country: string;
}

export interface MilitaryBasesCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: MilitaryBaseProperties;
  }>;
}

export interface MilitaryBaseStats {
  total: number;
  air: number;
  naval: number;
  ground: number;
  hq: number;
}

export function useMilitaryBases() {
  return useQuery<MilitaryBasesCollection>({
    queryKey: ['military-bases'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/military-bases`);
      if (!res.ok) throw new Error('Failed to fetch military bases');
      return res.json();
    },
    staleTime: 86_400_000, // 24 h — static dataset
    gcTime: 86_400_000,
  });
}

export function useMilitaryBaseStats() {
  return useQuery<MilitaryBaseStats>({
    queryKey: ['military-bases-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/military-bases/stats`);
      if (!res.ok) throw new Error('Failed to fetch military base stats');
      return res.json();
    },
    staleTime: 86_400_000,
    gcTime: 86_400_000,
  });
}
