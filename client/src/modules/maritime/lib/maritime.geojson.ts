import type { VesselState } from '../hooks/useMaritimeSnapshot';

export function vesselsToPointGeoJSON(vessels: VesselState[]) {
    return {
        type: 'FeatureCollection' as const,
        features: vessels.map(v => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [v.lon, v.lat]
            },
            properties: {
                mmsi: v.mmsi,
                name: v.name,
                sog: v.sog,
                cog: v.cog,
                heading: v.heading,
                navigationalStatus: v.navigationalStatus,
                type: v.type,
                lastUpdate: v.lastUpdate
            }
        }))
    };
}

export function vesselHistoryToLineGeoJSON(vessel: VesselState | null) {
    if (!vessel || !vessel.history || vessel.history.length < 2) {
        return {
            type: 'FeatureCollection' as const,
            features: []
        };
    }

    return {
        type: 'FeatureCollection' as const,
        features: [{
            type: 'Feature' as const,
            geometry: {
                type: 'LineString' as const,
                coordinates: vessel.history
            },
            properties: {
                mmsi: vessel.mmsi
            }
        }]
    };
}
