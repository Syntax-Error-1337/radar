/** Shared layer ID constants — kept in a separate file to satisfy react-refresh/only-export-components */

export const MILITARY_BASES_LAYER_IDS = ['military-bases-halo', 'military-bases-dot'];

export const ROCKET_ALERT_LAYER_IDS = ['rocket-alerts-halo', 'rocket-alerts-dot'];

export const GULF_WATCH_LAYER_IDS = [
  'gulf-watch-fill',
  'gulf-watch-outline',
  'gulf-watch-marker-halo',
  'gulf-watch-marker-dot',
];

// fill + outline + halo + dot per GCC country — used for interactiveLayerIds
const GCC_COUNTRIES = ['qatar', 'bahrain', 'kuwait', 'oman'] as const;
export const GCC_WATCH_LAYER_IDS = GCC_COUNTRIES.flatMap((c) => [
  `gcc-watch-${c}-fill`,
  `gcc-watch-${c}-outline`,
  `gcc-watch-${c}-halo`,
  `gcc-watch-${c}-dot`,
]);
