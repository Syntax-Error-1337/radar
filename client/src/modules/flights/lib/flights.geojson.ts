import { AircraftState } from './flights.types';

export function statesToPointGeoJSON(states: AircraftState[]) {
    return {
        type: 'FeatureCollection' as const,
        features: states.map(state => ({
            type: 'Feature' as const,
            id: state.icao24,
            geometry: {
                type: 'Point' as const,
                coordinates: [state.lon, state.lat]
            },
            properties: {
                icao24: state.icao24,
                callsign: state.callsign,
                heading: state.heading,
                altitude: state.baroAltitude,
                velocity: state.velocity,
                onGround: state.onGround
            }
        }))
    };
}
