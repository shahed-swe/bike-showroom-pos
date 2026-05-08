const { Op } = require('sequelize');
const { Supplier } = require('../models');
const { ApiError } = require('../utils/ApiError');

async function list({ search } = {}) {
  const where = {};
  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
    ];
  }
  return Supplier.findAll({ where, order: [['name', 'ASC']] });
}

async function create(payload) {
  if (!payload.name) throw new ApiError(400, 'Name required');
  return Supplier.create({
    name: payload.name,
    phone: payload.phone || null,
    email: payload.email || null,
    address: payload.address || null,
    notes: payload.notes || null,
  });
}

async function update(id, payload) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  ['name', 'phone', 'email', 'address', 'notes'].forEach((f) => {
    if (payload[f] !== undefined) supplier[f] = payload[f];
  });
  await supplier.save();
  return supplier;
}

async function remove(id) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  await supplier.destroy();
  return { ok: true };
}

module.exports = { list, create, update, remove };
