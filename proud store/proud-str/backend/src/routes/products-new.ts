import express, { Request, Response } from 'express';
import { supabase } from '../supabaseClient.js';
import { AuthenticatedRequest, authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products - Get all approved products (public)
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      category, 
      search, 
      sort = 'created_at', 
      order = 'desc', 
      page = 1, 
      limit = 20,
      min_price,
      max_price,
      rating
    } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .eq('approved_by_ai', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (min_price) {
      query = query.gte('price', parseFloat(min_price as string));
    }

    if (max_price) {
      query = query.lte('price', parseFloat(max_price as string));
    }

    if (rating) {
      query = query.gte('rating', parseFloat(rating as string));
    }

    // Apply sorting
    query = query.order(sort as string, { ascending: order === 'asc' });

    // Apply pagination
    const from = (parseInt(page as string) - 1) * parseInt(limit as string);
    const to = from + parseInt(limit as string) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      products: data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        pages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        reviews (
          id,
          rating,
          comment,
          user_id,
          users (full_name),
          created_at,
          verified_purchase
        )
      `)
      .eq('id', id)
      .eq('approved_by_ai', true)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products - Create new product (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      image_url,
      price,
      original_price,
      stock,
      category,
      brand,
      shipping_info,
      tags
    } = req.body;

    if (!title || !price || !stock) {
      return res.status(400).json({ error: 'Title, price, and stock are required' });
    }

    const discount_percentage = original_price ? 
      Math.round(((original_price - price) / original_price) * 100) : 0;

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          title,
          description,
          image_url,
          price,
          original_price,
          discount_percentage,
          stock,
          category,
          brand,
          shipping_info: shipping_info || 'Free shipping',
          tags: tags || [],
          approved_by_ai: true
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Calculate discount percentage if prices are updated
    if (updates.price && updates.original_price) {
      updates.discount_percentage = Math.round(
        ((updates.original_price - updates.price) / updates.original_price) * 100
      );
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/admin/all - Get all products including pending (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/:id/approve - Approve product (admin only)
router.post('/:id/approve', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .update({ approved_by_ai: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Product approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/:id/reject - Reject product (admin only)
router.post('/:id/reject', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .update({ approved_by_ai: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Product rejection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/categories - Get all categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/import-from-aliexpress - Import from AliExpress
router.post('/import-from-aliexpress', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This will be handled by the AliExpress integration
    res.json({ message: 'AliExpress import functionality available in /api/aliexpress' });
  } catch (error) {
    console.error('AliExpress import error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
