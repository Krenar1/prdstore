-- Complete Supabase Schema for TEMU-style Ecommerce Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_percentage INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  category TEXT,
  brand TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  shipping_info TEXT DEFAULT 'Free shipping',
  tags TEXT[],
  approved_by_ai BOOLEAN DEFAULT false,
  suggested_price DECIMAL(10,2),
  profit_margin DECIMAL(5,2),
  supplier_info JSONB,
  aliexpress_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  shipping_info JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  tracking_number TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cart table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- AI Logs table
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ai_decision TEXT NOT NULL,
  reasoning_text TEXT,
  suggested_changes JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ai_generated_text TEXT,
  headline TEXT,
  description TEXT,
  call_to_action TEXT,
  target_audience JSONB,
  budget_suggestion DECIMAL(10,2),
  estimated_roi DECIMAL(5,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  platform TEXT DEFAULT 'facebook' CHECK (platform IN ('facebook', 'google', 'instagram')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin Settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view approved products
CREATE POLICY "Anyone can view approved products" ON public.products
  FOR SELECT USING (approved_by_ai = true);

-- Admins can manage all products
CREATE POLICY "Admins can manage products" ON public.products
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON public.cart_items
  USING (auth.uid() = user_id);

-- Users can manage their own reviews
CREATE POLICY "Users can manage own reviews" ON public.reviews
  USING (auth.uid() = user_id);

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON public.addresses
  USING (auth.uid() = user_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert sample data
INSERT INTO public.categories (name, description, icon_url, sort_order) VALUES
('Electronics', 'Electronic devices and accessories', '📱', 1),
('Fashion', 'Clothing and accessories', '👗', 2),
('Home & Garden', 'Home improvement and garden items', '🏠', 3),
('Sports', 'Sports and outdoor equipment', '⚽', 4),
('Beauty', 'Beauty and personal care', '💄', 5),
('Toys', 'Toys and games', '🧸', 6);

-- Insert sample products
INSERT INTO public.products (title, description, image_url, price, original_price, discount_percentage, stock, category, brand, rating, reviews_count, shipping_info, tags, approved_by_ai, profit_margin) VALUES
('Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', 79.99, 129.99, 38, 150, 'Electronics', 'TechPro', 4.5, 1234, 'Free shipping', ARRAY['electronics', 'wireless', 'headphones'], true, 45.00),
('Smartphone Case', 'Protective case for latest smartphones', 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400', 24.99, 39.99, 37, 500, 'Electronics', 'ProtectPro', 4.3, 856, 'Free shipping', ARRAY['phone', 'case', 'protection'], true, 60.00),
('LED Desk Lamp', 'Adjustable LED desk lamp with USB charging', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 45.99, 69.99, 34, 200, 'Home & Garden', 'LightMax', 4.6, 523, 'Free shipping', ARRAY['lamp', 'led', 'desk'], true, 55.00),
('Running Shoes', 'Comfortable running shoes for all terrains', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 89.99, 149.99, 40, 300, 'Sports', 'RunFast', 4.4, 2103, 'Free shipping', ARRAY['shoes', 'running', 'sports'], true, 50.00),
('Skincare Set', 'Complete skincare routine with natural ingredients', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 34.99, 59.99, 42, 180, 'Beauty', 'GlowUp', 4.7, 912, 'Free shipping', ARRAY['skincare', 'beauty', 'natural'], true, 65.00),
('Backpack', 'Durable travel backpack with multiple compartments', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 59.99, 89.99, 33, 250, 'Fashion', 'TravelGear', 4.5, 678, 'Free shipping', ARRAY['backpack', 'travel', 'durable'], true, 40.00);

-- Insert admin user (will be created via auth, this is just for reference)
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
('admin_credentials', '{"email": "proudchannel2024@gmail.com", "password": "lolinr123"}'),
('aliexpress_api_key', '{"key": "", "secret": ""}'),
('facebook_ads_token', '{"access_token": ""}'),
('openai_api_key', '{"key": ""}');
