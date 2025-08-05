import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const res = await fetch(`http://localhost:7700/api/order-history`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + ordersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const pageButtonVariants = {
    hover: {
      scale: 1.1,
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95
    }
  };

  if (loading)
    return (
      <motion.div 
        className="flex flex-col justify-center items-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          variants={loadingVariants}
          animate="animate"
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg font-medium text-gray-600"
        >
          Loading orders...
        </motion.p>
      </motion.div>
    );

  if (!orders.length)
    return (
      <motion.div 
        className="text-center text-gray-500 text-lg mt-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-6xl mb-4"
        >
          📋
        </motion.div>
        No orders found.
      </motion.div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">☕Roriri Cafe Order History</h1>
        <p className="text-gray-600">Managing {orders.length} total orders</p>
      </motion.div>

      {/* Orders Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {currentOrders.map((order, index) => (
            <motion.div
              key={order.id}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              layout
              className="p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-3xl shadow-sm cursor-pointer overflow-hidden relative"
            >
              {/* Background Animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-3xl"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Order ID - Smaller */}
                <motion.div 
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded-full mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="mr-1">🧾</span>
                  {order.id}
                </motion.div>

                {/* Customer Info - Larger */}
                <motion.div 
                  className="mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center">
                    <span className="mr-2">👤</span>
                    {order.user.name}
                  </h3>
                  <p className="text-sm text-gray-600 ml-6">{order.user.email}</p>
                </motion.div>

                {/* Coffee Items - Enhanced */}
                <motion.div 
                  className="space-y-2 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {order.purchases.map((purchase, idx) => (
                    <motion.div
                      key={purchase.id}
                      className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100"
                      whileHover={{ scale: 1.02, backgroundColor: '#FEF3C7' }}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">☕</span>
                        <span className="font-medium text-gray-800 text-lg">
                          {purchase.product.name}
                        </span>
                      </div>
                      <motion.span 
                        className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold"
                        whileHover={{ scale: 1.1 }}
                      >
                        Qty: {purchase.quantity}
                      </motion.span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Footer Info */}
                <motion.div 
                  className="flex justify-between items-center pt-4 border-t border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  <div className="flex items-center text-green-600 font-bold text-lg">
                    <span className="mr-2">💰</span>
                    ₹{order.totalAmount?.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="mr-1">🕒</span>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      <motion.div
        className="flex justify-center items-center space-x-2"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          variants={pageButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
            currentPage === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:border-blue-400'
          }`}
        >
          ← Previous
        </motion.button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <motion.button
            key={page}
            variants={pageButtonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handlePageChange(page)}
            className={`w-10 h-10 rounded-xl border transition-all duration-200 ${
              currentPage === page
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-700 hover:border-blue-400'
            }`}
          >
            {page}
          </motion.button>
        ))}
        
        <motion.button
          variants={pageButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
            currentPage === totalPages
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:border-blue-400'
          }`}
        >
          Next →
        </motion.button>
      </motion.div>

      {/* Page Info */}
      <motion.p
        className="text-center text-sm text-gray-500 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Showing {startIndex + 1}-{Math.min(startIndex + ordersPerPage, orders.length)} of {orders.length} orders
      </motion.p>
    </div>
  );
};

export default AdminOrderHistory;