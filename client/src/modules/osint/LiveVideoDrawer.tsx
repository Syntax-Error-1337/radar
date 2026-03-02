import React, { useState } from 'react';
import { useOsintStore } from './osint.store';

type WebcamRegion = 'iran' | 'middle-east' | 'europe' | 'asia' | 'americas';

interface WebcamFeed {
    id: string;
    city: string;
    country: string;
    region: WebcamRegion;
    fallbackVideoId: string;
}

const WEBCAM_FEEDS: WebcamFeed[] = [
    { id: 'iran-tehran', city: 'Tehran', country: 'Iran', region: 'iran', fallbackVideoId: '-zGuR1qVKrU' },
    { id: 'iran-telaviv', city: 'Tel Aviv', country: 'Israel', region: 'iran', fallbackVideoId: 'gmtlJ_m2r5A' },
    { id: 'kyiv', city: 'Kyiv', country: 'Ukraine', region: 'europe', fallbackVideoId: '-Q7FuPINDjA' },
    { id: 'london', city: 'London', country: 'UK', region: 'europe', fallbackVideoId: 'Lxqcg1qt0XU' },
    { id: 'washington', city: 'Washington DC', country: 'USA', region: 'americas', fallbackVideoId: '1wV9lLe14aU' },
    { id: 'new-york', city: 'New York', country: 'USA', region: 'americas', fallbackVideoId: '4qyZLflp-sI' },
    { id: 'taipei', city: 'Taipei', country: 'Taiwan', region: 'asia', fallbackVideoId: 'z_fY1pj1VBw' },
    { id: 'tokyo', city: 'Tokyo', country: 'Japan', region: 'asia', fallbackVideoId: '4pu9sF5Qssw' },
];

export const LiveVideoDrawer: React.FC = () => {
    const { liveVideoDrawerOpen, setLiveVideoDrawerOpen } = useOsintStore();
    const [activeFeed, setActiveFeed] = useState<WebcamFeed>(WEBCAM_FEEDS[0]!);

    if (!liveVideoDrawerOpen) return null;

    return (
        <div className="absolute right-0 top-0 bottom-8 w-96 bg-intel-panel/95 backdrop-blur-md border-l border-intel-accent/30 z-40 flex flex-col shadow-2xl transition-transform transform translate-x-0">
            <div className="flex items-center justify-between p-4 border-b border-intel-accent/20 bg-intel-accent/10">
                <div className="flex items-center gap-2 text-intel-text-light font-bold tracking-widest text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    ACTIVE SURVEILLANCE
                </div>
                <button
                    onClick={() => setLiveVideoDrawerOpen(false)}
                    className="text-intel-text hover:text-intel-text-light transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 border-b border-intel-accent/20 flex flex-col gap-4">
                <div className="aspect-video w-full bg-black border border-intel-accent/30 relative">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${activeFeed.fallbackVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0`}
                        title={`${activeFeed.city} live webcam`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                <div className="text-intel-text-light text-sm font-bold tracking-widest flex justify-between items-center">
                    <span>{activeFeed.city.toUpperCase()}</span>
                    <span className="text-xs text-intel-text/60">{activeFeed.country.toUpperCase()}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
                <div className="text-intel-text/60 text-xs mb-2 uppercase tracking-widest">
                    AVAILABLE SATELLITE FEEDS
                </div>
                {WEBCAM_FEEDS.map(feed => (
                    <button
                        key={feed.id}
                        onClick={() => setActiveFeed(feed)}
                        className={`text-left px-3 py-2 border rounded text-xs font-bold tracking-wider transition-colors flex justify-between items-center ${activeFeed.id === feed.id
                                ? 'bg-intel-accent/20 border-intel-accent text-intel-text-light'
                                : 'bg-transparent border-intel-accent/20 text-intel-text hover:bg-intel-accent/10'
                            }`}
                    >
                        <span>{feed.city.toUpperCase()}</span>
                        {activeFeed.id === feed.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
