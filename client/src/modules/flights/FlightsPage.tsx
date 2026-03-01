import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useFlightsSnapshot } from './hooks/useFlightsSnapshot';
import { useFlightSelection } from './hooks/useFlightSelection';
import { useFlightTrack } from './hooks/useFlightTrack';
import { useFlightsStore } from './state/flights.store';
import { TrackManager } from './lib/flights.tracks';
import { statesToPointGeoJSON } from './lib/flights.geojson';
import { extrapolateState } from './lib/flights.extrapolation';
import { FlightsToolbar } from './components/FlightsToolbar';
import { FlightsLeftPanel } from './components/FlightsLeftPanel';
import { FlightsRightDrawer } from './components/FlightsRightDrawer';
import { FlightsStatusBar } from './components/FlightsStatusBar';
import { MapLayerControl } from './components/MapLayerControl';
import { useThemeStore } from '../../ui/theme/theme.store';

const trackManager = new TrackManager(5);

const airplanePath = "M9.123 30.464l-1.33-6.268-6.318-1.397 1.291-2.475 5.785-0.316c0.297-0.386 0.96-1.234 1.374-1.648l5.271-5.271-10.989-5.388 2.782-2.782 13.932 2.444 4.933-4.933c0.585-0.585 1.496-0.894 2.634-0.894 0.776 0 1.395 0.143 1.421 0.149l0.3 0.070 0.089 0.295c0.469 1.55 0.187 3.298-0.67 4.155l-4.956 4.956 2.434 13.875-2.782 2.782-5.367-10.945-4.923 4.924c-0.518 0.517-1.623 1.536-2.033 1.912l-0.431 5.425-2.449 1.329zM3.065 22.059l5.63 1.244 1.176 5.544 0.685-0.372 0.418-5.268 0.155-0.142c0.016-0.014 1.542-1.409 2.153-2.020l5.978-5.979 5.367 10.945 1.334-1.335-2.434-13.876 5.349-5.348c0.464-0.464 0.745-1.598 0.484-2.783-0.216-0.032-0.526-0.066-0.87-0.066-0.593 0-1.399 0.101-1.881 0.582l-5.325 5.325-13.933-2.444-1.335 1.334 10.989 5.388-6.326 6.326c-0.483 0.482-1.418 1.722-1.428 1.734l-0.149 0.198-5.672 0.31-0.366 0.702z";

const createColoredAirplane = (color: string) => {
    const svgString = `<svg width="32" height="32" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="clip-wing-left" clipPathUnits="userSpaceOnUse"><polygon points="0,0 18,0 18,17 0,26" /></clipPath>
    <clipPath id="clip-wing-right" clipPathUnits="userSpaceOnUse"><polygon points="12,0 32,0 32,32 16,32 16,10" /></clipPath>
    <clipPath id="clip-tail" clipPathUnits="userSpaceOnUse"><polygon points="0,16 16,16 16,32 0,32" /></clipPath>
    <clipPath id="clip-body" clipPathUnits="userSpaceOnUse"><polygon points="9,6 26,0 32,0 32,10 14,24 6,20" /></clipPath>
  </defs>
  <g clip-path="url(#clip-wing-left)"><path d="${airplanePath}" fill="${color}"/></g>
  <g clip-path="url(#clip-wing-right)"><path d="${airplanePath}" fill="${color}"/></g>
  <g clip-path="url(#clip-body)"><path d="${airplanePath}" fill="${color}"/></g>
  <g clip-path="url(#clip-tail)"><path d="${airplanePath}" fill="${color}"/></g>
</svg>`;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

const ICON_URLS = {
    'aircraft-white': createColoredAirplane('#ffffff'),
    'aircraft-green': createColoredAirplane('#10b981'),
    'aircraft-orange': createColoredAirplane('#f59e0b'),
};

const PRELOADED_ICONS: Record<string, HTMLImageElement> = {};
let iconsLoaded = false;
const iconsPromise = Promise.all(
    Object.entries(ICON_URLS).map(([id, url]) => new Promise<void>(resolve => {
        const img = new Image(32, 32);
        img.onload = () => {
            PRELOADED_ICONS[id] = img;
            resolve();
        };
        img.src = url;
    }))
).then(() => {
    iconsLoaded = true;
});

export const FlightsPage: React.FC = () => {
    const mapRef = useRef<MapRef>(null);
    const [imagesReady, setImagesReady] = useState(iconsLoaded);
    const { mapProjection, mapLayer } = useThemeStore();

    useEffect(() => {
        if (!imagesReady) {
            iconsPromise.then(() => setImagesReady(true));
        }
    }, [imagesReady]);

    const { data, isError } = useFlightsSnapshot();
    const states = data?.states || [];
    const timestamp = data?.timestamp || 0;

    const { filters } = useFlightsStore();
    const { selectedIcao24, setSelectedIcao24, selectedFlight } = useFlightSelection(states);
    const { data: trackHistory } = useFlightTrack(selectedIcao24);

    const filteredStates = useMemo(() => {
        return states.filter(s => {
            if (!filters.showOnGround && s.onGround) return false;
            if (s.baroAltitude != null && s.baroAltitude > filters.altitudeMax) return false;
            if (s.velocity != null && s.velocity > filters.speedMax) return false;
            if (filters.callsign && s.callsign && !s.callsign.includes(filters.callsign)) return false;
            return true;
        });
    }, [states, filters]);

    const activeMapStyle = useMemo(() => {
        switch (mapLayer) {
            case 'light': return 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
            case 'street': return 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
            case 'satellite': return {
                version: 8,
                sources: {
                    esri: {
                        type: 'raster',
                        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                        tileSize: 256
                    }
                },
                layers: [{
                    id: 'esri-satellite',
                    type: 'raster',
                    source: 'esri',
                    minzoom: 0,
                    maxzoom: 19
                }]
            } as any;
            case 'dark':
            default: return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
        }
    }, [mapLayer]);

    // Tracks state is now fully handled in requestAnimationFrame loop
    // no need for React state to manage GeoJSON for better perf

    useEffect(() => {
        if (states.length > 0 && timestamp > 0) {
            trackManager.update(states, timestamp);
            // We don't call setTracksGeoJSON here anymore since requestAnimationFrame handles it
        }
    }, [states, timestamp]);

    const pointsGeoJSON = useMemo(() => statesToPointGeoJSON(filteredStates), [filteredStates]);

    const historicalGeoJSON = useMemo<any>(() => {
        if (!trackHistory || !trackHistory.path) return { type: 'FeatureCollection', features: [] };

        // OpenSky paths are arrays of [time, lat, lon, baro, track, on_ground]
        const coordinates = trackHistory.path
            .filter((pt: any) => pt[1] !== null && pt[2] !== null)
            .map((pt: any) => [pt[2], pt[1]]); // Map to [lon, lat] for GeoJSON

        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: { icao24: selectedIcao24 }
            }]
        };
    }, [trackHistory, selectedIcao24]);

    const onClick = (e: any) => {
        const feature = e.features?.[0];
        if (feature && feature.properties?.icao24) {
            setSelectedIcao24(feature.properties.icao24);
        } else {
            setSelectedIcao24(null);
        }
    };

    const onMapLoad = useCallback((e: any) => {
        const map = e.target;
        if (iconsLoaded) {
            Object.entries(PRELOADED_ICONS).forEach(([id, img]) => {
                if (!map.hasImage(id)) {
                    map.addImage(id, img);
                }
            });
        }
    }, []);

    const onStyleImageMissing = useCallback((e: any) => {
        const id = e.id;
        const map = e.target;
        if (PRELOADED_ICONS[id] && !map.hasImage(id)) {
            map.addImage(id, PRELOADED_ICONS[id]);
        }
    }, []);

    useEffect(() => {
        let animationFrameId: number;
        let lastUpdateTime = 0;

        const animate = (time: number) => {
            const map = mapRef.current?.getMap();
            if (map && filteredStates.length > 0) {
                const zoom = map.getZoom();

                // Adaptive FPS based on zoom level:
                // <= 5: 1 FPS (every 1000ms)
                // <= 8: 5 FPS (every 200ms)
                // > 8: 30 FPS (every 33ms)
                let updateInterval = 1000;
                if (zoom > 8) updateInterval = 33;
                else if (zoom > 5) updateInterval = 200;

                if (time - lastUpdateTime > updateInterval) {
                    const nowSeconds = Date.now() / 1000;
                    const extrapolatedStates = filteredStates.map(state => extrapolateState(state, nowSeconds));
                    const geojson = statesToPointGeoJSON(extrapolatedStates);

                    // Prevent NaN coordinates from reaching Mapbox source
                    if (!geojson.features.some((f: any) => Number.isNaN(f.geometry.coordinates[0]))) {
                        const pointsSource = map.getSource('points') as any;
                        if (pointsSource?.setData) pointsSource.setData(geojson);

                        const haloSource = map.getSource('points-halo') as any;
                        if (haloSource?.setData) haloSource.setData(geojson);

                        // Also update tracks continuously so the line connects to the moving aircraft
                        const tracksSource = map.getSource('tracks') as any;
                        if (tracksSource?.setData) {
                            tracksSource.setData(trackManager.getLineGeoJSON(extrapolatedStates));
                        }

                        // Update historical selected track to tightly follow selected aircraft
                        if (selectedIcao24 && historicalGeoJSON.features.length > 0) {
                            const selectedState = extrapolatedStates.find(s => s.icao24 === selectedIcao24);
                            if (selectedState) {
                                const updatedHistorical = {
                                    ...historicalGeoJSON,
                                    features: [{
                                        ...historicalGeoJSON.features[0],
                                        geometry: {
                                            ...historicalGeoJSON.features[0].geometry,
                                            coordinates: [
                                                ...historicalGeoJSON.features[0].geometry.coordinates,
                                                [selectedState.lon, selectedState.lat]
                                            ]
                                        }
                                    }]
                                };
                                const historicalSource = map.getSource('historical-tracks') as any;
                                if (historicalSource?.setData) {
                                    historicalSource.setData(updatedHistorical);
                                }
                            }
                        }
                    }

                    lastUpdateTime = time;
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [filteredStates, selectedIcao24, historicalGeoJSON]);

    return (
        <div className="absolute inset-0 bg-intel-bg overflow-hidden flex flex-col">
            <FlightsToolbar />
            <FlightsLeftPanel data={filteredStates} />
            <FlightsRightDrawer flight={selectedFlight} onClose={() => setSelectedIcao24(null)} />
            <MapLayerControl />

            <div className="absolute inset-x-0 bottom-8 h-full bg-intel-panel pointer-events-auto z-0" style={{ top: '40px' }}>
                <Map
                    ref={mapRef}
                    key={`map-${mapProjection}`}
                    initialViewState={{
                        longitude: -30,
                        latitude: 40,
                        zoom: 3
                    }}
                    mapStyle={activeMapStyle}
                    interactiveLayerIds={['aircraft-points']}
                    onClick={onClick}
                    cursor={selectedIcao24 ? "pointer" : "crosshair"}
                    onLoad={onMapLoad}
                    onStyleImageMissing={onStyleImageMissing}
                    projection={mapProjection === 'globe' ? { type: 'globe' } as any : undefined}
                    style={{ width: '100%', height: '100%' }}
                >
                    <NavigationControl position="top-right" />

                    <Source id="tracks" type="geojson" data={{ type: 'FeatureCollection', features: [] }}>
                        {/* Dim track for unselected aircraft */}
                        <Layer
                            id="aircraft-tracks"
                            type="line"
                            paint={{
                                'line-color': '#3b82f6',
                                'line-width': 1,
                                'line-opacity': ['case', ['==', ['get', 'icao24'], selectedIcao24 || ''], 0, 0.15]
                            }}
                        />
                    </Source>

                    {/* Bold fading trail from OpenSky Historical API for the selected aircraft */}
                    <Source id="historical-tracks" type="geojson" data={historicalGeoJSON} lineMetrics={true}>
                        <Layer
                            id="aircraft-tracks-selected"
                            type="line"
                            paint={{
                                'line-width': 3,
                                'line-gradient': [
                                    'interpolate',
                                    ['linear'],
                                    ['line-progress'],
                                    0, 'rgba(192, 38, 211, 0)',   // Transparent magenta at oldest point
                                    1, 'rgba(192, 38, 211, 1)'    // Solid magenta at front of aircraft
                                ]
                            }}
                        />
                    </Source>

                    {/* Blue halo circle underneath for selected aircraft */}
                    <Source id="points-halo" type="geojson" data={pointsGeoJSON}>
                        <Layer
                            id="aircraft-points-halo"
                            type="circle"
                            paint={{
                                'circle-radius': ['case', ['==', ['get', 'icao24'], selectedIcao24 || ''], 10, 0],
                                'circle-color': 'transparent',
                                'circle-stroke-width': ['case', ['==', ['get', 'icao24'], selectedIcao24 || ''], 2, 0],
                                'circle-stroke-color': '#3b82f6'
                            }}
                        />
                    </Source>

                    {imagesReady && (
                        <Source id="points" type="geojson" data={pointsGeoJSON}>
                            <Layer
                                id="aircraft-points"
                                type="symbol"
                                layout={{
                                    'icon-image': [
                                        'case',
                                        ['==', ['get', 'icao24'], selectedIcao24 || ''], 'aircraft-white',
                                        ['boolean', ['get', 'onGround'], false], 'aircraft-orange',
                                        'aircraft-green'
                                    ],
                                    'icon-size': 0.8,
                                    'icon-rotate': ['-', ['get', 'heading'], 45],
                                    'icon-allow-overlap': true,
                                }}
                            />
                        </Source>
                    )}
                </Map>
            </div>

            <FlightsStatusBar
                lastUpdated={timestamp}
                isError={isError}
                provider={import.meta.env.VITE_FLIGHT_PROVIDER || 'opensky'}
            />
        </div>
    );
};
