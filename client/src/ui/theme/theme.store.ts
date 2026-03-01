import { create } from 'zustand';

export type ThemeMode = 'eo' | 'flir' | 'crt';
export type MapProjection = 'mercator' | 'globe';
export type MapLayer = 'dark' | 'light' | 'street' | 'satellite';
export type ActiveModule = 'flights' | 'maritime';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    mapProjection: MapProjection;
    setMapProjection: (proj: MapProjection) => void;
    mapLayer: MapLayer;
    setMapLayer: (layer: MapLayer) => void;
    activeModule: ActiveModule;
    setActiveModule: (module: ActiveModule) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: 'crt',
    setMode: (mode) => set({ mode }),
    mapProjection: 'mercator',
    setMapProjection: (mapProjection) => set({ mapProjection }),
    mapLayer: 'dark',
    setMapLayer: (mapLayer) => set({ mapLayer }),
    activeModule: 'flights',
    setActiveModule: (activeModule) => set({ activeModule }),
}));
