import express, { Request, Response } from 'express';
import { supabase } from '../supabaseClient.js';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cart - Get user's cart
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          title,
          price,
          original_price,
          image_url,
          stock,
          discount_percentage
        )
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Calculate totals
    let total_items = 0;
    let total_price = 0;
    let total_savings = 0;

    const cartItems = data.map(item => {
      const product = item.products;
      const itemTotal = product.price * item.quantity;
      const itemSavings = product.original_price ? 
        (product.original_price - product.price) * item.quantity : 0;
      
      total_items += item.quantity;
      total_price += itemTotal;
      total_savings += itemSavings;

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          original_price: product.original_price,
          image_url: product.image_url,
          stock: product.stock,
          discount_percentage: product.discount_percentage
        },
        item_total: itemTotal,
        item_savings: itemSavings
      };
    });

    res.json({
      cart_items: cartItems,
      summary: {
        total_items,
        total_price,
        total_savings,
        final_total: total_price
      }
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cart - Add item to cart
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, stock')
      .eq('id', product_id)
      .eq('approved_by_ai', true)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', req.user!.id)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock available' });
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({
        message: 'Cart item updated successfully',
        cart_item: data
      });
    } else {
      // Add new item
      const { data, error } = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: req.user!.id,
            product_id,
            quantity
          }
        ])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(201).json({
        message: 'Item added to cart successfully',
        cart_item: data
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cart/:id - Update cart item quantity
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    // Check if cart item exists and belongs to user
    const { data: cartItem, error: cartError } = await supabase
      .from('cart_items')
      .select('*, products (stock)')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (cartError || !cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock availability
    if (quantity > cartItem.products.stock) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: 'Cart item updated successfully',
      cart_item: data
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/:id - Remove item from cart
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user!.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
