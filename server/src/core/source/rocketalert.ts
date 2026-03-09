/**
 * RocketAlert Live — data source
 * API base: https://agg.rocketalert.live
 *
 * alertTypeId values:
 *   1  = Rockets / missiles
 *   2  = UAV / hostile aircraft
 *  -1  = All types
 */

const BASE = 'https://agg.rocketalert.live/api';
const TIMEOUT_MS = 8000;

// ── Shared types ──────────────────────────────────────────────────────────────

export interface RocketAlertItem {
  /** Hebrew place name */
  name: string;
  /** English place name (may be null) */
  englishName: string | null;
  lat: number | null;
  lon: number | null;
  taCityId: number | null;
  /** 1=rocket, 2=UAV/aircraft */
  alertTypeId: number;
  /** Seconds to shelter (0, 15, 30, 45, 60, 90, or null) */
  countdownSec: number | null;
  areaNameHe: string | null;
  areaNameEn: string | null;
  /** "YYYY-MM-DD HH:MM:SS" (local Israeli time) */
  timeStamp: string;
}

/** One group returned by the real-time endpoint */
export interface RealTimeGroup {
  alerts: RocketAlertItem[];
  empty: boolean;
  alertTypeId: number;
}

/** One day bucket from the details endpoint */
export interface AlertDay {
  date: string; // YYYY-MM-DD
  alerts: RocketAlertItem[];
}

/** One entry from the daily-count endpoint */
export interface DailyCount {
  timeStamp: string; // YYYY-MM-DD
  alerts: number;
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'IntelMap/1.0' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Unknown API error');
    return json.payload as T;
  } finally {
    clearTimeout(timer);
  }
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Real-time cached alerts (updated every ~30 s by the source).
 * Returns groups, each group being one alert burst.
 */
export async function fetchRealTimeAlerts(): Promise<RealTimeGroup[]> {
  return apiFetch<RealTimeGroup[]>(`${BASE}/v2/alerts/real-time/cached`);
}

/**
 * Detailed per-alert records, bucketed by date.
 * @param hours  How many hours back to query (default 24)
 * @param alertTypeId  -1=all, 1=rockets, 2=UAV
 */
export async function fetchRecentAlertDetails(hours = 24, alertTypeId = -1): Promise<AlertDay[]> {
  const from = isoHoursAgo(hours);
  const to = isoNow();
  const params = new URLSearchParams({
    from,
    to,
    alertTypeId: String(alertTypeId),
  });
  return apiFetch<AlertDay[]>(`${BASE}/v1/alerts/details?${params}`);
}

/**
 * Total alert count for a time window.
 */
export async function fetchAlertTotal(hours = 24, alertTypeId = -1): Promise<number> {
  const from = isoHoursAgo(hours);
  const to = isoNow();
  const params = new URLSearchParams({
    from,
    to,
    alertTypeId: String(alertTypeId),
  });
  return apiFetch<number>(`${BASE}/v1/alerts/total?${params}`);
}

/**
 * Daily alert counts, one entry per day.
 * @param days  How many days of history (default 7)
 */
export async function fetchDailyCounts(days = 7, alertTypeId = -1): Promise<DailyCount[]> {
  const from = isoDaysAgo(days);
  const to = isoNow();
  const params = new URLSearchParams({
    from,
    to,
    alertTypeId: String(alertTypeId),
  });
  return apiFetch<DailyCount[]>(`${BASE}/v1/alerts/daily?${params}`);
}

// ── Convenience: summarise active alerts for dashboard ───────────────────────

export interface AlertSummary {
  /** All alerts from real-time cached feed (flat list, newest first) */
  live: RocketAlertItem[];
  /** Total for last 24 h (both types) */
  total24h: number;
  /** Per-day counts for the last 7 days */
  daily: DailyCount[];
  /** Unique affected areas in the live burst */
  activeAreas: string[];
  /** Whether there are any live alerts right now */
  isActive: boolean;
}

export async function getAlertSummary(): Promise<AlertSummary> {
  const [realtimeGroups, total24h, daily] = await Promise.all([
    fetchRealTimeAlerts().catch(() => [] as RealTimeGroup[]),
    fetchAlertTotal(24, -1).catch(() => 0),
    fetchDailyCounts(7, -1).catch(() => [] as DailyCount[]),
  ]);

  // Flatten all alerts from all groups, sort newest first
  const live: RocketAlertItem[] = realtimeGroups
    .flatMap((g) => g.alerts)
    .sort((a, b) => b.timeStamp.localeCompare(a.timeStamp));

  const isActive = live.length > 0 && realtimeGroups.some((g) => !g.empty);

  const activeAreas = [
    ...new Set(
      live.map((a) => a.areaNameEn ?? a.areaNameHe ?? a.englishName ?? a.name).filter(Boolean),
    ),
  ].slice(0, 10);

  return { live, total24h, daily, activeAreas, isActive };
}
