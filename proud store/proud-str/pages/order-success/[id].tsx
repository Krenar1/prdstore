import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout-fixed';
import { CheckCircle, Package, Truck, MapPin, CreditCard, Download } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    product_image: string;
  }>;
}

export default function OrderSuccess() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (error || !order) {
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              <span className="text-sm text-gray-500">Order #{order.order_number}</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Order Date: {formatDate(order.created_at)}</p>
                  <p>Status: <span className="text-green-600 font-medium">{order.status}</span></p>
                  <p>Total: <span className="font-medium">{formatPrice(order.total_amount)}</span></p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.phone}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Order Confirmed</h3>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Processing</h3>
                    <p className="text-sm text-gray-500">Your order is being prepared</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-500">Shipped</h3>
                    <p className="text-sm text-gray-500">We'll notify you when it ships</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-500">Delivered</h3>
                    <p className="text-sm text-gray-500">Estimated delivery in 3-5 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">What's Next?</h2>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-md text-sm font-medium text-gray-700">
                <Download className="w-4 h-4" />
                <span>Download Invoice</span>
              </button>
              
              <button 
                onClick={() => router.push('/orders')}
                className="flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-md text-sm font-medium text-gray-700"
              >
                <Package className="w-4 h-4" />
                <span>Track Order</span>
              </button>
              
              <button 
                onClick={() => router.push('/')}
                className="flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-md text-sm font-medium text-white"
              >
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@proudstore.com" className="text-orange-600 hover:text-orange-500">
              support@proudstore.com
            </a>
            {' '}or{' '}
            <a href="tel:+1234567890" className="text-orange-600 hover:text-orange-500">
              (123) 456-7890
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
