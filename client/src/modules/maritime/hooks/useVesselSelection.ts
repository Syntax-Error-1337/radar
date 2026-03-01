import { useMemo } from 'react';
import { useMaritimeStore } from '../state/maritime.store';
import type { VesselState } from './useMaritimeSnapshot';

export function useVesselSelection(vessels: VesselState[]) {
    const { selectedMmsi, setSelectedMmsi } = useMaritimeStore();

    const selectedVessel = useMemo(() => {
        if (!selectedMmsi) return null;
        return vessels.find(v => v.mmsi === selectedMmsi) || null;
    }, [selectedMmsi, vessels]);

    return {
        selectedMmsi,
        setSelectedMmsi,
        selectedVessel,
    };
}
