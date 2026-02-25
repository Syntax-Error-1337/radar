import { Router } from 'express';
import { fetchStates, fetchTrack } from '../core/opensky';

const router = Router();

router.get('/snapshot', async (req, res) => {
    try {
        const states = await fetchStates();
        res.json({ states, timestamp: Date.now() });
    } catch (error: any) {
        console.error('Snapshot error:', error.message);
        res.status(502).json({ error: 'Upstream Provider Error', details: error.message });
    }
});

router.get('/track/:icao24', async (req, res) => {
    try {
        const track = await fetchTrack(req.params.icao24);
        res.json(track);
    } catch (error: any) {
        console.error('Track error:', error.message);
        // Track requests might 404 cleanly when no tracks are stored, which is fine
        if (error.message.includes('404')) {
            return res.status(404).json({ error: 'Not Found' });
        }
        res.status(502).json({ error: 'Upstream Provider Error', details: error.message });
    }
});

export default router;
