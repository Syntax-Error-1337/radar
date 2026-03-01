import type { AircraftState } from './flights.types';

// Earth radius in meters
const R = 6378137;

export function extrapolateState(state: AircraftState, nowSeconds: number): AircraftState {
    if (state.onGround || state.velocity == null || state.heading == null || state.lastContact == null) {
        return state;
    }

    const dt = nowSeconds - state.lastContact;

    // Don't extrapolate backward, or too far into the future (e.g. > 60s stale), or if NaN
    if (dt <= 0 || dt > 60 || Number.isNaN(dt)) {
        return state;
    }

    // Velocity is in m/s
    const distance = state.velocity * dt;

    // Convert heading from degrees to radians
    const headingRad = state.heading * Math.PI / 180;

    // Convert lat/lon to radians
    const latRad = state.lat * Math.PI / 180;

    // Simple flat earth approximation, accurate enough for short distances (e.g. < 50km)
    // 1 degree of latitude = ~111,320 meters
    const latDiff = (distance * Math.cos(headingRad)) / 111320;

    // 1 degree of longitude = ~111,320 meters * cos(latitude)
    const lonDiff = (distance * Math.sin(headingRad)) / (111320 * Math.cos(latRad));

    const newLat = state.lat + latDiff;
    const newLon = state.lon + lonDiff;

    if (Number.isNaN(newLat) || Number.isNaN(newLon)) {
        return state;
    }

    return {
        ...state,
        lat: Number(newLat.toFixed(5)),
        lon: Number(newLon.toFixed(5))
    };
}
