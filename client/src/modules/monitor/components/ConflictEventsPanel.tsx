import { useQuery } from '@tanstack/react-query';
import { Flame, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useOsintStore } from '../../osint/osint.store';

interface AcledEvent {
    id: string;
    eventType: string;
    country: string;
    location: {
        latitude: number;
        longitude: number;
    };
    occurredAt: number;
    fatalities: number;
    actors: string[];
    source: string;
    admin1: string;
}

export function ConflictEventsPanel() {
    const { setCurrentRegion } = useOsintStore();

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['monitor', 'acled'],
        queryFn: async () => {
            const res = await fetch('/api/monitor/acled?limit=50');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.events as AcledEvent[];
        },
        refetchInterval: 60000, // 60s
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-gray-400 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Flame size={14} className="text-red-400" />
                    <span>Recent Conflict Events</span>
                </div>
                {isLoading && <span className="text-red-400 animate-pulse">Syncing...</span>}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400/70 text-sm gap-2">
                        <Flame size={24} />
                        <span>Feed Error</span>
                    </div>
                ) : !events ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-md border border-white/5" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                        <span>No recent events</span>
                    </div>
                ) : (
                    events.slice(0, 50).map((event) => (
                        <div
                            key={event.id}
                            onClick={() => setCurrentRegion(event.location.latitude, event.location.longitude)}
                            className={clsx(
                                "flex flex-col p-3 rounded-lg border border-red-500/20 bg-red-500/5",
                                "cursor-pointer backdrop-blur-sm transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/40"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-red-400 tracking-wider truncate mr-2">
                                    {event.eventType.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                    {new Date(event.occurredAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-gray-300 mb-2">
                                <MapPin size={12} className="text-gray-500 shrink-0" />
                                <span className="truncate">{event.admin1 ? `${event.admin1}, ` : ''}{event.country}</span>
                            </div>

                            <div className="flex flex-col gap-1 text-[10px] text-gray-400">
                                {event.actors.length > 0 && (
                                    <div className="truncate">
                                        <span className="opacity-50">ACTORS:</span> <span className="text-gray-300">{event.actors.join(' vs ')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end mt-1">
                                    <span className="truncate max-w-[70%] opacity-50">SRC: {event.source}</span>
                                    {event.fatalities > 0 && (
                                        <span className="font-mono text-red-400 font-bold bg-red-500/20 px-1.5 py-0.5 rounded">
                                            {event.fatalities} FATALITIES
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
