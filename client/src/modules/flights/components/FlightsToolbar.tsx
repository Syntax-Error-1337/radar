import React from 'react';
import { useFlightsStore } from '../state/flights.store';

export const FlightsToolbar: React.FC = () => {
    const { filters, setFilter } = useFlightsStore();

    return (
        <div className="absolute top-0 left-0 right-0 p-2 bg-intel-panel/50 border-b border-intel-panel backdrop-blur-md z-10 flex gap-4 pointer-events-auto">
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold tracking-widest text-intel-text-light">CALLSIGN</label>
                <input
                    type="text"
                    value={filters.callsign}
                    onChange={e => setFilter('callsign', e.target.value.toUpperCase())}
                    className="bg-intel-bg border border-intel-panel rounded px-2 py-1 text-xs font-mono text-intel-text-light outline-none focus:border-intel-accent w-24"
                    placeholder="ANY"
                />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold tracking-widest text-intel-text-light">ON GROUND</label>
                <input
                    type="checkbox"
                    checked={filters.showOnGround}
                    onChange={e => setFilter('showOnGround', e.target.checked)}
                    className="accent-intel-accent"
                />
            </div>
        </div>
    );
};
