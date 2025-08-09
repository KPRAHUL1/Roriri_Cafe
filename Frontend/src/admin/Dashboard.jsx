import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  PiggyBank,
  BarChart,
  LogOut,
  Menu,
  X,
  User,
  User2,
  ListOrdered,
} from 'lucide-react';
import DashboardCard from './dashboardCard';
import apiService from '../components/Scan/apiService';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 0 });
  const [orders, setOrders] = useState([]);
const [todaySales, setTodaySales] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      setAdminData(JSON.parse(storedAdminData));
    }
  }, []);

  const API_BASE_URL = 'http://localhost:7700/api';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      icon: Home, 
      path: '/admin/dashboard',
      description: 'Overview and quick actions' 
    },
    { 
      name: 'Add Product', 
      icon: PlusCircle, 
      path: '/admin/dashboard/add-product',
      description: 'Create new food or beverage items' 
    },
    { 
      name: 'Add User Amount', 
      icon: PiggyBank, 
      path: '/admin/dashboard/add-user-amount',
      description: 'Top up user account balances' 
    },
    { 
      name: 'Order History', 
      icon: ListOrdered, 
      path: '/admin/dashboard/order-history',
      description: 'View sales and revenue reports' 
    },
    { 
      name: 'Create User', 
      icon: User, 
      path: '/admin/dashboard/create-user',
      description: 'View sales and revenue reports' 
    },
  ];

  const isCurrentPath = (path) => location.pathname === path;
  useEffect(() => {
    const fetchProducts = async () => {
      const productsData = await apiService.getProducts();
      setProducts(productsData);
    };
    fetchProducts();
  }, []);
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://localhost:7700/api/users?page=1&limit=50`);
      const data = await res.json();
      setUsers(data.users); // the array
      setPagination(data.pagination); // total, pages, etc.
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  fetchUsers();
}, []);


useEffect(() => {
  const fetchOrders = async () => { 
    try {
      const res = await fetch(`${API_BASE_URL}/order-history`);
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await res.json(); // { success: true, orders: [...] }
      const orderList = data.orders || [];
      setOrders(orderList);

      // 🧠 Filter orders created *today*
      const today = new Date().toISOString().split('T')[0]; // '2025-08-08'
      const todaysOrders = orderList.filter((order) => {
        const createdDate = new Date(order.createdAt).toISOString().split('T')[0];
        return createdDate === today;
      });

      // 💰 Sum the amounts
      const total = todaysOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

      setTodaySales(total);
    } catch (err) {
      console.error(err.message);
    }
  };

  fetchOrders();  
}, []);

  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-xl flex flex-col
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <div className="p-6 border-b border-gray-200 ">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">Roriri Cafe</h1>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 ">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center w-full px-4 py-3 rounded-lg 
                    transition-all duration-200 group
                    ${isCurrentPath(item.path)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
              {adminData?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="font-semibold text-gray-800 truncate">
                {adminData?.name || 'Admin'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {adminData?.email || 'admin@example.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
        </nav>
        
      </aside>
      <main className="flex-1 lg:ml-0">
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Smart Canteen</h1>
          <div className="w-10" />
        </div>
        <div className="p-6 lg:p-10">
          {isCurrentPath('/admin/dashboard') ? (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-lg text-gray-600">
                  Welcome to the Smart Canteen Admin Panel. Manage your canteen operations efficiently.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                  title="Add New Product"
                  description="Create a new food or beverage item for your menu"
                  icon={PlusCircle}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
                  onClick={() => navigate('/admin/dashboard/add-product')}
                />
                <DashboardCard
                  title="Manage User Funds"
                  description="Top up user account balances and manage payments"
                  icon={PiggyBank}
                  bgColor="bg-green-50"
                  textColor="text-green-600"
                  onClick={() => navigate('/admin/dashboard/add-user-amount')}
                />
                <DashboardCard
                  title="Order History"
                  description="Access sales reports, inventory, and revenue insights"
                  icon={ListOrdered}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
                  onClick={() => navigate('/admin/dashboard/order-history')}
                />
                <DashboardCard
                  title="Create User"
                  description="Access sales reports, inventory, and revenue insights"
                  icon={User2}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
                  onClick={() => navigate('/admin/dashboard/create-user')}
                />
              </div>
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Total Products 
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Active Users
                    </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.total}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Today's Sales
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{todaySales.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Feature Under Development
                </h2>
                <p className="text-gray-600 mb-6">
                  This feature is currently being developed. Please check back later.
                </p>
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;