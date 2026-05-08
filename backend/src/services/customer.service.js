const { Op, fn, col, literal } = require('sequelize');
const { Customer, Sale } = require('../models');
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
  const customers = await Customer.findAll({
    where,
    attributes: {
      include: [
        [
          literal(
            '(SELECT COUNT(*) FROM sales WHERE sales.customer_id = "Customer".id)'
          ),
          'total_purchases',
        ],
        [
          literal(
            '(SELECT COALESCE(SUM(total),0) FROM sales WHERE sales.customer_id = "Customer".id)'
          ),
          'total_spent',
        ],
      ],
    },
    order: [['created_at', 'DESC']],
  });
  return customers.map((c) => {
    const o = c.toJSON();
    o.total_purchases = Number(o.total_purchases || 0);
    o.total_spent = Number(o.total_spent || 0);
    return o;
  });
}

async function getById(id) {
  const customer = await Customer.findByPk(id, {
    include: [{ model: Sale, as: 'sales', order: [['created_at', 'DESC']] }],
  });
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
}

async function create(payload) {
  if (!payload.name) throw new ApiError(400, 'Name required');
  return Customer.create({
    name: payload.name,
    phone: payload.phone || null,
    email: payload.email || null,
    address: payload.address || null,
    notes: payload.notes || null,
  });
}

async function update(id, payload) {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  ['name', 'phone', 'email', 'address', 'notes'].forEach((f) => {
    if (payload[f] !== undefined) customer[f] = payload[f];
  });
  await customer.save();
  return customer;
}

async function remove(id) {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  await customer.destroy();
  return { ok: true };
}

module.exports = { list, getById, create, update, remove };
