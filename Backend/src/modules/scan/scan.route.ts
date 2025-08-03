// routes/scan.routes.js
import express from 'express';
import { scanQRCode } from './scan.service';

const router = express.Router();

// POST /api/scan (matches your frontend)
router.post('/scan', async (req:any, res:any) => {
  const { qrCode } = req.body;
  
  try {
    const userData = await scanQRCode(qrCode);
    res.json({ success: true, data: userData });
  } catch (error:any) {
    console.error('QR Scan Error:', error.message);
    const statusCode = error.message === 'User not found' ? 404 : 400;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET fallback for manual entry
router.get('/user/:identifier', async (req, res) => {
  const { identifier } = req.params;
  
  try {
    const userData = await scanQRCode(identifier);
    res.json({ success: true, data: userData });
  } catch (error:any) {
    console.error('User lookup Error:', error.message);
    res.status(404).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;