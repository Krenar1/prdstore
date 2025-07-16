import express from 'express';
import OpenAI from 'openai';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get AI analyses
router.get('/analyses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_analyses')
      .select(`
        *,
        products (
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const analyses = data?.map((item: any) => ({
      ...item,
      product_title: item.products?.title || 'Unknown Product'
    })) || [];

    res.json(analyses);
  } catch (error) {
    console.error('Error fetching AI analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Approve AI analysis
router.post('/analyses/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('ai_analyses')
      .update({ approved: true })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving analysis:', error);
    res.status(500).json({ error: 'Failed to approve analysis' });
  }
});

// Get AI configuration
router.get('/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const config = data || {
      openai_api_key: '',
      analysis_threshold: 0.7,
      auto_approval_threshold: 0.9,
      enable_auto_product_analysis: true,
      enable_price_optimization: true,
      enable_trend_analysis: true
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update AI configuration
router.post('/config', async (req, res) => {
  try {
    const config = req.body;
    
    const { data, error } = await supabase
      .from('ai_config')
      .upsert(config);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Run bulk product analysis
router.post('/bulk-analyze', async (req, res) => {
  try {
    // Get all products that haven't been analyzed
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .not('id', 'in', '(SELECT product_id FROM ai_analyses)');

    if (error) throw error;

    const analyses = [];
    
    for (const product of products || []) {
      try {
        const prompt = `Analyze this product for quality, marketability, and potential issues:
        Title: ${product.title}
        Description: ${product.description}
        Price: $${product.price}
        Category: ${product.category}
        
        Please provide a JSON response with:
        - quality_score (0-1)
        - marketability_score (0-1)
        - potential_issues (array of strings)
        - recommendations (array of strings)
        - overall_confidence (0-1)
        - should_approve (boolean)`;

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert product analyst for an e-commerce platform. Analyze products for quality, marketability, and potential issues.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        });

        const analysis = JSON.parse(response.choices[0].message.content || '{}');
        
        const { data: analysisData, error: analysisError } = await supabase
          .from('ai_analyses')
          .insert({
            product_id: product.id,
            analysis_type: 'product_quality',
            result: JSON.stringify(analysis),
            confidence: analysis.overall_confidence || 0.5,
            approved: analysis.should_approve && analysis.overall_confidence >= 0.9
          });

        if (analysisError) throw analysisError;

        analyses.push(analysisData);
      } catch (productError) {
        console.error(`Error analyzing product ${product.id}:`, productError);
      }
    }

    res.json({ message: `Analyzed ${analyses.length} products` });
  } catch (error) {
    console.error('Error running bulk analysis:', error);
    res.status(500).json({ error: 'Failed to run bulk analysis' });
  }
});

// Generate trend report
router.post('/trend-report', async (req, res) => {
  try {
    // Get recent products and orders for trend analysis
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (productsError) throw productsError;

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Analyze trends with AI
    const trendData = {
      product_categories: products?.reduce((acc: any, p: any) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {}),
      order_trends: orders?.length || 0,
      price_ranges: products?.reduce((acc: any, p: any) => {
        const range = p.price < 25 ? 'low' : p.price < 75 ? 'medium' : 'high';
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {})
    };

    const prompt = `Analyze these e-commerce trends and provide insights:
    
    Product Categories: ${JSON.stringify(trendData.product_categories)}
    Recent Orders: ${trendData.order_trends}
    Price Ranges: ${JSON.stringify(trendData.price_ranges)}
    
    Please provide analysis on:
    1. Trending categories
    2. Price optimization opportunities
    3. Market predictions
    4. Recommendations for growth
    
    Format as a concise summary with actionable insights.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert e-commerce trend analyst. Provide actionable insights for business growth.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.4
    });

    const summary = response.choices[0].message.content || 'No analysis available';

    res.json({ 
      summary,
      data: trendData,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating trend report:', error);
    res.status(500).json({ error: 'Failed to generate trend report' });
  }
});

// Auto-analyze new products
router.post('/analyze-product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const prompt = `Analyze this product for an e-commerce platform:
    
    Title: ${product.title}
    Description: ${product.description}
    Price: $${product.price}
    Category: ${product.category}
    
    Provide a quality assessment and recommendation for approval.
    Response format: JSON with quality_score, marketability_score, should_approve, and confidence.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a product quality analyst. Evaluate products for an e-commerce platform.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.2
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    const { data: analysisData, error: analysisError } = await supabase
      .from('ai_analyses')
      .insert({
        product_id: id,
        analysis_type: 'product_quality',
        result: JSON.stringify(analysis),
        confidence: analysis.confidence || 0.5,
        approved: analysis.should_approve && analysis.confidence >= 0.9
      });

    if (analysisError) throw analysisError;

    // Update product approval status if confidence is high
    if (analysis.should_approve && analysis.confidence >= 0.9) {
      await supabase
        .from('products')
        .update({ approved_by_ai: true })
        .eq('id', id);
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ error: 'Failed to analyze product' });
  }
});

export default router;
