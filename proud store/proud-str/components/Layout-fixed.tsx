import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingCartIcon, UserIcon, SearchIcon, MenuIcon, HeartIcon, BellIcon } from '@heroicons/react/outline';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUserProfile(token);
      fetchCartCount(token);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('http://localhost:4000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchCartCount = async (token: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.summary.total_items || 0);
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setCartCount(0);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = [
    { name: 'Electronics', icon: '📱', href: '/category/electronics' },
    { name: 'Fashion', icon: '👗', href: '/category/fashion' },
    { name: 'Home & Garden', icon: '🏠', href: '/category/home-garden' },
    { name: 'Sports', icon: '⚽', href: '/category/sports' },
    { name: 'Beauty', icon: '💄', href: '/category/beauty' },
    { name: 'Toys', icon: '🧸', href: '/category/toys' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        {/* Top Bar */}
        <div className="bg-orange-500 text-white text-sm py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span>🚚 Free shipping on orders over $50</span>
              <span>📱 Download our app</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/track">
                <a className="hover:underline">Track Order</a>
              </Link>
              <Link href="/help">
                <a className="hover:underline">Help</a>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-2xl font-bold text-orange-500">ProudStore</span>
              </a>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Wishlist */}
              <Link href="/wishlist">
                <a className="p-2 hover:bg-gray-100 rounded-full relative">
                  <HeartIcon className="h-6 w-6 text-gray-600" />
                </a>
              </Link>

              {/* Notifications */}
              <button className="p-2 hover:bg-gray-100 rounded-full relative">
                <BellIcon className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Cart */}
              <Link href="/cart">
                <a className="p-2 hover:bg-gray-100 rounded-full relative">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </a>
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <UserIcon className="h-6 w-6 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user.full_name}</span>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link href="/profile">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                      </Link>
                      <Link href="/orders">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Orders</a>
                      </Link>
                      <Link href="/wishlist">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Wishlist</a>
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin">
                          <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</a>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <a className="text-sm font-medium text-gray-700 hover:text-orange-500">Login</a>
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/register">
                    <a className="text-sm font-medium text-gray-700 hover:text-orange-500">Register</a>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-gray-100 border-t">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-8 overflow-x-auto">
              <button className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-orange-500 whitespace-nowrap">
                <MenuIcon className="h-4 w-4" />
                <span>All Categories</span>
              </button>
              {categories.map((category) => (
                <Link key={category.name} href={category.href}>
                  <a className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-orange-500 whitespace-nowrap">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About ProudStore</h3>
              <p className="text-gray-300 text-sm">
                Your one-stop shop for amazing products at unbeatable prices. 
                Discover trending items and shop with confidence.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/returns" className="hover:text-white">Returns</Link></li>
                <li><Link href="/track" className="hover:text-white">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/categories" className="hover:text-white">All Categories</Link></li>
                <li><Link href="/deals" className="hover:text-white">Daily Deals</Link></li>
                <li><Link href="/new-arrivals" className="hover:text-white">New Arrivals</Link></li>
                <li><Link href="/bestsellers" className="hover:text-white">Best Sellers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-300 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-300 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 ProudStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
