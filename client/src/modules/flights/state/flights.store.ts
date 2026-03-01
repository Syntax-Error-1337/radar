import { create } from 'zustand';

interface FlightsFilters {
    altitudeMin: number;
    altitudeMax: number;
    speedMin: number;
    speedMax: number;
    callsign: string;
    showOnGround: boolean;
}

interface FlightsState {
    filters: FlightsFilters;
    setFilter: <K extends keyof FlightsFilters>(key: K, value: FlightsFilters[K]) => void;
    selectedIcao24: string | null;
    setSelectedIcao24: (icao: string | null) => void;
    cameraTrackMode: boolean;
    setCameraTrackMode: (track: boolean) => void;
    onboardMode: boolean;
    setOnboardMode: (onboard: boolean) => void;
}

export const useFlightsStore = create<FlightsState>((set) => ({
    filters: {
        altitudeMin: 0,
        altitudeMax: 50000,
        speedMin: 0,
        speedMax: 1200,
        callsign: '',
        showOnGround: true,
    },
    setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
    selectedIcao24: null,
    setSelectedIcao24: (icao) => set({ selectedIcao24: icao }),
    cameraTrackMode: false,
    setCameraTrackMode: (track) => set({ cameraTrackMode: track, onboardMode: false }), // mutually exclusive modes
    onboardMode: false,
    setOnboardMode: (onboard) => set({ onboardMode: onboard, cameraTrackMode: false }), // mutually exclusive modes
}));
