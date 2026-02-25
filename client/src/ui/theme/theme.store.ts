import { create } from 'zustand';

export type ThemeMode = 'eo' | 'flir' | 'crt';
export type MapProjection = 'mercator' | 'globe';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    mapProjection: MapProjection;
    setMapProjection: (proj: MapProjection) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: 'crt',
    setMode: (mode) => set({ mode }),
    mapProjection: 'mercator',
    setMapProjection: (mapProjection) => set({ mapProjection }),
}));
