import { useRef, useEffect, useCallback } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from 'react-map-gl/maplibre';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useOsintStore } from '../../osint/osint.store';

const INITIAL_VIEW_STATE = {
    longitude: 0,
    latitude: 20,
    zoom: 1.5
};

export function MonitorMap() {
    const mapRef = useRef<MapRef>(null);
    const { mapLayer, mapProjection } = useThemeStore();
    const { setCurrentRegion } = useOsintStore();

    const { data: events } = useQuery({
        queryKey: ['monitor', 'acled', 'map'],
        queryFn: async () => {
            const res = await fetch('/api/monitor/acled?limit=1000');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.events;
        },
        refetchInterval: 60000, // 60s
    });

    const acledGeoJSON = useMemo(() => {
        if (!events) return null;
        return {
            type: 'FeatureCollection',
            features: events.map((e: any) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [e.location.longitude, e.location.latitude]
                },
                properties: {
                    id: e.id,
                    eventType: e.eventType,
                    fatalities: e.fatalities
                }
            }))
        };
    }, [events]);

    const activeMapStyle = mapLayer === 'satellite' ? SATELLITE_STYLE : DARK_STYLE;

    const onClick = useCallback((e: import('maplibre-gl').MapMouseEvent) => {
        // Set OSINT region on click, just like FlightsMap
        setCurrentRegion(e.lngLat.lat, e.lngLat.lng);
    }, [setCurrentRegion]);

    // Force map resize on mount to fix MapLibre zero-dimension rendering bug in flex/grid layouts
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="w-full h-full relative bg-black">
            <Map
                ref={mapRef}
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={activeMapStyle}
                styleDiffing={false}
                onClick={onClick}
                cursor="crosshair"
                projection={mapProjection === 'globe' ? { type: 'globe' } as import('maplibre-gl').ProjectionSpecification : { type: 'mercator' } as import('maplibre-gl').ProjectionSpecification}
                doubleClickZoom={mapProjection !== 'globe'}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl
                    position="top-right"
                    showCompass={true}
                    visualizePitch={true}
                />

                {acledGeoJSON && (
                    <Source id="acled-events" type="geojson" data={acledGeoJSON as any}>
                        <Layer
                            id="acled-heatmap"
                            type="heatmap"
                            paint={{
                                'heatmap-weight': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'fatalities'],
                                    0, 0.5,
                                    10, 1
                                ],
                                'heatmap-intensity': 1,
                                'heatmap-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['heatmap-density'],
                                    0, 'rgba(239, 68, 68, 0)',
                                    0.2, 'rgba(239, 68, 68, 0.2)',
                                    0.4, 'rgba(239, 68, 68, 0.4)',
                                    0.6, 'rgba(239, 68, 68, 0.6)',
                                    0.8, 'rgba(239, 68, 68, 0.8)',
                                    1, 'rgba(239, 68, 68, 1)'
                                ],
                                'heatmap-radius': 30,
                                'heatmap-opacity': 0.7
                            }}
                        />
                        <Layer
                            id="acled-points"
                            type="circle"
                            paint={{
                                'circle-radius': 3,
                                'circle-color': '#ef4444',
                                'circle-opacity': 0.9,
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#7f1d1d'
                            }}
                        />
                    </Source>
                )}
            </Map>
            <div className="absolute top-4 left-4 pointer-events-none z-10 bg-black/40 px-3 py-1.5 rounded border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    GLOBAL TACTICAL OVERVIEW
                </div>
            </div>
        </div>
    );
}
