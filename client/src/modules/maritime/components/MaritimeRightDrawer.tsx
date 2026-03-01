import React, { useEffect, useRef, useState } from 'react';
import { Target, X, Share2, AlertTriangle, Info } from 'lucide-react';
import type { VesselState } from '../hooks/useMaritimeSnapshot';

interface MaritimeRightDrawerProps {
    vessel: VesselState | null;
    onClose: () => void;
}

// Convert DD to DMS (Degrees, Minutes, Seconds)
function toDMS(coordinate: number, pos: string, neg: string): string {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = coordinate >= 0 ? pos : neg;
    return `${degrees}°${minutes}'${seconds}"${direction}`;
}

const getNavStatusString = (status: number) => {
    switch (status) {
        case 0: return 'UNDER WAY USING ENGINE';
        case 1: return 'AT ANCHOR';
        case 2: return 'NOT UNDER COMMAND';
        case 3: return 'RESTRICTED MANOEUVRABILITY';
        case 4: return 'CONSTRAINED BY DRAUGHT';
        case 5: return 'MOORED';
        case 6: return 'AGROUND';
        case 7: return 'ENGAGED IN FISHING';
        case 8: return 'UNDER WAY SAILING';
        case 14: return 'AIS-SART';
        default: return 'NOT DEFINED';
    }
};

const getShipTypeString = (type: number) => {
    if (type >= 20 && type <= 29) return 'WING IN GROUND';
    if (type === 30) return 'FISHING';
    if (type >= 31 && type <= 32) return 'TOWING';
    if (type === 33) return 'DREDGING';
    if (type === 34) return 'DIVING';
    if (type === 35) return 'MILITARY';
    if (type === 36) return 'SAILING';
    if (type === 37) return 'PLEASURE CRAFT';
    if (type >= 40 && type <= 49) return 'HIGH SPEED CRAFT';
    if (type === 50) return 'PILOT VESSEL';
    if (type === 51) return 'SEARCH AND RESCUE';
    if (type === 52) return 'TUG';
    if (type === 53) return 'PORT TENDER';
    if (type === 54) return 'ANTI-POLLUTION';
    if (type === 55) return 'LAW ENFORCEMENT';
    if (type === 58) return 'MEDICAL';
    if (type >= 60 && type <= 69) return 'PASSENGER';
    if (type >= 70 && type <= 79) return 'CARGO';
    if (type >= 80 && type <= 89) return 'TANKER';
    return 'UNKNOWN/OTHER';
};

export const MaritimeRightDrawer: React.FC<MaritimeRightDrawerProps> = ({ vessel, onClose }) => {
    // Live age counter — re-ticks every second so "Xs ago" stays current.
    // The stale-data warning at 120s will appear automatically without needing
    // a vessel update to trigger a re-render.
    const [ageSeconds, setAgeSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!vessel) return;
        // Immediately compute on open/change, then tick every second
        const tick = () => setAgeSeconds(Math.floor((Date.now() - vessel.lastUpdate) / 1000));
        tick();
        intervalRef.current = setInterval(tick, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [vessel?.lastUpdate]); // only restart when lastUpdate changes (new AIS packet)

    if (!vessel) return null;

    const latDMS = toDMS(vessel.lat, 'N', 'S');
    const lonDMS = toDMS(vessel.lon, 'E', 'W');
    const isMoored = vessel.navigationalStatus === 1 || vessel.navigationalStatus === 5;

    return (
        // CSS-only slide-in — no extra render, no mounted state trick.
        // animate-in + slide-in-from-right are Tailwind v3 animation utilities.
        <div className="absolute top-10 right-0 bottom-8 w-96 bg-intel-panel/95 backdrop-blur-md border-l border-intel-accent/30 shadow-2xl z-20 flex flex-col font-mono text-sm animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-intel-accent" />

                <div>
                    <div className="text-[10px] text-intel-accent mb-1 tracking-widest font-bold">TARGET // MARITIME</div>
                    <h2 className="text-2xl font-bold text-white tracking-wider flex items-center">
                        {vessel.name.toUpperCase()}
                        {isMoored && <span className="ml-3 px-1.5 py-0.5 bg-[#f59e0b]/20 text-[#f59e0b] text-[10px] border border-[#f59e0b]/30">MOORED</span>}
                    </h2>
                    <div className="text-intel-text text-xs mt-1 space-x-3 opacity-80">
                        <span>MMSI: {vessel.mmsi}</span>
                        {vessel.callsign && <span>CALLSIGN: {vessel.callsign}</span>}
                        {vessel.type !== undefined && <span>TYPE: {getShipTypeString(vessel.type)}</span>}
                    </div>
                </div>

                <button onClick={onClose} className="p-1.5 text-intel-text hover:text-white hover:bg-white/10 rounded transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                {/* Telemetry Block */}
                <div className="space-y-3 relative">
                    <div className="absolute -left-5 top-0 bottom-0 w-1 bg-intel-accent/30" />

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <div className="text-[10px] text-intel-text uppercase tracking-widest mb-1 flex items-center"><Target size={10} className="mr-1.5" /> LATITUDE</div>
                            <div className="text-base font-medium text-white font-mono">{latDMS}</div>
                            <div className="text-xs text-intel-text/60 mt-0.5">{vessel.lat.toFixed(6)}°</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-intel-text uppercase tracking-widest mb-1 flex items-center"><Target size={10} className="mr-1.5" /> LONGITUDE</div>
                            <div className="text-base font-medium text-white font-mono">{lonDMS}</div>
                            <div className="text-xs text-intel-text/60 mt-0.5">{vessel.lon.toFixed(6)}°</div>
                        </div>

                        <div>
                            <div className="text-[10px] text-intel-text uppercase tracking-widest mb-1">SPEED OVER GROUND</div>
                            <div className="text-lg font-medium text-intel-accent tabular-nums">
                                {vessel.sog.toFixed(1)} <span className="text-xs text-intel-text font-normal">kn</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-intel-text uppercase tracking-widest mb-1">COURSE</div>
                            <div className="text-lg font-medium text-white tabular-nums">
                                {Number(vessel.cog).toFixed(1)}°
                            </div>
                        </div>

                        {vessel.heading !== 511 && vessel.heading !== undefined && vessel.heading !== null && vessel.heading !== 0 && (
                            <div className="col-span-2 border-t border-white/5 pt-4 mt-2">
                                <div className="text-[10px] text-intel-text uppercase tracking-widest mb-1">TRUE HEADING</div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-lg font-medium text-white tabular-nums">{vessel.heading}°</div>
                                </div>
                            </div>
                        )}

                        {vessel.altitude !== undefined && (
                            <div className="col-span-2 border-t border-white/5 pt-4 mt-2">
                                <div className="text-[10px] text-intel-text uppercase tracking-widest mb-1">ALTITUDE</div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-lg font-medium text-intel-accent tabular-nums">{vessel.altitude} <span className="text-xs text-intel-text font-normal">m</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Block */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="text-[10px] text-intel-accent uppercase tracking-widest font-bold border-b border-intel-accent/30 pb-2 flex items-center">
                        <Info size={12} className="mr-2" />
                        STATUS INFO
                    </div>

                    <ul className="space-y-3 text-sm">
                        <li className="flex flex-col">
                            <span className="text-[10px] text-intel-text uppercase tracking-wider mb-0.5">NAVIGATIONAL STATUS</span>
                            <span className="text-white font-medium">{getNavStatusString(vessel.navigationalStatus)}</span>
                        </li>
                        <li className="flex flex-col">
                            <span className="text-[10px] text-intel-text uppercase tracking-wider mb-0.5">LAST DATA UPDATE</span>
                            <span className={`text-white font-medium tabular-nums ${ageSeconds > 60 ? 'text-amber-400' : ''}`}>
                                {ageSeconds}s ago
                            </span>
                        </li>
                        {vessel.destination && (
                            <li className="flex flex-col">
                                <span className="text-[10px] text-intel-text uppercase tracking-wider mb-0.5">DESTINATION</span>
                                <span className="text-white font-medium break-all">{vessel.destination}</span>
                            </li>
                        )}
                        {vessel.dimension && (vessel.dimension.a > 0 || vessel.dimension.b > 0) && (
                            <li className="flex flex-col">
                                <span className="text-[10px] text-intel-text uppercase tracking-wider mb-0.5">DIMENSIONS (L x W)</span>
                                <span className="text-white font-medium">{vessel.dimension.a + vessel.dimension.b}m x {vessel.dimension.c + vessel.dimension.d}m</span>
                            </li>
                        )}
                        {vessel.history && (
                            <li className="flex flex-col">
                                <span className="text-[10px] text-intel-text uppercase tracking-wider mb-0.5">TRACK HISTORY</span>
                                <span className="text-white font-medium">{vessel.history.length} position{vessel.history.length !== 1 ? 's' : ''}</span>
                            </li>
                        )}
                    </ul>
                </div>

                {vessel.textMessage && (
                    <div className="bg-intel-accent/10 border border-intel-accent/30 rounded p-3 text-xs text-intel-text flex items-start space-x-3 mt-4">
                        <Info size={14} className="text-intel-accent mt-0.5 shrink-0" />
                        <p className="font-mono text-white break-all">BROADCAST: {vessel.textMessage}</p>
                    </div>
                )}

                {/* Warning: stale data */}
                {ageSeconds > 120 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-xs text-amber-200/80 flex items-start space-x-3 mt-4">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <p>Positional data is stale. Vessel may have deviated from reported position.</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                <button
                    disabled
                    className="flex-1 flex items-center justify-center space-x-2 py-2 bg-intel-accent/10 hover:bg-intel-accent/20 border border-intel-accent/50 text-intel-accent transition-colors opacity-50 cursor-not-allowed">
                    <Share2 size={14} />
                    <span className="text-xs tracking-wider">SHARE</span>
                </button>
            </div>
        </div>
    );
};
