import React from 'react';
import { useThemeStore } from '../theme/theme.store';

export const TopNav: React.FC = () => {
    const { mode, setMode, mapProjection, setMapProjection } = useThemeStore();

    return (
        <header className="h-14 border-b border-intel-panel bg-intel-bg/90 backdrop-blur-md flex items-center px-4 justify-between z-10 relative">
            <div className="flex items-center gap-6">
                <h1 className="text-intel-text-light font-bold text-xl tracking-widest shrink-0">INTELMAP</h1>
                <nav className="flex gap-2">
                    <button className="px-4 py-1.5 bg-intel-accent/20 border border-intel-accent text-intel-accent rounded text-xs font-semibold tracking-wider">FLIGHTS</button>
                    <button className="px-4 py-1.5 text-intel-text opacity-40 cursor-not-allowed text-xs font-semibold tracking-wider" disabled>MARITIME</button>
                    <button className="px-4 py-1.5 text-intel-text opacity-40 cursor-not-allowed text-xs font-semibold tracking-wider" disabled>GROUND</button>
                </nav>
            </div>
            <div className="flex gap-2 items-center">
                <div className="flex gap-1 border-r border-intel-panel pr-4 mr-2">
                    <button
                        onClick={() => setMapProjection(mapProjection === 'mercator' ? 'globe' : 'mercator')}
                        className={`px-3 py-1 rounded text-xs uppercase font-bold transition-all text-intel-text hover:bg-intel-panel hover:text-intel-text-light`}
                    >
                        VIEW: {mapProjection}
                    </button>
                </div>
                {(['eo', 'flir', 'crt'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 rounded text-xs uppercase font-bold transition-all ${mode === m ? 'bg-intel-text-light text-intel-bg' : 'text-intel-text hover:bg-intel-panel'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </header>
    );
};
