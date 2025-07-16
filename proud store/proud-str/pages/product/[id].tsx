import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout-fixed';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Plus, Minus } from 'lucide-react';

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

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:4000/products/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data.product);
        setSelectedImage(data.product.image_url);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:4000/products/${id}/reviews`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const addToCart = async () => {
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
          product_id: id,
          quantity: quantity
        })
      });

      if (response.ok) {
        alert('Product added to cart!');
      } else {
        alert('Failed to add product to cart');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const buyNow = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Add to cart first, then redirect to checkout
    await addToCart();
    router.push('/checkout');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
          >
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                    selectedImage === image ? 'border-orange-500' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600 mt-2">{product.category}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating)}
                <span className="text-sm text-gray-600">({product.reviews_count} reviews)</span>
              </div>
              <span className="text-sm text-gray-600">{product.stock_quantity} in stock</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-orange-600">
                {formatPrice(product.price)}
              </span>
              {product.original_price > product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    Save {product.discount_percentage}%
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={addToCart}
                className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-md hover:bg-orange-600 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={buyNow}
                className="flex-1 bg-red-500 text-white py-3 px-6 rounded-md hover:bg-red-600"
              >
                Buy Now
              </button>
            </div>

            <div className="flex space-x-4">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Heart className="w-5 h-5" />
                <span>Add to Wishlist</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({product.reviews_count})
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{review.user_name}</h4>
                          <div className="flex items-center space-x-1 mt-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
