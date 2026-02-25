import { AircraftState } from './flights.types';

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

        // Prune tracks
        const cutoff = currentTimeMs - this.maxAgeMs;
        for (const [icao, history] of Array.from(this.tracks.entries())) {
            const pruned = history.filter(p => p.timestamp > cutoff);
            if (pruned.length < 2) {
                this.tracks.delete(icao);
            } else {
                this.tracks.set(icao, pruned);
            }
        }
    }

    getLineGeoJSON() {
        const features = [];
        for (const [icao, history] of this.tracks.entries()) {
            if (history.length > 1) {
                features.push({
                    type: 'Feature' as const,
                    id: icao,
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: history.map(p => [p.lon, p.lat])
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
