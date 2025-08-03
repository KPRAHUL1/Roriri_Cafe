import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AdminOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium text-gray-600">
        Loading orders...
      </div>
    );

  if (!orders.length)
    return (
      <div className="text-center text-gray-500 text-lg mt-12">
        No orders found.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {orders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition duration-300"
        >
          <div className="mb-3 text-base font-semibold text-gray-800">
            🧾 Order ID: {order.id}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            👤 {order.user.name} ({order.user.email})
          </div>

          <div className="divide-y divide-gray-100 mb-2">
            {order.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex justify-between py-1 text-sm text-gray-700"
              >
                <span>{purchase.product.name}</span>
                <span className="text-gray-500">Qty: {purchase.quantity}</span>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-500 mt-2">
            💰 Total: ₹{order.totalAmount?.toFixed(2)} •{' '}
            <span className="italic">
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminOrderHistory;
