import React, { Suspense, lazy } from 'react';
import { useThemeStore } from '../ui/theme/theme.store';

// Lazy-load each page so they ship in separate chunks.
// Users only pay for the JS of the module they're actively viewing.
const FlightsPage = lazy(() =>
    import('../modules/flights/FlightsPage').then(m => ({ default: m.FlightsPage }))
);
const MaritimePage = lazy(() =>
    import('../modules/maritime/MaritimePage').then(m => ({ default: m.MaritimePage }))
);

/** Minimal fallback shown while the chunk is loading (<200 ms on fast connections). */
const PageLoader: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-intel-bg">
        <span className="text-intel-text-light/40 text-xs font-mono tracking-widest uppercase animate-pulse">
            Loading…
        </span>
    </div>
);

export const AppRoutes: React.FC = () => {
    const activeModule = useThemeStore(s => s.activeModule);

    return (
        <Suspense fallback={<PageLoader />}>
            {activeModule === 'maritime' ? <MaritimePage /> : <FlightsPage />}
        </Suspense>
    );
};
