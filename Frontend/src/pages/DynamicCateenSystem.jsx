import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, CreditCard, ShoppingCart, AlertCircle, X, Loader, RefreshCw, Plus, Settings } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { BrowserMultiFormatReader } from '@zxing/library';
import apiService from '../components/Scan/apiService';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/Scan/QRScanner';
import CreateUserModal from '../components/Scan/CreateModel';
// API Configuration
const API_BASE_URL = 'http://localhost:7700/api';

// // API Service
// const apiService = {
//   scanUser: async (qrCode) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/users/scan/${qrCode}`);
//       if (!response.ok) {
//         throw new Error(response.status === 404 ? 'User not found' : 'Failed to scan user');
//       }
//       return await response.json();
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   getUserByUserId: async (userId) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/users/userid/${userId}`);
//       if (!response.ok) {
//         throw new Error(response.status === 404 ? 'User not found' : 'Failed to fetch user');
//       }
//       return await response.json();
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   createUser: async (userData) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/users`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(userData),
//       });
//       if (!response.ok) {
//         throw new Error('Failed to create user');
//       }
//       return await response.json();
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   rechargeUser: async (userId, rechargeData) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/users/${userId}/recharge`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(rechargeData),
//       });
//       if (!response.ok) {
//         throw new Error('Failed to recharge user');
//       }
//       return await response.json();
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   }
// };

// // QR Scanner Component (Simplified for demo)
// const QRScanner = ({ onScan, onError, isActive }) => {
//   const videoRef = useRef(null);
//   const codeReaderRef = useRef(null);
//   const [hasScanned, setHasScanned] = useState(false);

//   useEffect(() => {
//     if (!isActive) return;

//     const startScanner = async () => {
//       try {
//         const codeReader = new BrowserMultiFormatReader();
//         codeReaderRef.current = codeReader;

//         const videoInputDevices = await codeReader.listVideoInputDevices();
//         const selectedDeviceId = videoInputDevices?.[0]?.deviceId;

//         if (!selectedDeviceId) {
//           onError?.('No camera devices found');
//           return;
//         }

//         codeReader.decodeFromVideoDevice(
//           selectedDeviceId,
//           videoRef.current,
//           (result, err) => {
//             if (result && !hasScanned) {
//               setHasScanned(true); // prevent multiple scans
//               onScan(result.getText());
//             }
//             if (err && !(err.name === 'NotFoundException')) {
//               console.warn('Decode error:', err);
//             }
//           }
//         );
//       } catch (err) {
//         console.error('QR Scan Error:', err);
//         onError?.(err.message || 'Error initializing QR scanner');
//       }
//     };

//     const stopScanner = () => {
//       if (codeReaderRef.current) {
//         try {
//           codeReaderRef.current.reset();
//         } catch (e) {
//           console.warn('Error during scanner stop:', e);
//         }
//         codeReaderRef.current = null;
//       }
//     };

//     startScanner();

//     return () => {
//       stopScanner();
//       setHasScanned(false); // reset for next activation
//     };
//   }, [isActive]);

//   if (!isActive) return null;

//   return (
//     <div className="qr-scanner">
//       <video
//         ref={videoRef}
//         style={{ width: '100%', maxHeight: '300px', borderRadius: '10px' }}
//         muted
//         autoPlay
//         playsInline
//       />
//     </div>
//   );
// };


// // Create User Modal
// const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     userType: 'Student',
//     department: '',
//     balance: 0
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const newUser = await apiService.createUser(formData);
//       onUserCreated(newUser);
//       onClose();
//       setFormData({
//         name: '',
//         email: '',
//         phone: '',
//         userType: 'Student',
//         department: '',
//         balance: 0
//       });
//     } catch (error) {
//       setError(error.message || 'Failed to create user');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-bold">Create New User</h2>
//             <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//               <X size={24} />
//             </button>
//           </div>

//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
//               <input
//                 type="text"
//                 required
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
//               <input
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={(e) => setFormData({...formData, email: e.target.value})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//               <input
//                 type="tel"
//                 value={formData.phone}
//                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
//               <select
//                 required
//                 value={formData.userType}
//                 onChange={(e) => setFormData({...formData, userType: e.target.value})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="Student">Student</option>
//                 <option value="Employee">Employee</option>
//                 <option value="Staff">Staff</option>
//                 <option value="Visitor">Visitor</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
//               <input
//                 type="text"
//                 value={formData.department}
//                 onChange={(e) => setFormData({...formData, department: e.target.value})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 value={formData.balance}
//                 onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="flex space-x-3 pt-4">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
//               >
//                 {loading ? <Loader className="animate-spin" size={20} /> : 'Create User'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// Main Component
const DynamicCanteenATM = () => {
  const [currentView, setCurrentView] = useState('home');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

const handleQRScan = async (qrCode) => {
  setLoading(true);
  setError('');
  try {
    const user = await apiService.scanUser(qrCode);
    setUserData(user);
    localStorage.setItem('userData', JSON.stringify(user)); // ✅ Save to localStorage
    setCurrentView('user');
  } catch (err) {
    setError(err.message || 'Failed to scan QR code');
    setTimeout(() => setError(''), 4000);
  } finally {
    setLoading(false);
  }
};

const handleManualEntry = async () => {
  if (!manualInput.trim()) return;
  setLoading(true);
  setError('');
  try {
    const user = await apiService.getUserByUserId(manualInput.trim());
    setUserData(user);
    localStorage.setItem('userData', JSON.stringify(user)); // ✅ Save to localStorage
    setCurrentView('user');
  } catch (err) {
    setError(err.message || 'Failed to find user');
    setTimeout(() => setError(''), 4000);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const stored = localStorage.getItem('userData');
  if (stored) {
    const user = JSON.parse(stored);
    setUserData(user);
    setCurrentView('user');
  }
}, []);


  const handleScanError = (errorMsg) => {
    setError(errorMsg);
    setTimeout(() => setError(''), 4000);
  };

const resetToHome = () => {
  setCurrentView('home');
  setUserData(null);
  setError('');
  setManualInput('');
  localStorage.removeItem('userData'); // ✅ Clear
};


const proceedToPurchase = (user) => {
  if (!user || !user.userId) {
    console.error('Invalid user data:', user);
    return;
  }

  navigate(`/purchase/${user.userId}`, { state: { user } });
};


  const handleUserCreated = (newUser) => {
    alert(`✅ User created successfully!\n\nName: ${newUser.name}\nQR Code: ${newUser.qrCode}\nUser ID: ${newUser.userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">🍽️Roriri Cafe</h1>
          <p className="text-indigo-100">Dynamic QR Scanner • Backend Connected</p>
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
                <span className="text-gray-700 font-medium">Connecting to server...</span>
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
              <div className="border-t pt-6 space-y-3">
                <p className="text-sm font-medium text-gray-600 text-center">Admin Actions</p>
                
                {/* <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Create New User</span>
                </button>
                 */}
                <button
                  onClick={() => navigate('/admin/login')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Settings size={20} />
                  <span>Admin Panel</span>
                </button>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2 font-medium">🔗 Backend Connected</p>
                <p className="text-xs text-gray-500">API: {API_BASE_URL}</p>
                <p className="text-xs text-green-600 mt-1">✅ Real-time user scanning enabled</p>
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
  📷 <strong>Demo Mode:</strong> Camera will simulate scanning...
</p>
                <p className="text-xs text-yellow-600 mt-1">
                  In production: Integrate with @zxing/library for real QR detection
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
                  <p className="text-indigo-600 font-medium">{userData.userType} • {userData.department}</p>
                  <p className="text-sm text-gray-500 mt-1">ID: {userData.userId}</p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl text-white text-center shadow-xl">
                  <div className="flex items-center justify-center mb-3">
                    <CreditCard className="mr-3" size={28} />
                    <span className="text-lg font-semibold">Available Balance</span>
                  </div>
                  <p className="text-4xl font-bold">₹{parseFloat(userData.balance).toFixed(2)}</p>
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
                    {userData.status}
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
      </div>

      {/* Create User Modal */}
      <CreateUserModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};

export default DynamicCanteenATM;