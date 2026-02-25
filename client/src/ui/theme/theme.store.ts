import { create } from 'zustand';

export type ThemeMode = 'eo' | 'flir' | 'crt';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: 'crt',
    setMode: (mode) => set({ mode }),
}));
