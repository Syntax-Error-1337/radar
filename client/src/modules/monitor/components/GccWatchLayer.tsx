import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import {
  GCC_COUNTRIES,
  useGccCountryAlerts,
  useGccCountryGeoJSON,
} from '../hooks/useGulfWatchAlerts';
import type { GccCountry } from '../hooks/useGulfWatchAlerts';

/** Approximate centroids for active-alert markers per GCC region */
const REGION_CENTROIDS: Record<string, [number, number]> = {
  // Qatar
  doha: [51.531, 25.2867],
  'al-rayyan': [51.4343, 25.2924],
  'al-wakrah': [51.5993, 25.1716],
  'al-daayen': [51.5388, 25.4189],
  'al-khor': [51.4963, 25.6834],
  'al-shamal': [51.2072, 26.1122],
  'umm-salal': [51.4012, 25.4176],
  'al-shahaniya': [51.2097, 25.3558],
  // Bahrain
  capital: [50.586, 26.2154],
  muharraq: [50.6156, 26.2569],
  northern: [50.4985, 26.2401],
  southern: [50.5516, 25.9351],
  // Kuwait
  'al-asimah': [47.9783, 29.3697],
  hawalli: [48.0321, 29.3327],
  farwaniya: [47.9588, 29.2892],
  ahmadi: [48.077, 29.0769],
  jahra: [47.6736, 29.3375],
  'mubarak-al-kabeer': [48.0816, 29.2162],
  // Oman
  muscat: [58.5922, 23.588],
  'al-batinah': [57.5301, 23.93],
  'ad-dakhiliyah': [57.5357, 22.92],
  'ash-sharqiyah': [58.83, 22.46],
  dhofar: [54.1, 17.02],
  'az-zahirah': [56.72, 23.58],
  'al-wusta': [56.82, 21.53],
};

const FILL_COLOR: ExpressionSpecification = [
  'case',
  ['==', ['get', 'alertSeverity'], 'warning'],
  'rgba(239, 68, 68, 0.18)',
  ['==', ['get', 'alertSeverity'], 'watch'],
  'rgba(251, 146, 60, 0.15)',
  ['==', ['get', 'alertSeverity'], 'advisory'],
  'rgba(234, 179, 8, 0.12)',
  'rgba(96, 165, 250, 0.06)',
];

const OUTLINE_COLOR: ExpressionSpecification = [
  'case',
  ['==', ['get', 'alertSeverity'], 'warning'],
  'rgba(239, 68, 68, 0.75)',
  ['==', ['get', 'alertSeverity'], 'watch'],
  'rgba(251, 146, 60, 0.70)',
  ['==', ['get', 'alertSeverity'], 'advisory'],
  'rgba(234, 179, 8, 0.60)',
  'rgba(148, 163, 184, 0.20)',
];

const HALO_COLOR: ExpressionSpecification = [
  'case',
  ['==', ['get', 'alertSeverity'], 'warning'],
  'rgba(239, 68, 68, 0.14)',
  ['==', ['get', 'alertSeverity'], 'watch'],
  'rgba(251, 146, 60, 0.12)',
  'rgba(234, 179, 8, 0.10)',
];

const DOT_COLOR: ExpressionSpecification = [
  'case',
  ['==', ['get', 'alertSeverity'], 'warning'],
  'rgba(239, 68, 68, 0.92)',
  ['==', ['get', 'alertSeverity'], 'watch'],
  'rgba(251, 146, 60, 0.92)',
  'rgba(234, 179, 8, 0.90)',
];

function CountryLayer({ country }: { country: GccCountry }) {
  const { data: alerts } = useGccCountryAlerts(country);
  const { data: geojson } = useGccCountryGeoJSON(country);
  const src = `gcc-watch-${country}`;

  // Polygon features — always visible; "clear" state when no alert
  const enrichedGeojson = useMemo(() => {
    if (!geojson) return null;
    const activeIds = alerts ? new Set(alerts.activeEmirateIds) : new Set<string>();
    const alertsByRegion = alerts
      ? new Map(alerts.alerts.map((a) => [a.emirateId, a]))
      : new Map<string, never>();

    const features = (geojson as GeoJSON.FeatureCollection).features.map((f) => {
      const regionId = (f.properties as Record<string, string>).id;
      const isActive = activeIds.has(regionId);
      const alert = alertsByRegion.get(regionId);
      return {
        ...f,
        properties: {
          ...f.properties,
          isActive,
          alertType: alert?.type ?? '',
          alertSeverity: alert?.severity ?? '',
          descriptionEn: alert?.description?.en ?? '',
          descriptionAr: alert?.description?.ar ?? '',
          startedAt: alert?.startedAt ?? '',
          expiresAt: alert?.expiresAt ?? '',
          sourceCount: alert?.sourceCount ?? 0,
          country,
        },
      };
    });
    return { ...geojson, features };
  }, [geojson, alerts, country]);

  // Point markers — one per active region
  const markersGeojson = useMemo(() => {
    if (!alerts?.isActive) return { type: 'FeatureCollection' as const, features: [] };
    const alertsByRegion = new Map(alerts.alerts.map((a) => [a.emirateId, a]));
    const features = alerts.activeEmirateIds
      .map((regionId) => {
        const coords = REGION_CENTROIDS[regionId];
        if (!coords) return null;
        const alert = alertsByRegion.get(regionId);
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: coords },
          properties: {
            regionId,
            name_en: regionId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            name_ar: '',
            isActive: true,
            alertType: alert?.type ?? '',
            alertSeverity: alert?.severity ?? '',
            descriptionEn: alert?.description?.en ?? '',
            descriptionAr: alert?.description?.ar ?? '',
            startedAt: alert?.startedAt ?? '',
            expiresAt: alert?.expiresAt ?? '',
            sourceCount: alert?.sourceCount ?? 0,
            country,
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
    return { type: 'FeatureCollection' as const, features };
  }, [alerts, country]);

  if (!enrichedGeojson) return null;

  return (
    <>
      {/* Polygon fill — always on */}
      <Source id={src} type="geojson" data={enrichedGeojson as GeoJSON.FeatureCollection}>
        <Layer id={`${src}-fill`} type="fill" paint={{ 'fill-color': FILL_COLOR }} />
        <Layer
          id={`${src}-outline`}
          type="line"
          paint={{
            'line-color': OUTLINE_COLOR,
            'line-width': ['case', ['get', 'isActive'], 1.5, 0.5],
          }}
        />
        <Layer
          id={`${src}-label`}
          type="symbol"
          filter={['==', ['get', 'isActive'], true]}
          layout={{
            'text-field': ['get', 'name_en'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 10,
            'text-anchor': 'center',
          }}
          paint={{
            'text-color': 'rgba(255, 200, 180, 0.9)',
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 1.5,
          }}
        />
      </Source>

      {/* Markers — one dot per active region */}
      <Source id={`${src}-markers`} type="geojson" data={markersGeojson}>
        <Layer
          id={`${src}-halo`}
          type="circle"
          paint={{
            'circle-radius': 14,
            'circle-color': HALO_COLOR,
            'circle-stroke-width': 1,
            'circle-stroke-color': [
              'case',
              ['==', ['get', 'alertSeverity'], 'warning'],
              'rgba(239, 68, 68, 0.45)',
              ['==', ['get', 'alertSeverity'], 'watch'],
              'rgba(251, 146, 60, 0.40)',
              'rgba(234, 179, 8, 0.35)',
            ],
          }}
        />
        <Layer
          id={`${src}-dot`}
          type="circle"
          paint={{
            'circle-radius': 5,
            'circle-color': DOT_COLOR,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.7)',
          }}
        />
        <Layer
          id={`${src}-marker-label`}
          type="symbol"
          layout={{
            'text-field': ['get', 'name_en'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 8,
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-max-width': 8,
          }}
          paint={{
            'text-color': 'rgba(255, 220, 160, 0.8)',
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 1,
          }}
        />
      </Source>
    </>
  );
}

/**
 * Renders polygon fills + active-alert markers for all GCC countries
 * (Qatar, Bahrain, Kuwait, Oman) using boundary GeoJSON from the server proxy.
 */
export function GccWatchLayer() {
  return (
    <>
      {GCC_COUNTRIES.map((country) => (
        <CountryLayer key={country} country={country} />
      ))}
    </>
  );
}
