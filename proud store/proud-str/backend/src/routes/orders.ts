import { supabase } from '../supabaseClient.js';
import express, { Request, Response } from 'express';
const router = express.Router();

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  const { user_id, items, shipping_info, total_price } = req.body;
  const { data, error } = await supabase.from('orders').insert([{ user_id, items, shipping_info, total_price }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/orders/:user_id
router.get('/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', user_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/orders
router.get('/', async (req: Request, res: Response) => {
  // TODO: Admin auth check
  const { data, error } = await supabase.from('orders').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  // TODO: Admin auth check
  const { id } = req.params;
  const { status } = req.body;
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
