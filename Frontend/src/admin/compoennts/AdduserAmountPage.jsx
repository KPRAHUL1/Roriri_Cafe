import { useEffect, useState } from "react";
import { 
  Search, 
  User, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  DollarSign,
  UserCheck,
  Loader
} from "lucide-react";

const AddUserAmountPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [status, setStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:7700/api/users', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (response.ok) {
          const data = await response.json();
console.log('Fetched users:', data);
const userList = data.users;

          setUsers(userList);
          setFilteredUsers(userList);
          
          
        } else {
          setStatus({ 
            type: 'error', 
            message: 'Failed to fetch users. Please try again.' 
          });
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setStatus({ 
          type: 'error', 
          message: 'Error connecting to server. Please check your connection.' 
        });
      } finally {
        setFetchingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCurrentStep(2);
    setStatus(null);
  };

  const handleAmountSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      setStatus({ 
        type: 'error', 
        message: 'Please enter a valid amount greater than 0.' 
      });
      return;
    }

    setCurrentStep(3);
  };

  const handleFinalConfirmation = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const token = localStorage.getItem('adminToken');
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      
      const response = await fetch(`http://localhost:7700/api/users/${selectedUser.id}/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          paymentMethod,
          notes: notes || `Amount added by admin: ${adminData.name || 'Admin'}`,
          rechargedBy: adminData.id || 'admin'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add amount');
      }

      const result = await response.json();
      
      setStatus({ 
        type: 'success', 
        message: `Successfully added ₹${amount} to ${selectedUser.name}'s account.` 
      });
      
      // Update selected user balance in state
      setSelectedUser(prev => ({
        ...prev,
        balance: result.user.balance
      }));
      
      setCurrentStep(4);
      
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: `Error: ${err.message}` 
      });
      setCurrentStep(3);
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setSelectedUser(null);
    setAmount('');
    setPaymentMethod('Cash');
    setNotes('');
    setCurrentStep(1);
    setStatus(null);
    setSearchTerm('');
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStatus(null);
    }
  };

  // Step indicators
  const steps = [
    { number: 1, title: 'Select User', icon: Search },
    { number: 2, title: 'Enter Amount', icon: DollarSign },
    { number: 3, title: 'Verify Details', icon: UserCheck },
    { number: 4, title: 'Complete', icon: CheckCircle }
  ];

  if (fetchingUsers) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Add Amount to User</h1>
        <p className="text-gray-600">Recharge user accounts with step-by-step verification</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                ${currentStep >= step.number 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                  currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`p-4 mb-6 rounded-lg flex items-center ${
          status.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Step 1: Select User */}
        {currentStep === 1 && (
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Search className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Select User</h2>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, user ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.isArray(filteredUsers) && filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-indigo-600 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.userId} • {user.userType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{parseFloat(user.balance).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Current Balance</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {currentStep === 2 && selectedUser && (
          <div className="p-6">
            <div className="flex items-center mb-6">
              <DollarSign className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Enter Amount</h2>
            </div>

            {/* Selected User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <p className="text-xs text-gray-500">
                    Current Balance: ₹{parseFloat(selectedUser.balance).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAmountSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Add (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 inline mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 inline ml-2" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Verify Details */}
        {currentStep === 3 && selectedUser && (
          <div className="p-6">
            <div className="flex items-center mb-6">
              <UserCheck className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Verify Details</h2>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Please verify the details</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Make sure all information is correct before proceeding with the recharge.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">User Name:</span>
                <span className="font-semibold">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">User ID:</span>
                <span className="font-semibold">{selectedUser.userId}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-semibold">₹{parseFloat(selectedUser.balance).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Amount to Add:</span>
                <span className="font-semibold text-green-600">₹{parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">New Balance:</span>
                <span className="font-semibold text-indigo-600">
                  ₹{(parseFloat(selectedUser.balance) + parseFloat(amount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">{paymentMethod}</span>
              </div>
              {notes && (
                <div className="flex justify-between items-start py-3 border-b border-gray-200">
                  <span className="text-gray-600">Notes:</span>
                  <span className="font-semibold text-right max-w-xs">{notes}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={loading}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 inline mr-2" />
                Back
              </button>
              <button
                onClick={handleFinalConfirmation}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin inline mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 inline mr-2" />
                )}
                {loading ? 'Processing...' : 'Confirm & Add Amount'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && selectedUser && (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Amount Added Successfully!</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                ₹{parseFloat(amount).toFixed(2)} has been successfully added to {selectedUser.name}'s account.
              </p>
              <p className="text-green-700 text-sm mt-2">
                New balance: ₹{selectedUser.balance ? parseFloat(selectedUser.balance).toFixed(2) : '0.00'}
              </p>
            </div>

            <button
              onClick={resetProcess}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Add Amount to Another User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserAmountPage;