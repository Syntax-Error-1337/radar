import React from 'react';
import { Panel } from '../../../ui/layout/Panel';
import { useFlightsStore } from '../state/flights.store';
import { AircraftState } from '../lib/flights.types';

interface Props {
    data: AircraftState[];
}

export const FlightsLeftPanel: React.FC<Props> = ({ data }) => {
    const { filters, setFilter } = useFlightsStore();

    return (
        <div className="absolute top-16 left-4 bottom-12 w-64 flex flex-col gap-4 pointer-events-none z-10">
            <Panel title="global stats" className="h-28 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                        <span className="text-intel-text text-[10px] tracking-widest font-bold">TOTAL TRACKS</span>
                        <span className="text-intel-text-light font-mono text-xs">{data.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-intel-text text-[10px] tracking-widest font-bold">AIRBORNE</span>
                        <span className="text-intel-accent font-mono text-xs">{data.filter(d => !d.onGround).length}</span>
                    </div>
                </div>
            </Panel>

            <Panel title="filters" className="flex-1">
                <div className="flex flex-col gap-5 pt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-intel-text-light tracking-widest">MAX ALTITUDE (m)</label>
                        <input type="range" className="accent-intel-accent" min="0" max="50000" step="1000" value={filters.altitudeMax} onChange={e => setFilter('altitudeMax', Number(e.target.value))} />
                        <div className="flex justify-between text-xs font-mono text-intel-text">
                            <span>0</span>
                            <span>{filters.altitudeMax}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-intel-text-light tracking-widest">MAX SPEED (m/s)</label>
                        <input type="range" className="accent-intel-accent" min="0" max="1000" step="50" value={filters.speedMax} onChange={e => setFilter('speedMax', Number(e.target.value))} />
                        <div className="flex justify-between text-xs font-mono text-intel-text">
                            <span>0</span>
                            <span>{filters.speedMax}</span>
                        </div>
                    </div>
                </div>
            </Panel>
        </div>
    );
};
