import type { AircraftState } from './flights.types';

export function statesToPointGeoJSON(states: AircraftState[]) {
    return {
        type: 'FeatureCollection' as const,
        features: states
            .filter(state => state.lon != null && state.lat != null && !Number.isNaN(state.lon) && !Number.isNaN(state.lat))
            .map(state => ({
                type: 'Feature' as const,
                id: state.icao24,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [state.lon, state.lat]
                },
                properties: {
                    icao24: state.icao24,
                    callsign: state.callsign,
                    heading: state.heading ?? 0,
                    altitude: state.baroAltitude ?? 0,
                    velocity: state.velocity ?? 0,
                    onGround: state.onGround
                }
            }))
    };
}
