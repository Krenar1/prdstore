import { supabase } from '../supabaseClient.js';
import express, { Request, Response } from 'express';
const router = express.Router();

// POST /api/ads/generate
router.post('/generate', async (req: Request, res: Response) => {
  // TODO: AI generates ad copy
  res.json({});
});

// POST /api/ads/launch
router.post('/launch', async (req: Request, res: Response) => {
  // TODO: Admin launches Facebook Ad (mockable)
  res.json({});
});

export default router;
