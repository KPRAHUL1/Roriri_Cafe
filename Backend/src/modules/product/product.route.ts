import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProductById,
  deleteProductById,
  updateProductStock
} from './product.service';

const express = require('express');
const router = express.Router();

router.get('/', async (req:any, res:any) => {
  try {
    const response = await getAllProducts();
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req:any, res:any) => {
  try {
    const response = await getProductById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', async (req:any, res:any) => {
  try {
    const payload = req.body;
    const response = await createProduct(payload);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req:any, res:any) => {
  try {
    const payload = req.body;
    const id = req.params.id;
    const response = await updateProductById(id, payload);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.patch('/:id/stock', async (req:any, res:any) => {
  try {
    const { stock, reason } = req.body;
    const id = req.params.id;
    const response = await updateProductStock(id, stock, reason);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

router.delete('/:id', async (req:any, res:any) => {
  try {
    const id = req.params.id;
    await deleteProductById(id);
    res.status(200).json('Product deleted successfully');
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;