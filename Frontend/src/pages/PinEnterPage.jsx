import React, { useState, useEffect } from 'react';

// API Base URL (should ideally come from environment variables in a real app)
const API_BASE_URL = 'http://localhost:7700/api';

// PinEntry component now accepts props for user data, success callback, and back navigation
function PinEntry({ userData, onSuccess, onBack }) {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [isLoading, setIsLoading] = useState(false);
  const [pinLockedUntil, setPinLockedUntil] = useState(null); // Date object or null, based on API response

  // Effect to handle initial lock status if passed from parent (e.g., from scan result)
  useEffect(() => {
    if (userData && userData.pinLockedUntil) {
      const lockDate = new Date(userData.pinLockedUntil);
      if (lockDate > new Date()) {
        setPinLockedUntil(lockDate);
        setMessageType('error');
        setMessage(`Account temporarily locked. Try again in ${Math.ceil((lockDate.getTime() - new Date().getTime()) / 1000)} seconds.`);
      }
    }
  }, [userData]);

  // Effect to update lock message countdown
  useEffect(() => {
    let timer;
    if (pinLockedUntil && new Date() < pinLockedUntil) {
      timer = setInterval(() => {
        const remaining = Math.ceil((pinLockedUntil.getTime() - new Date().getTime()) / 1000);
        if (remaining > 0) {
          setMessage(`Account temporarily locked. Try again in ${remaining} seconds.`);
        } else {
          // Lock time has passed
          clearInterval(timer);
          setPinLockedUntil(null);
          setMessage('Account unlocked. Please try again.');
          setMessageType('info');
        }
      }, 1000);
    }
    return () => clearInterval(timer); // Cleanup on unmount or lock status change
  }, [pinLockedUntil]);


  const handlePinChange = (e) => {
    const value = e.target.value;
    // Allow only digits and limit to 4 characters
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };

  const verifyPinWithApi = async (userId, inputPin) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: inputPin }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error messages from your backend
        if (response.status === 423 && result.error.includes('locked')) {
          // If locked, update the lockedUntil state to show countdown
          // Note: In a real app, the API should return the exact lock duration/timestamp
          // For this example, we'll assume the error message implies a lock
          setPinLockedUntil(new Date(Date.now() + 60 * 1000)); // Simulate 1 min lock
          throw new Error(result.error);
        } else if (response.status === 401 && result.error.includes('Invalid PIN')) {
          throw new Error(result.error);
        } else {
          throw new Error(result.error || 'Failed to verify PIN');
        }
      }

      return result; // { success: true, message: 'PIN verified successfully' }
    } catch (error) {
      console.error('API Error:', error);
      throw error; // Re-throw to be caught by handleSubmit
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!userData || !userData.userId) {
      setMessage('User data is missing. Please go back and scan again.');
      setMessageType('error');
      return;
    }

    if (!pin) {
      setMessage('PIN is required');
      setMessageType('error');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setMessage('PIN must be exactly 4 digits');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPinWithApi(userData.userId, pin);
      setMessage(result.message);
      setMessageType('success');
      setPin(''); // Clear PIN on success
      onSuccess(userData); // Call the success callback passed from parent
    } catch (error) {
      console.error('Verify PIN error:', error);
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageClasses = () => {
    switch (messageType) {
      case 'success':
        return 'text-green-600 bg-green-100 border-green-400';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-400';
      case 'info':
        return 'text-blue-600 bg-blue-100 border-blue-400';
      default:
        return '';
    }
  };

  return (
    <div className="p-8"> {/* Adjusted padding for better integration */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Enter Your PIN</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
            4-Digit PIN for {userData?.name || 'User'}
          </label>
          <input
            id="pin"
            type="tel" // Use tel for numeric keypad on mobile
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="4"
            value={pin}
            onChange={handlePinChange}
            className="w-full px-4 py-3 text-2xl tracking-[0.7em] text-center border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400"
            placeholder="••••"
            disabled={isLoading || (pinLockedUntil && new Date() < pinLockedUntil)}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg border ${getMessageClasses()} text-sm text-center`} role="alert">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || pin.length !== 4 || (pinLockedUntil && new Date() < pinLockedUntil)}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </div>
          ) : (
            'Verify PIN'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-500 text-sm">
        User ID: <span className="font-semibold">{userData?.userId || 'N/A'}</span>
      </p>
    </div>
  );
}

export default PinEntry;
