const { Op } = require('sequelize');
const { Brand, BikeModel, Product } = require('../models');
const { ApiError } = require('../utils/ApiError');

async function list({ search, with_models } = {}) {
  const where = {};
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  const include = [];
  if (with_models === 'true' || with_models === true) {
    include.push({ model: BikeModel, as: 'models', separate: true, order: [['name', 'ASC']] });
  }
  return Brand.findAll({ where, include, order: [['name', 'ASC']] });
}

async function getById(id) {
  const brand = await Brand.findByPk(id, {
    include: [{ model: BikeModel, as: 'models', separate: true, order: [['name', 'ASC']] }],
  });
  if (!brand) throw new ApiError(404, 'Brand not found');
  return brand;
}

async function create({ name, logo, notes }) {
  if (!name || !name.trim()) throw new ApiError(400, 'Brand name required');
  const exists = await Brand.findOne({ where: { name: name.trim() } });
  if (exists) throw new ApiError(409, 'Brand already exists');
  return Brand.create({ name: name.trim(), logo: logo || null, notes: notes || null });
}

async function update(id, payload) {
  const brand = await Brand.findByPk(id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  if (payload.name !== undefined) brand.name = payload.name.trim();
  if (payload.logo !== undefined) brand.logo = payload.logo;
  if (payload.notes !== undefined) brand.notes = payload.notes;
  await brand.save();
  return brand;
}

async function remove(id) {
  const brand = await Brand.findByPk(id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  const productCount = await Product.count({ where: { brand_id: id } });
  if (productCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete — ${productCount} product(s) are using this brand. Reassign or delete those first.`
    );
  }
  await brand.destroy();
  return { ok: true };
}

module.exports = { list, getById, create, update, remove };
