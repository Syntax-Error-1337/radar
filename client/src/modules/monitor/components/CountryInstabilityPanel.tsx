import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface CIIScore {
    region: string;
    combinedScore: number;
    trend: string;
    components: {
        newsActivity: number;
        ciiContribution: number;
        geoConvergence: number;
        militaryActivity: number;
    };
}

export function CountryInstabilityPanel() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['monitor', 'cii'],
        queryFn: async () => {
            const res = await fetch('/api/monitor/cii');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.ciiScores as CIIScore[];
        },
        refetchInterval: 30000, // 30s
    });

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-red-500 bg-red-500/10 border-red-500/30';
        if (score >= 50) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
        if (score >= 25) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
        return 'text-green-500 bg-green-500/10 border-green-500/30';
    };

    const getProgressColor = (score: number) => {
        if (score >= 75) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        if (score >= 50) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
        if (score >= 25) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
        return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-gray-400 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span>Country Instability Index</span>
                </div>
                {isLoading && <span className="text-blue-400 animate-pulse">Syncing...</span>}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400/70 text-sm gap-2">
                        <AlertTriangle size={24} />
                        <span>Feed Error</span>
                    </div>
                ) : !data ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-white/5 rounded-md border border-white/5" />
                        ))}
                    </div>
                ) : (
                    data.map((country) => (
                        <div key={country.region} className={clsx(
                            "relative overflow-hidden p-3 rounded-lg border",
                            "backdrop-blur-sm transition-all duration-300 hover:bg-white/5",
                            getScoreColor(country.combinedScore)
                        )}>
                            <div className="flex justify-between items-end mb-2 relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold tracking-wider">{country.region}</span>
                                    <div className="flex items-center gap-2 text-xs opacity-70">
                                        <span>UNR: {country.components.ciiContribution}</span>
                                        <span>•</span>
                                        <span>NWS: {country.components.newsActivity}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                        <span className="text-2xl font-mono font-bold">{country.combinedScore}</span>
                                        {country.trend.includes('UP') ? <TrendingUp size={16} /> :
                                            country.trend.includes('DOWN') ? <TrendingDown size={16} /> :
                                                <Minus size={16} />}
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-1 relative z-10">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(country.combinedScore)}`}
                                    style={{ width: `${country.combinedScore}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
