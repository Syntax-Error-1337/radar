import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useRocketAlerts } from '../hooks/useRocketAlerts';

/** Layer IDs exposed so MonitorMap can set interactiveLayerIds */
export const ROCKET_ALERT_LAYER_IDS = ['rocket-alerts-halo', 'rocket-alerts-dot'];

/**
 * Renders live rocket/UAV alert positions as red circle markers on the map.
 * Only items with non-null lat/lon coordinates are rendered.
 */
export function RocketAlertLayer() {
  const { data } = useRocketAlerts();

  const geojson = useMemo(() => {
    if (!data?.live?.length) {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    const features = data.live
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [a.lon as number, a.lat as number],
        },
        properties: {
          nameEn: a.englishName ?? '',
          nameHe: a.name,
          area: a.areaNameEn ?? a.areaNameHe ?? '',
          areaHe: a.areaNameHe ?? '',
          alertTypeId: a.alertTypeId,
          countdownSec: a.countdownSec ?? 0,
          timeStamp: a.timeStamp,
          lat: a.lat,
          lon: a.lon,
        },
      }));

    return { type: 'FeatureCollection' as const, features };
  }, [data]);

  if (!data?.isActive || geojson.features.length === 0) return null;

  return (
    <Source id="rocket-alerts" type="geojson" data={geojson}>
      {/* Outer halo */}
      <Layer
        id="rocket-alerts-halo"
        type="circle"
        paint={{
          'circle-radius': 18,
          'circle-color': 'rgba(239, 68, 68, 0.15)',
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(239, 68, 68, 0.4)',
        }}
      />
      {/* Inner dot */}
      <Layer
        id="rocket-alerts-dot"
        type="circle"
        paint={{
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'alertTypeId'],
            2,
            'rgba(251, 146, 60, 0.95)', // UAV — orange
            'rgba(239, 68, 68, 0.95)', // Rockets — red
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.7)',
        }}
      />
      {/* Location label */}
      <Layer
        id="rocket-alerts-label"
        type="symbol"
        layout={{
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 9,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-max-width': 8,
        }}
        paint={{
          'text-color': 'rgba(255, 200, 200, 0.9)',
          'text-halo-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-width': 1,
        }}
      />
    </Source>
  );
}
