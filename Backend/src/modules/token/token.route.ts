import express from 'express';
import { createToken } from './token.service';

const router = express.Router();

// routes/token.routes.ts or token.controller.ts
router.post('/', async (req, res) => {
  try {
    const result = await createToken(req.body); // This function should also handle email
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error("Token Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
