import React, { useCallback, useRef } from 'react';
import { useFlightsStore } from '../state/flights.store';
import type { FlightsFilters } from '../state/flights.store';

interface FlightsToolbarProps {
    totalCount: number;
    filteredCount: number;
    airborneCount: number;
    onGroundCount: number;
}

export const FlightsToolbar: React.FC<FlightsToolbarProps> = ({
    totalCount,
    filteredCount,
    airborneCount,
    onGroundCount,
}) => {
    const { filters, setFilter } = useFlightsStore();

    // Debounce slider updates so rapid drags don't re-filter thousands of
    // states on every pixel movement.
    const sliderTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const debouncedSetFilter = useCallback(
        <K extends keyof FlightsFilters>(key: K, value: FlightsFilters[K]) => {
            if (sliderTimer.current) clearTimeout(sliderTimer.current);
            sliderTimer.current = setTimeout(() => setFilter(key, value), 80);
        },
        [setFilter]
    );

    return (
        <div className="absolute top-0 left-0 right-0 p-2 bg-intel-panel/50 border-b border-intel-panel backdrop-blur-md z-10 flex items-center gap-4 pointer-events-auto flex-wrap">

            {/* ── Global Stats ──────────────────────────────── */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold tracking-widest text-intel-text-light/50 uppercase">Stats</span>
                <StatPill label="TOTAL" value={totalCount} color="text-intel-text-light" />
                <StatPill label="SHOWN" value={filteredCount} color="text-intel-accent" />
                <StatPill label="AIRBORNE" value={airborneCount} color="text-green-400" />
                <StatPill label="GROUND" value={onGroundCount} color="text-amber-400" />
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* ── Callsign filter ───────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="callsign-filter" className="text-[10px] font-bold tracking-widest text-intel-text-light">CALLSIGN</label>
                <input
                    id="callsign-filter"
                    type="text"
                    value={filters.callsign}
                    onChange={e => setFilter('callsign', e.target.value.toUpperCase())}
                    className="bg-intel-bg border border-intel-panel rounded px-2 py-1 text-xs font-mono text-intel-text-light outline-none focus:border-intel-accent w-24"
                    placeholder="ANY"
                />
            </div>

            {/* ── On Ground toggle ──────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="on-ground-toggle" className="text-[10px] font-bold tracking-widest text-intel-text-light">ON GROUND</label>
                <input
                    id="on-ground-toggle"
                    type="checkbox"
                    checked={filters.showOnGround}
                    onChange={e => setFilter('showOnGround', e.target.checked)}
                    className="accent-intel-accent"
                />
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* ── Altitude slider ───────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="alt-slider" className="text-[10px] font-bold tracking-widest text-intel-text-light whitespace-nowrap">MAX ALT (m)</label>
                <input
                    id="alt-slider"
                    type="range"
                    className="accent-intel-accent w-24"
                    min="0" max="50000" step="1000"
                    defaultValue={filters.altitudeMax}
                    onChange={e => debouncedSetFilter('altitudeMax', Number(e.target.value))}
                    aria-label="Maximum altitude filter"
                />
                <span className="text-[10px] font-mono text-intel-accent w-12 text-right">{filters.altitudeMax.toLocaleString()}</span>
            </div>

            {/* ── Speed slider ──────────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="spd-slider" className="text-[10px] font-bold tracking-widest text-intel-text-light whitespace-nowrap">MAX SPD (m/s)</label>
                <input
                    id="spd-slider"
                    type="range"
                    className="accent-intel-accent w-20"
                    min="0" max="1000" step="50"
                    defaultValue={filters.speedMax}
                    onChange={e => debouncedSetFilter('speedMax', Number(e.target.value))}
                    aria-label="Maximum speed filter"
                />
                <span className="text-[10px] font-mono text-intel-accent w-8 text-right">{filters.speedMax}</span>
            </div>
        </div>
    );
};

const StatPill: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold tracking-widest text-intel-text-light/60">{label}</span>
        <span className={`text-xs font-mono font-bold tabular-nums ${color}`}>{value.toLocaleString()}</span>
    </div>
);
