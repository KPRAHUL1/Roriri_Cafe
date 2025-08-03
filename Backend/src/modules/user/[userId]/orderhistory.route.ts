import express from 'express';
import { getAllOrderHistories } from './orderHistory.service ';

const router = express.Router();

router.get('/order-history', async (req, res) => {
  try {
    const orders = await getAllOrderHistories();
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Order history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
