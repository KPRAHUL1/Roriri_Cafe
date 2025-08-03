import React, { useState, useRef } from 'react';
import { User, Mail, Phone, Building, CreditCard, QrCode, CheckCircle, ArrowRight, ArrowLeft, Download, Send } from 'lucide-react';
import { QRCodeCanvas } from "qrcode.react";

const CreateUser = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [apiError, setApiError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [qrCodeData, setQrCodeData] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    phone: '',
    userType: 'Student',
    department: '',
    balance: 0,
    status: 'Active'
  });
  const qrRef = useRef(null);

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Account Details', icon: CreditCard },
    { number: 3, title: 'QR Generation', icon: QrCode },
    { number: 4, title: 'Confirmation', icon: CheckCircle }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear API error when user starts typing
    setApiError('');
    
    // Check user ID availability with debounce
    if (name === 'userId' && value.trim()) {
      clearTimeout(window.userIdCheckTimeout);
      window.userIdCheckTimeout = setTimeout(() => {
        checkUserIdAvailability(value);
      }, 500);
    }
    
    // Clear validation errors for the field being edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.userId.trim()) {
      errors.userId = 'User ID is required';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkUserIdAvailability = async (userId) => {
    if (!userId.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:770/api/users/userid/${userId}`);
      if (response.ok) {
        // User exists
        setValidationErrors(prev => ({
          ...prev,
          userId: 'User ID already exists'
        }));
      } else if (response.status === 404) {
        // User doesn't exist - good
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.userId;
          return newErrors;
        });
      }
    } catch (error) {
      console.log('Error checking user ID availability:', error);
    }
  };

  const generateQRCode = (userId) => {
    // Generate QR code data - you can customize this based on your needs
    return JSON.stringify({
      userId: userId,
      type: 'user_identification',
      timestamp: new Date().toISOString()
    });
  };

  const QRCodeComponent = ({ data, size = 200 }) => {
    return (
      <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
        <QRCodeCanvas
          value={data || formData.userId}
          size={size}
          level="H"
          fgColor="#1f2937"
          bgColor="#ffffff"
          includeMargin={true}
        />
      </div>
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 2) {
        const qrData = generateQRCode(formData.userId);
        setQrCodeData(qrData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Prepare payload for API
      const payload = {
        userId: formData.userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        userType: formData.userType,
        department: formData.department,
        balance: parseFloat(formData.balance.toString()) || 0.00,
        status: formData.status
      };

      // Make API call to create user
      const response = await fetch('http://localhost:7700/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('User created successfully:', userData);
      
      // Update QR code data with the generated QR code from backend or create QR data
      const qrData = userData.qrCode || generateQRCode(userData.userId || formData.userId);
      setQrCodeData(qrData);
      setIsCreated(true);
      setCurrentStep(4);
      
      // Show success message
      alert(`User created successfully! User ID: ${userData.userId}`);
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Failed to create user: ${error.message}`);
      setIsLoading(false);
    } finally {
      if (isCreated) {
        setIsLoading(false);
      }
    }
  };

const handleSendEmail = async () => {
  try {
    setIsLoading(true);
    
    // Get QR code canvas element
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      throw new Error('QR code not found. Please generate QR code first.');
    }
    
    // Convert canvas to base64 image
    const qrCodeImage = canvas.toDataURL('image/png');
    
    // Validate form data
    if (!formData.email) {
      throw new Error('Email address is required');
    }
    
    if (!formData.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    
    const emailPayload = {
      email: formData.email.trim(),
      name: formData.name || 'User',
      userId: formData.userId,
      qrCode: qrCodeData,
      qrCodeImage: qrCodeImage,
      userType: formData.userType
    };
    
    console.log('Sending email to:', emailPayload.email);
    
    const response = await fetch('http://localhost:7700/api/users/send-qr-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      alert(`✅ QR Code sent successfully to ${formData.email}!`);
      console.log('Email sent successfully:', responseData);
    } else {
      throw new Error(responseData.error || 'Failed to send email');
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    alert(`❌ Failed to send email: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
  const downloadQRCode = () => {
    try {
      // Get the QR code canvas element
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // Create download link
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `qr-code-${formData.userId}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('QR Code downloaded successfully!');
      } else {
        alert('Unable to download QR code. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code.');
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setIsCreated(false);
    setApiError('');
    setValidationErrors({});
    setFormData({
      userId: '',
      name: '',
      email: '',
      phone: '',
      userType: 'Student',
      department: '',
      balance: 0,
      status: 'Active'
    });
    setQrCodeData('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Create New User</h1>
          <p className="text-gray-600">Follow the steps to create a new user account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-110' : 
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      'bg-white border-gray-300 text-gray-400'}
                  `}>
                    <Icon size={20} />
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl">
          {/* API Error Display */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{apiError}</p>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <User className="mr-3 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">User ID*</label>
                  <input
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      validationErrors.userId 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter unique user ID"
                    required
                  />
                  {validationErrors.userId && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.userId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Full Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      validationErrors.name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter full name"
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      validationErrors.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter email address"
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {currentStep === 2 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <CreditCard className="mr-3 text-blue-600" />
                Account Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">User Type*</label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="Student">Student</option>
                    <option value="Employee">Employee</option>
                    <option value="Staff">Staff</option>
                    <option value="Visitor">Visitor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter department"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: QR Code Generation */}
          {currentStep === 3 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <QrCode className="mr-3 text-blue-600" />
                QR Code Preview
              </h2>
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <QRCodeComponent data={qrCodeData} size={250} />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-blue-800 font-medium">User ID: {formData.userId}</p>
                  <p className="text-blue-600 text-sm mt-1">This QR code contains user identification data</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="animate-slide-in text-center">
              {!isCreated ? (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Review & Confirm</h2>
                  <div className="bg-gray-50 p-6 rounded-xl mb-6 text-left max-w-md mx-auto">
                    <h3 className="font-semibold mb-4">User Details:</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">User ID:</span> {formData.userId}</p>
                      <p><span className="font-medium">Name:</span> {formData.name}</p>
                      <p><span className="font-medium">Email:</span> {formData.email}</p>
                      <p><span className="font-medium">Type:</span> {formData.userType}</p>
                      <p><span className="font-medium">Department:</span> {formData.department || 'N/A'}</p>
                      <p><span className="font-medium">Balance:</span> ${formData.balance}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="animate-bounce mb-6">
                    <CheckCircle className="mx-auto text-green-500" size={80} />
                  </div>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">User Created Successfully!</h2>
                  <div className="bg-green-50 p-6 rounded-xl mb-6">
                    <div className="flex justify-center mb-4">
                      <QRCodeComponent data={qrCodeData} size={200} />
                    </div>
                    <p className="text-green-800 font-medium">QR Code for {formData.name}</p>
                    <p className="text-green-600 text-sm">User ID: {formData.userId}</p>
                  </div>
                  <div className="flex justify-center space-x-4 mb-6">
                    <button
                      onClick={downloadQRCode}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Download className="mr-2" size={16} />
                      Download QR
                    </button>
                    <button
                      onClick={handleSendEmail}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <Send className="mr-2" size={16} />
                      Send to Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={currentStep === 1 ? undefined : handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                currentStep === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeft className="mr-2" size={16} />
              Previous
            </button>

            <div className="flex space-x-4">
              {isCreated && (
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Create Another User
                </button>
              )}
              
              {!isCreated && (
                <button
                  onClick={currentStep === 4 ? handleSubmit : handleNext}
                  disabled={isLoading || (currentStep === 1 && (Object.keys(validationErrors).length > 0 || !formData.userId || !formData.name || !formData.email))}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    isLoading || (currentStep === 1 && (Object.keys(validationErrors).length > 0 || !formData.userId || !formData.name || !formData.email))
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : currentStep === 4 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : currentStep === 4 ? (
                    'Create User'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2" size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreateUser;