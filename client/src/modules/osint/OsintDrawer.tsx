import React from 'react';
import { useOsintStore } from './osint.store';
import { useOsintNews } from './hooks/useOsintNews';
import { useIntelBrief } from './hooks/useIntelBrief';

export const OsintDrawer: React.FC = () => {
    const { osintDrawerOpen, setOsintDrawerOpen, currentRegionLat, currentRegionLon, selectedCategory, setSelectedCategory } = useOsintStore();

    // Fetch news based on current map center
    const { data, isLoading, isError } = useOsintNews(currentRegionLat, currentRegionLon, selectedCategory, osintDrawerOpen);

    const intelBrief = useIntelBrief();

    if (!osintDrawerOpen) return null;

    return (
        <div className="absolute left-0 top-0 bottom-8 w-96 bg-intel-panel/95 backdrop-blur-md border-r border-intel-accent/30 z-40 flex flex-col shadow-2xl transition-transform transform translate-x-0">
            <div className="flex items-center justify-between p-4 border-b border-intel-accent/20 bg-intel-accent/10">
                <div className="flex items-center gap-2 text-intel-text-light font-bold tracking-widest text-sm">
                    <span className="w-2 h-2 rounded-full bg-intel-accent animate-pulse"></span>
                    OSINT & GEOPOLITICAL NEWS
                </div>
                <button
                    onClick={() => setOsintDrawerOpen(false)}
                    className="text-intel-text hover:text-intel-text-light transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-2 border-b border-intel-accent/20 bg-intel-bg/50 flex gap-2 overflow-x-auto no-scrollbar">
                {(["All", "Business & Economy", "Lifestyle & Culture", "Local News", "Politics & Society", "Science & Technology", "Sports", "World / International"] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`whitespace-nowrap px-3 py-1 text-xs font-bold rounded-full border transition-colors ${selectedCategory === cat ? 'bg-intel-accent text-intel-bg border-intel-accent' : 'bg-transparent text-intel-accent border-intel-accent/40 hover:bg-intel-accent/20'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm no-scrollbar">
                <div className="text-intel-text/60 text-xs mb-4 uppercase tracking-widest">
                    TARGETING SECTOR: {data?.news?.length ? data.news[0]?.source || 'INTERNATIONAL' : 'INTERNATIONAL'} ({currentRegionLat.toFixed(2)}, {currentRegionLon.toFixed(2)})
                </div>

                {isLoading && (
                    <div className="text-intel-accent animate-pulse">
                        &gt; INTERCEPTING COMMUNICATIONS...
                    </div>
                )}

                {isError && (
                    <div className="text-red-400">
                        &gt; COMMS LINK SEVERED. UNABLE TO FETCH DATA.
                    </div>
                )}

                {data?.intercepts?.map((intercept, idx) => (
                    <div key={`intercept-${idx}`} className="border-l-2 border-red-500 pl-3 py-1 mb-4 bg-red-500/10">
                        <div className="text-red-400 font-bold text-xs mb-1">
                            [CRITICAL INTERCEPT] {new Date(intercept.pubDate).toLocaleTimeString()}
                        </div>
                        <div className="text-intel-text-light">
                            {intercept.title}
                        </div>
                    </div>
                ))}

                {intelBrief.data && (
                    <div className="border border-intel-accent bg-intel-accent/10 p-3 rounded mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <div className="text-intel-accent text-xs font-bold uppercase tracking-widest border-b border-intel-accent/30 pb-2 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-intel-accent rounded-full animate-pulse"></span>
                            AI INTELLIGENCE BRIEF
                        </div>
                        <div className="text-intel-text-light whitespace-pre-wrap leading-relaxed">
                            {intelBrief.data.brief}
                        </div>
                    </div>
                )}

                {intelBrief.isPending && (
                    <div className="border border-intel-accent/50 bg-intel-accent/5 p-3 rounded mb-4">
                        <div className="text-intel-accent text-xs font-bold uppercase tracking-widest animate-pulse">
                            &gt; SYNTHESIZING INTELLIGENCE...
                        </div>
                    </div>
                )}

                {data?.news?.map((item, idx) => (
                    <div key={`news-${idx}`} className="border border-intel-accent/20 bg-intel-bg/50 p-3 rounded">
                        <div className="text-intel-accent/70 text-xs mb-2 flex justify-between">
                            <span>{item.source}</span>
                            <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                        </div>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-intel-text-light hover:text-intel-accent transition-colors font-semibold block mb-2 cursor-pointer">
                            {item.title}
                        </a>
                        <p className="text-intel-text/80 text-xs line-clamp-3">
                            {item.snippet}
                        </p>
                    </div>
                ))}

                {data && data.news.length === 0 && !isLoading && (
                    <div className="text-intel-text/60">
                        &gt; NO SIGNALS COMING FROM THIS SECTOR.
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-intel-accent/20 bg-intel-bg">
                <button
                    onClick={() => {
                        if (data?.news) {
                            intelBrief.mutate({ news: data.news, lat: currentRegionLat, lon: currentRegionLon });
                        }
                    }}
                    disabled={!data || data.news.length === 0 || intelBrief.isPending}
                    className="w-full py-2 bg-intel-accent/20 hover:bg-intel-accent/40 text-intel-text-light border border-intel-accent/50 rounded transition-all tracking-widest text-xs font-bold uppercase disabled:opacity-50"
                >
                    {intelBrief.isPending ? 'PROCESSING...' : 'GENERATE INTEL BRIEF (AI)'}
                </button>
            </div>
        </div>
    );
};
