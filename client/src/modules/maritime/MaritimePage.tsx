import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { useMaritimeSnapshot } from './hooks/useMaritimeSnapshot';
import { useVesselSelection } from './hooks/useVesselSelection';
import { useVesselDetail } from './hooks/useVesselDetail';
import { useMaritimeStore } from './state/maritime.store';
import { vesselsToPointGeoJSON, vesselHistoryToLineGeoJSON } from './lib/maritime.geojson';
import { useThemeStore } from '../../ui/theme/theme.store';
import { MapLayerControl } from '../flights/components/MapLayerControl';
import { MaritimeToolbar } from './components/MaritimeToolbar';
import { MaritimeRightDrawer } from './components/MaritimeRightDrawer';
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


export const MaritimePage: React.FC = () => {
    const mapRef = useRef<MapRef>(null);
    const [imagesReady, setImagesReady] = useState(iconsLoaded);
    // Fine-grained selectors
    const mapProjection = useThemeStore(s => s.mapProjection);
    const mapLayer = useThemeStore(s => s.mapLayer);

    useEffect(() => {
        if (!imagesReady) {
            iconsPromise.then(() => setImagesReady(true));
        }
    }, [imagesReady]);

    const { data, isError } = useMaritimeSnapshot();
    const vessels = useMemo(() => data?.vessels || [], [data?.vessels]);
    const timestamp = data?.timestamp || 0;

    const { filters } = useMaritimeStore();
    const { selectedMmsi, setSelectedMmsi, selectedVessel } = useVesselSelection(vessels);

    const filteredVessels = useMemo(() => {
        return vessels.filter(v => {
            if (v.sog != null && v.sog < filters.speedMin) return false;
            if (v.sog != null && v.sog > filters.speedMax) return false;
            if (filters.name && v.name && !v.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
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
            case 'dark':
            default: return MAP_STYLE_URLS.dark;
        }
    }, [mapLayer]);

    // Fetch full vessel detail (incl. history) when a vessel is selected.
    // The snapshot endpoint strips history for bandwidth; this on-demand fetch
    // restores it so the route-history layer and drawer get real data.
    const { data: vesselDetail } = useVesselDetail(selectedMmsi);

    // Use the detail vessel if available (has history), fall back to snapshot vessel
    const activeVessel = vesselDetail ?? selectedVessel;

    const onClose = useCallback(() => setSelectedMmsi(null), [setSelectedMmsi]);

    // Ref pattern: interval reads latest filtered vessels without restarting on every refetch.
    // `dirtyRef` is set true whenever filteredVessels changes so the interval
    // only rebuilds GeoJSON when there is actually new data — at 2 Hz with 30k
    // vessels this avoids ~100ms of wasted JS per tick.
    const filteredVesselsRef = useRef(filteredVessels);
    const dirtyRef = useRef(true); // start dirty so first paint is immediate
    useEffect(() => {
        filteredVesselsRef.current = filteredVessels;
        dirtyRef.current = true;
    }, [filteredVessels]);

    const historyGeoJSON = useMemo(
        () => vesselHistoryToLineGeoJSON(activeVessel ?? null),
        [activeVessel],
    );

    // Stable empty FeatureCollection — actual data pushed via setData() below
    const EMPTY_FC = useRef({ type: 'FeatureCollection' as const, features: [] as never[] }).current;

    // Push vessel GeoJSON directly to MapLibre at 2 Hz — bypasses React renders entirely.
    // Only rebuilds when dirty (new AIS data arrived); skips the tick otherwise.
    useEffect(() => {
        const interval = setInterval(() => {
            if (!dirtyRef.current) return; // nothing changed since last push
            const map = mapRef.current?.getMap();
            if (!map) return;
            dirtyRef.current = false;
            const geojson = vesselsToPointGeoJSON(filteredVesselsRef.current);
            const pointsSource = map.getSource('points') as import('maplibre-gl').GeoJSONSource;
            if (pointsSource?.setData) pointsSource.setData(geojson);
            const haloSource = map.getSource('points-halo') as import('maplibre-gl').GeoJSONSource;
            if (haloSource?.setData) haloSource.setData(geojson);
        }, 500);
        return () => clearInterval(interval);
    }, []);

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

    return (
        <div className="absolute inset-0 bg-intel-bg overflow-hidden flex flex-col">
            <MaritimeToolbar
                totalCount={vessels.length}
                filteredCount={filteredVessels.length}
            />
            {/* <MaritimeLeftPanel /> */}
            <MaritimeRightDrawer vessel={activeVessel ?? null} onClose={onClose} />
            <MapLayerControl />

            <div className="absolute inset-x-0 bottom-8 h-full bg-intel-panel pointer-events-auto z-0" style={{ top: '40px' }}>
                <Map
                    ref={mapRef}
                    initialViewState={{ longitude: -30, latitude: 40, zoom: 3 }}
                    mapStyle={activeMapStyle}
                    styleDiffing={false}
                    interactiveLayerIds={['vessel-points']}
                    onClick={onClick}
                    cursor={selectedMmsi ? 'pointer' : 'crosshair'}
                    onLoad={onMapLoad}
                    onStyleData={onStyleData}
                    onStyleImageMissing={onStyleImageMissing}
                    projection={mapProjection === 'globe' ? { type: 'globe' } as import('maplibre-gl').ProjectionSpecification : { type: 'mercator' } as import('maplibre-gl').ProjectionSpecification}
                    doubleClickZoom={mapProjection !== 'globe'}
                    style={{ width: '100%', height: '100%' }}
                >
                    <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />

                    {/* Historical Route Line — drawn from full vessel detail (includes history array) */}
                    {activeVessel && activeVessel.history && activeVessel.history.length > 1 && (
                        <Source id="vessel-history" type="geojson" data={historyGeoJSON}>
                            <Layer
                                id="vessel-history-line"
                                type="line"
                                paint={{
                                    'line-color': '#10b981',
                                    'line-width': 2,
                                    'line-opacity': 0.6,
                                    'line-dasharray': [2, 2],
                                }}
                            />
                        </Source>
                    )}

                    {/* Blue halo for selected vessel */}
                    <Source id="points-halo" type="geojson" data={EMPTY_FC}>
                        <Layer
                            id="vessel-points-halo"
                            type="circle"
                            paint={{
                                'circle-radius': ['case', ['==', ['get', 'mmsi'], selectedMmsi || 0], 12, 0],
                                'circle-color': 'transparent',
                                'circle-stroke-width': ['case', ['==', ['get', 'mmsi'], selectedMmsi || 0], 2, 0],
                                'circle-stroke-color': '#3b82f6',
                            }}
                        />
                    </Source>

                    {imagesReady && (
                        <Source id="points" type="geojson" data={EMPTY_FC}>
                            <Layer
                                id="vessel-points"
                                type="symbol"
                                layout={{
                                    'icon-image': [
                                        'case',
                                        ['==', ['get', 'mmsi'], selectedMmsi || 0], 'ship-white',
                                        ['in', ['get', 'navigationalStatus'], ['literal', [1, 5]]], 'ship-orange',
                                        'ship-green',
                                    ],
                                    'icon-size': 0.7,
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
