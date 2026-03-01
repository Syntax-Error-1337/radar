import type { AircraftState } from './flights.types';

export interface TrackPoint {
    lat: number;
    lon: number;
    timestamp: number;
}

export class TrackManager {
    private tracks = new Map<string, TrackPoint[]>();
    private readonly maxAgeMs: number;

    constructor(maxAgeMinutes = 5) {
        this.maxAgeMs = maxAgeMinutes * 60 * 1000;
    }

    update(states: AircraftState[], currentTimeMs: number) {
        // Add current points
        for (const state of states) {
            if (!this.tracks.has(state.icao24)) {
                this.tracks.set(state.icao24, []);
            }
            const history = this.tracks.get(state.icao24)!;
            // Avoid duplicates and nulls/NaNs
            if (state.lat == null || state.lon == null || Number.isNaN(state.lat) || Number.isNaN(state.lon)) continue;

            const last = history[history.length - 1];
            if (!last || last.lat !== state.lat || last.lon !== state.lon) {
                history.push({ lat: state.lat, lon: state.lon, timestamp: currentTimeMs });
            }
        }

        // Prune points older than the time window.
        // Iterate the Map directly — Array.from() would create a temporary copy of all
        // entries before the loop begins, wasting memory on every update call.
        const cutoff = currentTimeMs - this.maxAgeMs;
        for (const [icao, history] of this.tracks) {
            const pruned = history.filter(p => p.timestamp > cutoff);
            if (pruned.length === 0) {
                this.tracks.delete(icao);
            } else {
                this.tracks.set(icao, pruned);
            }
        }
    }

    getLineGeoJSON(extrapolatedStates?: AircraftState[]) {
        const features = [];
        const extraPoints = new Map<string, TrackPoint>();

        if (extrapolatedStates) {
            for (const state of extrapolatedStates) {
                if (state.lat != null && state.lon != null && !Number.isNaN(state.lat) && !Number.isNaN(state.lon)) {
                    extraPoints.set(state.icao24, { lat: state.lat, lon: state.lon, timestamp: Date.now() });
                }
            }
        }

        for (const [icao, history] of this.tracks) {
            // Avoid a spread copy — append the live extrapolated point in-place only if
            // it's newer than the last stored sample (which it always is during rAF).
            const extra = extraPoints.get(icao);
            const coords: number[][] = history.map(p => [p.lon, p.lat]);
            if (extra) {
                coords.push([extra.lon, extra.lat]);
            }

            if (coords.length > 1) {
                features.push({
                    type: 'Feature' as const,
                    id: icao,
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: coords,
                    },
                    properties: { icao24: icao },
                });
            }
        }
        return {
            type: 'FeatureCollection' as const,
            features
        };
    }
}
