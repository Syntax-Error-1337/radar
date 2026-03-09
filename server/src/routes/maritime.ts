import { Router } from 'express';
import { aisStreamService } from '../core/source/aisstream';

const router = Router();

// Maximum vessels to return in a single snapshot — MapLibre can't render more than
// ~30k symbol layers efficiently, and serializing 100k+ vessels with history arrays
// would easily exceed 100 MB of JSON per 5-second poll.
const SNAPSHOT_VESSEL_LIMIT = 30_000;

router.get('/status', (req, res) => {
  res.json({
    isConnected: aisStreamService.isConnected,
    readyState: aisStreamService.readyState,
    vesselCount: aisStreamService.vessels.size,
    totalMessagesReceived: aisStreamService.totalMessagesReceived,
    lastMessageReceived: aisStreamService.lastMessageReceived,
    secondsSinceLastMessage: aisStreamService.lastMessageReceived
      ? Math.floor((Date.now() - aisStreamService.lastMessageReceived) / 1000)
      : null,
  });
});

router.get('/snapshot', (req, res) => {
  const allVessels = aisStreamService.vessels;
  let vessels = Array.from(allVessels.values());

  // Cap vessel count — take the most recently updated ones
  if (vessels.length > SNAPSHOT_VESSEL_LIMIT) {
    vessels.sort((a, b) => b.lastUpdate - a.lastUpdate);
    vessels = vessels.slice(0, SNAPSHOT_VESSEL_LIMIT);
  }

  // Strip history — the map only needs position/heading to render vessel icons.
  // History is fetched separately via /api/maritime/vessel/:mmsi when a user
  // selects a vessel. Stripping it reduces payload size dramatically:
  // 50k vessels × 150 history points × ~16 bytes = ~120 MB → ~2 MB without history.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stripped = vessels.map(({ history: _h, ...v }) => v);

  res.json({
    timestamp: Date.now(),
    vessels: stripped,
  });
});

// Vessel detail endpoint — returns full data including history for the selected vessel
router.get('/vessel/:mmsi', (req, res) => {
  const mmsi = parseInt(req.params.mmsi, 10);
  const vessel = aisStreamService.vessels.get(mmsi);
  if (!vessel) {
    res.status(404).json({ error: 'Vessel not found' });
    return;
  }
  res.json(vessel);
});

export default router;
