import React, { useMemo, useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useFlightsSnapshot } from './hooks/useFlightsSnapshot';
import { useFlightSelection } from './hooks/useFlightSelection';
import { useFlightTrack } from './hooks/useFlightTrack';
import { useFlightsStore } from './state/flights.store';
import { TrackManager } from './lib/flights.tracks';
import { statesToPointGeoJSON } from './lib/flights.geojson';
import { FlightsToolbar } from './components/FlightsToolbar';
import { FlightsLeftPanel } from './components/FlightsLeftPanel';
import { FlightsRightDrawer } from './components/FlightsRightDrawer';
import { FlightsStatusBar } from './components/FlightsStatusBar';

const trackManager = new TrackManager(5);

const createColoredAirplane = (color: string) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="none">
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5.5-3.5 3.5-3.2-1.1c-.4-.1-.8.1-1 .5L1 17l4 2 2 4 .6-.3c.4-.2.6-.6.5-1l-1.1-3.2 3.5-3.5 5.5 6 1.2-.7c.4-.2.7-.6.6-1.1z"/>
</svg>`;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

const ICONS = {
    'aircraft-white': createColoredAirplane('#ffffff'),
    'aircraft-green': createColoredAirplane('#10b981'),
    'aircraft-orange': createColoredAirplane('#f59e0b'),
};

export const FlightsPage: React.FC = () => {
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

    const [tracksGeoJSON, setTracksGeoJSON] = useState<any>({ type: 'FeatureCollection', features: [] });

    useEffect(() => {
        if (states.length > 0 && timestamp > 0) {
            trackManager.update(states, timestamp);
            setTracksGeoJSON(trackManager.getLineGeoJSON());
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

    const onMapLoad = (e: any) => {
        const map = e.target;
        Object.entries(ICONS).forEach(([id, url]) => {
            if (!map.hasImage(id)) {
                const img = new Image(24, 24);
                img.onload = () => {
                    if (!map.hasImage(id)) {
                        map.addImage(id, img);
                    }
                };
                img.src = url;
            }
        });
    };

    const onStyleImageMissing = (e: any) => {
        const id = e.id;
        const map = e.target;
        const iconUrl = ICONS[id as keyof typeof ICONS];
        if (iconUrl && !map.hasImage(id)) {
            const img = new Image(24, 24);
            img.onload = () => {
                if (!map.hasImage(id)) {
                    map.addImage(id, img);
                }
            };
            img.src = iconUrl;
        }
    };

    return (
        <div className="absolute inset-0 bg-intel-bg overflow-hidden flex flex-col">
            <FlightsToolbar />
            <FlightsLeftPanel data={filteredStates} />
            <FlightsRightDrawer flight={selectedFlight} onClose={() => setSelectedIcao24(null)} />

            <div className="absolute inset-x-0 bottom-8 h-full bg-intel-panel pointer-events-auto z-0" style={{ top: '40px' }}>
                <Map
                    initialViewState={{
                        longitude: -30,
                        latitude: 40,
                        zoom: 3
                    }}
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    interactiveLayerIds={['aircraft-points']}
                    onClick={onClick}
                    cursor={selectedIcao24 ? "pointer" : "crosshair"}
                    onLoad={onMapLoad}
                    onStyleImageMissing={onStyleImageMissing}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Source id="tracks" type="geojson" data={tracksGeoJSON}>
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
                                'icon-rotate': ['get', 'heading'],
                                'icon-allow-overlap': true,
                            }}
                        />
                    </Source>
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
