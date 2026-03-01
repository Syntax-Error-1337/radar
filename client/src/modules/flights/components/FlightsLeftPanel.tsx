import React from 'react';
import { AircraftState } from '../lib/flights.types';

interface Props {
    data: AircraftState[];
}

// Left panel is now empty — stats & filters have moved to the top navbar.
export const FlightsLeftPanel: React.FC<Props> = () => {
    return null;
};
