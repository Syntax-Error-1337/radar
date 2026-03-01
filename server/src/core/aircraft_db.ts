import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export interface AircraftDetails {
    icao24: string;
    registration?: string;
    manufacturerName?: string;
    model?: string;
    operator?: string;
    typecode?: string;
    built?: string;
}

class AircraftDatabase {
    private isLoaded = false;
    private db = new Map<string, AircraftDetails>();
    private dbPath = path.resolve(__dirname, '../../../aircraft-database-complete-2025-08.csv');

    public async load(): Promise<void> {
        if (this.isLoaded) return;
        return new Promise((resolve, reject) => {
            console.log('Loading Aircraft Database into memory...');
            const startTime = Date.now();
            let count = 0;

            if (!fs.existsSync(this.dbPath)) {
                console.warn(`Aircraft DB not found at: ${this.dbPath}. Extended details will be unavailable.`);
                this.isLoaded = true;
                return resolve();
            }

            fs.createReadStream(this.dbPath)
                .pipe(csv({ quote: "'" }))
                .on('data', (row: any) => {
                    const icao24 = row.icao24?.trim().toLowerCase();
                    if (!icao24) return;

                    const details: AircraftDetails = {
                        icao24
                    };

                    if (row.registration) details.registration = row.registration.trim();
                    if (row.manufacturerName) details.manufacturerName = row.manufacturerName.trim();
                    else if (row.manufacturerIcao) details.manufacturerName = row.manufacturerIcao.trim();

                    if (row.model) details.model = row.model.trim();

                    const operator = (row.operator || row.owner)?.trim();
                    if (operator) details.operator = operator;

                    if (row.typecode) details.typecode = row.typecode.trim();
                    if (row.built) details.built = String(row.built).trim();

                    this.db.set(icao24, details);
                    count++;
                })
                .on('end', () => {
                    this.isLoaded = true;
                    console.log(`Aircraft Database loaded ${count} records in ${Date.now() - startTime}ms`);
                    resolve();
                })
                .on('error', (error) => {
                    console.error('Failed to parse Aircraft Database:', error);
                    reject(error);
                });
        });
    }

    public getDetails(icao24: string): AircraftDetails | undefined {
        return this.db.get(icao24.toLowerCase());
    }
}

export const aircraftDb = new AircraftDatabase();
