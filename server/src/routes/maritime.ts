import { Router } from 'express';
import { aisStreamService } from '../core/aisstream';

const router = Router();

router.get('/snapshot', (req, res) => {
    // Return all known vessels as an array
    const vesselsArray = Array.from(aisStreamService.vessels.values());
    res.json({
        timestamp: Date.now(),
        vessels: vesselsArray
    });
});

export default router;
