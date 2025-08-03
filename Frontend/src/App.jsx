import { Route, Routes } from 'react-router-dom';
import './App.css';
import DynamicCanteenATM from './pages/DynamicCateenSystem';
import AdminLogin from './admin/auth/Login';
import AdminDashboard from './admin/Dashboard';
import PrivateRoutes from './admin/compoennts/PrivateRoute';
import AddProductPage from './admin/compoennts/AddProduct';
import AddUserAmountPage from './admin/compoennts/AdduserAmountPage';
import ProductAnalyticsPage from './admin/compoennts/ProductAnalyticsPage';
import CreateUser from './admin/compoennts/User/CreateUser';
import ProductManager from './admin/compoennts/AddProduct';
import PurchasePage from './components/Product/Purchasepage';
import AdminOrderHistory from './admin/compoennts/orderHistory/OrderHistory';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<DynamicCanteenATM />} />
      <Route path="/purchase/:userId" element={<PurchasePage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Protected Admin Routes */}
      <Route element={<PrivateRoutes />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/dashboard/add-product" element={<ProductManager />} />
        <Route path="/admin/dashboard/add-user-amount" element={<AddUserAmountPage />} />
        <Route path="/admin/dashboard/product-analytics" element={<ProductAnalyticsPage />} />
        <Route path="/admin/dashboard/create-user" element={<CreateUser />} />
        <Route path="/admin/dashboard/order-history" element={<AdminOrderHistory />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<div className="text-center mt-20 text-xl text-gray-600">404: Page not found.</div>} />
    </Routes>
  );
}

export default App;