import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useGulfWatchAlerts, useEmiratesGeoJSON } from '../hooks/useGulfWatchAlerts';

/** Approximate geographic centroids for each UAE emirate */
const EMIRATE_CENTROIDS: Record<string, [number, number]> = {
  'abu-dhabi': [54.3773, 24.4539],
  dubai: [55.2708, 25.2048],
  sharjah: [55.4272, 25.3462],
  ajman: [55.5136, 25.4052],
  'umm-al-quwain': [55.5533, 25.5647],
  'ras-al-khaimah': [55.9762, 25.8007],
  fujairah: [56.3265, 25.1288],
};

/**
 * Renders active UAE alert regions as highlighted emirate polygons on the map.
 * Uses emirate GeoJSON joined with live alert data by emirateId.
 */
export function GulfWatchLayer() {
  const { data: alerts } = useGulfWatchAlerts();
  const { data: geojson } = useEmiratesGeoJSON();

  // Polygon features — for fill + outline + label
  const enrichedGeojson = useMemo(() => {
    if (!geojson) return null;

    // Safe fallback when alerts haven't loaded yet — render all emirates as "clear"
    const activeIds = alerts ? new Set(alerts.activeEmirateIds) : new Set<string>();
    const alertsByEmirate = alerts
      ? new Map(alerts.alerts.map((a) => [a.emirateId, a]))
      : new Map<string, never>();

    const features = (geojson as GeoJSON.FeatureCollection).features.map((f) => {
      const emirateId = (f.properties as Record<string, string>).id;
      const isActive = activeIds.has(emirateId);
      const alert = alertsByEmirate.get(emirateId);
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
        },
      };
    });

    return { ...geojson, features };
  }, [geojson, alerts]);

  // Point features — one marker per active emirate using centroid coordinates
  const markersGeojson = useMemo(() => {
    if (!alerts?.isActive) return { type: 'FeatureCollection' as const, features: [] };

    const alertsByEmirate = new Map(alerts.alerts.map((a) => [a.emirateId, a]));

    const features = alerts.activeEmirateIds
      .map((emirateId) => {
        const coords = EMIRATE_CENTROIDS[emirateId];
        if (!coords) return null;
        const alert = alertsByEmirate.get(emirateId);
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: coords },
          properties: {
            emirateId,
            // mirror polygon props so the click handler works the same way
            name_en: emirateId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            name_ar: '',
            isActive: true,
            alertType: alert?.type ?? '',
            alertSeverity: alert?.severity ?? '',
            descriptionEn: alert?.description?.en ?? '',
            descriptionAr: alert?.description?.ar ?? '',
            startedAt: alert?.startedAt ?? '',
            expiresAt: alert?.expiresAt ?? '',
            sourceCount: alert?.sourceCount ?? 0,
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    return { type: 'FeatureCollection' as const, features };
  }, [alerts]);

  // Only skip rendering if the GeoJSON boundary data hasn't loaded at all
  if (!enrichedGeojson) return null;

  return (
    <>
      {/* ── Polygon layer ── always visible; "clear" (blue-grey) when no alert ── */}
      <Source id="gulf-watch" type="geojson" data={enrichedGeojson as GeoJSON.FeatureCollection}>
        <Layer
          id="gulf-watch-fill"
          type="fill"
          paint={{
            'fill-color': [
              'case',
              ['==', ['get', 'alertSeverity'], 'warning'],
              'rgba(239, 68, 68, 0.18)',
              ['==', ['get', 'alertSeverity'], 'watch'],
              'rgba(251, 146, 60, 0.15)',
              ['==', ['get', 'alertSeverity'], 'advisory'],
              'rgba(234, 179, 8, 0.12)',
              'rgba(96, 165, 250, 0.06)', // clear state
            ],
          }}
        />
        <Layer
          id="gulf-watch-outline"
          type="line"
          paint={{
            'line-color': [
              'case',
              ['==', ['get', 'alertSeverity'], 'warning'],
              'rgba(239, 68, 68, 0.75)',
              ['==', ['get', 'alertSeverity'], 'watch'],
              'rgba(251, 146, 60, 0.7)',
              ['==', ['get', 'alertSeverity'], 'advisory'],
              'rgba(234, 179, 8, 0.6)',
              'rgba(148, 163, 184, 0.25)', // clear state
            ],
            'line-width': ['case', ['get', 'isActive'], 1.5, 0.5],
          }}
        />
        <Layer
          id="gulf-watch-label"
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

      {/* ── Marker layer — one dot per active emirate ── */}
      <Source id="gulf-watch-markers" type="geojson" data={markersGeojson}>
        {/* Outer halo */}
        <Layer
          id="gulf-watch-marker-halo"
          type="circle"
          paint={{
            'circle-radius': 16,
            'circle-color': [
              'case',
              ['==', ['get', 'alertSeverity'], 'warning'],
              'rgba(239, 68, 68, 0.15)',
              'rgba(251, 146, 60, 0.12)',
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': [
              'case',
              ['==', ['get', 'alertSeverity'], 'warning'],
              'rgba(239, 68, 68, 0.45)',
              'rgba(251, 146, 60, 0.4)',
            ],
          }}
        />
        {/* Inner dot */}
        <Layer
          id="gulf-watch-marker-dot"
          type="circle"
          paint={{
            'circle-radius': 6,
            'circle-color': [
              'case',
              ['==', ['get', 'alertSeverity'], 'warning'],
              'rgba(239, 68, 68, 0.92)',
              'rgba(251, 146, 60, 0.92)',
            ],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.7)',
          }}
        />
        {/* Name below dot */}
        <Layer
          id="gulf-watch-marker-label"
          type="symbol"
          layout={{
            'text-field': ['get', 'name_en'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 9,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
            'text-max-width': 8,
          }}
          paint={{
            'text-color': 'rgba(255, 200, 180, 0.9)',
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 1,
          }}
        />
      </Source>
    </>
  );
}
