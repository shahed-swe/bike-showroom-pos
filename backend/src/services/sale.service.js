const { Op } = require('sequelize');
const {
  sequelize,
  Sale,
  SaleItem,
  SaleItemBatch,
  StockBatch,
  Product,
  Customer,
  User,
  Setting,
} = require('../models');
const { ApiError } = require('../utils/ApiError');

async function generateInvoiceNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const last = await Sale.findOne({
    where: { invoice_number: { [Op.like]: `INV-${ymd}-%` } },
    order: [['id', 'DESC']],
  });
  let n = 1;
  if (last) {
    const m = last.invoice_number.match(/-(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `INV-${ymd}-${String(n).padStart(4, '0')}`;
}

async function getShopSettings() {
  const rows = await Setting.findAll();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

async function list({ from, to, customer_id, search, limit = 100 } = {}) {
  const where = {};
  if (from) where.created_at = { ...(where.created_at || {}), [Op.gte]: new Date(from) };
  if (to) where.created_at = { ...(where.created_at || {}), [Op.lte]: new Date(to) };
  if (customer_id) where.customer_id = customer_id;
  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { invoice_number: { [Op.iLike]: term } },
      { customer_name: { [Op.iLike]: term } },
      { customer_phone: { [Op.iLike]: term } },
    ];
  }
  const sales = await Sale.findAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'username'] },
    ],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
  });
  return sales.map((s) => {
    const o = s.toJSON();
    o.customer_full_name = o.customer ? o.customer.name : null;
    o.created_by_name = o.creator ? o.creator.username : null;
    return o;
  });
}

async function getById(id) {
  const sale = await Sale.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: User, as: 'creator', attributes: ['id', 'username'] },
      {
        model: SaleItem,
        as: 'items',
        include: [
          {
            model: SaleItemBatch,
            as: 'batch_draws',
            include: [{ model: StockBatch, as: 'batch', attributes: ['id', 'received_at'] }],
          },
        ],
      },
    ],
  });
  if (!sale) throw new ApiError(404, 'Sale not found');
  const o = sale.toJSON();
  o.customer_full_name = o.customer ? o.customer.name : null;
  o.customer_phone_full = o.customer ? o.customer.phone : null;
  o.customer_address = o.customer ? o.customer.address : null;
  o.created_by_name = o.creator ? o.creator.username : null;
  o.items = o.items.map((it) => ({
    ...it,
    batches: it.batch_draws.map((bd) => ({
      ...bd,
      batch_received_at: bd.batch ? bd.batch.received_at : null,
    })),
  }));
  o.shop = await getShopSettings();
  return o;
}

async function create(payload, userId) {
  const {
    customer_id,
    customer_name,
    customer_phone,
    items,
    discount = 0,
    tax = 0,
    payment_method = 'cash',
    payment_status = 'paid',
    notes,
  } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one item required');
  }
  for (const it of items) {
    if (!it.product_id || !it.quantity || it.quantity <= 0 || it.unit_price === undefined) {
      throw new ApiError(400, 'Each item needs product_id, quantity, unit_price');
    }
  }

  return sequelize.transaction(async (t) => {
    const invoice_number = await generateInvoiceNumber();
    const sale = await Sale.create(
      {
        invoice_number,
        customer_id: customer_id || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        subtotal: 0,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        total: 0,
        total_cost: 0,
        profit: 0,
        payment_method,
        payment_status,
        notes: notes || null,
        created_by: userId || null,
      },
      { transaction: t }
    );

    let subtotal = 0;
    let totalCost = 0;

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) throw new ApiError(404, `Product ${item.product_id} not found`);

      const batches = await StockBatch.findAll({
        where: { product_id: item.product_id, quantity_remaining: { [Op.gt]: 0 } },
        order: [
          ['received_at', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction: t,
        lock: t.LOCK ? t.LOCK.UPDATE : undefined,
      });

      const totalAvailable = batches.reduce((s, b) => s + b.quantity_remaining, 0);
      if (totalAvailable < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${totalAvailable}`);
      }

      let qtyNeeded = Number(item.quantity);
      const itemUnitPrice = Number(item.unit_price);
      const itemTotalPrice = itemUnitPrice * qtyNeeded;
      let itemTotalCost = 0;
      const drawnBatches = [];

      for (const batch of batches) {
        if (qtyNeeded <= 0) break;
        const drawn = Math.min(qtyNeeded, batch.quantity_remaining);
        itemTotalCost += drawn * Number(batch.purchase_price);
        drawnBatches.push({
          batch_id: batch.id,
          quantity: drawn,
          cost_per_unit: Number(batch.purchase_price),
        });
        batch.quantity_remaining -= drawn;
        await batch.save({ transaction: t });
        qtyNeeded -= drawn;
      }

      const itemProfit = itemTotalPrice - itemTotalCost;

      const saleItem = await SaleItem.create(
        {
          sale_id: sale.id,
          product_id: item.product_id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_price: itemUnitPrice,
          total_price: itemTotalPrice,
          total_cost: itemTotalCost,
          profit: itemProfit,
        },
        { transaction: t }
      );

      for (const drawn of drawnBatches) {
        await SaleItemBatch.create(
          {
            sale_item_id: saleItem.id,
            batch_id: drawn.batch_id,
            quantity: drawn.quantity,
            cost_per_unit: drawn.cost_per_unit,
          },
          { transaction: t }
        );
      }

      subtotal += itemTotalPrice;
      totalCost += itemTotalCost;
    }

    const total = subtotal - Number(discount || 0) + Number(tax || 0);
    const profit = total - totalCost;

    sale.subtotal = subtotal;
    sale.total = total;
    sale.total_cost = totalCost;
    sale.profit = profit;
    await sale.save({ transaction: t });

    return sale.id;
  }).then((id) => getById(id));
}

async function remove(id, userRole) {
  if (userRole !== 'admin') throw new ApiError(403, 'Only admin can delete a sale');
  const sale = await Sale.findByPk(id, {
    include: [{ model: SaleItem, as: 'items', include: [{ model: SaleItemBatch, as: 'batch_draws' }] }],
  });
  if (!sale) throw new ApiError(404, 'Sale not found');

  await sequelize.transaction(async (t) => {
    for (const item of sale.items) {
      for (const draw of item.batch_draws) {
        const batch = await StockBatch.findByPk(draw.batch_id, { transaction: t });
        if (batch) {
          batch.quantity_remaining += draw.quantity;
          await batch.save({ transaction: t });
        }
      }
    }
    await sale.destroy({ transaction: t });
  });
  return { ok: true };
}

module.exports = { list, getById, create, remove };
