import { describe, it, expect } from 'vitest';
import { TrackManager } from '../flights.tracks';

/** Build a minimal AircraftState for tests */
function mkState(icao24: string, lat: number, lon: number) {
    return {
        icao24,
        lat,
        lon,
        callsign: null,
        baroAltitude: 0,
        geoAltitude: 0,
        velocity: 0,
        heading: 0,
        onGround: false,
        lastContact: 0,
        originCountry: '',
        verticalRate: null,
        squawk: null,
        spi: false,
        positionSource: 0,
        category: 0,
    };
}

describe('TrackManager', () => {
    it('prunes tracks older than maxAge', () => {
        const manager = new TrackManager(5); // 5 min max age
        const now = 1_000_000; // fixed deterministic timestamp (ms)

        // Add A1 at t = 6 min ago (should be pruned)
        manager.update([mkState('A1', 10, 10)], now - 6 * 60 * 1000);
        // Add A1 again at now — after pruning only 1 point survives, track deleted
        manager.update([mkState('A1', 11, 11)], now);

        expect(manager.getLineGeoJSON().features.length).toBe(0);
    });

    it('keeps tracks within maxAge', () => {
        const manager = new TrackManager(5); // fresh manager — no cross-test state
        const now = 2_000_000; // different baseline to avoid any accidental sharing

        // Add B2 at t = 2 min ago (within window)
        manager.update([mkState('B2', 20, 20)], now - 2 * 60 * 1000);
        // Add B2 again at now
        manager.update([mkState('B2', 21, 21)], now);

        const geojson = manager.getLineGeoJSON();
        expect(geojson.features.length).toBe(1);
        expect(geojson.features[0].id).toBe('B2');
    });

    it('does not include duplicate consecutive positions', () => {
        const manager = new TrackManager(5);
        const now = 3_000_000;

        manager.update([mkState('C3', 30, 30)], now - 60_000);
        manager.update([mkState('C3', 30, 30)], now); // same coordinates

        // Only 1 unique position → track deleted (< 2 distinct points)
        expect(manager.getLineGeoJSON().features.length).toBe(0);
    });
});
