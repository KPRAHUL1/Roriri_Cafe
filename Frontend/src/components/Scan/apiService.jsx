const API_BASE_URL = 'http://localhost:7700/api';

const apiService = {
  // ---------------- USERS ----------------
  scanUser: async (qrCode) => {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCode }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Invalid QR code or user not found');
  }

  return result.data; // ✅ extract only the actual userData
},

getUserByUserId: async (userId) => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`);
  console.log(response);
  

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'User not found');
  }

  return result.data; // ✅ this is what you want
},


  // ---------------- PRODUCTS ----------------
  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const products = await response.json();

    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.imagePath || '',
      category: product.category || 'General',
      description: product.description || '',
      available: product.isActive && product.stock > 0,
      stock: product.stock,
      minStock: product.minStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
  },

  getProductById: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);

    if (!response.ok) {
      throw new Error('Product not found');
    }

    return await response.json();
  },

  // ---------------- TRANSACTIONS ----------------
  createTransaction: async (transactionData) => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }

    return await response.json();
  },

  // ---------------- PURCHASES ----------------
  createPurchase: async (purchaseData) => {
    const response = await fetch(`${API_BASE_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });

  if (!response.ok) {
  const errorMessage = await response.text();
  console.error("Purchase Error:", errorMessage);
  throw new Error('Failed to create purchase');
}


    return await response.json();
  },

  // ---------------- ORDER PROCESS ----------------
 processOrder: async ({ userId, items, totalAmount }) => {
  const user = await apiService.getUserByUserId(userId);

  if (user.balance < totalAmount) {
    throw new Error('Insufficient balance');
  }

  const transaction = await apiService.createTransaction({
    userId,
    items,            // 👈 include all items
    totalAmount,
  });

  // Optionally generate token
  if (transaction.purchases?.length > 0) {
    await apiService.generateToken(transaction.purchases[0].id, items);
  }

  return transaction;
},


  // ---------------- TOKENS ----------------
generateToken: async (purchaseId, items) => {
  const response = await fetch(`${API_BASE_URL}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purchaseId,
      items,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token error:', error);
    throw new Error('Failed to generate token');
  }

  const data = await response.json();

  // ✅ Assuming backend returns token details like { success: true, token: {...} }
  return data.token || data;
},
getAllOrderHistory: async () => {
  const res = await fetch(`${API_BASE_URL}/order-history`);
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch order history');
  }

  return result.orders; // this is an array of full transaction objects
},
getOrderHistoryByUserId: async (userId) => {
  const res = await fetch(`${API_BASE_URL}/user/${userId}/order-history`);
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch user order history');
  }

  return result.orders;
},


};



export default apiService;
