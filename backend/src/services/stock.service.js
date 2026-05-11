const { fn, col, literal } = require('sequelize');
const { sequelize, StockBatch, Product, Supplier } = require('../models');
const { ApiError } = require('../utils/ApiError');

async function listBatches({ product_id } = {}) {
  const where = {};
  if (product_id) where.product_id = product_id;
  const batches = await StockBatch.findAll({
    where,
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category'] },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
    ],
    order: [['received_at', 'DESC']],
    limit: 500,
  });
  return batches.map((b) => {
    const o = b.toJSON();
    o.product_name = o.product ? o.product.name : null;
    o.sku = o.product ? o.product.sku : null;
    o.category = o.product ? o.product.category : null;
    o.supplier_name = o.supplier ? o.supplier.name : null;
    return o;
  });
}

async function stockIn({
  product_id,
  supplier_id,
  purchase_price,
  selling_price,
  quantity,
  notes,
  received_at,
}) {
  if (!product_id || purchase_price === undefined || selling_price === undefined || !quantity) {
    throw new ApiError(400, 'product_id, purchase_price, selling_price and quantity required');
  }
  if (Number(quantity) <= 0) throw new ApiError(400, 'Quantity must be > 0');
  if (Number(purchase_price) < 0 || Number(selling_price) < 0) {
    throw new ApiError(400, 'Prices must be non-negative');
  }

  const product = await Product.findByPk(product_id);
  if (!product) throw new ApiError(404, 'Product not found');

  return sequelize.transaction(async (t) => {
    const batch = await StockBatch.create(
      {
        product_id,
        supplier_id: supplier_id || null,
        purchase_price: Number(purchase_price),
        selling_price: Number(selling_price),
        quantity_added: Number(quantity),
        quantity_remaining: Number(quantity),
        notes: notes || null,
        received_at: received_at ? new Date(received_at) : new Date(),
      },
      { transaction: t }
    );

    product.current_selling_price = Number(selling_price);
    await product.save({ transaction: t });

    return batch;
  });
}

async function updateBatch(id, payload) {
  const batch = await StockBatch.findByPk(id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (payload.purchase_price !== undefined) batch.purchase_price = Number(payload.purchase_price);
  if (payload.selling_price !== undefined) batch.selling_price = Number(payload.selling_price);
  if (payload.notes !== undefined) batch.notes = payload.notes;
  if (payload.supplier_id !== undefined) batch.supplier_id = payload.supplier_id || null;

  // Allow changing the recorded quantity — useful when a quantity was entered by mistake.
  // We can only safely change quantity_added by a delta that doesn't push quantity_remaining
  // below zero (i.e. we can't "remove" units that have already been sold).
  if (payload.quantity_added !== undefined) {
    const newAdded = Number(payload.quantity_added);
    if (!Number.isFinite(newAdded) || newAdded <= 0) {
      throw new ApiError(400, 'quantity_added must be a positive number');
    }
    const sold = batch.quantity_added - batch.quantity_remaining;
    if (newAdded < sold) {
      throw new ApiError(
        400,
        `Cannot reduce quantity below already-sold units (${sold} sold from this batch)`
      );
    }
    const delta = newAdded - batch.quantity_added;
    batch.quantity_added = newAdded;
    batch.quantity_remaining = batch.quantity_remaining + delta;
  }

  await batch.save();
  return batch;
}

async function deleteBatch(id) {
  const batch = await StockBatch.findByPk(id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (batch.quantity_added !== batch.quantity_remaining) {
    throw new ApiError(400, 'Cannot delete batch — some units have already been sold');
  }
  await batch.destroy();
  return { ok: true };
}

async function priceHistory(product_id) {
  return StockBatch.findAll({
    where: { product_id },
    attributes: ['id', 'purchase_price', 'selling_price', 'quantity_added', 'quantity_remaining', 'received_at', 'notes'],
    order: [['received_at', 'ASC']],
  });
}

async function lowStock() {
  const products = await Product.findAll({
    where: { is_active: true },
    include: [{ model: StockBatch, as: 'batches', attributes: [] }],
    attributes: {
      include: [
        [fn('COALESCE', fn('SUM', col('batches.quantity_remaining')), 0), 'total_stock'],
      ],
    },
    group: ['Product.id'],
    having: literal('COALESCE(SUM("batches"."quantity_remaining"), 0) <= "Product"."low_stock_threshold"'),
    order: [[literal('total_stock'), 'ASC']],
    subQuery: false,
  });
  return products.map((p) => {
    const o = p.toJSON();
    o.total_stock = Number(o.total_stock || 0);
    return o;
  });
}

module.exports = { listBatches, stockIn, updateBatch, deleteBatch, priceHistory, lowStock };
