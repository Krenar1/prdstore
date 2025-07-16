import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout-fixed';
import { CreditCard, MapPin, User, Lock, Check } from 'lucide-react';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
  total_price: number;
}

interface Address {
  full_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export default function Checkout() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [shippingAddress, setShippingAddress] = useState<Address>({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    phone: ''
  });

  const [paymentMethod, setPaymentMethod] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    card_holder: ''
  });

  const [useShippingForBilling, setUseShippingForBilling] = useState(true);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setCartItems(data.items || []);
        if (data.items.length === 0) {
          router.push('/cart');
        }
      } else {
        setError(data.error || 'Failed to fetch cart items');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentMethod(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepNumber: number) => {
    if (stepNumber === 1) {
      const required = ['full_name', 'address_line1', 'city', 'state', 'postal_code', 'phone'];
      return required.every(field => shippingAddress[field as keyof Address]);
    }
    if (stepNumber === 2) {
      return paymentMethod.card_number && paymentMethod.expiry_date && paymentMethod.cvv && paymentMethod.card_holder;
    }
    return true;
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError('');
    
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:4000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shipping_address: shippingAddress,
          payment_method: 'card',
          payment_details: paymentMethod
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cart and redirect to success page
        router.push(`/order-success/${data.order.id}`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.total_price, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Steps */}
          <div className="lg:col-span-2">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Shipping</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                  <div className={`h-1 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`} />
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > 2 ? <Check className="w-5 h-5" /> : '2'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Payment</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                  <div className={`h-1 ${step >= 3 ? 'bg-orange-500' : 'bg-gray-200'}`} />
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > 3 ? <Check className="w-5 h-5" /> : '3'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Review</span>
                </div>
              </div>
            </div>

            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.full_name}
                      onChange={(e) => handleAddressChange('full_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line1}
                      onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line2}
                      onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!validateStep(1)}
                    className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      value={paymentMethod.card_holder}
                      onChange={(e) => handlePaymentChange('card_holder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={paymentMethod.card_number}
                      onChange={(e) => handlePaymentChange('card_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={paymentMethod.expiry_date}
                        onChange={(e) => handlePaymentChange('expiry_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="MM/YY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={paymentMethod.cvv}
                        onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!validateStep(2)}
                    className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Check className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Review Your Order</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600">
                      <p>{shippingAddress.full_name}</p>
                      <p>{shippingAddress.address_line1}</p>
                      {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                      <p>{shippingAddress.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                    <div className="text-sm text-gray-600">
                      <p>Card ending in {paymentMethod.card_number.slice(-4)}</p>
                      <p>Expires {paymentMethod.expiry_date}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placing ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.product_name}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatPrice(getTotalPrice() * 0.08)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base font-medium">
                      <span>Total</span>
                      <span>{formatPrice(getTotalPrice() * 1.08)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
