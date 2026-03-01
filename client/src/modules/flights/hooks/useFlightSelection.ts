import { useFlightsStore } from '../state/flights.store';
import type { AircraftState } from '../lib/flights.types';

export function useFlightSelection(states: AircraftState[] = []) {
    const selectedIcao24 = useFlightsStore(s => s.selectedIcao24);
    const setSelectedIcao24 = useFlightsStore(s => s.setSelectedIcao24);
    const setCameraTrackMode = useFlightsStore(s => s.setCameraTrackMode);
    const setOnboardMode = useFlightsStore(s => s.setOnboardMode);

    const handleSetSelectedIcao24 = (icao: string | null) => {
        setSelectedIcao24(icao);
        if (!icao) {
            setCameraTrackMode(false);
            setOnboardMode(false);
        }
    };

    const selectedFlight = states.find(s => s.icao24 === selectedIcao24) || null;

    return { selectedIcao24, setSelectedIcao24: handleSetSelectedIcao24, selectedFlight };
}
