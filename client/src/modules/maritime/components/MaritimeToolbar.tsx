import React, { useCallback, useState } from 'react';
import { useMaritimeStore } from '../state/maritime.store';

interface MaritimeToolbarProps {
    totalCount: number;
    filteredCount: number;
}

/**
 * Fine-grained Zustand selectors — each field subscribes independently so the
 * toolbar only re-renders when the specific slice it uses changes.
 * Previously it subscribed to the whole store object.
 */
export const MaritimeToolbar: React.FC<MaritimeToolbarProps> = ({
    totalCount,
    filteredCount,
}) => {
    const name = useMaritimeStore(s => s.filters.name);
    const speedMin = useMaritimeStore(s => s.filters.speedMin);
    const showUnderway = useMaritimeStore(s => s.filters.showUnderway);
    const showMoored = useMaritimeStore(s => s.filters.showMoored);
    const setFilter = useMaritimeStore(s => s.setFilter);

    // Local debounce state for the name input — avoids rebuilding filteredVessels
    // on every keystroke; commits to the store after 300 ms of no typing.
    const [localName, setLocalName] = useState(name);
    const nameTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setLocalName(val);
        if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
        nameTimerRef.current = setTimeout(() => setFilter('name', val), 300);
    }, [setFilter]);

    return (
        <div className="absolute top-0 left-0 right-0 h-10 bg-intel-panel border-b border-intel-border/50 flex items-center px-4 justify-between z-10 shrink-0 font-mono shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center h-full space-x-6">
                <div className="flex items-center space-x-4">
                    <span className="text-[10px] text-intel-text opacity-50 uppercase tracking-widest font-bold">Stats</span>
                    <div className="flex space-x-3 text-xs">
                        <span className="text-white/70">TOTAL <strong className="text-white ml-1">{totalCount.toLocaleString()}</strong></span>
                        <span className="text-white/70">SHOWN <strong className="text-intel-accent ml-1">{filteredCount.toLocaleString()}</strong></span>
                    </div>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Filters */}
                <div className="flex items-center space-x-4 h-full">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-intel-text uppercase tracking-widest font-bold">NAME</span>
                        <input
                            type="text"
                            value={localName}
                            onChange={handleNameChange}
                            className="bg-intel-bg border border-white/10 text-white text-xs px-2 py-0.5 w-24 focus:outline-none focus:border-intel-accent focus:ring-1 focus:ring-intel-accent/50"
                            placeholder="ANY"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-intel-text uppercase tracking-widest font-bold">UNDERWAY</span>
                        <input
                            type="checkbox"
                            checked={showUnderway}
                            onChange={(e) => setFilter('showUnderway', e.target.checked)}
                            className="accent-intel-accent cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-intel-text uppercase tracking-widest font-bold">MOORED</span>
                        <input
                            type="checkbox"
                            checked={showMoored}
                            onChange={(e) => setFilter('showMoored', e.target.checked)}
                            className="accent-[#f59e0b] cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-intel-text uppercase tracking-widest font-bold">MIN SPD (KT)</span>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={speedMin}
                            onChange={(e) => setFilter('speedMin', parseInt(e.target.value))}
                            className="w-24 accent-intel-accent"
                        />
                        <span className="text-[10px] text-intel-accent w-6 tabular-nums text-right">{speedMin}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
