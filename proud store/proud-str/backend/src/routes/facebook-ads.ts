import express from 'express';
import { supabase } from '../supabaseClient.js';
import { openai } from '../openaiClient.js';
import axios from 'axios';

const router = express.Router();

// Mock Facebook Ads API responses for development
const mockFacebookAdsData = {
  account_id: '123456789',
  access_token: 'mock_access_token',
  campaigns: [
    {
      id: 'campaign_001',
      name: 'Electronics Summer Sale',
      status: 'ACTIVE',
      budget: 500,
      impressions: 15420,
      clicks: 1250,
      conversions: 45,
      spend: 387.50,
      cpm: 25.10,
      ctr: 8.1,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'campaign_002',
      name: 'Fashion Collection Launch',
      status: 'ACTIVE',
      budget: 750,
      impressions: 22100,
      clicks: 1890,
      conversions: 67,
      spend: 623.75,
      cpm: 28.23,
      ctr: 8.6,
      created_at: '2024-01-10T14:30:00Z'
    }
  ]
};

// Get Facebook Ads account info
router.get('/account', async (req, res) => {
  try {
    // In production, this would call Facebook Graph API
    const accountInfo = {
      id: mockFacebookAdsData.account_id,
      name: 'Proud Store Ads Account',
      currency: 'USD',
      timezone: 'America/New_York',
      balance: 2450.75,
      spend_limit: 5000,
      status: 'ACTIVE'
    };
    
    res.json(accountInfo);
  } catch (error) {
    console.error('Error fetching Facebook Ads account:', error);
    res.status(500).json({ error: 'Failed to fetch account info' });
  }
});

// Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('facebook_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Merge with mock data for demo
    const campaigns = [
      ...mockFacebookAdsData.campaigns,
      ...(data || [])
    ];
    
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { product_id, budget, target_audience, campaign_name } = req.body;
    
    if (!product_id || !budget || !campaign_name) {
      return res.status(400).json({ error: 'Product ID, budget, and campaign name are required' });
    }
    
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();
    
    if (productError) throw productError;
    
    // Generate AI-optimized ad copy
    const adCopyPrompt = `Create compelling Facebook ad copy for this product:
    
    Product: ${product.title}
    Description: ${product.description}
    Price: $${product.price}
    Category: ${product.category}
    Target Audience: ${JSON.stringify(target_audience)}
    
    Create:
    1. Primary headline (25 characters max)
    2. Secondary headline (40 characters max)
    3. Ad description (90 characters max)
    4. Call-to-action button text
    5. Audience targeting suggestions
    
    Format as JSON with headline, secondary_headline, description, cta_text, and targeting_suggestions.`;
    
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a Facebook Ads expert. Create high-converting ad copy.' },
        { role: 'user', content: adCopyPrompt }
      ],
      max_tokens: 400,
      temperature: 0.4
    });
    
    const adCopy = JSON.parse(aiResponse.choices[0].message.content || '{}');
    
    // Create campaign in Facebook Ads (mock)
    const campaignId = `campaign_${Date.now()}`;
    const campaignData = {
      id: campaignId,
      name: campaign_name,
      status: 'ACTIVE',
      budget: budget,
      product_id: product_id,
      ad_copy: adCopy,
      target_audience: target_audience,
      created_at: new Date().toISOString()
    };
    
    // Save to database
    const { data: dbCampaign, error: dbError } = await supabase
      .from('facebook_campaigns')
      .insert({
        campaign_id: campaignId,
        product_id: product_id,
        campaign_name: campaign_name,
        budget: budget,
        status: 'active',
        target_audience: target_audience,
        performance_metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0
        }
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    res.json({
      success: true,
      campaign: campaignData,
      ai_ad_copy: adCopy,
      database_record: dbCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('facebook_campaigns')
      .update(updates)
      .eq('campaign_id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, campaign: data });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Get campaign performance
router.get('/campaigns/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock performance data
    const performance = {
      campaign_id: id,
      impressions: Math.floor(Math.random() * 20000) + 5000,
      clicks: Math.floor(Math.random() * 1000) + 200,
      conversions: Math.floor(Math.random() * 100) + 10,
      spend: Math.floor(Math.random() * 500) + 100,
      cpm: (Math.random() * 20 + 10).toFixed(2),
      ctr: (Math.random() * 5 + 3).toFixed(1),
      conversion_rate: (Math.random() * 8 + 2).toFixed(1),
      cost_per_conversion: (Math.random() * 50 + 10).toFixed(2),
      roas: (Math.random() * 4 + 2).toFixed(1),
      updated_at: new Date().toISOString()
    };
    
    res.json(performance);
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Pause/Resume campaign
router.post('/campaigns/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: campaign, error: fetchError } = await supabase
      .from('facebook_campaigns')
      .select('status')
      .eq('campaign_id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    
    const { data, error } = await supabase
      .from('facebook_campaigns')
      .update({ status: newStatus })
      .eq('campaign_id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, campaign: data });
  } catch (error) {
    console.error('Error toggling campaign:', error);
    res.status(500).json({ error: 'Failed to toggle campaign' });
  }
});

// Get audience insights
router.get('/audiences/insights', async (req, res) => {
  try {
    const { interests, demographics, location } = req.query;
    
    // Mock audience insights
    const insights = {
      audience_size: Math.floor(Math.random() * 5000000) + 500000,
      reach_estimate: Math.floor(Math.random() * 500000) + 50000,
      cost_estimate: {
        min_cpm: (Math.random() * 10 + 5).toFixed(2),
        max_cpm: (Math.random() * 30 + 15).toFixed(2),
        avg_cpc: (Math.random() * 2 + 0.5).toFixed(2)
      },
      demographics: {
        age_distribution: {
          '18-24': Math.floor(Math.random() * 30) + 10,
          '25-34': Math.floor(Math.random() * 40) + 20,
          '35-44': Math.floor(Math.random() * 25) + 15,
          '45-54': Math.floor(Math.random() * 20) + 10,
          '55+': Math.floor(Math.random() * 15) + 5
        },
        gender_distribution: {
          male: Math.floor(Math.random() * 30) + 35,
          female: Math.floor(Math.random() * 30) + 35,
          unknown: Math.floor(Math.random() * 10) + 5
        }
      },
      interests: [
        'Online Shopping',
        'E-commerce',
        'Fashion',
        'Technology',
        'Electronics'
      ],
      recommendations: [
        'Target users who have shown interest in similar products',
        'Focus on mobile users for better conversion rates',
        'Consider lookalike audiences based on existing customers'
      ]
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching audience insights:', error);
    res.status(500).json({ error: 'Failed to fetch audience insights' });
  }
});

// Generate ad creative suggestions
router.post('/creative/suggestions', async (req, res) => {
  try {
    const { product_id, campaign_objective, target_audience } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();
    
    if (productError) throw productError;
    
    const creativeSuggestionPrompt = `Generate Facebook ad creative suggestions for:
    
    Product: ${product.title}
    Description: ${product.description}
    Price: $${product.price}
    Category: ${product.category}
    Objective: ${campaign_objective || 'conversions'}
    Target Audience: ${JSON.stringify(target_audience)}
    
    Provide 3 different creative concepts with:
    1. Visual concept description
    2. Headline variations (3 options each)
    3. Body text variations (3 options each)
    4. Call-to-action suggestions
    5. Estimated performance potential
    
    Format as JSON array with concept_name, visual_concept, headlines, body_texts, cta_options, and performance_estimate.`;
    
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a Facebook Ads creative expert. Generate high-converting ad concepts.' },
        { role: 'user', content: creativeSuggestionPrompt }
      ],
      max_tokens: 800,
      temperature: 0.6
    });
    
    const creativeSuggestions = JSON.parse(aiResponse.choices[0].message.content || '[]');
    
    res.json({
      product: product,
      creative_suggestions: creativeSuggestions,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating creative suggestions:', error);
    res.status(500).json({ error: 'Failed to generate creative suggestions' });
  }
});

// Get campaign analytics dashboard
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const { date_range = '7d' } = req.query;
    
    // Mock analytics data
    const analytics = {
      overview: {
        total_campaigns: 8,
        active_campaigns: 5,
        total_spend: 3240.50,
        total_impressions: 156780,
        total_clicks: 12450,
        total_conversions: 340,
        average_ctr: 7.9,
        average_cpm: 20.67,
        roas: 3.2
      },
      performance_trends: {
        impressions: [12000, 14500, 13200, 15800, 17200, 16500, 18900],
        clicks: [960, 1150, 1080, 1240, 1380, 1320, 1510],
        conversions: [28, 35, 32, 41, 45, 42, 52],
        spend: [280, 340, 310, 380, 420, 390, 450]
      },
      top_performing_campaigns: mockFacebookAdsData.campaigns.slice(0, 3),
      audience_insights: {
        top_demographics: ['25-34', '35-44', '18-24'],
        top_interests: ['Online Shopping', 'Fashion', 'Technology'],
        top_locations: ['United States', 'Canada', 'United Kingdom']
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Auto-optimize campaigns
router.post('/campaigns/:id/optimize', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: campaign, error: campaignError } = await supabase
      .from('facebook_campaigns')
      .select('*')
      .eq('campaign_id', id)
      .single();
    
    if (campaignError) throw campaignError;
    
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', campaign.product_id)
      .single();
    
    if (productError) throw productError;
    
    // AI optimization suggestions
    const optimizationPrompt = `Analyze this Facebook campaign and provide optimization suggestions:
    
    Campaign: ${campaign.campaign_name}
    Product: ${product.title}
    Current Budget: $${campaign.budget}
    Performance Metrics: ${JSON.stringify(campaign.performance_metrics)}
    
    Provide optimization recommendations for:
    1. Budget allocation
    2. Audience targeting
    3. Ad creative
    4. Bidding strategy
    5. Schedule optimization
    
    Format as JSON with specific, actionable recommendations.`;
    
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a Facebook Ads optimization expert. Provide data-driven recommendations.' },
        { role: 'user', content: optimizationPrompt }
      ],
      max_tokens: 600,
      temperature: 0.3
    });
    
    const optimizations = JSON.parse(aiResponse.choices[0].message.content || '{}');
    
    res.json({
      campaign_id: id,
      optimization_suggestions: optimizations,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing campaign:', error);
    res.status(500).json({ error: 'Failed to optimize campaign' });
  }
});

export default router;
