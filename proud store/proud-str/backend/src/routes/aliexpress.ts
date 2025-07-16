import express from 'express';
import { supabase } from '../supabaseClient.js';
import { openai } from '../openaiClient.js';

const router = express.Router();

// Mock AliExpress API responses for development
const mockAliExpressData = [
  {
    id: 'ae_001',
    title: 'Wireless Bluetooth Earbuds Pro',
    description: 'Premium wireless earbuds with active noise cancellation',
    price: 25.99,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400'
    ],
    category: 'electronics',
    supplier: {
      name: 'TechSupplier Co.',
      rating: 4.8,
      location: 'Shenzhen, China'
    }
  },
  {
    id: 'ae_002',
    title: 'LED Strip Lights RGB',
    description: 'Smart LED strip lights with app control',
    price: 12.99,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    ],
    category: 'home',
    supplier: {
      name: 'LightTech Ltd.',
      rating: 4.6,
      location: 'Guangzhou, China'
    }
  },
  {
    id: 'ae_003',
    title: 'Phone Camera Lens Kit',
    description: 'Professional phone camera lens attachments',
    price: 18.99,
    images: [
      'https://images.unsplash.com/photo-1616091216791-a5360b5fc78a?w=400'
    ],
    category: 'electronics',
    supplier: {
      name: 'PhotoGear Inc.',
      rating: 4.7,
      location: 'Dongguan, China'
    }
  }
];

// Search AliExpress products
router.get('/search', async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice } = req.query;
    
    // In production, this would call the real AliExpress API
    let results = mockAliExpressData;
    
    // Filter by query
    if (query) {
      results = results.filter(product => 
        product.title.toLowerCase().includes(query.toString().toLowerCase()) ||
        product.description.toLowerCase().includes(query.toString().toLowerCase())
      );
    }
    
    // Filter by category
    if (category && category !== 'all') {
      results = results.filter(product => product.category === category);
    }
    
    // Filter by price range
    if (minPrice) {
      results = results.filter(product => product.price >= parseFloat(minPrice.toString()));
    }
    
    if (maxPrice) {
      results = results.filter(product => product.price <= parseFloat(maxPrice.toString()));
    }
    
    res.json({
      products: results,
      total: results.length,
      page: 1,
      totalPages: 1
    });
  } catch (error) {
    console.error('Error searching AliExpress:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get product details
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = mockAliExpressData.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error getting product details:', error);
    res.status(500).json({ error: 'Failed to get product details' });
  }
});

// Import product from AliExpress
router.post('/import/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { markup = 100 } = req.body; // Default 100% markup
    
    // Find the AliExpress product
    const aliProduct = mockAliExpressData.find(p => p.id === id);
    if (!aliProduct) {
      return res.status(404).json({ error: 'AliExpress product not found' });
    }
    
    // Check if already imported
    const { data: existingImport } = await supabase
      .from('aliexpress_products')
      .select('*')
      .eq('aliexpress_id', id)
      .single();
    
    if (existingImport && existingImport.imported) {
      return res.status(400).json({ error: 'Product already imported' });
    }
    
    // Calculate import price with markup
    const importPrice = (aliProduct.price * (1 + markup / 100)).toFixed(2);
    
    // Use AI to optimize title and description
    const aiOptimizationPrompt = `Optimize this product for an e-commerce store:
    
    Original Title: ${aliProduct.title}
    Original Description: ${aliProduct.description}
    Price: $${importPrice}
    Category: ${aliProduct.category}
    
    Please provide:
    1. An SEO-optimized title
    2. A compelling product description
    3. Key selling points
    4. Suggested tags
    
    Format as JSON with optimized_title, optimized_description, selling_points, and tags.`;
    
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an e-commerce product optimization expert.' },
        { role: 'user', content: aiOptimizationPrompt }
      ],
      max_tokens: 500,
      temperature: 0.3
    });
    
    const optimization = JSON.parse(aiResponse.choices[0].message.content || '{}');
    
    // Save to AliExpress products table
    const { data: aliExpressRecord, error: aliError } = await supabase
      .from('aliexpress_products')
      .upsert({
        aliexpress_id: id,
        title: aliProduct.title,
        description: aliProduct.description,
        price: aliProduct.price,
        images: aliProduct.images,
        category: aliProduct.category,
        supplier_info: aliProduct.supplier,
        imported: true
      });
    
    if (aliError) throw aliError;
    
    // Create product in main products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title: optimization.optimized_title || aliProduct.title,
        description: optimization.optimized_description || aliProduct.description,
        image: aliProduct.images[0],
        price: parseFloat(importPrice),
        stock: 100, // Default stock
        category: aliProduct.category,
        discount: 0,
        approved_by_ai: false // Will be analyzed by AI
      })
      .select()
      .single();
    
    if (productError) throw productError;
    
    // Trigger AI analysis for the new product
    const analysisPrompt = `Analyze this imported product:
    
    Title: ${product.title}
    Description: ${product.description}
    Price: $${product.price}
    Category: ${product.category}
    Original AliExpress Price: $${aliProduct.price}
    Markup: ${markup}%
    
    Evaluate quality, market potential, and pricing strategy.
    Provide JSON with quality_score, market_potential, pricing_recommendation, and should_approve.`;
    
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a product import analyst. Evaluate imported products for quality and market potential.' },
        { role: 'user', content: analysisPrompt }
      ],
      max_tokens: 400,
      temperature: 0.2
    });
    
    const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');
    
    // Save AI analysis
    await supabase
      .from('ai_analyses')
      .insert({
        product_id: product.id,
        analysis_type: 'aliexpress_import',
        result: JSON.stringify(analysis),
        confidence: analysis.confidence || 0.7,
        approved: analysis.should_approve && analysis.confidence >= 0.8
      });
    
    // Update product approval if AI recommends it
    if (analysis.should_approve && analysis.confidence >= 0.8) {
      await supabase
        .from('products')
        .update({ approved_by_ai: true })
        .eq('id', product.id);
    }
    
    res.json({
      success: true,
      product,
      aliexpress_product: aliProduct,
      ai_optimization: optimization,
      ai_analysis: analysis,
      import_price: importPrice,
      markup_percentage: markup
    });
  } catch (error) {
    console.error('Error importing product:', error);
    res.status(500).json({ error: 'Failed to import product' });
  }
});

// Get import history
router.get('/imports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('aliexpress_products')
      .select('*')
      .eq('imported', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

// Bulk import products
router.post('/bulk-import', async (req, res) => {
  try {
    const { product_ids, markup = 100 } = req.body;
    
    if (!product_ids || !Array.isArray(product_ids)) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }
    
    const imported = [];
    const errors = [];
    
    for (const productId of product_ids) {
      try {
        const aliProduct = mockAliExpressData.find(p => p.id === productId);
        if (!aliProduct) {
          errors.push({ id: productId, error: 'Product not found' });
          continue;
        }
        
        const importPrice = (aliProduct.price * (1 + markup / 100)).toFixed(2);
        
        // Save to database
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            title: aliProduct.title,
            description: aliProduct.description,
            image: aliProduct.images[0],
            price: parseFloat(importPrice),
            stock: 100,
            category: aliProduct.category,
            discount: 0,
            approved_by_ai: false
          })
          .select()
          .single();
        
        if (productError) throw productError;
        
        await supabase
          .from('aliexpress_products')
          .upsert({
            aliexpress_id: productId,
            title: aliProduct.title,
            description: aliProduct.description,
            price: aliProduct.price,
            images: aliProduct.images,
            category: aliProduct.category,
            supplier_info: aliProduct.supplier,
            imported: true
          });
        
        imported.push({
          aliexpress_id: productId,
          product_id: product.id,
          import_price: importPrice
        });
        
      } catch (error) {
        errors.push({ id: productId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      imported: imported.length,
      errors: errors.length,
      details: { imported, errors }
    });
  } catch (error) {
    console.error('Error bulk importing:', error);
    res.status(500).json({ error: 'Failed to bulk import products' });
  }
});

// Get trending products from AliExpress
router.get('/trending', async (req, res) => {
  try {
    // In production, this would call AliExpress trending API
    const trending = mockAliExpressData.slice(0, 2);
    
    res.json({
      products: trending,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
});

export default router;
