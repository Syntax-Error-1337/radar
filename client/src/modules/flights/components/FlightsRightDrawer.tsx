import React from 'react';
import { Panel } from '../../../ui/layout/Panel';
import type { AircraftState } from '../lib/flights.types';
import { formatAge } from '../../../utils/time';
import { X } from 'lucide-react';

interface Props {
    flight: AircraftState | null;
    onClose: () => void;
}

export const FlightsRightDrawer: React.FC<Props> = ({ flight, onClose }) => {
    if (!flight) return null;

    return (
        <div className="absolute top-16 right-4 bottom-12 w-[340px] pointer-events-none z-10 flex flex-col">
            <Panel title={`intel: ${flight.callsign || flight.icao24}`} className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-4">
                <div className="absolute top-2 right-2 pointer-events-auto cursor-pointer" onClick={onClose}>
                    <X size={16} className="text-intel-text hover:text-white" />
                </div>

                <div className="space-y-6 mt-2 relative">

                    {/* Header Details */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-mono border-b border-intel-panel pb-2">
                        <div className="text-intel-text uppercase">ICAO24</div>
                        <div className="text-intel-text-light text-right">{flight.icao24.toUpperCase()}</div>
                        <div className="text-intel-text uppercase">Callsign</div>
                        <div className="text-intel-accent text-right font-bold">{flight.callsign || 'UNKNOWN'}</div>
                        <div className="text-intel-text uppercase">Country</div>
                        <div className="text-intel-text-light text-right truncate" title={flight.originCountry || 'N/A'}>
                            {flight.originCountry || 'N/A'}
                        </div>
                    </div>

                    {/* Spatial */}
                    <div>
                        <div className="text-intel-text-light font-bold text-xs mb-2 uppercase border-l-2 border-intel-accent pl-2">Spatial</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono">
                            <div className="text-intel-text">Groundspeed</div>
                            <div className="text-intel-text-light text-right">{flight.velocity ? Math.round(flight.velocity * 1.94384) + ' kt' : 'n/a'}</div>

                            <div className="text-intel-text">Baro. altitude</div>
                            <div className="text-intel-text-light text-right">{flight.baroAltitude ? Math.round(flight.baroAltitude * 3.28084) + ' ft' : 'n/a'}</div>

                            <div className="text-intel-text">WGS84 altitude</div>
                            <div className="text-intel-text-light text-right">{flight.geoAltitude ? Math.round(flight.geoAltitude * 3.28084) + ' ft' : 'n/a'}</div>

                            <div className="text-intel-text">Vert. Rate</div>
                            <div className="text-intel-text-light text-right">
                                {flight.verticalRate ? (
                                    <span className={flight.verticalRate > 0 ? 'text-intel-success' : 'text-intel-warn'}>
                                        {flight.verticalRate > 0 ? '▲ ' : '▼ '}
                                        {Math.abs(Math.round(flight.verticalRate * 196.85))} ft/min
                                    </span>
                                ) : 'n/a'}
                            </div>

                            <div className="text-intel-text">Track</div>
                            <div className="text-intel-text-light text-right">{flight.heading ? flight.heading.toFixed(1) + '°' : 'n/a'}</div>

                            <div className="text-intel-text">Pos.</div>
                            <div className="text-intel-text-light text-right truncate">
                                {flight.lat.toFixed(3)}°, {flight.lon.toFixed(3)}°
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <div className="text-intel-text-light font-bold text-xs mb-2 uppercase border-l-2 border-intel-accent pl-2">Signal & State</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono">
                            <div className="text-intel-text">Status</div>
                            <div className="text-right">
                                {flight.onGround ? <span className="text-intel-warn font-bold">GROUNDED</span> : <span className="text-intel-success font-bold">AIRBORNE</span>}
                            </div>

                            <div className="text-intel-text">Squawk</div>
                            <div className="text-intel-accent font-bold text-right">{flight.squawk || 'n/a'}</div>

                            <div className="text-intel-text">SPI</div>
                            <div className="text-intel-text-light text-right">{flight.spi ? 'Active' : 'False'}</div>

                            <div className="text-intel-text">Pos. Source</div>
                            <div className="text-intel-text-light text-right">
                                {flight.positionSource === 0 ? 'ADS-B' : flight.positionSource === 1 ? 'ASTERIX' : flight.positionSource === 2 ? 'MLAT' : 'FLARM'}
                            </div>

                            <div className="text-intel-text">Category (Type)</div>
                            <div className="text-intel-text-light text-right">{flight.category}</div>

                            <div className="text-intel-text">Last Contact</div>
                            <div className="text-intel-text-light text-right">{formatAge(flight.lastContact)}</div>
                        </div>
                    </div>

                </div>
            </Panel>
        </div>
    );
};
