import { describe, it, expect } from 'vitest';
import { TrackManager } from '../flights.tracks';

describe('TrackManager', () => {
    it('should create tracks and prune old ones', () => {
        const manager = new TrackManager(5); // 5 mins
        const now = Date.now();

        manager.update([
            { icao24: 'A1', lat: 10, lon: 10, callsign: null, baroAltitude: 0, geoAltitude: 0, velocity: 0, heading: 0, onGround: false, lastContact: now / 1000, originCountry: '' }
        ], now - 6 * 60 * 1000); // 6 mins ago

        manager.update([
            { icao24: 'A1', lat: 11, lon: 11, callsign: null, baroAltitude: 0, geoAltitude: 0, velocity: 0, heading: 0, onGround: false, lastContact: now / 1000, originCountry: '' }
        ], now);

        const geojson = manager.getLineGeoJSON();
        expect(geojson.features.length).toBe(0); // Should be pruned since only 1 point remains in the window

        manager.update([
            { icao24: 'B2', lat: 20, lon: 20, callsign: null, baroAltitude: 0, geoAltitude: 0, velocity: 0, heading: 0, onGround: false, lastContact: now / 1000, originCountry: '' }
        ], now - 2 * 60 * 1000); // 2 mins ago

        manager.update([
            { icao24: 'B2', lat: 21, lon: 21, callsign: null, baroAltitude: 0, geoAltitude: 0, velocity: 0, heading: 0, onGround: false, lastContact: now / 1000, originCountry: '' }
        ], now);

        const geojson2 = manager.getLineGeoJSON();
        expect(geojson2.features.length).toBe(1);
        expect(geojson2.features[0].id).toBe('B2');
    });
});
