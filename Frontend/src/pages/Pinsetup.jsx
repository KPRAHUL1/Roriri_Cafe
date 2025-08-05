import React, { useState } from 'react';

// API Base URL (should ideally come from environment variables in a real app)
const API_BASE_URL = 'http://localhost:7700/api';

function PinSetup({ userData, onComplete, onBack }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error'
  const [isLoading, setIsLoading] = useState(false);

  const handlePinChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };

  const handleConfirmPinChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setConfirmPin(value);
    }
  };

  const setPinWithApi = async (userId, newPin, confirmationPin) => { // Added confirmationPin parameter
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/set-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          pin: newPin,
          confirmPin: confirmationPin // Send confirmPin to the backend
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set PIN');
      }

      return result; // { success: true, message: 'PIN set successfully' }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
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

    if (pin.length !== 4 || confirmPin.length !== 4) {
      setMessage('PIN must be exactly 4 digits');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      // Pass both PIN and confirmPin to the backend for validation
      const result = await setPinWithApi(userData.userId, pin, confirmPin); // Pass confirmPin here
      setMessage(result.message);
      setMessageType('success');
      setPin('');
      setConfirmPin('');
      onComplete(userData); // Call the complete callback passed from parent
    } catch (error) {
      console.error('Set PIN error:', error);
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
      default:
        return '';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Set Your PIN</h2>
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
            New 4-Digit PIN for {userData?.name || 'User'}
          </label>
          <input
            id="pin"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="4"
            value={pin}
            onChange={handlePinChange}
            className="w-full px-4 py-3 text-2xl tracking-[0.7em] text-center border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out placeholder-gray-400"
            placeholder="••••"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirm-pin" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm PIN
          </label>
          <input
            id="confirm-pin"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="4"
            value={confirmPin}
            onChange={handleConfirmPinChange}
            className="w-full px-4 py-3 text-2xl tracking-[0.7em] text-center border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out placeholder-gray-400"
            placeholder="••••"
            disabled={isLoading}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg border ${getMessageClasses()} text-sm text-center`} role="alert">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting PIN...
            </div>
          ) : (
            'Set PIN'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-500 text-sm">
        User ID: <span className="font-semibold">{userData?.userId || 'N/A'}</span>
      </p>
    </div>
  );
}

export default PinSetup;
