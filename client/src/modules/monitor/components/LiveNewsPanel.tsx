import React from 'react';
import { Tv } from 'lucide-react';

export function LiveNewsPanel() {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-gray-400 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Tv size={14} className="text-blue-400" />
                    <span>Global Live Feed</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-red-400">LIVE</span>
                </div>
            </div>

            <div className="flex-1 bg-black relative rounded-sm overflow-hidden border border-white/10">
                <iframe
                    className="w-full h-full absolute inset-0"
                    src="https://www.youtube-nocookie.com/embed/dp8PhLsUcFE?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0" // Bloomberg Live or similar
                    title="Live News"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            <div className="text-[10px] text-gray-500 uppercase tracking-widest px-1">
                Primary Open Source Feed • Bloomberg Global Network
            </div>
        </div>
    );
}
