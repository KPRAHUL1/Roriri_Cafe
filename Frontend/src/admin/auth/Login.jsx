import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const toggleForm = () => setIsLogin(!isLogin);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = isLogin
      ? 'http://localhost:7700/api/admin-auth/login'
      : 'http://localhost:7700/api/admin-auth/register';

    const payload = isLogin
      ? {
          email: formData.email,
          password: formData.password,
        }
      : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          username: formData.username,
        };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Something went wrong!');
        return;
      }

      if (isLogin) {
        // Store authentication data
        localStorage.setItem("adminToken", data.token);
        if (data.admin) {
          localStorage.setItem("adminData", JSON.stringify(data.admin));
        }
        
        // Navigate to dashboard
        navigate('/admin/dashboard', { replace: true });
      } else {
        alert('Registered successfully! Now login.');
        setIsLogin(true);
        // Clear form data
        setFormData({
          email: '',
          password: '',
          name: '',
          username: '',
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden bg-gray-800">
        {/* Left image */}
        <div
          className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1571091718767-18b5b1457add')",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-6 py-12">
            <h1 className="text-5xl font-extrabold">
              Food<span className="text-orange-500">.</span>
            </h1>
            <p className="mt-4 text-lg max-w-md font-medium">
              Admin can manage users, products, and view insights.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="w-full lg:w-1/2 px-6 md:px-12 py-10 text-white flex items-center">
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="w-full"
              onSubmit={handleSubmit}
            >
              <h2 className="text-4xl font-bold mb-8 text-center">
                {isLogin ? 'Login' : 'Register'}
              </h2>

              {!isLogin && (
                <>
                  <div className="mb-4">
                    <label htmlFor="name" className="block mb-2 text-sm">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                      placeholder="Admin Name"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="username" className="block mb-2 text-sm">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                      placeholder="Username"
                    />
                  </div>
                </>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block mb-2 text-sm">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 rounded-lg font-semibold hover:bg-orange-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading
                  ? isLogin
                    ? 'Signing in...'
                    : 'Registering...'
                  : isLogin
                  ? 'Sign in'
                  : 'Register'}
              </button>

              <p className="text-center mt-6 text-sm text-gray-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={toggleForm}
                  type="button"
                  className="text-orange-500 font-semibold hover:underline transition-colors duration-200"
                >
                  {isLogin ? 'Register' : 'Sign in'}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;