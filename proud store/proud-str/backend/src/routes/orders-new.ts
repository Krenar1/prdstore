import express, { Request, Response } from 'express';
import { supabase } from '../supabaseClient.js';
import { AuthenticatedRequest, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/orders - Create new order (authenticated users)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      items,
      shipping_info,
      payment_method = 'card'
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    if (!shipping_info || !shipping_info.address || !shipping_info.city) {
      return res.status(400).json({ error: 'Shipping information is required' });
    }

    // Calculate total price
    let total_price = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, price, stock, image_url')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.title}. Available: ${product.stock}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      total_price += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_title: product.title,
        product_image: product.image_url,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: req.user!.id,
          items: orderItems,
          shipping_info,
          total_price,
          payment_method,
          status: 'pending',
          payment_status: 'pending',
          estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      ])
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ error: orderError.message });
    }

    // Update product stock
    for (const item of items) {
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      
      if (currentProduct) {
        await supabase
          .from('products')
          .update({ 
            stock: currentProduct.stock - item.quantity 
          })
          .eq('id', item.product_id);
      }
    }

    // Clear user's cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user!.id);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders - Get user's orders
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user!.id);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (parseInt(page as string) - 1) * parseInt(limit as string);
    const to = from + parseInt(limit as string) - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      orders: data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        pages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/admin/all - Get all orders (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (parseInt(page as string) - 1) * parseInt(limit as string);
    const to = from + parseInt(limit as string) - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      orders: data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        pages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status - Update order status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };
    if (tracking_number) {
      updateData.tracking_number = tracking_number;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: 'Order status updated successfully',
      order: data
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/payment-status - Update payment status (admin only)
router.patch('/:id/payment-status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: 'Payment status updated successfully',
      order: data
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/track/:tracking_number - Track order by tracking number
router.get('/track/:tracking_number', async (req: Request, res: Response) => {
  try {
    const { tracking_number } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('id, status, estimated_delivery, created_at, tracking_number')
      .eq('tracking_number', tracking_number)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Generate tracking history based on status
    const trackingHistory = [];
    const createdAt = new Date(data.created_at);
    
    trackingHistory.push({
      status: 'Order Placed',
      date: createdAt,
      description: 'Your order has been placed successfully'
    });

    if (data.status === 'processing' || data.status === 'shipped' || data.status === 'delivered') {
      trackingHistory.push({
        status: 'Processing',
        date: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 day
        description: 'Your order is being processed'
      });
    }

    if (data.status === 'shipped' || data.status === 'delivered') {
      trackingHistory.push({
        status: 'Shipped',
        date: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
        description: 'Your order has been shipped'
      });
    }

    if (data.status === 'delivered') {
      trackingHistory.push({
        status: 'Delivered',
        date: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        description: 'Your order has been delivered'
      });
    }

    res.json({
      order_id: data.id,
      tracking_number: data.tracking_number,
      current_status: data.status,
      estimated_delivery: data.estimated_delivery,
      tracking_history: trackingHistory
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/cancel - Cancel order (user or admin)
router.post('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if order exists and user has permission
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    if (req.user!.role !== 'admin' && order.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Can only cancel pending or processing orders
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel shipped or delivered orders' });
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason || 'User requested cancellation'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Restore product stock
    for (const item of order.items) {
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      
      if (currentProduct) {
        await supabase
          .from('products')
          .update({ 
            stock: currentProduct.stock + item.quantity 
          })
          .eq('id', item.product_id);
      }
    }

    res.json({
      message: 'Order cancelled successfully',
      order: data
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
