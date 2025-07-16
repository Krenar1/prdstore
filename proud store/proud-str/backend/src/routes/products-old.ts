import { supabase } from '../supabaseClient.js';
import express, { Request, Response } from 'express';
const router = express.Router();

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('products').select('*').eq('approved_by_ai', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  // TODO: Admin auth check
  const { title, description, image, price, stock, discount } = req.body;
  const { data, error } = await supabase.from('products').insert([{ title, description, image, price, stock, discount }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response) => {
  // TODO: Admin auth check
  const { id } = req.params;
  const updateData = req.body;
  const { data, error } = await supabase.from('products').update(updateData).eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/products/:id
router.delete('/:id', async (req: Request, res: Response) => {
  // TODO: Admin auth check
  const { id } = req.params;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/products/import-from-aliexpress
router.post('/import-from-aliexpress', async (req: Request, res: Response) => {
  // TODO: AliExpress import + AI pipeline
  res.json({});
});

export default router;
