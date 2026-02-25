import { useFlightsStore } from '../state/flights.store';
import { AircraftState } from '../lib/flights.types';

export function useFlightSelection(states: AircraftState[] = []) {
    const selectedIcao24 = useFlightsStore(s => s.selectedIcao24);
    const setSelectedIcao24 = useFlightsStore(s => s.setSelectedIcao24);

    const selectedFlight = states.find(s => s.icao24 === selectedIcao24) || null;

    return { selectedIcao24, setSelectedIcao24, selectedFlight };
}
