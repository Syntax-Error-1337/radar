export interface AircraftState {
    icao24: string;
    callsign: string | null;
    lat: number;
    lon: number;
    baroAltitude: number | null;
    geoAltitude: number | null;
    velocity: number | null;
    heading: number | null;
    onGround: boolean;
    lastContact: number;
    originCountry: string | null;
    verticalRate: number | null;
    squawk: string | null;
    spi: boolean;
    positionSource: number;
    category: number;
    registration?: string;
    manufacturerName?: string;
    model?: string;
    operator?: string;
    typecode?: string;
    built?: string;

    // Extended telemetry from ADSB.lol
    mach?: number;
    true_heading?: number;
    mag_heading?: number;
    oat?: number;
    tat?: number;
    roll?: number;
    ias?: number;
    tas?: number;
    wd?: number;
    ws?: number;
    nav_altitude_mcp?: number;
    nav_heading?: number;
    nav_qnh?: number;
    nav_modes?: string[];
    rc?: number;
    rssi?: number;
    emergency?: string;
}
