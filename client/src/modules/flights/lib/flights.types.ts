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
}
