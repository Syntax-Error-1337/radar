import type { StyleSpecification } from 'maplibre-gl';

/**
 * Shared map style URLs and objects used across all map-bearing pages.
 * Centralised here so changes (e.g. swapping a tile provider) only need to
 * happen in one place and both FlightsPage and MaritimePage stay in sync.
 */

export const MAP_STYLE_URLS = {
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    street: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    nautical: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
} as const;

/**
 * ESRI World Imagery satellite style.
 * Expressed as a StyleSpecification object (not a URL) because ESRI's tile
 * service doesn't expose a MapLibre-compatible JSON endpoint.
 *
 * IMPORTANT: assign this constant directly as mapStyle — do NOT wrap it in
 * useMemo() inside a component. It is already a stable module-level reference,
 * so react-map-gl will never see a changed prop and won't trigger a style diff.
 */
export const SATELLITE_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        esri: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
        },
    },
    layers: [{
        id: 'esri-satellite',
        type: 'raster',
        source: 'esri',
        minzoom: 0,
        maxzoom: 19,
    }],
};
