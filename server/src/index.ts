import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import flightsRouter from './routes/flights';
import maritimeRouter from './routes/maritime';
import geoRouter from './routes/geo';
import monitorRouter from './routes/monitor';
import cyberRouter from './routes/cyber';
import { aircraftDb } from './core/aircraft_db';
import { initializeDefaultJobs, startScheduler } from './core/scheduler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/flights', flightsRouter);
app.use('/api/maritime', maritimeRouter);
app.use('/api/geo', geoRouter);
app.use('/api/monitor', monitorRouter);
app.use('/api/cyber', cyberRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, async () => {
  console.log(`Server intel-proxy listening on port ${PORT}`);

  // Load the massive aircraft database in the background
  try {
    await aircraftDb.load();
  } catch (e) {
    console.error('Failed to initialize aircraft DB:', e);
  }

  // Initialize and start scheduled jobs for data ingestion
  try {
    initializeDefaultJobs();
    startScheduler();
    console.log('Scheduler initialized successfully');
  } catch (e) {
    console.error('Failed to initialize scheduler:', e);
  }
});

// Graceful shutdown — nodemon sends SIGUSR2, Docker/systemd send SIGTERM
function shutdown() {
  server.close(() => process.exit(0));
}
process.once('SIGUSR2', shutdown); // nodemon restart
process.once('SIGTERM', shutdown); // container stop
process.once('SIGINT', shutdown); // Ctrl-C
