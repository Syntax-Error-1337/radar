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

// JSON cache sits next to the CSV; its mtime is compared to the CSV's mtime so
// it is automatically rebuilt whenever the source file is replaced.
const CSV_PATH = path.resolve(__dirname, '../../../aircraft-database-complete-2025-08.csv');
const JSON_CACHE_PATH = `${CSV_PATH}.cache.json`;

class AircraftDatabase {
    private isLoaded = false;
    private db = new Map<string, AircraftDetails>();

    public async load(): Promise<void> {
        if (this.isLoaded) return;

        // Use JSON cache when it is newer than the CSV to skip parsing ~108 MB every restart
        if (this.tryLoadFromCache()) return;

        if (!fs.existsSync(CSV_PATH)) {
            console.warn(`Aircraft DB not found at: ${CSV_PATH}. Extended details will be unavailable.`);
            this.isLoaded = true;
            return;
        }

        await this.parseCSV();
        this.saveCache();
    }

    private tryLoadFromCache(): boolean {
        try {
            if (!fs.existsSync(JSON_CACHE_PATH)) return false;

            const csvMtime = fs.statSync(CSV_PATH).mtimeMs;
            const cacheMtime = fs.statSync(JSON_CACHE_PATH).mtimeMs;
            if (cacheMtime < csvMtime) {
                console.log('Aircraft DB cache is stale, rebuilding from CSV...');
                return false;
            }

            console.log('Loading Aircraft Database from JSON cache...');
            const t = Date.now();
            const entries: [string, AircraftDetails][] = JSON.parse(
                fs.readFileSync(JSON_CACHE_PATH, 'utf8')
            );
            this.db = new Map(entries);
            this.isLoaded = true;
            console.log(`Aircraft Database loaded ${this.db.size} records from cache in ${Date.now() - t}ms`);
            return true;
        } catch (e) {
            console.warn('Failed to load Aircraft DB cache, falling back to CSV:', e);
            return false;
        }
    }

    private saveCache(): void {
        try {
            fs.writeFileSync(JSON_CACHE_PATH, JSON.stringify(Array.from(this.db.entries())));
            console.log('Aircraft DB JSON cache written.');
        } catch (e) {
            console.warn('Failed to write Aircraft DB cache (non-fatal):', e);
        }
    }

    private parseCSV(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log('Parsing Aircraft Database CSV (first run only)...');
            const t = Date.now();
            let count = 0;

            fs.createReadStream(CSV_PATH)
                .pipe(csv({ quote: "'" }))
                .on('data', (row: any) => {
                    const icao24 = row.icao24?.trim().toLowerCase();
                    if (!icao24) return;

                    const details: AircraftDetails = { icao24 };

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
                    console.log(`Aircraft Database parsed ${count} records in ${Date.now() - t}ms`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    public getDetails(icao24: string): AircraftDetails | undefined {
        return this.db.get(icao24.toLowerCase());
    }
}

export const aircraftDb = new AircraftDatabase();
