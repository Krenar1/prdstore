import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Eye,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';

interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    user_email: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  top_products: Array<{
    id: string;
    name: string;
    sales_count: number;
    revenue: number;
    image_url: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminAuth();
    fetchDashboardStats();
  }, []);

  const checkAdminAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin-login');
      return;
    }
  };

  const fetchDashboardStats = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch('http://localhost:4000/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin-login');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ProudStore Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/products')}
                className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/settings')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.total_revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="text-sm text-orange-600 hover:text-orange-500"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {stats.recent_orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.user_email}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatPrice(order.total_amount)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
                <button
                  onClick={() => router.push('/admin/products')}
                  className="text-sm text-orange-600 hover:text-orange-500"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {stats.top_products.map((product) => (
                <div key={product.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales_count} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatPrice(product.revenue)}</p>
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        className="text-sm text-orange-600 hover:text-orange-500"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/admin/products/new')}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Add New Product</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/orders')}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Manage Orders</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Manage Users</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/analytics')}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
