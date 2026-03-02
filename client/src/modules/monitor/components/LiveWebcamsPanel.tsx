import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import clsx from 'clsx';

type WebcamRegion = 'iran' | 'middle-east' | 'europe' | 'asia' | 'americas';

interface WebcamFeed {
    id: string;
    city: string;
    country: string;
    region: WebcamRegion;
    fallbackVideoId: string;
}

const WEBCAM_FEEDS: WebcamFeed[] = [
    { id: 'kyiv', city: 'Kyiv', country: 'Ukraine', region: 'europe', fallbackVideoId: '-Q7FuPINDjA' },
    { id: 'iran-tehran', city: 'Tehran', country: 'Iran', region: 'iran', fallbackVideoId: '-zGuR1qVKrU' },
    { id: 'iran-telaviv', city: 'Tel Aviv', country: 'Israel', region: 'iran', fallbackVideoId: 'gmtlJ_m2r5A' },
    { id: 'london', city: 'London', country: 'UK', region: 'europe', fallbackVideoId: 'Lxqcg1qt0XU' },
    { id: 'washington', city: 'Washington DC', country: 'USA', region: 'americas', fallbackVideoId: '1wV9lLe14aU' },
    { id: 'taipei', city: 'Taipei', country: 'Taiwan', region: 'asia', fallbackVideoId: 'z_fY1pj1VBw' },
];

export function LiveWebcamsPanel() {
    const [activeFeed, setActiveFeed] = useState<WebcamFeed>(WEBCAM_FEEDS[0]!);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-gray-400 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Camera size={14} className="text-blue-400" />
                    <span>Global Surveillance</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/50">{activeFeed.city}, {activeFeed.country}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-2"></span>
                </div>
            </div>

            <div className="flex-1 bg-black relative rounded-sm overflow-hidden border border-white/10">
                <iframe
                    className="w-full h-full absolute inset-0"
                    src={`https://www.youtube-nocookie.com/embed/${activeFeed.fallbackVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0`}
                    title={`${activeFeed.city} live webcam`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            <div className="h-20 bg-black/40 border border-white/10 flex gap-2 p-1.5 overflow-x-auto custom-scrollbar rounded-sm">
                {WEBCAM_FEEDS.map(feed => (
                    <button
                        key={feed.id}
                        onClick={() => setActiveFeed(feed)}
                        className={clsx(
                            "min-w-[120px] relative flex flex-col justify-end p-2 border transition-all text-left rounded-sm flex-shrink-0 group overflow-hidden",
                            activeFeed.id === feed.id ? 'border-red-500/50' : 'border-white/10 hover:border-white/30'
                        )}
                        style={{
                            backgroundImage: `url(https://img.youtube.com/vi/${feed.fallbackVideoId}/mqdefault.jpg)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className={clsx(
                            "absolute inset-0 transition-opacity",
                            activeFeed.id === feed.id ? 'bg-gradient-to-t from-red-900/90 via-black/50 to-transparent' : 'bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:to-transparent'
                        )}></div>

                        <span className={clsx(
                            "relative z-10 text-xs font-bold truncate tracking-wider",
                            activeFeed.id === feed.id ? 'text-red-100' : 'text-white'
                        )}>
                            {feed.city.toUpperCase()}
                        </span>

                        {activeFeed.id === feed.id && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
