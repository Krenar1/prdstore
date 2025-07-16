-- Supabase SQL schema for Proud Store

-- Users table (Supabase managed)
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image text,
  price numeric NOT NULL,
  stock integer NOT NULL,
  approved_by_ai boolean DEFAULT false,
  suggested_price numeric,
  discount numeric,
  profit_margin numeric,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  customer_name text,
  customer_email text,
  items jsonb NOT NULL,
  shipping_info jsonb,
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- AI analyses table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  analysis_type text NOT NULL,
  result text NOT NULL,
  confidence numeric NOT NULL,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- AI configuration table
CREATE TABLE IF NOT EXISTS ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_api_key text,
  analysis_threshold numeric DEFAULT 0.7,
  auto_approval_threshold numeric DEFAULT 0.9,
  enable_auto_product_analysis boolean DEFAULT true,
  enable_price_optimization boolean DEFAULT true,
  enable_trend_analysis boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- AI logs table
CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  ai_decision text,
  reasoning_text text,
  created_at timestamptz DEFAULT now()
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  ai_generated_text text,
  budget_suggestion numeric,
  status text DEFAULT 'Draft',
  created_at timestamptz DEFAULT now()
);

-- AliExpress integration table
CREATE TABLE IF NOT EXISTS aliexpress_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliexpress_id text UNIQUE NOT NULL,
  title text,
  description text,
  price numeric,
  images jsonb,
  category text,
  supplier_info jsonb,
  imported boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Facebook Ads campaigns table
CREATE TABLE IF NOT EXISTS facebook_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text UNIQUE,
  product_id uuid REFERENCES products(id),
  campaign_name text,
  budget numeric,
  status text DEFAULT 'active',
  target_audience jsonb,
  performance_metrics jsonb,
  created_at timestamptz DEFAULT now()
);

-- Customer analytics table
CREATE TABLE IF NOT EXISTS customer_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  behavior_data jsonb,
  purchase_history jsonb,
  preferences jsonb,
  lifetime_value numeric,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_approved_by_ai ON products(approved_by_ai);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_product_id ON ai_analyses(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_approved ON ai_analyses(approved);
CREATE INDEX IF NOT EXISTS idx_aliexpress_products_imported ON aliexpress_products(imported);
CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_status ON facebook_campaigns(status);

-- Sample data for testing
INSERT INTO products (title, description, image, price, stock, category, discount) VALUES
('Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 89.99, 50, 'electronics', 10),
('Smart Fitness Watch', 'Track your fitness goals with this advanced smartwatch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 199.99, 30, 'electronics', 15),
('Premium Yoga Mat', 'Non-slip yoga mat for all your workout needs', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 39.99, 100, 'sports', 5),
('Organic Skincare Set', 'Natural skincare products for healthy skin', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', 59.99, 75, 'beauty', 20),
('Designer Handbag', 'Stylish handbag for everyday use', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', 129.99, 25, 'fashion', 25),
('Smart Home Speaker', 'Voice-controlled smart speaker with AI assistant', 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=400', 149.99, 40, 'electronics', 12),
('Ceramic Coffee Mug Set', 'Beautiful ceramic mugs for your morning coffee', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 24.99, 80, 'home', 0),
('Bluetooth Gaming Mouse', 'High-precision gaming mouse with customizable buttons', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 79.99, 60, 'electronics', 8),
('Scented Candle Collection', 'Relaxing scented candles for home ambiance', 'https://images.unsplash.com/photo-1602874801006-24f9845c2d3d?w=400', 34.99, 120, 'home', 0),
('Wireless Phone Charger', 'Fast wireless charging pad for smartphones', 'https://images.unsplash.com/photo-1563898281-48b8e71c2d93?w=400', 29.99, 90, 'electronics', 5)
ON CONFLICT DO NOTHING;
