import React from 'react';
import { useOsintStore } from '../../osint/osint.store';
import { useOsintNews } from '../../osint/hooks/useOsintNews';
import { useIntelBrief } from '../../osint/hooks/useIntelBrief';
import { Cpu, Radio, Globe } from 'lucide-react';
import clsx from 'clsx';

export function AIInsightsPanel() {
    const { currentRegionLat, currentRegionLon, selectedCategory, setSelectedCategory } = useOsintStore();
    const { data: routeData, isLoading, isError } = useOsintNews(currentRegionLat, currentRegionLon, selectedCategory, true);
    const intelBrief = useIntelBrief();

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-gray-400 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-purple-400" />
                    <span>AI Synthesis Engine</span>
                </div>
                {isLoading && <span className="text-purple-400 animate-pulse text-[10px]">Processing...</span>}
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
                {(["All", "Politics & Society", "Business & Economy", "Military", "Science & Technology", "Local News"] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={clsx(
                            "whitespace-nowrap px-2 py-1 text-[9px] uppercase font-bold rounded-sm border transition-colors",
                            selectedCategory === cat
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                : 'bg-transparent text-gray-500 border-white/10 hover:bg-white/5 hover:text-gray-300'
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {isError && (
                    <div className="text-red-400 text-xs p-3 border border-red-500/30 bg-red-500/10 rounded">
                        &gt; COMMS LINK SEVERED. UNABLE TO FETCH OSINT DATA.
                    </div>
                )}

                {/* AI Brief Widget */}
                <div className="border border-purple-500/30 bg-purple-900/10 relative shadow-[0_0_15px_rgba(168,85,247,0.1)] rounded overflow-hidden">
                    <div className="px-3 py-1.5 bg-purple-500/20 border-b border-purple-500/30 flex justify-between items-center text-[10px] font-bold tracking-widest text-purple-200">
                        <div className="flex items-center gap-2">
                            <Radio size={12} className={intelBrief.isPending ? "animate-spin" : ""} />
                            <span>COGNITIVE REPORT</span>
                        </div>
                    </div>
                    <div className="p-3 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap min-h-[60px]">
                        {intelBrief.isPending ? (
                            <span className="opacity-50 text-purple-300 animate-pulse">&gt; Parsing incoming planetary signals...</span>
                        ) : intelBrief.data ? (
                            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 text-[11px] text-gray-300 font-mono">
                                {intelBrief.data.brief}
                            </div>
                        ) : (
                            <span className="opacity-50 text-gray-500">&gt; Engine awaiting target sector data.</span>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if (routeData?.news) {
                                intelBrief.mutate({ news: routeData.news, lat: currentRegionLat, lon: currentRegionLon });
                            }
                        }}
                        disabled={!routeData || routeData.news.length === 0 || intelBrief.isPending}
                        className="w-full py-1.5 border-t border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/30 text-[10px] font-bold tracking-widest uppercase transition-colors disabled:opacity-30 text-purple-200"
                    >
                        INITIALIZE SYNTHESIS
                    </button>
                </div>

                {/* Critical Intercepts */}
                {routeData?.intercepts?.map((intercept, idx) => (
                    <div key={`intercept-${idx}`} className="border-l-2 border-red-500 pl-3 py-2 bg-red-500/10 rounded-r">
                        <div className="text-red-400 font-bold text-[10px] mb-1 tracking-widest flex justify-between">
                            <span>[CRITICAL INTERCEPT]</span>
                            <span>{new Date(intercept.pubDate).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-white text-[11px] leading-relaxed font-semibold">
                            {intercept.title}
                        </div>
                    </div>
                ))}

                {/* Standard News Items */}
                {routeData?.news?.map((item, idx) => (
                    <div key={`news-${idx}`} className="border flex flex-col gap-1 border-white/5 bg-black/40 p-2.5 rounded hover:border-white/20 transition-colors">
                        <div className="text-gray-500 text-[9px] flex justify-between uppercase tracking-wider">
                            <span>{item.source}</span>
                            <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                        </div>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-gray-200 text-xs hover:text-purple-400 transition-colors font-semibold block cursor-pointer leading-relaxed">
                            {item.title}
                        </a>
                    </div>
                ))}

                {routeData && routeData.news.length === 0 && !isLoading && (
                    <div className="text-gray-500 text-xs p-4 border border-white/10 text-center rounded">
                        &gt; NO SIGNALS DETECTED IN SECTOR
                    </div>
                )}
            </div>
        </div>
    );
}
