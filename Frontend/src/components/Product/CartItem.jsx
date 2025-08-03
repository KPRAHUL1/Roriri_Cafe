import { Minus, Plus } from "lucide-react";

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{item.name}</h4>
          <p className="text-green-600 font-medium">₹{item.price}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-red-500 hover:text-red-700 text-sm font-medium"
        >
          Remove
        </button>
        <span className="font-semibold text-gray-800">
          ₹{(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default CartItem;
