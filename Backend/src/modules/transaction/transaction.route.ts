import express from 'express';
import { createTransaction } from './transaction.service';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, items, totalAmount } = req.body;
    const result = await createTransaction(userId, items, totalAmount);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Transaction error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
