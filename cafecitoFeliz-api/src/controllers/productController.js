// src/controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');

function badRequest(details) {
  const err = new Error('Invalid request');
  err.statusCode = 400;
  err.publicError = 'Invalid request';
  err.details = details;
  return err;
}

function notFound(message = 'Not found') {
  const err = new Error(message);
  err.statusCode = 404;
  err.publicError = 'Not found';
  err.publicMessage = message;
  return err;
}

// GET /api/products
async function getProducts(req, res) {
  try {
    const q = (req.query.q ?? '').trim();
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const activeParam = String(req.query.active ?? 'true').toLowerCase(); // default = true

    // Validacion
    const details = [];
    if (!Number.isInteger(page) || page < 1) {
      details.push({ field: 'page', value: req.query.page, message: 'page must be >= 1' });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      details.push({ field: 'limit', value: req.query.limit, message: 'limit must be between 1 and 100' });
    }
    if (!['true', 'false', 'all'].includes(activeParam)) {
      details.push({ field: 'active', value: req.query.active, message: 'active must be true, false or all' });
    }
    if (details.length) {
      return res.status(400).json({ error: 'Invalid query parameters', details });
    }

    const filter = {};

    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }

    if (activeParam !== 'all') {
      filter.active = activeParam === 'true';
    }

    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.json({ data: products, total, page, limit });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

// GET /api/products/:id
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(badRequest([{ field: 'id', message: 'invalid id' }]));
    }

    const product = await Product.findById(id);
    if (!product) return next(notFound('Product not found'));

    return res.json(product);
  } catch (err) {
    return next(err);
  }
}

// POST /api/products
async function createProduct(req, res, next) {
  try {
    const { name, price, stock } = req.body ?? {};
    const details = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      details.push({ field: 'name', message: 'name must be 2..100 chars' });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      details.push({ field: 'price', message: 'price must be > 0' });
    }

    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      details.push({ field: 'stock', message: 'stock must be integer >= 0' });
    }

    if (details.length) {
      const err = new Error('Validation failed');
      err.statusCode = 422;
      err.publicError = 'Validation failed';
      err.details = details;
      return next(err);
    }

    const created = await Product.create({
      name: name.trim(),
      price: priceNum,
      stock: stockNum,
      active: true,
    });

    return res.status(201).json(created);
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/products/:id
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(badRequest([{ field: 'id', message: 'invalid id' }]));
    }

    const { name, price, stock, active } = req.body ?? {};
    const update = {};
    const details = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        details.push({ field: 'name', message: 'name must be 2..100 chars' });
      } else {
        update.name = name.trim();
      }
    }

    if (price !== undefined) {
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        details.push({ field: 'price', message: 'price must be > 0' });
      } else {
        update.price = priceNum;
      }
    }

    if (stock !== undefined) {
      const stockNum = Number(stock);
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        details.push({ field: 'stock', message: 'stock must be integer >= 0' });
      } else {
        update.stock = stockNum;
      }
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        details.push({ field: 'active', message: 'active must be boolean' });
      } else {
        update.active = active;
      }
    }

    if (details.length) {
      const err = new Error('Validation failed');
      err.statusCode = 422;
      err.publicError = 'Validation failed';
      err.details = details;
      return next(err);
    }

    if (Object.keys(update).length === 0) {
      return next(badRequest([{ message: 'No fields to update' }]));
    }

    const updated = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return next(notFound('Product not found'));

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/products/:id/deactivate
async function deactivateProduct(req, res) {
  try {
    const { id } = req.params;

    const updated = await Product.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Not found', message: 'Product not found' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

// PATCH /api/products/:id/activate
async function activateProduct(req, res) {
  try {
    const { id } = req.params;

    const updated = await Product.findByIdAndUpdate(
      id,
      { active: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Not found', message: 'Product not found' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  activateProduct,
};
