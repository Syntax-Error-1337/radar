import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { useMaritimeSnapshot } from './hooks/useMaritimeSnapshot';
import { useVesselSelection } from './hooks/useVesselSelection';
import { useMaritimeStore } from './state/maritime.store';
import { vesselsToPointGeoJSON, vesselHistoryToLineGeoJSON } from './lib/maritime.geojson';
import { useThemeStore } from '../../ui/theme/theme.store';
import { MapLayerControl } from '../flights/components/MapLayerControl';
import { MaritimeToolbar } from './components/MaritimeToolbar';
import { MaritimeRightDrawer } from './components/MaritimeRightDrawer';
import { ZoomIn } from 'lucide-react';
import { SATELLITE_STYLE, MAP_STYLE_URLS } from '../../lib/mapStyles';


const ICON_URLS = {
    'ship-white': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23ffffff" stroke="%23000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    'ship-green': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%2310b981" stroke="%23042f2e" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    'ship-orange': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23f59e0b" stroke="%23451a03" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
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

// Minimum zoom level for OpenSeaMap seamark tiles to have data
const CHART_MIN_ZOOM = 8;

export const MaritimePage: React.FC = () => {
    const mapRef = useRef<MapRef>(null);
    const [imagesReady, setImagesReady] = useState(iconsLoaded);
    const [mapZoom, setMapZoom] = useState(3);
    // Fine-grained selectors — each field triggers its own re-render slice
    const mapProjection = useThemeStore(s => s.mapProjection);
    const mapLayer = useThemeStore(s => s.mapLayer);
    const setMapLayer = useThemeStore(s => s.setMapLayer);

    useEffect(() => {
        if (!imagesReady) {
            iconsPromise.then(() => setImagesReady(true));
        }
    }, [imagesReady]);

    const { data, isError } = useMaritimeSnapshot();
    const vessels = useMemo(() => data?.vessels || [], [data?.vessels]);
    const timestamp = data?.timestamp || 0;

    const { filters, showNauticalChart, setShowNauticalChart } = useMaritimeStore();
    const { selectedMmsi, setSelectedMmsi, selectedVessel } = useVesselSelection(vessels);

    // When chart is toggled ON: switch to nautical base map and zoom in if needed
    const handleChartToggle = useCallback((on: boolean) => {
        setShowNauticalChart(on);
        if (on) {
            // Only switch from dark — satellite uses an object style so switching to a URL
            // string triggers a MapLibre style-diff crash. Seamark overlay looks fine on satellite.
            if (mapLayer === 'dark') {
                setMapLayer('nautical');
            }
            // Fly in to minimum zoom where chart data exists
            const map = mapRef.current?.getMap();
            if (map && map.getZoom() < CHART_MIN_ZOOM) {
                map.flyTo({ zoom: CHART_MIN_ZOOM, duration: 1500, essential: true });
            }
        }
    }, [mapLayer, setMapLayer, setShowNauticalChart]);

    const filteredVessels = useMemo(() => {
        return vessels.filter(v => {
            if (v.sog != null && v.sog < filters.speedMin) return false;
            if (v.sog != null && v.sog > filters.speedMax) return false;
            if (filters.name && v.name && !v.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
            // Navigational status: 1 or 5 usually means moored
            const isMoored = v.navigationalStatus === 1 || v.navigationalStatus === 5;
            if (!filters.showUnderway && !isMoored) return false;
            if (!filters.showMoored && isMoored) return false;
            return true;
        });
    }, [vessels, filters]);

    const activeMapStyle = useMemo(() => {
        switch (mapLayer) {
            case 'light': return MAP_STYLE_URLS.light;
            case 'street': return MAP_STYLE_URLS.street;
            case 'satellite': return SATELLITE_STYLE;
            case 'nautical': return MAP_STYLE_URLS.nautical;
            case 'dark':
            default: return MAP_STYLE_URLS.dark;
        }
    }, [mapLayer]);

    // Keep points directly via React state since ship interpolation might not be as critical or 
    // requires more complex rhumb line extrapolation, for now direct rendering is enough.
    // AIS updates are often every few seconds/minutes anyway.
    const pointsGeoJSON = useMemo(() => vesselsToPointGeoJSON(filteredVessels), [filteredVessels]);
    const historyGeoJSON = useMemo(() => vesselHistoryToLineGeoJSON(selectedVessel), [selectedVessel]);

    const onClick = useCallback((e: import('maplibre-gl').MapMouseEvent & { features?: import('maplibre-gl').MapGeoJSONFeature[] }) => {
        const feature = e.features?.[0];
        if (feature && feature.properties?.mmsi) {
            setSelectedMmsi(feature.properties.mmsi);
        } else {
            setSelectedMmsi(null);
        }
    }, [setSelectedMmsi]);

    const onMapLoad = useCallback((e: { target: import('maplibre-gl').Map }) => {
        const map = e.target;
        setMapZoom(map.getZoom());
        if (iconsLoaded) {
            Object.entries(PRELOADED_ICONS).forEach(([id, img]) => {
                if (!map.hasImage(id)) map.addImage(id, img);
            });
        }
    }, []);

    const onStyleImageMissing = useCallback((e: { id: string; target: import('maplibre-gl').Map }) => {
        const id = e.id;
        const map = e.target;
        if (PRELOADED_ICONS[id] && !map.hasImage(id)) {
            map.addImage(id, PRELOADED_ICONS[id]);
        }
    }, []);

    const onStyleData = useCallback((e: { dataType: string; target: import('maplibre-gl').Map }) => {
        if (e.dataType !== 'style') return;
        const map = e.target;
        if (iconsLoaded) {
            Object.entries(PRELOADED_ICONS).forEach(([id, img]) => {
                if (!map.hasImage(id)) map.addImage(id, img);
            });
        }
    }, []);

    const onZoom = useCallback((e: { target: import('maplibre-gl').Map }) => {
        const z = e.target.getZoom();
        // Only update React state when crossing the threshold — avoids re-renders on every
        // animation frame during flyTo which would repeatedly trigger the style diff.
        setMapZoom(prev => {
            const wasLow = prev < CHART_MIN_ZOOM;
            const isLow = z < CHART_MIN_ZOOM;
            return wasLow !== isLow ? z : prev;
        });
    }, []);

    const chartZoomTooLow = showNauticalChart && mapZoom < CHART_MIN_ZOOM;

    return (
        <div className="absolute inset-0 bg-intel-bg overflow-hidden flex flex-col">
            <MaritimeToolbar
                totalCount={vessels.length}
                filteredCount={filteredVessels.length}
                onChartToggle={handleChartToggle}
            />
            {/* <MaritimeLeftPanel /> */}
            <MaritimeRightDrawer vessel={selectedVessel} onClose={() => setSelectedMmsi(null)} />
            <MapLayerControl />

            {/* Zoom-in hint when chart is on but map is too far out */}
            {chartZoomTooLow && (
                <div
                    className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 bg-[#10b981]/15 border border-[#10b981]/40 backdrop-blur-sm px-4 py-2 font-mono text-[11px] text-[#10b981] cursor-pointer hover:bg-[#10b981]/25 transition-colors"
                    onClick={() => {
                        const map = mapRef.current?.getMap();
                        if (map) map.flyTo({ zoom: CHART_MIN_ZOOM, duration: 1200, essential: true });
                    }}
                    title="Click to zoom in and reveal nautical chart data"
                >
                    <ZoomIn size={13} />
                    <span className="uppercase tracking-widest font-bold">CHART ACTIVE — ZOOM IN TO SEE DETAIL</span>
                    <span className="opacity-60 ml-1">▸ Click to zoom</span>
                </div>
            )}

            <div className="absolute inset-x-0 bottom-8 h-full bg-intel-panel pointer-events-auto z-0" style={{ top: '40px' }}>
                <Map
                    ref={mapRef}
                    initialViewState={{
                        longitude: -30,
                        latitude: 40,
                        zoom: 3
                    }}
                    mapStyle={activeMapStyle}
                    styleDiffing={false}
                    interactiveLayerIds={['vessel-points']}
                    onClick={onClick}
                    cursor={selectedMmsi ? "pointer" : "crosshair"}
                    onLoad={onMapLoad}
                    onStyleData={onStyleData}
                    onStyleImageMissing={onStyleImageMissing}
                    onZoom={onZoom}
                    projection={mapProjection === 'globe' ? { type: 'globe' } as import('maplibre-gl').ProjectionSpecification : { type: 'mercator' } as import('maplibre-gl').ProjectionSpecification}
                    doubleClickZoom={mapProjection !== 'globe'}
                    style={{ width: '100%', height: '100%' }}
                >
                    <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />

                    {/* === NAUTICAL CHART LAYERS (rendered below vessel layers) === */}
                    {showNauticalChart && (
                        <>
                            <Source
                                id="openseamap"
                                type="raster"
                                tiles={['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png']}
                                tileSize={256}
                                minzoom={1}
                                maxzoom={18}
                                attribution="© <a href='https://www.openseamap.org' target='_blank'>OpenSeaMap</a> contributors"
                            >
                                <Layer
                                    id="openseamap-layer"
                                    type="raster"
                                    paint={{
                                        'raster-opacity': 0.9,
                                        'raster-fade-duration': 300,
                                    }}
                                />
                            </Source>
                        </>
                    )}

                    {/* Historical Route Line */}
                    {selectedVessel && selectedVessel.history && selectedVessel.history.length > 1 && (
                        <Source id="vessel-history" type="geojson" data={historyGeoJSON}>
                            <Layer
                                id="vessel-history-line"
                                type="line"
                                paint={{
                                    'line-color': '#10b981',
                                    'line-width': 2,
                                    'line-opacity': 0.6,
                                    'line-dasharray': [2, 2]
                                }}
                            />
                        </Source>
                    )}

                    {/* Blue halo circle underneath for selected vessel */}
                    <Source id="points-halo" type="geojson" data={pointsGeoJSON}>
                        <Layer
                            id="vessel-points-halo"
                            type="circle"
                            paint={{
                                'circle-radius': ['case', ['==', ['get', 'mmsi'], selectedMmsi || 0], 12, 0],
                                'circle-color': 'transparent',
                                'circle-stroke-width': ['case', ['==', ['get', 'mmsi'], selectedMmsi || 0], 2, 0],
                                'circle-stroke-color': '#3b82f6'
                            }}
                        />
                    </Source>

                    {imagesReady && (
                        <Source id="points" type="geojson" data={pointsGeoJSON}>
                            <Layer
                                id="vessel-points"
                                type="symbol"
                                layout={{
                                    'icon-image': [
                                        'case',
                                        ['==', ['get', 'mmsi'], selectedMmsi || 0], 'ship-white',
                                        ['in', ['get', 'navigationalStatus'], ['literal', [1, 5]]], 'ship-orange',
                                        'ship-green'
                                    ],
                                    'icon-size': 0.7,
                                    // Ship heading or COG, default 0
                                    'icon-rotate': ['coalesce', ['get', 'heading'], ['get', 'cog'], 0],
                                    'icon-rotation-alignment': 'map',
                                    'icon-allow-overlap': true,
                                }}
                            />
                        </Source>
                    )}
                </Map>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-8 bg-intel-panel border-t border-white/10 flex items-center px-4 justify-between text-xs text-intel-text z-50 overflow-hidden shrink-0 font-mono">
                <div className="flex space-x-6 items-center flex-1">
                    <span className="flex items-center">
                        <span className="opacity-50 mr-2 uppercase tracking-wide">DATA LINK:</span>
                        <span className="text-white font-semibold">AISSTREAM</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isError ? 'bg-red-500/20 text-red-400' : 'bg-[#10b981]/20 text-[#10b981]'}`}>
                        {isError ? 'CONNECTION_ERROR' : 'SECURE_ACTIVE'}
                    </span>
                </div>
                <div className="flex space-x-6 shrink-0 opacity-70">
                    <span className="uppercase tracking-wide tabular-nums">LAST UPDATE: {new Date(timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
};
