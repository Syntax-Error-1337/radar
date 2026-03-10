import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useRocketAlerts, useRocketAlertHistory } from '../hooks/useRocketAlerts';
import type { RocketAlertItem } from '../hooks/useRocketAlerts';

function buildGeojson(items: RocketAlertItem[]) {
  const features = items
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
}

/**
 * Renders live rocket/UAV alert positions as red circle markers on the map.
 * When no live alerts are active, falls back to the last 24 h of history
 * shown as dimmed grey markers.
 */
export function RocketAlertLayer() {
  const { data } = useRocketAlerts();
  const isActive = data?.isActive ?? false;

  // Only fetch history when there are no live alerts
  const { data: history } = useRocketAlertHistory(24);

  const liveGeojson = useMemo(() => buildGeojson(data?.live ?? []), [data]);

  const historyGeojson = useMemo(() => {
    if (isActive) return { type: 'FeatureCollection' as const, features: [] };
    const allItems = (history?.days ?? []).flatMap((d) => d.alerts);
    return buildGeojson(allItems);
  }, [history, isActive]);

  // Nothing at all to show
  if (!isActive && historyGeojson.features.length === 0) return null;

  return (
    <>
      {/* ── Live alerts ── shown only when isActive */}
      {isActive && liveGeojson.features.length > 0 && (
        <Source id="rocket-alerts" type="geojson" data={liveGeojson}>
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
              'text-field': ['get', 'nameEn'],
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
      )}

      {/* ── Historical fallback ── dimmed grey dots for last 24 h */}
      {!isActive && historyGeojson.features.length > 0 && (
        <Source id="rocket-alerts-history" type="geojson" data={historyGeojson}>
          {/* Outer halo */}
          <Layer
            id="rocket-alerts-halo"
            type="circle"
            paint={{
              'circle-radius': 12,
              'circle-color': 'rgba(148, 163, 184, 0.08)',
              'circle-stroke-width': 0.5,
              'circle-stroke-color': 'rgba(148, 163, 184, 0.25)',
            }}
          />
          {/* Inner dot */}
          <Layer
            id="rocket-alerts-dot"
            type="circle"
            paint={{
              'circle-radius': 4,
              'circle-color': [
                'match',
                ['get', 'alertTypeId'],
                2,
                'rgba(251, 146, 60, 0.35)', // UAV — dim orange
                'rgba(239, 68, 68, 0.35)', // Rockets — dim red
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': 'rgba(255, 255, 255, 0.2)',
            }}
          />
          {/* Location label */}
          <Layer
            id="rocket-alerts-label"
            type="symbol"
            layout={{
              'text-field': ['get', 'nameEn'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 8,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-max-width': 8,
            }}
            paint={{
              'text-color': 'rgba(180, 180, 200, 0.5)',
              'text-halo-color': 'rgba(0, 0, 0, 0.7)',
              'text-halo-width': 1,
            }}
          />
        </Source>
      )}
    </>
  );
}
