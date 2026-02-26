const mongoose = require('mongoose');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const { calculateDiscountPercent } = require('../utils/discount');

 // Genera un folio simple para ticket
 // Ejemplo: CF-20260213-0001
 
function buildSaleId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `CF-${y}${m}${d}-${rand}`;
}


function money(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}


async function rollbackStock(discounted) {
  for (const d of discounted) {
    await Product.updateOne(
      { _id: d.productId },
      { $inc: { stock: d.quantity } }
    );
  }
}

/**
 * POST /api/sales
 *
 * JSON
 * {
 *   customerId: string | null,
 *   paymentMethod: "cash"|"card"|"transfer",
 *   items: [{ productId, quantity }]
 * }

 */
async function createSale(req, res) {
  try {
    const { customerId = null, paymentMethod = 'cash', items } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [
          { field: 'items', message: 'items cannot be empty (minimum 1 item required)' },
        ],
      });
    }

    const allowedMethods = ['cash', 'card', 'transfer'];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [
          { field: 'paymentMethod', message: 'paymentMethod must be one of: cash, card, transfer' },
        ],
      });
    }

    const normalizedItems = [];
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const pid = it?.productId;
      const qty = Number(it?.quantity);

      if (!pid || !mongoose.isValidObjectId(pid)) {
        return res.status(400).json({
          error: 'Product not found',
          details: [{ productId: pid, message: 'Product does not exist' }],
        });
      }

      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(422).json({
          error: 'Validation failed',
          details: [
            {
              field: `items[${idx}].quantity`,
              message: 'quantity must be a positive integer (greater than or equal to 1)',
            },
          ],
        });
      }

      normalizedItems.push({ productId: pid, quantity: qty });
    }


    let customer = null;
    if (customerId !== null) {
      if (!mongoose.isValidObjectId(customerId)) {
        return res.status(404).json({
          error: 'Customer not found',
          details: [{ customerId, message: 'Customer does not exist' }],
        });
      }

      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found',
          details: [{ customerId, message: 'Customer does not exist' }],
        });
      }
    }

    const productIds = normalizedItems.map((i) => i.productId);

    const products = await Product.find({
      _id: { $in: productIds },
      active: true,
    });

    const productsById = new Map(products.map((p) => [String(p._id), p]));

    for (const it of normalizedItems) {
      if (!productsById.has(String(it.productId))) {
        return res.status(404).json({
          error: 'Product not found',
          details: [{ productId: it.productId, message: 'Product does not exist or is inactive' }],
        });
      }
    }

    const saleItems = [];
    for (const it of normalizedItems) {
      const product = productsById.get(String(it.productId));

      const lineTotal = money(it.quantity * Number(product.price));

      saleItems.push({
        productId: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: Number(product.price),
        quantity: it.quantity,
        lineTotal,
      });
    }


    const discounted = [];

    for (const it of saleItems) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: it.productId,
          active: true,
          stock: { $gte: it.quantity },
        },
        { $inc: { stock: -it.quantity } },
        { new: true }
      );

      if (!updated) {
        await rollbackStock(discounted);

        return res.status(409).json({
          error: 'Insufficient stock',
          details: [
            {
              productId: String(it.productId),
              productName: it.productNameSnapshot,
              requested: it.quantity,
              message: 'Insufficient stock to complete the sale',
            },
          ],
        });
      }

      discounted.push({ productId: it.productId, quantity: it.quantity });
    }

    const subtotal = money(saleItems.reduce((sum, i) => sum + i.lineTotal, 0));

    const discountPercent = customer
      ? Number(calculateDiscountPercent(customer.purchasesCount))
      : 0;

    const discountAmount = money(subtotal * (discountPercent / 100));
    const total = money(subtotal - discountAmount);


    const saleId = buildSaleId();

    let created;
    try {
      created = await Sale.create({
        saleId,
        customerId: customer ? customer._id : null,
        paymentMethod,
        items: saleItems,
        subtotal,
        discountPercent,
        discountAmount,
        total,
      });
    } catch (e) {
      await rollbackStock(discounted);
      throw e;
    }

    if (customer) {
      await Customer.updateOne(
        { _id: customer._id },
        { $inc: { purchasesCount: 1 } }
      );
    }

    const ticket = {
      saleId: created.saleId,
      timestamp: created.createdAt,
      storeName: 'Cafecito Feliz',
      items: created.items.map((i) => ({
        name: i.productNameSnapshot,
        qty: i.quantity,
        unitPrice: i.unitPriceSnapshot,
        lineTotal: i.lineTotal,
      })),
      subtotal: created.subtotal,
      discount: `${created.discountPercent}% (-$${money(created.discountAmount).toFixed(2)})`,
      total: created.total,
      paymentMethod: created.paymentMethod,
    };

    return res.status(201).json({
      saleId: created.saleId,
      customerId: created.customerId,
      paymentMethod: created.paymentMethod,
      items: created.items.map((i) => ({
        productId: String(i.productId),
        productName: i.productNameSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPriceSnapshot,
        lineTotal: i.lineTotal,
      })),
      subtotal: created.subtotal,
      discountPercent: created.discountPercent,
      discountAmount: money(created.discountAmount),
      total: money(created.total),
      ticket,
      createdAt: created.createdAt,
    });
  } catch (err) {
    console.error('createSale error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/sales/:saleId

async function getSaleBySaleId(req, res) {
  try {
    const { saleId } = req.params;

    const sale = await Sale.findOne({ saleId });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', id: saleId });
    }

    return res.json(sale);
  } catch (err) {
    console.error('getSaleBySaleId error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

 // PATCH /api/sales/:saleId/cancel
 // { reason: "texto..." }

async function cancelSaleBySaleId(req, res) {
  try {
    const { saleId } = req.params;
    const reason = String(req.body?.reason ?? '').trim();

    // 1) Buscar venta por saleId
    const sale = await Sale.findOne({ saleId });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', id: saleId });
    }

    if (sale.status === 'canceled') {
      return res.status(409).json({
        error: 'Sale already canceled',
        saleId,
        canceledAt: sale.canceledAt,
      });
    }

    sale.status = 'canceled';
    sale.canceledAt = new Date();
    sale.cancelReason = reason;
    await sale.save();

    for (const it of sale.items) {
      await Product.updateOne(
        { _id: it.productId },
        { $inc: { stock: it.quantity } }
      );
    }

    if (sale.customerId) {
      await Customer.updateOne(
        { _id: sale.customerId, purchasesCount: { $gt: 0 } },
        { $inc: { purchasesCount: -1 } }
      );
    }

    return res.json({
      ok: true,
      message: 'Sale canceled and stock restored',
      saleId: sale.saleId,
      status: sale.status,
      canceledAt: sale.canceledAt,
      cancelReason: sale.cancelReason,
    });
  } catch (err) {
    console.error('cancelSaleBySaleId error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


async function listSales(req, res) {
  try {
    const q = String(req.query.q ?? '').trim();
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = String(req.query.status ?? 'all').trim();

    const details = [];
    if (!Number.isInteger(page) || page < 1) {
      details.push({ field: 'page', value: req.query.page, message: 'page must be >= 1' });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      details.push({ field: 'limit', value: req.query.limit, message: 'limit must be between 1 and 100' });
    }
    if (!['completed', 'canceled', 'all'].includes(status)) {
      details.push({ field: 'status', value: status, message: 'status must be completed, canceled, or all' });
    }
    if (details.length) {
      return res.status(400).json({ error: 'Invalid query parameters', details });
    }

    const filter = {};

    if (q) {
      filter.saleId = { $regex: q, $options: 'i' };
    }

    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, sales] = await Promise.all([
      Sale.countDocuments(filter),
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('saleId status total paymentMethod createdAt canceledAt') // resumen
        .lean(),
    ]);

    return res.json({ data: sales, total, page, limit });
  } catch (err) {
    console.error('listSales error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createSale,
  getSaleBySaleId,
  cancelSaleBySaleId,
  listSales,
};
