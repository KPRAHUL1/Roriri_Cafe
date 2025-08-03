import React, { useState, useEffect } from 'react';

const ProductAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:7700/api/products', { // New API endpoint
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center p-6">Loading analytics...</div>;
  }
  if (error) {
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  }

  // Example data structure:
  // {
  //   mostPopularProducts: [{ name: 'Product A', sales: 150 }],
  //   lowStockProducts: [{ name: 'Product B', stock: 2 }],
  //   totalRevenue: 5000,
  //   totalProducts: 50
  // }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Product Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-500">Total Revenue</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">${analytics.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-500">Total Products</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{analytics.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-500">Items Sold (Last 30 Days)</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{analytics.totalItemsSold}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-500">Low Stock Alerts</h2>
          <p className="mt-2 text-3xl font-bold text-red-500">{analytics.lowStockProducts.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Most Popular Products</h2>
          <ul>
            {analytics.mostPopularProducts.map((product, index) => (
              <li key={index} className="flex justify-between py-2 border-b last:border-b-0">
                <span>{product.name}</span>
                <span className="font-bold">{product.sales} units sold</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Low Stock Products</h2>
          <ul>
            {analytics.lowStockProducts.map((product, index) => (
              <li key={index} className="flex justify-between py-2 border-b last:border-b-0">
                <span>{product.name}</span>
                <span className="font-bold">{product.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsPage;