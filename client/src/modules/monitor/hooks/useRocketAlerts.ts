import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface RocketAlertItem {
  name: string;
  englishName: string | null;
  lat: number | null;
  lon: number | null;
  alertTypeId: number;
  countdownSec: number | null;
  areaNameEn: string | null;
  areaNameHe: string | null;
  timeStamp: string;
}

export interface DailyCount {
  timeStamp: string;
  alerts: number;
}

export interface RocketAlertSummary {
  isActive: boolean;
  live: RocketAlertItem[];
  total24h: number;
  daily: DailyCount[];
  activeAreas: string[];
}

export function useRocketAlerts() {
  return useQuery<RocketAlertSummary>({
    queryKey: ['rocket-alerts'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/rocket-alerts`);
      if (!res.ok) throw new Error('Failed to fetch rocket alerts');
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export interface AlertHistoryDay {
  date: string;
  alerts: RocketAlertItem[];
}

export function useRocketAlertHistory(hours = 24) {
  return useQuery<{ days: AlertHistoryDay[] }>({
    queryKey: ['rocket-alerts-history', hours],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/rocket-alerts/history?hours=${hours}`);
      if (!res.ok) throw new Error('Failed to fetch rocket alert history');
      return res.json();
    },
    staleTime: 5 * 60_000, // history changes slowly — cache 5 min
    gcTime: 10 * 60_000,
  });
}
