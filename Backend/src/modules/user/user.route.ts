import { db } from '../../shared/lib/db';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByQrCode,
  getUserByUserId,
  createUser,
  updateUserById,
  deleteUserById,
  updateUserBalance,
  rechargeUserBalance,
  verifyUserPin,
  setUserPin,
  checkUserHasPin,
  getUserStats,
  searchUsers,
  exportUserData,
  getUserActivity,
  validateUserData,
  getSystemStats
} from './user.service';

const express = require('express');
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const logRequest = (req: Request, res: Response, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

router.use(logRequest);
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      userType: req.query.userType as string,
      department: req.query.department as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const response = await getAllUsers(filters);
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

router.get('/stats/system', async (req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system statistics',
      details: error.message 
    });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const filters = {
      userType: req.query.userType as string,
      department: req.query.department as string,
      status: req.query.status as string,
      balanceMin: req.query.balanceMin ? parseFloat(req.query.balanceMin as string) : undefined,
      balanceMax: req.query.balanceMax ? parseFloat(req.query.balanceMax as string) : undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
    };

    const results = await searchUsers(query.trim(), filters);
    res.status(200).json({
      query,
      results,
      count: results.length
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      error: 'Failed to search users',
      details: error.message 
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const response = await getUserById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error.message 
    });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getUserStats(req.params.id);
    res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      details: error.message 
    });
  }
});

router.get('/:id/activity', async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const activity = await getUserActivity(req.params.id, days);
    res.status(200).json(activity);
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user activity',
      details: error.message 
    });
  }
});

router.get('/:id/export', async (req: Request, res: Response) => {
  try {
    const userData = await exportUserData(req.params.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-${userData.userId}-export.json"`);
    
    res.status(200).json(userData);
  } catch (error: any) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ 
      error: 'Failed to export user data',
      details: error.message 
    });
  }
});

router.get('/scan/:qrCode', async (req: Request, res: Response) => {
  try {
    const response = await getUserByQrCode(req.params.qrCode);
    if (!response) {
      return res.status(404).json({ error: 'User not found with this QR code' });
    }
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error scanning user:', error);
    res.status(500).json({ 
      error: 'Failed to scan user',
      details: error.message 
    });
  }
});

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const response = await getUserByUserId(req.params.userId);
    if (!response) {
      return res.status(404).json({ error: 'User not found with this user ID' });
    }
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching user by userId:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error.message 
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = validateUserData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.errors 
      });
    }

    const existingUser = await db.user.findUnique({
      where: { email: req.body.email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    if (req.body.userId) {
      const existingUserId = await db.user.findUnique({
        where: { userId: req.body.userId }
      });

      if (existingUserId) {
        return res.status(409).json({ error: 'User ID already exists' });
      }
    }

    const response = await createUser(req.body);
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message 
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const id = req.params.id;
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (payload.email && payload.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: payload.email }
      });

      if (emailExists) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    const response = await updateUserById(id, payload);
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
});

router.patch('/:id/balance', async (req: Request, res: Response) => {
  try {
    const { amount, operation, description } = req.body;
    const id = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    if (!operation || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({ error: 'Operation must be "add" or "subtract"' });
    }

    const response = await updateUserBalance(id, amount, operation, description);
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error updating balance:', error);
    
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to update balance',
      details: error.message 
    });
  }
});

router.post('/:id/recharge', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const userId = req.params.id;

    if (!payload.amount || payload.amount <= 0) {
      return res.status(400).json({ error: 'Recharge amount must be positive' });
    }

    if (!payload.paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const validPaymentMethods = ['Cash', 'UPI', 'Card', 'BankTransfer'];
    if (!validPaymentMethods.includes(payload.paymentMethod)) {
      return res.status(400).json({ 
        error: 'Invalid payment method',
        validMethods: validPaymentMethods 
      });
    }

    const response = await rechargeUserBalance(userId, payload);
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error recharging balance:', error);
    res.status(500).json({ 
      error: 'Failed to recharge balance',
      details: error.message 
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await deleteUserById(id);
    res.status(200).json({ 
      message: 'User deleted successfully',
      userId: existingUser.userId 
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    });
  }
});

router.get('/test/connection', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing database connection...');
    
    const users = await db.user.findMany({
      select: {
        id: true,
        userId: true,
        qrCode: true,
        name: true,
        email: true,
        status: true,
        userType: true,
        balance: true
      },
      take: 10
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    res.json({
      success: true,
      count: users.length,
      users: users,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/send-qr-email', async (req: Request, res: Response) => {
  try {
    const { email, name, userId, qrCode, qrCodeImage, userType, hasPinSetup } = req.body;

    if (!email || !qrCodeImage) {
      return res.status(400).json({ error: 'Email and QR code image are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');
    const mailOptions = {
      from: {
        name: 'Roriri Cafe',
        address: process.env.EMAIL_USER || 'kprahul1143@gmail.com'
      },
      to: email,
      subject: `Welcome to Roriri Cafe - Your QR Code`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🍽️ Canteen Management System</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Your Digital Dining Experience</p>
            </div>

            <!-- Welcome Message -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0;">Hello ${name || 'User'}! 👋</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0;">
                Welcome to our canteen system! Your account has been successfully created. 
                Below you'll find your personal QR code for quick and easy transactions.
              </p>
            </div>

            <!-- QR Code Section -->
            <div style="background: #f3f4f6; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0;">Your Personal QR Code</h3>
              <div style="background: white; display: inline-block; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <img src="cid:qrcode" alt="QR Code" style="max-width: 200px; display: block;" />
              </div>
              <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">
                📱 Scan this code at the canteen for quick payments
              </p>
            </div>

            <!-- Account Details -->
            <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #065f46; margin: 0 0 15px 0;">📋 Account Details</h3>
              <div style="color: #047857;">
                <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${name || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>User Type:</strong> ${userType || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;">
                  <strong>PIN Security:</strong> 
                  <span style="color:  '#16a34a'};">
                    🔐 Enabled
                  </span>
                </p>
              </div>
            </div>

            <!-- Instructions -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0;">🚀 How to Use Your QR Code</h3>
              <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Visit any canteen counter</li>
                <li>Show your QR code to the staff</li>
                <li>Complete your order and payment</li>
                <li>Enjoy your meal!</li>
              </ol>
            </div>

            <!-- Tips -->
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0;">💡 Pro Tips</h3>
              <ul style="color: #1e40af; line-height: 1.6; padding-left: 20px; margin: 0;">
                <li>Save this QR code to your phone for quick access</li>
                <li>Check your balance regularly</li>
                <li>Keep your PIN secure and don't share it with anyone</li>
                <li>Report any issues immediately to canteen staff</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                This is an automated email from the Canteen Management System
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Please keep this QR code safe and secure.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                Generated on ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `qr-code-${userId || 'user'}.png`,
          content: qrBuffer,
          cid: 'qrcode'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`QR code email sent successfully to ${email}. Message ID: ${info.messageId}`);
    
    res.status(200).json({ 
      message: 'QR code sent successfully',
      recipient: email,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Email sending error:', error);
    
    if (error.code === 'EAUTH') {
      res.status(500).json({ error: 'Email authentication failed. Please check email configuration.' });
    } else if (error.code === 'ENOTFOUND') {
      res.status(500).json({ error: 'Email service connection failed.' });
    } else if (error.code === 'EENVELOPE') {
      res.status(400).json({ error: 'Invalid email address provided.' });
    } else {
      res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message 
      });
    }
  }
});


router.post('/:id/verify-pin', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }
    
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    
    const result = await verifyUserPin(userId, pin);
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Verify PIN error:', error);
    
    if (error.message.includes('locked')) {
      return res.status(423).json({ error: error.message });
    }
    
    if (error.message.includes('Invalid PIN')) {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to verify PIN',
      details: error.message 
    });
  }
}); 


router.post('/:id/set-pin', async (req: Request, res: Response) => {
  try {
    const { pin, confirmPin } = req.body;
    const paramUserId = req.params.id; 
    
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }
    
    if (pin !== confirmPin) {
      return res.status(400).json({ error: 'PIN and confirmation PIN do not match' });
    }
    
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    const user = await db.user.findUnique({
      where: { userId: paramUserId },
      select: { id: true, name: true, userId: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Pass the unique identifier that matches your update logic.
    // If your `setUserPin` function updates by the UUID `id`, pass `user.id`.
    // If it updates by the string `userId`, pass `user.userId`.
    // Based on your `setUserPin` below, it's expecting the `userId` string.
    const result = await setUserPin(user.userId, pin);
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('PIN creation error:', error);
    res.status(500).json({ 
      error: 'Failed to set PIN',
      details: error.message 
    });
  }
}); 

router.get('/:id/has-pin', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const result = await checkUserHasPin(userId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error checking PIN status:', error);
    res.status(500).json({ 
      error: 'Failed to check PIN status',
      details: error.message 
    });
  }
});

router.post('/:id/reset-pin', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    await db.user.update({
      where: { id: userId },
      data: {
        pin: null,
        pinAttempts: 0,
        pinLockedUntil: null
      }
    });
    
    res.status(200).json({ 
      message: 'PIN reset successfully. User will need to set a new PIN on next login.' 
    });
    
  } catch (error: any) {
    console.error('Error resetting PIN:', error);
    res.status(500).json({ 
      error: 'Failed to reset PIN',
      details: error.message 
    });
  }
});

router.post('/:id/unlock', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, pinLockedUntil: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.pinLockedUntil || new Date() >= user.pinLockedUntil) {
      return res.status(400).json({ error: 'User account is not locked' });
    }
    
    await db.user.update({
      where: { id: userId },
      data: {
        pinAttempts: 0,
        pinLockedUntil: null
      }
    });
    
    res.status(200).json({ 
      message: 'User account unlocked successfully' 
    });
    
  } catch (error: any) {
    console.error('Error unlocking account:', error);
    res.status(500).json({ 
      error: 'Failed to unlock account',
      details: error.message 
    });
  }
});
router.get('/health/check', async (req: Request, res: Response) => {
  try {
    await db.user.findFirst({
      select: { id: true }
    });
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'User Management API',
      version: '1.0.0',
      database: 'connected'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'User Management API',
      error: error.message,
      database: 'disconnected'
    });
  }
});

router.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error in user routes:', error);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { details: error.message, stack: error.stack })
  });
});

module.exports = router;