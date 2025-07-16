import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';
import { openai } from './openaiClient.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders-new.js';
import cartRouter from './routes/cart.js';
import adsRouter from './routes/ads.js';
import authRouter from './routes/auth.js';
import aiRouter from './routes/ai.js';
import aliexpressRouter from './routes/aliexpress.js';
import facebookAdsRouter from './routes/facebook-ads.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/ads', adsRouter);
app.use('/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/aliexpress', aliexpressRouter);
app.use('/api/facebook-ads', facebookAdsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Proud Store Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
});
