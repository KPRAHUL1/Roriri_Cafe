import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

const PrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("adminToken");
      
      // You can add token validation logic here
      // For now, just checking if token exists
      if (token) {
        // Optionally validate token with backend
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default PrivateRoutes;