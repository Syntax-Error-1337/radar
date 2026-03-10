import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import { useMilitaryBases } from '../hooks/useMilitaryBases';
import { useMilitaryBasesStore } from '../militaryBases.store';

export const MILITARY_BASES_LAYER_IDS = ['military-bases-halo', 'military-bases-dot'];

// MapLibre expression — color by category
const CATEGORY_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'category'],
  'air',
  '#38bdf8', // sky-400
  'naval',
  '#22d3ee', // cyan-400
  'ground',
  '#4ade80', // green-400
  '#fbbf24', // amber-400 (hq / default)
];

const CATEGORY_HALO: ExpressionSpecification = [
  'match',
  ['get', 'category'],
  'air',
  'rgba(56,  189, 248, 0.18)',
  'naval',
  'rgba(34,  211, 238, 0.15)',
  'ground',
  'rgba(74,  222, 128, 0.15)',
  'rgba(251, 191, 36,  0.15)',
];

/**
 * Renders global military installations on the map,
 * filtered by category toggles in useMilitaryBasesStore.
 */
export function MilitaryBasesLayer() {
  const { enabled, showAir, showNaval, showGround, showHq } = useMilitaryBasesStore();
  const { data: geojson } = useMilitaryBases();

  const filtered = useMemo(() => {
    if (!geojson) return null;
    const allowed = new Set([
      ...(showAir ? ['air'] : []),
      ...(showNaval ? ['naval'] : []),
      ...(showGround ? ['ground'] : []),
      ...(showHq ? ['hq'] : []),
    ]);
    return {
      ...geojson,
      features: geojson.features.filter((f) => allowed.has(f.properties.category)),
    };
  }, [geojson, showAir, showNaval, showGround, showHq]);

  if (!enabled || !filtered) return null;

  return (
    <Source
      id="military-bases"
      type="geojson"
      data={filtered as GeoJSON.FeatureCollection}
      cluster={false}
    >
      {/* Soft glow ring */}
      <Layer
        id="military-bases-halo"
        type="circle"
        paint={{
          'circle-radius': 7,
          'circle-color': CATEGORY_HALO,
          'circle-stroke-width': 0.5,
          'circle-stroke-color': CATEGORY_COLOR,
          'circle-opacity': 0.7,
        }}
      />
      {/* Core dot */}
      <Layer
        id="military-bases-dot"
        type="circle"
        paint={{
          'circle-radius': 2.5,
          'circle-color': CATEGORY_COLOR,
          'circle-opacity': 0.95,
          'circle-stroke-width': 0,
        }}
      />
    </Source>
  );
}
