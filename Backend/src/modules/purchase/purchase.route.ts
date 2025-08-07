import express from 'express';
import { createPurchase } from './purchase.service';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const result = await createPurchase(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error:any) {
    console.error('Purchase Error:', error.message);
    const statusCode = error.message.includes('Invalid') || error.message.includes('Insufficient')
      ? 400
      : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

module.exports = router;
