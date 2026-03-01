import React from 'react';
import { Panel } from '../../../ui/layout/Panel';
import type { AircraftState } from '../lib/flights.types';
import { formatAge } from '../../../utils/time';
import { X, Camera, Crosshair, Box } from 'lucide-react';
import { useAircraftPhoto } from '../hooks/useAircraftPhoto';
import { useFlightsStore } from '../state/flights.store';

interface Props {
    flight: AircraftState | null;
    onClose: () => void;
}

export const FlightsRightDrawer: React.FC<Props> = ({ flight, onClose }) => {
    const { data: photo, isLoading: photoLoading } = useAircraftPhoto(flight?.icao24);
    // Fine-grained selectors — drawer only needs camera/onboard state, not filters or selection.
    const cameraTrackMode = useFlightsStore(s => s.cameraTrackMode);
    const setCameraTrackMode = useFlightsStore(s => s.setCameraTrackMode);
    const onboardMode = useFlightsStore(s => s.onboardMode);
    const setOnboardMode = useFlightsStore(s => s.setOnboardMode);

    if (!flight) return null;

    return (
        <div className="absolute top-16 right-4 bottom-12 w-[340px] pointer-events-none z-10 flex flex-col">
            <Panel title={`intel: ${flight.callsign || flight.icao24}`} className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-4">
                <div
                    className="absolute top-2 right-2 pointer-events-auto cursor-pointer"
                    onClick={onClose}
                    role="button"
                    aria-label="Close flight details panel"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && onClose()}
                >
                    <X size={16} className="text-intel-text hover:text-white" />
                </div>

                <div className="space-y-6 mt-2 relative">

                    {/* Aircraft Photo */}
                    <div className="w-full relative min-h-12 flex justify-center border-b border-intel-panel pb-4 mb-2">
                        {photoLoading ? (
                            <div className="w-full h-32 bg-intel-panel animate-pulse flex items-center justify-center rounded-sm">
                                <Camera size={24} className="text-intel-text-light opacity-50" />
                            </div>
                        ) : photo ? (
                            <div className="w-full flex flex-col items-end gap-1">
                                <img
                                    src={photo.thumbnail_large.src}
                                    className="w-full object-cover rounded-sm border border-intel-text-light/20 drop-shadow-md"
                                    alt={`Aircraft ${flight.registration || flight.icao24}`}
                                />
                                <a
                                    href={photo.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-intel-text-light/60 hover:text-intel-text-light font-mono"
                                >
                                    © {photo.photographer} / Planespotters.net
                                </a>
                            </div>
                        ) : (
                            <div className="w-full py-4 flex flex-col items-center justify-center border border-dashed border-intel-text-light/20 rounded-sm">
                                <Camera size={20} className="text-intel-text-light/40 mb-1" />
                                <span className="text-[10px] text-intel-text-light/40 font-mono tracking-widest uppercase">No Photo Available</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 border-b border-intel-panel pb-4 mb-2">
                        <button
                            onClick={() => setCameraTrackMode(!cameraTrackMode)}
                            aria-label={cameraTrackMode ? 'Disable camera tracking' : 'Enable camera tracking'}
                            aria-pressed={cameraTrackMode}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] border transition-colors text-[11px] font-bold ${cameraTrackMode
                                ? 'bg-intel-accent/20 border-intel-accent/50 text-intel-accent shadow-[0_0_10px_rgba(26,115,232,0.3)]'
                                : 'bg-[#151b28] hover:bg-[#1a2233] border-intel-panel text-intel-text-light'
                                }`}
                        >
                            <Crosshair size={13} className={cameraTrackMode ? "animate-pulse" : ""} />
                            {cameraTrackMode ? 'TRACKING' : 'TRACK'}
                        </button>

                        <button
                            onClick={() => setOnboardMode(!onboardMode)}
                            aria-label={onboardMode ? 'Disable 3D onboard view' : 'Enable 3D onboard view'}
                            aria-pressed={onboardMode}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] border transition-colors text-[11px] font-bold ${onboardMode
                                ? 'bg-intel-accent/20 border-intel-accent/50 text-intel-accent shadow-[0_0_10px_rgba(26,115,232,0.3)]'
                                : 'bg-[#151b28] hover:bg-[#1a2233] border-intel-panel text-intel-text-light'
                                }`}
                            title="Experience 3D aircraft models, terrain, and seamlessly jump to nearby live traffic"
                        >
                            <Box size={13} className={onboardMode ? "animate-pulse" : ""} />
                            {onboardMode ? '3D ACTIVE' : '3D ONBOARD'}
                        </button>
                    </div>

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

                    {/* Aircraft Details (from Database) */}
                    {(flight.registration || flight.model || flight.operator || flight.manufacturerName) && (
                        <div>
                            <div className="text-intel-text-light font-bold text-xs mb-2 uppercase border-l-2 border-intel-accent pl-2">Aircraft</div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono mb-6">
                                {flight.registration && (
                                    <>
                                        <div className="text-intel-text">Registration</div>
                                        <div className="text-intel-accent font-bold text-right">{flight.registration}</div>
                                    </>
                                )}
                                {flight.operator && (
                                    <>
                                        <div className="text-intel-text">Operator</div>
                                        <div className="text-intel-text-light text-right truncate" title={flight.operator}>{flight.operator}</div>
                                    </>
                                )}
                                {(flight.manufacturerName || flight.model) && (
                                    <>
                                        <div className="text-intel-text">Type</div>
                                        <div className="text-intel-text-light text-right truncate" title={`${flight.manufacturerName || ''} ${flight.model || ''}`.trim()}>
                                            {flight.manufacturerName ? `${flight.manufacturerName} ` : ''}{flight.model || flight.typecode || 'Unknown'}
                                        </div>
                                    </>
                                )}
                                {flight.built && (
                                    <>
                                        <div className="text-intel-text">Built</div>
                                        <div className="text-intel-text-light text-right">{flight.built}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

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
                            <div className="text-intel-text-light text-right">{flight.heading != null ? flight.heading.toFixed(1) + '°' : 'n/a'}</div>

                            {flight.true_heading != null && (
                                <>
                                    <div className="text-intel-text">True Hdg</div>
                                    <div className="text-intel-text-light text-right">{flight.true_heading.toFixed(1)}°</div>
                                </>
                            )}
                            {flight.mag_heading != null && (
                                <>
                                    <div className="text-intel-text">Mag. Hdg</div>
                                    <div className="text-intel-text-light text-right">{flight.mag_heading.toFixed(1)}°</div>
                                </>
                            )}
                            {flight.roll != null && (
                                <>
                                    <div className="text-intel-text">Roll Angle</div>
                                    <div className="text-intel-text-light text-right">{flight.roll.toFixed(1)}°</div>
                                </>
                            )}
                            {flight.ias != null && (
                                <>
                                    <div className="text-intel-text">IAS</div>
                                    <div className="text-intel-text-light text-right">{flight.ias} kt</div>
                                </>
                            )}
                            {flight.tas != null && (
                                <>
                                    <div className="text-intel-text">TAS</div>
                                    <div className="text-intel-text-light text-right">{flight.tas} kt</div>
                                </>
                            )}
                            {flight.mach != null && (
                                <>
                                    <div className="text-intel-text">Mach</div>
                                    <div className="text-intel-text-light text-right">{flight.mach.toFixed(3)}</div>
                                </>
                            )}

                            <div className="text-intel-text">Pos.</div>
                            <div className="text-intel-text-light text-right truncate">
                                {flight.lat.toFixed(3)}°, {flight.lon.toFixed(3)}°
                            </div>
                        </div>
                    </div>

                    {/* Environment */}
                    {(flight.wd != null || flight.ws != null || flight.oat != null || flight.tat != null) && (
                        <div>
                            <div className="text-intel-text-light font-bold text-xs mb-2 uppercase border-l-2 border-intel-accent pl-2">Environment</div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono mb-6">
                                {(flight.wd != null || flight.ws != null) && (
                                    <>
                                        <div className="text-intel-text">Wind</div>
                                        <div className="text-intel-text-light text-right">
                                            {flight.wd != null ? `${flight.wd}° ` : ''}{flight.ws != null ? `@ ${flight.ws} kt` : ''}
                                        </div>
                                    </>
                                )}
                                {flight.oat != null && (
                                    <>
                                        <div className="text-intel-text">Outside Air Temp</div>
                                        <div className="text-intel-text-light text-right">{flight.oat}°C</div>
                                    </>
                                )}
                                {flight.tat != null && (
                                    <>
                                        <div className="text-intel-text">Total Air Temp</div>
                                        <div className="text-intel-text-light text-right">{flight.tat}°C</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Autopilot / FMS */}
                    {(flight.nav_altitude_mcp != null || flight.nav_heading != null || flight.nav_qnh != null || (flight.nav_modes && flight.nav_modes.length > 0)) && (
                        <div>
                            <div className="text-intel-text-light font-bold text-xs mb-2 uppercase border-l-2 border-intel-accent pl-2">Autopilot / FMS</div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono mb-6">
                                {flight.nav_altitude_mcp != null && (
                                    <>
                                        <div className="text-intel-text">Target Alt (MCP)</div>
                                        <div className="text-intel-text-light text-right">{flight.nav_altitude_mcp} ft</div>
                                    </>
                                )}
                                {flight.nav_heading != null && (
                                    <>
                                        <div className="text-intel-text">Target Hdg</div>
                                        <div className="text-intel-text-light text-right">{flight.nav_heading}°</div>
                                    </>
                                )}
                                {flight.nav_qnh != null && (
                                    <>
                                        <div className="text-intel-text">Altimeter (QNH)</div>
                                        <div className="text-intel-text-light text-right">{flight.nav_qnh} mb</div>
                                    </>
                                )}
                                {flight.nav_modes && flight.nav_modes.length > 0 && (
                                    <>
                                        <div className="text-intel-text">Active Modes</div>
                                        <div className="text-intel-text-light text-right">{flight.nav_modes.join(', ')}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

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

                            {flight.rssi != null && (
                                <>
                                    <div className="text-intel-text">RSSI</div>
                                    <div className="text-intel-text-light text-right">{flight.rssi.toFixed(1)} dBFS</div>
                                </>
                            )}
                            {flight.rc != null && (
                                <>
                                    <div className="text-intel-text">Containment Rad.</div>
                                    <div className="text-intel-text-light text-right">{flight.rc} m</div>
                                </>
                            )}
                            {flight.emergency && (
                                <>
                                    <div className="text-intel-text">Emergency</div>
                                    <div className="text-intel-warn font-bold text-right uppercase animate-pulse">{flight.emergency}</div>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </Panel>
        </div>
    );
};
