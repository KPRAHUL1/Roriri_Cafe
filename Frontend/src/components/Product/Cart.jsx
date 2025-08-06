import { ShoppingCart } from "lucide-react";
import CartItem from "./CartItem";

// Custom animation class (add to your global CSS if not using Tailwind's plugin)
const fadeInScale = `
  @keyframes fadeInScale {
    0% { opacity: 0; transform: scale(0.95);}
    100% { opacity: 1; transform: scale(1);}
  }
  .animate-fadeInScale {
    animation: fadeInScale 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
  }
`;

// Inject custom animation styles (for demo, ideally add to your CSS file)
if (typeof document !== "undefined" && !document.getElementById("fadeInScaleStyle")) {
  const style = document.createElement("style");
  style.id = "fadeInScaleStyle";
  style.innerHTML = fadeInScale;
  document.head.appendChild(style);
}

const Cart = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  userBalance,
  processingOrder
}) => {
  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const canAfford = userBalance >= totalAmount;

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center animate-fadeInScale w-full max-w-md mx-auto my-8">
        <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
        <p className="text-gray-500 text-sm">Add some delicious items to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeInScale w-full max-w-md mx-auto my-8 border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
        <h3 className="text-xl font-bold flex items-center tracking-tight">
          <ShoppingCart className="mr-2" size={22} />
          Your Order ({cartItems.length} items)
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto px-2 py-2">
        {cartItems.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>

      <div className="p-5 bg-gray-50 border-t">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Total Amount:</span>
          <span className="text-xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center mb-4 text-sm">
          <span>Available Balance:</span>
          <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
            ₹{userBalance.toFixed(2)}
          </span>
        </div>

        {!canAfford && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4">
            <p className="text-sm">
              Insufficient balance. Need ₹{(totalAmount - userBalance).toFixed(2)} more.
            </p>
          </div>
        )}

        <button
          onClick={onCheckout}
          disabled={!canAfford || processingOrder}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 shadow ${
            !canAfford || processingOrder
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
          }`}
        >
          {processingOrder ? 'Processing...' : canAfford ? 'Proceed to Pay' : 'Insufficient Balance'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
