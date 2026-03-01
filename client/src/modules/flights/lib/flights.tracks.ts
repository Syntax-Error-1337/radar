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
            // Avoid duplicates
            const last = history[history.length - 1];
            if (!last || last.lat !== state.lat || last.lon !== state.lon) {
                history.push({ lat: state.lat, lon: state.lon, timestamp: currentTimeMs });
            }
        }

        // Prune points older than the time window.
        // Only delete the track when *no* points survive — a single recent point
        // is valid and should grow on the next update call.
        const cutoff = currentTimeMs - this.maxAgeMs;
        for (const [icao, history] of Array.from(this.tracks.entries())) {
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
                extraPoints.set(state.icao24, { lat: state.lat, lon: state.lon, timestamp: Date.now() });
            }
        }

        for (const [icao, history] of this.tracks.entries()) {
            const currentHistory = [...history];
            const extra = extraPoints.get(icao);

            if (extra) {
                currentHistory.push(extra);
            }

            if (currentHistory.length > 1) {
                features.push({
                    type: 'Feature' as const,
                    id: icao,
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: currentHistory.map(p => [p.lon, p.lat])
                    },
                    properties: { icao24: icao }
                });
            }
        }
        return {
            type: 'FeatureCollection' as const,
            features
        };
    }
}
