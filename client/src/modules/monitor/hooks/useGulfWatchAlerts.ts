import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AlertDescription {
  ar: string;
  en: string;
}

export interface GulfWatchAlert {
  id: string;
  emirateId: string;
  type: string;
  severity: string; // 'warning' | 'watch' | 'advisory'
  description: AlertDescription;
  sourceText?: string;
  startedAt: string;
  expiresAt: string;
  expiredAt?: string;
  sourceCount: number;
}

export interface GulfWatchSummary {
  isActive: boolean;
  activeEmirateIds: string[];
  alerts: GulfWatchAlert[];
  totalActive: number;
  lastUpdated: string;
}

export function useGulfWatchAlerts() {
  return useQuery<GulfWatchSummary>({
    queryKey: ['gulf-watch-alerts'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/alerts`);
      if (!res.ok) throw new Error('Failed to fetch GulfWatch alerts');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

export interface GulfWatchHistoryResponse {
  alerts: GulfWatchAlert[];
  count: number;
}

export const GCC_COUNTRIES = ['qatar', 'bahrain', 'kuwait', 'oman'] as const;
export type GccCountry = (typeof GCC_COUNTRIES)[number];

export const GCC_COUNTRY_LABEL: Record<GccCountry, string> = {
  qatar: 'Qatar',
  bahrain: 'Bahrain',
  kuwait: 'Kuwait',
  oman: 'Oman',
};

export function useGccCountryAlerts(country: GccCountry) {
  return useQuery<GulfWatchSummary>({
    queryKey: ['gcc-watch-alerts', country],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/${country}/alerts`);
      if (!res.ok) throw new Error(`Failed to fetch ${country} alerts`);
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

export function useGccCountryHistory(country: GccCountry, limit = 20) {
  return useQuery<GulfWatchHistoryResponse>({
    queryKey: ['gcc-watch-history', country, limit],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/monitor/gulf-watch/${country}/alerts/history?limit=${limit}`,
      );
      if (!res.ok) throw new Error(`Failed to fetch ${country} history`);
      return res.json();
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useGulfWatchAlertHistory(limit = 50) {
  return useQuery<GulfWatchHistoryResponse>({
    queryKey: ['gulf-watch-history', limit],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/alerts/history?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch GulfWatch history');
      return res.json();
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useEmiratesGeoJSON() {
  return useQuery({
    queryKey: ['gulf-watch-geojson'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/geojson`);
      if (!res.ok) throw new Error('Failed to fetch emirates GeoJSON');
      return res.json();
    },
    staleTime: 3_600_000, // 1 hour — static geometry
    gcTime: 7_200_000,
  });
}

export function useGccCountryGeoJSON(country: GccCountry) {
  return useQuery({
    queryKey: ['gcc-watch-geojson', country],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/${country}/geojson`);
      if (!res.ok) throw new Error(`Failed to fetch ${country} GeoJSON`);
      return res.json();
    },
    staleTime: 3_600_000,
    gcTime: 7_200_000,
  });
}
