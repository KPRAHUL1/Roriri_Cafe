import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  DollarSign,
  Tag,
  Package2,
  AlertTriangle,
  Coffee,
  Utensils,
  Clock,
  RefreshCw
} from 'lucide-react';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    minStock: '5',
    category: '',
    imageUrl: '',
    imagePath: '',
    isActive: true
  });

  const [validationErrors, setValidationErrors] = useState({});

  // API Base URL - adjust this to match your backend URL
  const API_BASE_URL = 'http://localhost:7700/api';

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Tea', 'Coffee', 'Cooldrinks', 'Snacks'];
  
  const steps = [
    { number: 1, title: 'Basic Info', icon: Package },
    { number: 2, title: 'Pricing & Stock', icon: DollarSign },
    { number: 3, title: 'Image & Category', icon: ImageIcon },
    { number: 4, title: 'Review', icon: Check }
  ];

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Breakfast': return <Clock size={16} />;
      case 'Lunch': case 'Dinner': return <Utensils size={16} />;
      case 'Tea': case 'Coffee': return <Coffee size={16} />;
      case 'Cooldrinks': return <Package size={16} />;
      case 'Snacks': return <Package2 size={16} />;
      default: return <Tag size={16} />;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setApiError(`Failed to load products: ${error.message}`);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setApiError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          imageUrl: imageUrl,
          imagePath: `uploads/${file.name}`
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.name.trim()) errors.name = 'Product name is required';
      if (!formData.description.trim()) errors.description = 'Description is required';
    }
    
    if (step === 2) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = 'Valid price is required';
      }
      if (!formData.stock || parseInt(formData.stock) < 0) {
        errors.stock = 'Valid stock quantity is required';
      }
      if (!formData.minStock || parseInt(formData.minStock) < 0) {
        errors.minStock = 'Valid minimum stock is required';
      }
    }
    
    if (step === 3) {
      if (!formData.category.trim()) errors.category = 'Category is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        category: formData.category,
        imageUrl: formData.imageUrl || '',
        imagePath: formData.imagePath || '',
        isActive: formData.isActive
      };

      let response;
      
      if (editingProduct) {
        // Update existing product
        response = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new product
        response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const savedProduct = await response.json();
      
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? savedProduct : p));
        setSuccessMessage('Product updated successfully!');
      } else {
        setProducts(prev => [savedProduct, ...prev]);
        setSuccessMessage('Product created successfully!');
      }
      
      setCurrentStep(4);
      
      setTimeout(() => {
        resetForm();
        setShowAddProduct(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving product:', error);
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      minStock: '5',
      category: '',
      imageUrl: '',
      imagePath: '',
      isActive: true
    });
    setImagePreview('');
    setCurrentStep(1);
    setValidationErrors({});
    setApiError('');
    setSuccessMessage('');
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      category: product.category,
      imageUrl: product.imageUrl || '',
      imagePath: product.imagePath || '',
      isActive: product.isActive
    });
    setImagePreview(product.imageUrl || '');
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete product');
      }

      setProducts(prev => prev.filter(product => product.id !== id));
      setSuccessMessage('Product deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setApiError(`Failed to delete product: ${error.message}`);
      setTimeout(() => setApiError(''), 5000);
    }
  };

  const handleViewProduct = async (product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const productDetails = await response.json();
      
      alert(`Product Details:\n\nName: ${productDetails.name}\nDescription: ${productDetails.description}\nPrice: $${productDetails.price}\nStock: ${productDetails.stock}\nMin Stock: ${productDetails.minStock}\nCategory: ${productDetails.category}\nActive: ${productDetails.isActive ? 'Yes' : 'No'}\nCreated: ${new Date(productDetails.createdAt).toLocaleDateString()}\nUpdated: ${new Date(productDetails.updatedAt).toLocaleDateString()}`);
    } catch (error) {
      console.error('Error fetching product details:', error);
      alert('Failed to load product details');
    }
  };

  const handleUpdateStock = async (productId, newStock, reason = 'Manual update') => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: newStock, reason })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update stock');
      }

      const updatedProduct = await response.json();
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      setSuccessMessage('Stock updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating stock:', error);
      setApiError(`Failed to update stock: ${error.message}`);
      setTimeout(() => setApiError(''), 5000);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= minStock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getStockAlert = () => {
    const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    if (outOfStockProducts.length > 0 || lowStockProducts.length > 0) {
      return (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg animate-slide-down">
          <div className="flex items-start">
            <AlertTriangle className="text-orange-600 mr-2 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-orange-800">Stock Alerts</h4>
              {outOfStockProducts.length > 0 && (
                <p className="text-orange-700 text-sm">
                  Out of stock: {outOfStockProducts.map(p => p.name).join(', ')}
                </p>
              )}
              {lowStockProducts.length > 0 && (
                <p className="text-orange-700 text-sm">
                  Low stock: {lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Food & Beverage Manager</h1>
            <p className="text-gray-600">Manage your restaurant inventory with ease</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-slide-down">
            <p className="text-green-600 font-medium">{successMessage}</p>
          </div>
        )}

        {apiError && !showAddProduct && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="text-red-600 mr-2 mt-0.5" size={20} />
              <div>
                <p className="text-red-600 font-medium">API Error</p>
                <p className="text-red-600 text-sm">{apiError}</p>
                <button 
                  onClick={fetchProducts}
                  className="mt-2 text-red-700 hover:text-red-800 underline text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alerts */}
        {getStockAlert()}

        {!showAddProduct ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Products</p>
                    <p className="text-2xl font-bold text-gray-800">{products.length}</p>
                  </div>
                  <Package className="text-blue-600" size={32} />
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{animationDelay: '100ms'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {products.filter(p => p.stock <= p.minStock && p.stock > 0).length}
                    </p>
                  </div>
                  <AlertTriangle className="text-yellow-600" size={32} />
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{animationDelay: '200ms'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {products.filter(p => p.stock === 0).length}
                    </p>
                  </div>
                  <X className="text-red-600" size={32} />
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{animationDelay: '300ms'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Categories</p>
                    <p className="text-2xl font-bold text-green-600">{categories.length}</p>
                  </div>
                  <Tag className="text-green-600" size={32} />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 animate-slide-up">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-3 rounded mb-4"></div>
                    <div className="bg-gray-200 h-6 rounded"></div>
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package2 size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
                  <p className="text-gray-500">
                    {products.length === 0 ? 'Start by adding your first product' : 'No products match your search criteria'}
                  </p>
                  {apiError && (
                    <button 
                      onClick={fetchProducts}
                      className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Retry Loading Products
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map((product, index) => {
                  const stockInfo = getStockStatus(product.stock, product.minStock);
                  
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scale-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative">
                        <img
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop'}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-2xl"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop';
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                            {stockInfo.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
                          <span className="text-lg font-bold text-orange-600">${product.price}</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {getCategoryIcon(product.category)}
                            <span className="ml-1">{product.category}</span>
                          </span>
                          <span className={`text-sm ${product.stock <= product.minStock ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewProduct(product)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </button>
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                          >
                            <Edit size={16} className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                          >
                            <Trash2 size={16} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Add/Edit Product Modal */
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-center space-x-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;
                    
                    return (
                      <div key={step.number} className="flex items-center">
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                          ${isActive ? 'bg-orange-600 border-orange-600 text-white scale-110' : 
                            isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                            'bg-white border-gray-300 text-gray-400'}
                        `}>
                          <Icon size={16} />
                        </div>
                        <div className="ml-2 hidden sm:block">
                          <p className={`text-xs font-medium ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                            {step.title}
                          </p>
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-12 h-0.5 mx-4 transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {apiError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{apiError}</p>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="animate-slide-in space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          validationErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                        }`}
                        placeholder="Enter product name"
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description*</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          validationErrors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                        }`}
                        placeholder="Enter product description"
                      />
                      {validationErrors.description && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="animate-slide-in space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing & Stock</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)*</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            validationErrors.price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                          }`}
                          placeholder="0.00"
                        />
                        {validationErrors.price && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.price}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock*</label>
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          min="0"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            validationErrors.stock ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                          }`}
                          placeholder="0"
                        />
                        {validationErrors.stock && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.stock}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock Alert*</label>
                      <input
                        type="number"
                        name="minStock"
                        value={formData.minStock}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          validationErrors.minStock ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                        }`}
                        placeholder="5"
                      />
                      {validationErrors.minStock && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.minStock}</p>
                      )}
                      <p className="text-gray-500 text-sm mt-1">Alert when stock falls below this number</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="animate-slide-in space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Image & Category</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors duration-200">
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                            <button
                              onClick={() => {
                                setImagePreview('');
                                setFormData(prev => ({ ...prev, imageUrl: '', imagePath: '' }));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                            <p className="text-gray-600 mb-2">Upload product image</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                            />
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                            >
                              Choose File
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category*</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          validationErrors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {validationErrors.category && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Product is active</span>
                      </label>
                      <p className="text-gray-500 text-sm mt-1">Inactive products won't be visible in the main list</p>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="animate-slide-in text-center">
                    {successMessage ? (
                      <div>
                        <div className="animate-bounce mb-6">
                          <Check className="mx-auto text-green-500" size={80} />
                        </div>
                        <h3 className="text-2xl font-semibold text-green-600 mb-4">{successMessage}</h3>
                        <p className="text-gray-600">The product has been {editingProduct ? 'updated in' : 'added to'} your inventory.</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Review Product Details</h3>
                        
                        <div className="bg-gray-50 p-6 rounded-xl text-left max-w-md mx-auto">
                          {imagePreview && (
                            <img src={imagePreview} alt="Product" className="w-full h-32 object-cover rounded-lg mb-4" />
                          )}
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Name:</span> {formData.name}</p>
                            <p><span className="font-medium">Description:</span> {formData.description}</p>
                            <p><span className="font-medium">Price:</span> ${formData.price}</p>
                            <p><span className="font-medium">Stock:</span> {formData.stock} units</p>
                            <p><span className="font-medium">Min Stock:</span> {formData.minStock} units</p>
                            <p><span className="font-medium">Category:</span> {formData.category}</p>
                            <p><span className="font-medium">Status:</span> {formData.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!successMessage && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={currentStep === 1 ? () => { setShowAddProduct(false); resetForm(); } : handlePrevious}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    <ArrowLeft className="mr-2" size={16} />
                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                  </button>

                  <button
                    onClick={currentStep === 4 ? handleSubmit : handleNext}
                    disabled={isSubmitting}
                    className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                      isSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : currentStep === 4 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </>
                    ) : currentStep === 4 ? (
                      editingProduct ? 'Update Product' : 'Create Product'
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2" size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-up {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-in {
          from { 
            opacity: 0;
            transform: translateX(20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
        
        .animate-scale-up {
          animation: scale-up 0.4s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProductManager