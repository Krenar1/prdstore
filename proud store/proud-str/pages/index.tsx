import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout-fixed';
import { Star, ShoppingCart, Heart, Eye, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image_url: string;
  images: string[];
  description: string;
  category: string;
  rating: number;
  reviews_count: number;
  stock_quantity: number;
  discount_percentage: number;
  is_featured: boolean;
  is_on_sale: boolean;
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const categoryParam = selectedCategory === 'All' ? '' : `?category=${selectedCategory}`;
      const sortParam = categoryParam ? `&sort=${sortBy}` : `?sort=${sortBy}`;
      
      const response = await fetch(`http://localhost:4000/products${categoryParam}${sortParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:4000/products/categories');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(['All', ...data.categories]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const addToCart = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      });

      if (response.ok) {
        // Show success message or update cart count
        alert('Product added to cart!');
      } else {
        alert('Failed to add product to cart');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => router.push(`/product/${product.id}`)}
        />
        {product.is_on_sale && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{product.discount_percentage}%
          </div>
        )}
        <div className="absolute top-2 right-2 flex space-x-2">
          <button className="p-1 bg-white rounded-full shadow-sm hover:shadow-md">
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>
          <button className="p-1 bg-white rounded-full shadow-sm hover:shadow-md">
            <Eye className="w-4 h-4 text-gray-600 hover:text-blue-500" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
          {product.name}
        </h3>
        
        <div className="flex items-center space-x-1 mb-2">
          {renderStars(product.rating)}
          <span className="text-sm text-gray-600">({product.reviews_count})</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-orange-600">
              {formatPrice(product.price)}
            </span>
            {product.original_price > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {product.stock_quantity} left
          </span>
        </div>
        
        <button
          onClick={() => addToCart(product.id)}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Shop Smart, Save Big
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                Discover amazing deals on millions of products
              </p>
              <div className="flex justify-center space-x-4">
                <div className="bg-white bg-opacity-20 px-6 py-3 rounded-lg">
                  <div className="text-2xl font-bold">10M+</div>
                  <div className="text-sm">Products</div>
                </div>
                <div className="bg-white bg-opacity-20 px-6 py-3 rounded-lg">
                  <div className="text-2xl font-bold">50M+</div>
                  <div className="text-sm">Happy Customers</div>
                </div>
                <div className="bg-white bg-opacity-20 px-6 py-3 rounded-lg">
                  <div className="text-2xl font-bold">90%</div>
                  <div className="text-sm">Positive Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between mb-8">
            <div className="flex flex-wrap items-center space-x-4 mb-4 sm:mb-0">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Best Rating</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 text-lg">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-600 text-lg">No products found</div>
              <button
                onClick={() => setSelectedCategory('All')}
                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
              >
                Show All Products
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose ProudStore?
              </h2>
              <p className="text-lg text-gray-600">
                Your trusted marketplace for quality products at unbeatable prices
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast & Free Shipping</h3>
                <p className="text-gray-600">
                  Get your orders delivered quickly with our efficient shipping network
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  All products are carefully vetted to ensure the highest quality standards
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Support</h3>
                <p className="text-gray-600">
                  24/7 customer support to help you with any questions or concerns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
