import type { AircraftState } from '../../modules/flights/lib/flights.types';

export interface ProviderSnapshot {
    states: AircraftState[];
    timestamp: number;
}

export interface FlightProvider {
    snapshot(): Promise<ProviderSnapshot>;
    track(icao24: string): Promise<any>;
}
