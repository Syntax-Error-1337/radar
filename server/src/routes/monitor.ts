import { Router } from 'express';
import * as gpsjam from '../core/source/gpsjam';
import * as rocketalert from '../core/source/rocketalert';
import * as gulfwatch from '../core/source/gulfwatch';
import * as militarybases from '../core/source/militarybases';

const router = Router();

/**
 * GET /api/monitor/gps-jamming
 * Fetch GPS interference data mapped to H3 hex cells
 *
 * Query Parameters:
 * - date: Optional date in YYYY-MM-DD format (default: latest)
 * - h3: Optional comma-separated list of H3 indices to filter
 * - minInterference: Optional minimum interference ratio (0-1)
 *
 * Response:
 * {
 *   date: string,
 *   suspect: boolean,
 *   totalCells: number,
 *   cells: [
 *     {
 *       h3: string,
 *       count_good_aircraft: number,
 *       count_bad_aircraft: number,
 *       interference_ratio: number
 *     }
 *   ]
 * }
 */
router.get('/gps-jamming', async (req, res) => {
  try {
    const { date, h3, minInterference } = req.query;

    // Parse query options
    const options: gpsjam.QueryOptions = {};

    if (date && typeof date === 'string') {
      options.date = date;
    }

    if (h3 && typeof h3 === 'string') {
      options.h3Indices = h3.split(',').map((s) => s.trim());
    }

    if (minInterference && typeof minInterference === 'string') {
      const val = parseFloat(minInterference);
      if (!isNaN(val)) {
        options.minInterference = val;
      }
    }

    // Query data
    const dataset = await gpsjam.queryGPSJamming(options);

    // Format response optimized for map rendering
    res.json({
      date: dataset.date,
      suspect: dataset.suspect,
      totalCells: dataset.totalCells,
      cells: dataset.cells.map((cell) => ({
        h3: cell.hex,
        interference: cell.interference_ratio,
        good: cell.count_good_aircraft,
        bad: cell.count_bad_aircraft,
      })),
    });
  } catch (error: any) {
    console.error('[API] GPS jamming error:', error);
    res.status(500).json({
      error: 'Failed to fetch GPS jamming data',
      message: error.message,
    });
  }
});

/**
 * GET /api/monitor/gps-jamming/dates
 * Get list of all available dataset dates
 */
router.get('/gps-jamming/dates', async (req, res) => {
  try {
    const dates = await gpsjam.getAvailableDates();
    res.json({ dates });
  } catch (error: any) {
    console.error('[API] GPS jamming dates error:', error);
    res.status(500).json({
      error: 'Failed to fetch available dates',
      message: error.message,
    });
  }
});

/**
 * GET /api/monitor/gps-jamming/stats
 * Get interference statistics for a specific date
 *
 * Query Parameters:
 * - date: Optional date in YYYY-MM-DD format (default: latest)
 */
router.get('/gps-jamming/stats', async (req, res) => {
  try {
    const { date } = req.query;
    const dateStr = typeof date === 'string' ? date : undefined;

    const stats = await gpsjam.getInterferenceStats(dateStr);
    res.json(stats);
  } catch (error: any) {
    console.error('[API] GPS jamming stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch interference statistics',
      message: error.message,
    });
  }
});

/**
 * POST /api/monitor/gps-jamming/backfill
 * Manually trigger backfill of missing datasets
 *
 * Body:
 * - limit: Optional number of datasets to backfill (default: all)
 */
router.post('/gps-jamming/backfill', async (req, res) => {
  try {
    const { limit } = req.body || {};
    const limitNum = typeof limit === 'number' ? limit : undefined;

    const downloaded = await gpsjam.backfillDatasets(limitNum);

    res.json({
      success: true,
      downloaded,
      message: `Successfully backfilled ${downloaded} datasets`,
    });
  } catch (error: any) {
    console.error('[API] GPS jamming backfill error:', error);
    res.status(500).json({
      error: 'Failed to backfill datasets',
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Rocket Alert routes  (source: agg.rocketalert.live)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/monitor/rocket-alerts
 * Dashboard summary: live burst + 24 h total + 7-day daily counts.
 *
 * Response: AlertSummary
 * {
 *   isActive:    boolean,          // true when real-time bursts are non-empty
 *   live:        RocketAlertItem[] // all alerts from current cached burst
 *   total24h:    number,           // total alerts last 24 h (all types)
 *   daily:       { timeStamp: string, alerts: number }[]  // last 7 days
 *   activeAreas: string[]          // unique area names in live burst
 * }
 */
router.get('/rocket-alerts', async (req, res) => {
  try {
    const summary = await rocketalert.getAlertSummary();
    res.json(summary);
  } catch (error: any) {
    console.error('[API] Rocket alerts summary error:', error);
    res.status(500).json({ error: 'Failed to fetch rocket alert summary', message: error.message });
  }
});

/**
 * GET /api/monitor/rocket-alerts/history
 * Detailed per-alert records for a custom time window.
 *
 * Query parameters:
 *   hours       – hours back from now (default: 24, max: 720)
 *   alertTypeId – 1=rockets, 2=UAV, -1=all (default: -1)
 *
 * Response:
 * { days: [{ date: string, alerts: RocketAlertItem[] }] }
 */
router.get('/rocket-alerts/history', async (req, res) => {
  try {
    const hours = Math.min(720, Math.max(1, parseInt(String(req.query.hours ?? '24'), 10) || 24));
    const alertTypeId = parseInt(String(req.query.alertTypeId ?? '-1'), 10) || -1;

    const days = await rocketalert.fetchRecentAlertDetails(hours, alertTypeId);
    res.json({ days });
  } catch (error: any) {
    console.error('[API] Rocket alerts history error:', error);
    res.status(500).json({ error: 'Failed to fetch rocket alert history', message: error.message });
  }
});

/**
 * GET /api/monitor/rocket-alerts/daily
 * Per-day alert counts.
 *
 * Query parameters:
 *   days        – how many days back (default: 7, max: 90)
 *   alertTypeId – 1=rockets, 2=UAV, -1=all (default: -1)
 *
 * Response:
 * { counts: [{ timeStamp: string, alerts: number }] }
 */
router.get('/rocket-alerts/daily', async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(String(req.query.days ?? '7'), 10) || 7));
    const alertTypeId = parseInt(String(req.query.alertTypeId ?? '-1'), 10) || -1;

    const counts = await rocketalert.fetchDailyCounts(days, alertTypeId);
    res.json({ counts });
  } catch (error: any) {
    console.error('[API] Rocket alerts daily error:', error);
    res.status(500).json({ error: 'Failed to fetch daily counts', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GulfWatch routes  (source: gulfwatch-api.onrender.com)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/monitor/gulf-watch/alerts
 * Active alert summary for UAE.
 *
 * Response: AlertSummary
 * {
 *   isActive:         boolean,
 *   activeEmirateIds: string[],
 *   alerts:           GulfWatchAlert[],
 *   totalActive:      number,
 *   lastUpdated:      string
 * }
 */
router.get('/gulf-watch/alerts', async (req, res) => {
  try {
    const summary = await gulfwatch.getAlertSummary('uae');
    res.json(summary);
  } catch (error: any) {
    console.error('[API] GulfWatch alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch GulfWatch alerts', message: error.message });
  }
});

/**
 * GET /api/monitor/gulf-watch/alerts/history
 * Recent alert history for UAE.
 */
router.get('/gulf-watch/alerts/history', async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10) || 0);
    const data = await gulfwatch.fetchAlertHistory('uae', limit, offset);
    res.json(data);
  } catch (error: any) {
    console.error('[API] GulfWatch history error:', error);
    res.status(500).json({ error: 'Failed to fetch GulfWatch history', message: error.message });
  }
});

// ── Generic GCC country routes ────────────────────────────────────────────────

/**
 * GET /api/monitor/gulf-watch/:country/alerts
 * Active alert summary for any supported GCC country.
 * Supported: qatar | bahrain | kuwait | oman | uae
 */
router.get('/gulf-watch/:country/alerts', async (req, res) => {
  const country = req.params.country as gulfwatch.GccCountry;
  if (!(gulfwatch.SUPPORTED_COUNTRIES as readonly string[]).includes(country)) {
    res.status(400).json({ error: `Unsupported country: ${country}` });
    return;
  }
  try {
    const summary = await gulfwatch.getAlertSummary(country);
    res.json(summary);
  } catch (error: any) {
    console.error(`[API] GulfWatch ${country} alerts error:`, error);
    res.status(500).json({ error: `Failed to fetch ${country} alerts`, message: error.message });
  }
});

/**
 * GET /api/monitor/gulf-watch/:country/alerts/history
 * Alert history for any supported GCC country.
 */
router.get('/gulf-watch/:country/alerts/history', async (req, res) => {
  const country = req.params.country as gulfwatch.GccCountry;
  if (!(gulfwatch.SUPPORTED_COUNTRIES as readonly string[]).includes(country)) {
    res.status(400).json({ error: `Unsupported country: ${country}` });
    return;
  }
  try {
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10) || 0);
    const data = await gulfwatch.fetchAlertHistory(country, limit, offset);
    res.json(data);
  } catch (error: any) {
    console.error(`[API] GulfWatch ${country} history error:`, error);
    res.status(500).json({ error: `Failed to fetch ${country} history`, message: error.message });
  }
});

/**
 * GET /api/monitor/gulf-watch/geojson
 * UAE GeoJSON — kept for backwards compatibility.
 */
router.get('/gulf-watch/geojson', async (req, res) => {
  try {
    const geojson = await gulfwatch.fetchCountryGeoJSON('uae');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(geojson);
  } catch (error: any) {
    console.error('[API] GulfWatch GeoJSON error:', error);
    res.status(500).json({ error: 'Failed to fetch emirates GeoJSON', message: error.message });
  }
});

/**
 * GET /api/monitor/gulf-watch/:country/geojson
 * Region boundary GeoJSON for any supported GCC country (1 h CDN cache).
 */
router.get('/gulf-watch/:country/geojson', async (req, res) => {
  const country = req.params.country as gulfwatch.GccCountry;
  if (!(gulfwatch.SUPPORTED_COUNTRIES as readonly string[]).includes(country)) {
    res.status(400).json({ error: `Unsupported country: ${country}` });
    return;
  }
  try {
    const geojson = await gulfwatch.fetchCountryGeoJSON(country);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(geojson);
  } catch (error: any) {
    console.error(`[API] GulfWatch ${country} GeoJSON error:`, error);
    res.status(500).json({ error: `Failed to fetch ${country} GeoJSON`, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Military Bases routes  (source: local KML)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/monitor/military-bases
 * All global military installations as a GeoJSON FeatureCollection.
 * Cached indefinitely — static dataset.
 */
router.get('/military-bases', (_req, res) => {
  try {
    const geojson = militarybases.getMilitaryBasesGeoJSON();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(geojson);
  } catch (error: any) {
    console.error('[API] Military bases error:', error);
    res.status(500).json({ error: 'Failed to load military bases', message: error.message });
  }
});

/**
 * GET /api/monitor/military-bases/stats
 * Summary counts by category.
 */
router.get('/military-bases/stats', (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(militarybases.getMilitaryBaseStats());
  } catch (error: any) {
    console.error('[API] Military bases stats error:', error);
    res.status(500).json({ error: 'Failed to load stats', message: error.message });
  }
});

export default router;
