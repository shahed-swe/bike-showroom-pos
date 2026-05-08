const { Op, fn, col, literal } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { Product, StockBatch, Brand, BikeModel, SaleItem } = require('../models');
const { ApiError } = require('../utils/ApiError');

const includeBrandModel = [
  { model: Brand, as: 'brand', attributes: ['id', 'name'] },
  { model: BikeModel, as: 'model', attributes: ['id', 'name', 'brand_id'] },
];

async function generateSku(category) {
  const prefix = category === 'bike' ? 'BK' : 'PT';
  const last = await Product.findOne({
    where: { sku: { [Op.like]: `${prefix}-%` } },
    order: [['id', 'DESC']],
  });
  let n = 1;
  if (last && last.sku) {
    const m = last.sku.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

async function attachStockSummary(product) {
  const batches = await StockBatch.findAll({
    where: { product_id: product.id },
    attributes: [
      [fn('COALESCE', fn('SUM', col('quantity_remaining')), 0), 'total_stock'],
      [
        fn('COALESCE', fn('SUM', literal('quantity_remaining * purchase_price')), 0),
        'stock_value',
      ],
    ],
    raw: true,
  });
  const obj = product.toJSON();
  obj.total_stock = Number(batches[0]?.total_stock || 0);
  obj.stock_value = Number(batches[0]?.stock_value || 0);
  return obj;
}

async function list({ search, category, low_stock, brand_id, model_id } = {}) {
  const where = { is_active: true };
  if (category) where.category = category;
  if (brand_id) where.brand_id = brand_id;
  if (model_id) where.model_id = model_id;
  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { sku: { [Op.iLike]: term } },
    ];
  }
  const products = await Product.findAll({
    where,
    include: includeBrandModel,
    order: [['created_at', 'DESC']],
  });
  let withStock = await Promise.all(products.map((p) => attachStockSummary(p)));
  if (low_stock === 'true' || low_stock === true) {
    withStock = withStock.filter((p) => p.total_stock <= p.low_stock_threshold);
  }
  return withStock;
}

async function getById(id) {
  const product = await Product.findByPk(id, {
    include: [
      ...includeBrandModel,
      {
        model: StockBatch,
        as: 'batches',
        include: [{ association: 'supplier' }],
      },
    ],
  });
  if (!product) throw new ApiError(404, 'Product not found');
  const withStock = await attachStockSummary(product);
  withStock.batches = (product.batches || [])
    .sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
    .map((b) => {
      const obj = b.toJSON();
      obj.supplier_name = b.supplier ? b.supplier.name : null;
      return obj;
    });
  return withStock;
}

function normaliseFK(payload, field) {
  if (payload[field] === '' || payload[field] === undefined || payload[field] === null) return null;
  const n = Number(payload[field]);
  return Number.isFinite(n) ? n : null;
}

async function validateBrandModel(brand_id, model_id) {
  if (brand_id) {
    const brand = await Brand.findByPk(brand_id);
    if (!brand) throw new ApiError(400, 'Selected brand not found');
  }
  if (model_id) {
    const model = await BikeModel.findByPk(model_id);
    if (!model) throw new ApiError(400, 'Selected model not found');
    if (brand_id && model.brand_id !== Number(brand_id)) {
      throw new ApiError(400, 'Selected model does not belong to chosen brand');
    }
  }
}

async function create(payload, imagePath) {
  const { name, category, description, unit, current_selling_price, low_stock_threshold, sku } = payload;
  if (!name || !category) throw new ApiError(400, 'Name and category required');
  if (!['bike', 'part'].includes(category)) {
    throw new ApiError(400, 'Category must be bike or part');
  }

  const brand_id = normaliseFK(payload, 'brand_id');
  const model_id = normaliseFK(payload, 'model_id');
  await validateBrandModel(brand_id, model_id);

  const finalSku = sku && sku.trim() ? sku.trim() : await generateSku(category);
  const exists = await Product.findOne({ where: { sku: finalSku } });
  if (exists) throw new ApiError(409, 'SKU already exists');

  const product = await Product.create({
    sku: finalSku,
    name,
    category,
    brand_id,
    model_id,
    description: description || null,
    image: imagePath || null,
    unit: unit || 'pcs',
    current_selling_price: Number(current_selling_price) || 0,
    low_stock_threshold: Number(low_stock_threshold) || 5,
  });
  return getById(product.id);
}

async function update(id, payload, imagePath) {
  const product = await Product.findByPk(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (imagePath && product.image) {
    const oldPath = path.join(__dirname, '..', '..', product.image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const fields = ['name', 'category', 'description', 'unit'];
  fields.forEach((f) => {
    if (payload[f] !== undefined) product[f] = payload[f];
  });

  if (payload.brand_id !== undefined) product.brand_id = normaliseFK(payload, 'brand_id');
  if (payload.model_id !== undefined) product.model_id = normaliseFK(payload, 'model_id');
  await validateBrandModel(product.brand_id, product.model_id);

  if (payload.current_selling_price !== undefined) product.current_selling_price = Number(payload.current_selling_price);
  if (payload.low_stock_threshold !== undefined) product.low_stock_threshold = Number(payload.low_stock_threshold);
  if (imagePath) product.image = imagePath;
  await product.save();
  return getById(product.id);
}

async function remove(id) {
  const product = await Product.findByPk(id);
  if (!product) throw new ApiError(404, 'Product not found');

  const sold = await SaleItem.count({ where: { product_id: id } });
  if (sold > 0) {
    product.is_active = false;
    await product.save();
    return { ok: true, soft_deleted: true };
  }

  if (product.image) {
    const p = path.join(__dirname, '..', '..', product.image);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  await product.destroy();
  return { ok: true };
}

module.exports = { list, getById, create, update, remove };
