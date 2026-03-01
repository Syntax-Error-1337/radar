import { useMemo } from 'react';
import { useMaritimeStore } from '../state/maritime.store';
import type { VesselState } from './useMaritimeSnapshot';

/**
 * Derives selectedVessel from the vessels list.
 *
 * Uses a Map index (O(1) lookup) instead of Array.find (O(n)).
 * With up to 30k vessels, the old approach ran 30k comparisons on every
 * 5-second refetch. The Map is rebuilt only when the `vessels` reference
 * changes, which React Query does only on actual data updates.
 */
export function useVesselSelection(vessels: VesselState[]) {
    const selectedMmsi = useMaritimeStore(s => s.selectedMmsi);
    const setSelectedMmsi = useMaritimeStore(s => s.setSelectedMmsi);

    // O(n) to build once, then O(1) lookups.
    const vesselMap = useMemo(() => {
        const m = new Map<number, VesselState>();
        for (const v of vessels) m.set(v.mmsi, v);
        return m;
    }, [vessels]);

    const selectedVessel = useMemo(
        () => (selectedMmsi ? vesselMap.get(selectedMmsi) ?? null : null),
        [selectedMmsi, vesselMap],
    );

    return { selectedMmsi, setSelectedMmsi, selectedVessel };
}
