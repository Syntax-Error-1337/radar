import { create } from 'zustand';

export interface MaritimeFilters {
    speedMin: number;
    speedMax: number;
    name: string;
    showUnderway: boolean;
    showMoored: boolean;
}

interface MaritimeState {
    filters: MaritimeFilters;
    setFilter: <K extends keyof MaritimeFilters>(key: K, value: MaritimeFilters[K]) => void;
    selectedMmsi: number | null;
    setSelectedMmsi: (mmsi: number | null) => void;
}

export const useMaritimeStore = create<MaritimeState>((set) => ({
    filters: {
        speedMin: 0,
        speedMax: 100,
        name: '',
        showUnderway: true,
        showMoored: true,
    },
    setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
    selectedMmsi: null,
    setSelectedMmsi: (mmsi) => set({ selectedMmsi: mmsi }),
}));
