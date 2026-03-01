import React from 'react';
import { useMaritimeStore } from '../state/maritime.store';
import { Map } from 'lucide-react';

interface MaritimeToolbarProps {
    totalCount: number;
    filteredCount: number;
    /** Optional override for the chart toggle — used by MaritimePage to add smart zoom/layer behaviour */
    onChartToggle?: (on: boolean) => void;
}

export const MaritimeToolbar: React.FC<MaritimeToolbarProps> = ({
    totalCount,
    filteredCount,
    onChartToggle,
}) => {
    const { filters, setFilter, showNauticalChart, setShowNauticalChart } = useMaritimeStore();

    const handleChart = () => {
        const next = !showNauticalChart;
        if (onChartToggle) {
            onChartToggle(next);
        } else {
            setShowNauticalChart(next);
        }
    };

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
                            value={filters.name}
                            onChange={(e) => setFilter('name', e.target.value.toUpperCase())}
                            className="bg-intel-bg border border-white/10 text-white text-xs px-2 py-0.5 w-24 focus:outline-none focus:border-intel-accent focus:ring-1 focus:ring-intel-accent/50"
                            placeholder="ANY"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-intel-text uppercase tracking-widest font-bold">UNDERWAY</span>
                        <input
                            type="checkbox"
                            checked={filters.showUnderway}
                            onChange={(e) => setFilter('showUnderway', e.target.checked)}
                            className="accent-intel-accent cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-intel-text uppercase tracking-widest font-bold">MOORED</span>
                        <input
                            type="checkbox"
                            checked={filters.showMoored}
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
                            value={filters.speedMin}
                            onChange={(e) => setFilter('speedMin', parseInt(e.target.value))}
                            className="w-24 accent-intel-accent"
                        />
                        <span className="text-[10px] text-intel-accent w-6 tabular-nums text-right">{filters.speedMin}</span>
                    </div>
                </div>
            </div>

            {/* Right side: Nautical Chart Toggle */}
            <div className="flex items-center h-full">
                <button
                    onClick={handleChart}
                    title="Toggle OpenSeaMap nautical chart overlay"
                    className={`flex items-center space-x-2 h-full px-3 border-l border-white/10 text-[10px] uppercase tracking-widest font-bold transition-colors ${showNauticalChart
                            ? 'text-[#10b981] bg-[#10b981]/10'
                            : 'text-intel-text/50 hover:text-intel-text hover:bg-white/5'
                        }`}
                >
                    <Map size={12} className={showNauticalChart ? 'text-[#10b981]' : ''} />
                    <span>CHART</span>
                    {showNauticalChart && (
                        <span className="ml-1 px-1 py-px bg-[#10b981]/20 text-[#10b981] text-[9px] border border-[#10b981]/30 leading-tight">
                            ON
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};
