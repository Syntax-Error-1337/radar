import { create } from 'zustand';

interface MilitaryBasesStore {
  enabled: boolean;
  showAir: boolean;
  showNaval: boolean;
  showGround: boolean;
  showHq: boolean;
  setEnabled: (v: boolean) => void;
  setShowAir: (v: boolean) => void;
  setShowNaval: (v: boolean) => void;
  setShowGround: (v: boolean) => void;
  setShowHq: (v: boolean) => void;
}

export const useMilitaryBasesStore = create<MilitaryBasesStore>((set) => ({
  enabled: false,
  showAir: true,
  showNaval: true,
  showGround: true,
  showHq: true,
  setEnabled: (v) => set({ enabled: v }),
  setShowAir: (v) => set({ showAir: v }),
  setShowNaval: (v) => set({ showNaval: v }),
  setShowGround: (v) => set({ showGround: v }),
  setShowHq: (v) => set({ showHq: v }),
}));
