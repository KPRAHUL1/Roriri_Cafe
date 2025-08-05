import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, CreditCard, ShoppingCart, AlertCircle, X, Loader, RefreshCw, Plus, Settings } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { BrowserMultiFormatReader } from '@zxing/library';
import apiService from '../components/Scan/apiService';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/Scan/QRScanner';
import PinEntry from './PinEnterPage';
import PinSetup from './Pinsetup';
const API_BASE_URL = 'http://localhost:7700/api';

const DynamicCanteenATM = () => {
  const [currentView, setCurrentView] = useState('home');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const navigate = useNavigate();
const handleQRScan = async (qrCode) => {
  setLoading(true);
  setError('');

  try {
    let qrData;
    try {
      qrData = JSON.parse(qrCode);
      console.log('✅ Parsed QR data as JSON:', qrData);
    } catch (parseError) {
      console.warn('ℹ️ QR code is not JSON, using as userId:', qrCode);
      qrData = { userId: qrCode };
    }

    // 🔍 Step 1: Fetch user data
    const user = await apiService.scanUser(qrData.userId);
    if (!user) throw new Error("User not found");

    console.log('✅ User fetched:', user);

    // 🔐 Step 2: Check if user has PIN
    const pinCheck = await fetch(`${API_BASE_URL}/users/${user.userId}/has-pin`);
    const { hasPin } = await pinCheck.json();

    console.log(`🔐 Has PIN: ${hasPin}`);

    // ⛳ Step 3: Route accordingly
    if (hasPin) {
      setCurrentView('pin-entry');
    } else {
      setCurrentView('pin-setup');
    }

    setUserData(user);
  } catch (err) {
    console.error('❌ QR scan error:', err);
    setError(err.message || 'Failed to scan QR code');
  } finally {
    setLoading(false);
  }
};



  // ✅ Fixed PIN Success Handler
  const handlePinSuccess = (user) => {
    setCurrentView('user');
    setUserData(user);
   
     localStorage.setItem('userData', JSON.stringify(user));
  };

  // ✅ Fixed PIN Setup Complete Handler
  const handlePinSetupComplete = (user) => {
    setCurrentView('user');
    setUserData(user);
    // Store in memory (not localStorage in artifacts)
  localStorage.setItem('userData', JSON.stringify(user));
  };

  // Manual Entry Handler
  const handleManualEntry = async () => {
    if (!manualInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const user = await apiService.getUserByUserId(manualInput.trim());
      
      // Check PIN status for manual entry too
      const pinCheck = await fetch(`${API_BASE_URL}/users/${user.id}/has-pin`);
      const { hasPin } = await pinCheck.json();
      
      if (hasPin) {
        setCurrentView('pin-entry');
        setUserData(user);
      } else {
        setCurrentView('pin-setup');
        setUserData(user);
      }
    } catch (err) {
      setError(err.message || 'Failed to find user');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (errorMsg) => {
    setError(errorMsg);
    setTimeout(() => setError(''), 4000);
  };

  const resetToHome = () => {
    setCurrentView('home');
    setUserData(null);
    setError('');
    setManualInput('');
   localStorage.removeItem('userData');
  };

  const proceedToPurchase = (user) => {
    if (!user || !user.userId) {
      console.error('Invalid user data:', user);
      return;
    }

   navigate(`/purchase/${user.userId}`, { state: { user } });
    // alert(`Proceeding to purchase page for ${user.name} (${user.userId})`);
  };

  // ✅ Load user from storage on mount (commented out for artifacts)
  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      const user = JSON.parse(stored);
      setUserData(user);
      setCurrentView('user');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">🍽️ Roriri Cafe</h1>
          <p className="text-indigo-100">Dynamic QR Scanner • PIN Authentication</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-3" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Loader className="animate-spin text-indigo-600" size={28} />
                <span className="text-gray-700 font-medium">Processing...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          )}

          {/* Home View */}
          {currentView === 'home' && !loading && (
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Welcome to Roriri Cafe</h2>
              
              <button
                onClick={() => setCurrentView('scanner')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Camera size={28} />
                <span className="text-lg font-semibold">Scan QR Code</span>
              </button>
              
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  OR
                </div>
              </div>
              
              <button
                onClick={() => setCurrentView('manual')}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-5 px-6 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
              >
                <User size={28} />
                <span className="text-lg font-semibold">Enter User ID</span>
              </button>

              {/* Admin Actions */}
              <div className="border-t pt-6">
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Admin Actions</p>
                <button
                  onClick={() => alert('Navigate to /admin/login')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Settings size={20} />
                  <span>Admin Panel</span>
                </button>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2 font-medium">🔗 Backend Connected</p>
                <p className="text-xs text-gray-500">API: {API_BASE_URL}</p>
                <p className="text-xs text-green-600 mt-1">✅ Real-time PIN authentication enabled</p>
              </div>
            </div>
          )}

          {/* Scanner View */}
          {currentView === 'scanner' && !loading && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">QR Scanner</h2>
                <button
                  onClick={resetToHome}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <QRScanner 
                onScan={handleQRScan}
                onError={handleScanError}
                isActive={currentView === 'scanner'}
              />
              
              <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  📷 <strong>Demo Mode:</strong> Will auto-scan in 3 seconds
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Replace with real @zxing/library implementation
                </p>
              </div>
            </div>
          )}

          {/* Manual Entry View */}
          {currentView === 'manual' && !loading && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Manual Entry</h2>
                <button
                  onClick={resetToHome}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Enter User ID:
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="STU1234, EMP5678, etc."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && manualInput.trim()) {
                        handleManualEntry();
                      }
                    }}
                  />
                </div>
                
                <button
                  onClick={handleManualEntry}
                  disabled={!manualInput.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg"
                >
                  Search User →
                </button>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Use the User ID format like STU1234, EMP5678
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ PIN Entry View - NOW INTEGRATED */}
          {currentView === 'pin-entry' && userData && !loading && (
            <PinEntry 
              userData={userData}
              onSuccess={handlePinSuccess}
              onBack={resetToHome}
            />
          )}

          {/* ✅ PIN Setup View - NOW INTEGRATED */}
          {currentView === 'pin-setup' && userData && !loading && (
            <PinSetup
              userData={userData}
              onComplete={handlePinSetupComplete}
              onBack={resetToHome}
            />
          )}

          {/* User Details View */}
          {currentView === 'user' && userData && !loading && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Welcome Back!</h2>
                <button
                  onClick={resetToHome}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Avatar & Info */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="text-white" size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{userData.name}</h3>
                  <p className="text-indigo-600 font-medium">{userData.UserType} • {userData.department}</p>
                  <p className="text-sm text-gray-500 mt-1">ID: {userData.userId}</p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl text-white text-center shadow-xl">
                  <div className="flex items-center justify-center mb-3">
                    <CreditCard className="mr-3" size={28} />
                    <span className="text-lg font-semibold">Available Balance</span>
                  </div>
                  <p className="text-4xl font-bold">₹{parseFloat(userData.balance || 0).toFixed(2)}</p>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 p-5 rounded-xl space-y-3">
                  <p className="text-gray-700 flex items-center">
                    <span className="mr-2">📧</span>
                    <span className="font-medium">{userData.email}</span>
                  </p>
                  {userData.phone && (
                    <p className="text-gray-700 flex items-center">
                      <span className="mr-2">📱</span>
                      <span className="font-medium">{userData.phone}</span>
                    </p>
                  )}
                  <p className="text-gray-700 flex items-center">
                    <span className="mr-2">🔍</span>
                    <span className="font-medium">QR: {userData.qrCode}</span>
                  </p>
                  {userData.lastUsed && (
                    <p className="text-gray-500 text-sm">
                      Last used: {new Date(userData.lastUsed).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    userData.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userData.status || 'Active'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => proceedToPurchase(userData)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg shadow-lg transform hover:scale-105"
                  >
                    <ShoppingCart size={24} />
                    <span>Start Shopping</span>
                  </button>
                  
                  <button
                    onClick={() => alert('Recharge functionality coming soon!')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Recharge Balance</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-indigo-100">
          <p className="text-sm">🔒 Secure • ⚡ Fast • 🌐 Backend Connected • 📱 Real-time</p>
        </div>

        {/* Flow Status */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hidden">
          <h3 className="text-white font-semibold mb-2">🔄 Integrated Flow:</h3>
          <div className="text-indigo-100 text-sm space-y-1">
            <p><strong>Current View:</strong> {currentView}</p>
            <p><strong>User Loaded:</strong> {userData ? '✅ ' + userData.name : '❌ None'}</p>
            <p><strong>API Endpoints:</strong></p>
            <ul className="text-xs ml-4 space-y-1">
              <li>• POST /api/users/scan (QR scanning)</li>
              <li>• GET /api/users/:id/has-pin (PIN check)</li>
              <li>• POST /api/users/:id/verify-pin (PIN verify)</li>
              <li>• POST /api/users/:id/set-pin (PIN creation)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicCanteenATM;