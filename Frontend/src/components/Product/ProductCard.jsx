import { Clock, Star } from "lucide-react";

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeInScale w-full max-w-xs mx-auto my-4 border border-gray-100">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
        />
        {!product.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded-full shadow-lg">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 shadow-md flex items-center space-x-1">
          <Star className="text-yellow-400 fill-current" size={14} />
          <span className="text-sm font-medium">{product.rating}</span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-gray-800 truncate">{product.name}</h3>
          <span className="text-green-600 font-bold text-lg">₹{product.price}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs bg-green-100 text-blue-800 px-2 py-1 rounded-full">Stocks: {product.stock}</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{product.category}</span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-gray-500 text-xs">
            <Clock size={12} className="mr-1" />
            {product.prepTime}
          </div>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={!product.available}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors duration-200 shadow ${
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

export default ProductCard;