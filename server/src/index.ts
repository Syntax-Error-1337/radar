import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import flightsRouter from './routes/flights';
import { aircraftDb } from './core/aircraft_db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/flights', flightsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, async () => {
    console.log(`Server intel-proxy listening on port ${PORT}`);

    // Load the massive aircraft database in the background
    try {
        await aircraftDb.load();
    } catch (e) {
        console.error('Failed to initialize aircraft DB:', e);
    }
});
