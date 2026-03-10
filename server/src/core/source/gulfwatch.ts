/**
 * GulfWatch — UAE alert data source
 * API base: https://gulfwatch-api.onrender.com/api
 * GeoJSON:  https://gulfwatch.ai/data/uae-emirates.geojson
 */

const BASE = 'https://gulfwatch-api.onrender.com/api';

const GEOJSON_URLS = {
  uae: 'https://gulfwatch.ai/data/uae-emirates.geojson',
  qatar: 'https://gulfwatch.ai/data/qatar-municipalities.geojson',
  bahrain: 'https://gulfwatch.ai/data/bahrain-governorates.geojson',
  kuwait: 'https://gulfwatch.ai/data/kuwait-governorates.geojson',
  oman: 'https://gulfwatch.ai/data/oman-governorates.geojson',
} as const;
const TIMEOUT_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlertDescription {
  ar: string;
  en: string;
}

export interface GulfWatchAlert {
  id: string;
  emirateId: string;
  type: string; // 'air-raid' | 'security' | etc.
  severity: string; // 'warning' | 'watch' | 'advisory'
  description: AlertDescription;
  sourceText?: string; // full source text — only in history
  startedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  expiredAt?: string; // ISO 8601 — only present in history
  sourceCount: number;
}

export interface EmirateStatus {
  emirateId: string;
  activeAlerts: GulfWatchAlert[];
  status: string; // 'active' | 'clear'
}

export interface ActiveAlertsResponse {
  emirateStatuses: EmirateStatus[];
  lastUpdated: string;
}

export interface AlertHistoryResponse {
  alerts: GulfWatchAlert[];
  count: number;
}

export interface AlertSummary {
  isActive: boolean;
  activeEmirateIds: string[];
  alerts: GulfWatchAlert[];
  totalActive: number;
  lastUpdated: string;
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
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Supported GCC country slugs (saudi-arabia excluded — API returns error)
export const SUPPORTED_COUNTRIES = ['uae', 'qatar', 'bahrain', 'kuwait', 'oman'] as const;
export type GccCountry = (typeof SUPPORTED_COUNTRIES)[number];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch current active alerts per region for any supported GCC country.
 */
export async function fetchActiveAlerts(
  country: GccCountry = 'uae',
): Promise<ActiveAlertsResponse> {
  return apiFetch<ActiveAlertsResponse>(`${BASE}/alerts?country=${country}`);
}

/**
 * Fetch recent alert history for any supported GCC country.
 * @param country  GCC country slug
 * @param limit    Max records to return (default 50)
 * @param offset   Pagination offset (default 0)
 */
export async function fetchAlertHistory(
  country: GccCountry = 'uae',
  limit = 50,
  offset = 0,
): Promise<AlertHistoryResponse> {
  const params = new URLSearchParams({
    country,
    limit: String(limit),
    offset: String(offset),
  });
  return apiFetch<AlertHistoryResponse>(`${BASE}/alerts/history?${params}`);
}

/**
 * Fetch region boundary GeoJSON for any supported GCC country.
 * Feature properties: { id, name_en, name_ar }
 */
export async function fetchCountryGeoJSON(country: GccCountry = 'uae'): Promise<unknown> {
  return apiFetch<unknown>(GEOJSON_URLS[country]);
}

/** @deprecated Use fetchCountryGeoJSON('uae') */
export async function fetchEmiratesGeoJSON(): Promise<unknown> {
  return fetchCountryGeoJSON('uae');
}

/**
 * Summarise active alerts for dashboard consumption (any supported GCC country).
 */
export async function getAlertSummary(country: GccCountry = 'uae'): Promise<AlertSummary> {
  const data = await fetchActiveAlerts(country).catch(
    (): ActiveAlertsResponse => ({ emirateStatuses: [], lastUpdated: new Date().toISOString() }),
  );

  const activeStatuses = data.emirateStatuses.filter((s) => s.activeAlerts.length > 0);
  const alerts = activeStatuses.flatMap((s) => s.activeAlerts);
  const activeEmirateIds = [...new Set(activeStatuses.map((s) => s.emirateId))];

  return {
    isActive: alerts.length > 0,
    activeEmirateIds,
    alerts,
    totalActive: alerts.length,
    lastUpdated: data.lastUpdated,
  };
}
