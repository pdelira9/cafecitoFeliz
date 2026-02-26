const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const { httpError } = require('../utils/httpError');

function validatePagination(page, limit) {
  const details = [];
  if (!Number.isInteger(page) || page < 1) {
    details.push({ field: "page", value: page, message: "page must be >= 1" });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    details.push({
      field: "limit",
      value: limit,
      message: "limit must be between 1 and 100",
    });
  }
  return details;
}

// GET /api/customers

async function listCustomers(req, res, next) {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const activeQ = String(req.query.active ?? "true").trim();

    const details = validatePagination(page, limit);

    const allowedActive = ["all", "true", "false"];
    if (!allowedActive.includes(activeQ)) {
      details.push({
        field: "active",
        value: activeQ,
        message: "active must be all, true, or false",
      });
    }

    if (details.length) {
      return res
        .status(400)
        .json({ error: "Invalid query parameters", details });
    }

    const filter = {};

    if (activeQ === "false") {
      filter.active = false;
    } else if (activeQ === "true") {
      filter.$or = [{ active: true }, { active: { $exists: false } }];
    }

    // Buscamos
    if (q) {
      const searchOr = [
        { name: { $regex: q, $options: "i" } },
        { phoneOrEmail: { $regex: q, $options: "i" } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const skip = (page - 1) * limit;

    const [total, customers] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.json({ data: customers, total, page, limit });
  } catch (err) {
    console.error("listCustomers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/customers

async function createCustomer(req, res) {
  try {
    const { name, phoneOrEmail } = req.body ?? {};

    const details = [];
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      details.push({
        field: "name",
        message: "name is required (min 2 chars)",
      });
    }
    if (
      !phoneOrEmail ||
      typeof phoneOrEmail !== "string" ||
      phoneOrEmail.trim().length < 3
    ) {
      details.push({
        field: "phoneOrEmail",
        message: "phoneOrEmail is required (min 3 chars)",
      });
    }
    if (details.length) {
      return res.status(422).json({ error: "Validation failed", details });
    }

    const contact = phoneOrEmail.trim().toLowerCase();

    const existing = await Customer.findOne({ phoneOrEmail: contact });
    if (existing) {
      return res.status(409).json({ error: "Customer already exists" });
    }

    const created = await Customer.create({
      name: name.trim(),
      phoneOrEmail: contact,
      active: true,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("createCustomer error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/customers/:id

async function updateCustomer(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: "Customer not found", id });
    }

    const { name, phoneOrEmail } = req.body ?? {};

    const update = {};
    const details = [];

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 80
      ) {
        details.push({
          field: "name",
          message: "name must be between 2 and 80 characters",
        });
      } else {
        update.name = name.trim();
      }
    }

    if (phoneOrEmail !== undefined) {
      if (
        typeof phoneOrEmail !== "string" ||
        phoneOrEmail.trim().length < 3 ||
        phoneOrEmail.trim().length > 120
      ) {
        details.push({
          field: "phoneOrEmail",
          message: "phoneOrEmail must be between 3 and 120 characters",
        });
      } else {
        update.phoneOrEmail = phoneOrEmail.trim().toLowerCase();
      }
    }

    if (details.length) {
      return res.status(422).json({ error: "Validation failed", details });
    }

    if (update.phoneOrEmail) {
      const exists = await Customer.findOne({
        _id: { $ne: id },
        phoneOrEmail: update.phoneOrEmail,
      });
      if (exists) {
        return res.status(409).json({ error: "Customer already exists" });
      }
    }

    const updated = await Customer.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Customer not found", id });
    }

    return res.json(updated);
  } catch (err) {
    console.error("updateCustomer error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/customers/:id/active

async function setCustomerActive(req, res) {
  try {
    const { id } = req.params;
    const active = req.body?.active;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: "Customer not found", id });
    }

    if (typeof active !== "boolean") {
      return res.status(422).json({
        error: "Validation failed",
        details: [{ field: "active", message: "active must be boolean" }],
      });
    }

    const updated = await Customer.findByIdAndUpdate(
      id,
      { active },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "Customer not found", id });
    }

    return res.json(updated);
  } catch (err) {
    console.error("setCustomerActive error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  setCustomerActive,
};
