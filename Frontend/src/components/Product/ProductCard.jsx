import { Clock, Star } from "lucide-react";

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {!product.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 shadow-md">
          <div className="flex items-center space-x-1">
            <Star className="text-yellow-400 fill-current" size={14} />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
          <span className="text-green-600 font-bold text-lg">₹{product.price}</span>
            <span className="text-xs bg-green-100 text-blue-800 px-2 py-1 rounded-full">Stocks: {product.stock}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{product.category}</span>
          
          <div className="flex items-center text-gray-500 text-xs">
            <Clock size={12} className="mr-1" />
            {product.prepTime}
          </div>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          disabled={!product.available}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
            product.available
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {product.available ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

// Cart Component
// const Cart = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, userBalance }) => {
//   const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
//   const canAfford = userBalance >= totalAmount;

//   if (cartItems.length === 0) {
//     return (
//       <div className="bg-white rounded-xl shadow-lg p-6 text-center">
//         <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
//         <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
//         <p className="text-gray-500 text-sm">Add some delicious items to get started!</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//       <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
//         <h3 className="text-lg font-semibold flex items-center">
//           <ShoppingCart className="mr-2" size={20} />
//           Your Order ({cartItems.length} items)
//         </h3>
//       </div>
      
//       <div className="max-h-96 overflow-y-auto">
//         {cartItems.map((item) => (
//           <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
//             <div className="flex items-center space-x-3">
//               <img 
//                 src={item.image} 
//                 alt={item.name}
//                 className="w-16 h-16 object-cover rounded-lg"
//               />
//               <div className="flex-1">
//                 <h4 className="font-semibold text-gray-800">{item.name}</h4>
//                 <p className="text-green-600 font-medium">₹{item.price}</p>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
//                   className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
//                 >
//                   <Minus size={14} />
//                 </button>
//                 <span className="w-8 text-center font-semibold">{item.quantity}</span>
//                 <button
//                   onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
//                   className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
//                 >
//                   <Plus size={14} />
//                 </button>
//               </div>
//             </div>
            
//             <div className="flex justify-between items-center mt-2">
//               <button
//                 onClick={() => onRemoveItem(item.id)}
//                 className="text-red-500 hover:text-red-700 text-sm font-medium"
//               >
//                 Remove
//               </button>
//               <span className="font-semibold text-gray-800">
//                 ₹{(item.price * item.quantity).toFixed(2)}
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>
      
//       <div className="p-4 bg-gray-50 border-t">
//         <div className="flex justify-between items-center mb-2">
//           <span className="font-semibold">Total Amount:</span>
//           <span className="text-xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
//         </div>
        
//         <div className="flex justify-between items-center mb-4 text-sm">
//           <span>Available Balance:</span>
//           <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
//             ₹{userBalance.toFixed(2)}
//           </span>
//         </div>
        
//         {!canAfford && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4">
//             <p className="text-sm">Insufficient balance. Need ₹{(totalAmount - userBalance).toFixed(2)} more.</p>
//           </div>
//         )}
        
//         <button
//           onClick={onCheckout}
//           disabled={!canAfford}
//           className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
//             canAfford
//               ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
//               : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//           }`}
//         >
//           {canAfford ? 'Proceed to Pay' : 'Insufficient Balance'}
//         </button>
//       </div>
//     </div>
//   );
// };
export default ProductCard;