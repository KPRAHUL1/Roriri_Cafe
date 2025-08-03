import { db } from '../../shared/lib/db';
const nodemailer = require('nodemailer');
require('dotenv').config();
import {
  getAllUsers,
  getUserById,
  getUserByQrCode,
  getUserByUserId,
  createUser,
  updateUserById,
  deleteUserById,
  updateUserBalance,
  rechargeUserBalance
} from './user.service';

const express = require('express');
const router = express.Router();

// Get all users
router.get('/', async (req: any, res: any) => {
  try {
    const response = await getAllUsers();
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req: any, res: any) => {
  try {
    const response = await getUserById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user by QR code - for scanner
router.get('/scan/:qrCode', async (req: any, res: any) => {
  try {
    const response = await getUserByQrCode(req.params.qrCode);
    if (!response) {
      return res.status(404).json({ error: 'User not found with this QR code' });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan user' });
  }
});

// Get user by userId (custom field)
router.get('/userid/:userId', async (req: any, res: any) => {
  try {
    const response = await getUserByUserId(req.params.userId);
    if (!response) {
      return res.status(404).json({ error: 'User not found with this user ID' });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', async (req: any, res: any) => {
  try {
    const payload = req.body;
    const response = await createUser(payload);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req: any, res: any) => {
  try {
    const payload = req.body;
    const id = req.params.id;
    const response = await updateUserById(id, payload);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user balance
router.patch('/:id/balance', async (req: any, res: any) => {
  try {
    const { amount, operation } = req.body; // operation: 'add' or 'subtract'
    const id = req.params.id;
    const response = await updateUserBalance(id, amount, operation);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Recharge user balance
router.post('/:id/recharge', async (req: any, res: any) => {
  try {
    const payload = req.body;
    const userId = req.params.id;
    const response = await rechargeUserBalance(userId, payload);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to recharge balance' });
  }
});

// Delete user (soft delete)
router.delete('/:id', async (req: any, res: any) => {
  try {
    const id = req.params.id;
    await deleteUserById(id);
    res.status(200).json('User deleted successfully');
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
router.get('/test', async (req: any, res: any) => {
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
      take: 10 // Just first 10 users
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    res.json({
      success: true,
      count: users.length,
      users: users,
      message: 'Database connection successful'
    });
  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database connection failed'
    });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your app password
  }
});


// Send QR code via email
router.post('/send-qr-email', async (req:any, res:any) => {
  try {
    const { email, name, userId, qrCode, qrCodeImage, userType } = req.body;

    // Validate required fields
    if (!email || !qrCodeImage) {
      return res.status(400).json({ error: 'Email and QR code image are required' });
    }

    // Convert base64 to buffer for email attachment
    const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your QR Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name || 'User'}!</h2>
          <p>Here's your QR code:</p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="cid:qrcode" alt="QR Code" style="max-width: 200px;" />
          </div>
          <p><strong>User ID:</strong> ${userId || 'N/A'}</p>
          <p><strong>User Type:</strong> ${userType || 'N/A'}</p>
          <p><strong>QR Data:</strong> ${qrCode || 'N/A'}</p>
          <p>Please keep this QR code safe and secure.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          cid: 'qrcode' // Referenced in HTML as cid:qrcode
        }
      ]
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    console.log(`QR code email sent successfully to ${email}`);
    res.status(200).json({ 
      message: 'QR code sent successfully',
      recipient: email 
    });

  } catch (error:any) {
    console.error('Email sending error:', error);
    
    // More specific error handling
    if (error.code === 'EAUTH') {
      res.status(500).json({ error: 'Email authentication failed' });
    } else if (error.code === 'ENOTFOUND') {
      res.status(500).json({ error: 'Email service connection failed' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
});

module.exports = router;