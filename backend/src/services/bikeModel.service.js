const { Op } = require('sequelize');
const { BikeModel, Brand, Product } = require('../models');
const { ApiError } = require('../utils/ApiError');

async function list({ brand_id, search } = {}) {
  const where = {};
  if (brand_id) where.brand_id = brand_id;
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  return BikeModel.findAll({
    where,
    include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
  });
}

async function create({ brand_id, name, notes }) {
  if (!brand_id) throw new ApiError(400, 'brand_id required');
  if (!name || !name.trim()) throw new ApiError(400, 'Model name required');
  const brand = await Brand.findByPk(brand_id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  const exists = await BikeModel.findOne({
    where: { brand_id, name: name.trim() },
  });
  if (exists) throw new ApiError(409, 'Model already exists for this brand');
  return BikeModel.create({ brand_id, name: name.trim(), notes: notes || null });
}

async function update(id, payload) {
  const model = await BikeModel.findByPk(id);
  if (!model) throw new ApiError(404, 'Model not found');
  if (payload.name !== undefined) model.name = payload.name.trim();
  if (payload.brand_id !== undefined) {
    const brand = await Brand.findByPk(payload.brand_id);
    if (!brand) throw new ApiError(404, 'Brand not found');
    model.brand_id = payload.brand_id;
  }
  if (payload.notes !== undefined) model.notes = payload.notes;
  await model.save();
  return model;
}

async function remove(id) {
  const model = await BikeModel.findByPk(id);
  if (!model) throw new ApiError(404, 'Model not found');
  const productCount = await Product.count({ where: { model_id: id } });
  if (productCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete — ${productCount} product(s) are using this model. Reassign or delete those first.`
    );
  }
  await model.destroy();
  return { ok: true };
}

module.exports = { list, create, update, remove };
