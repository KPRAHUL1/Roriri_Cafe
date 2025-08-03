import { useEffect, useState } from "react";
import apiService from "../Scan/apiService";
import { AlertCircle, ArrowLeft, Loader, User } from "lucide-react";
import ProductCard from "./ProductCard";
import Cart from "./Cart";

const ShoppingView = ({ userData,setUserData, onBackToUser }) => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await apiService.getProducts();
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products',err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  if (userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
}, [userData]);



    if (!userData) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        ❌ User data not found. Please go back and rescan.
      </div>
    );
  }

  const addToCart = (product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
    setProcessingOrder(true);
    try {
      const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Process order using your backend
      const orderResult = await apiService.processOrder({
        userId: userData.id || userData.userId, // Handle both id formats
        items: cartItems,
        totalAmount: totalAmount,
        currentBalance: userData.balance
      });

      // Show success message with order details
      alert(`🎉 Order Placed Successfully!\n\nOrder ID: ${orderResult.orderId}\nTotal: ₹${totalAmount.toFixed(2)}\nEstimated Time: ${orderResult.estimatedTime}\n\nNew Balance: ₹${orderResult.newBalance.toFixed(2)}`);
      
      // Clear cart
      setCartItems([]);
      
      // Update user balance
    setUserData(prev => ({
  ...prev,
  balance: orderResult.newBalance
}));

      
      // Optionally generate token for order collection
      if (orderResult.purchases && orderResult.purchases.length > 0) {
       try {
  await apiService.generateToken(orderResult.purchases[0].id, cartItems.map(item => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
  })));

  console.log("✅ Token email sent!");
} catch (tokenError) {
  console.warn('❌ Token generation failed:', tokenError);
}

      }
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to process order');
      setTimeout(() => setError(''), 4000);
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
        <p className="text-gray-600">Loading delicious food...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToUser}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🍽️ Roriri Cafe</h1>
              <p className="text-sm text-gray-600">Welcome, {userData.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-lg font-bold text-green-600">₹{userData.balance.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" size={20} />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Order Overlay */}
      {processingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 text-center">
            <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
            <p className="text-gray-700 font-medium">Processing your order...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Menu</h2>
              <p className="text-gray-600">Choose from our delicious selection</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
             <Cart
  cartItems={cartItems}
  onUpdateQuantity={updateQuantity}
  onRemoveItem={removeFromCart}
  onCheckout={handleCheckout}
  userBalance={userData.balance}
  processingOrder={processingOrder} // ✅ Pass it here
/>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ShoppingView;