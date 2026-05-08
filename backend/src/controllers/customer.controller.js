const customerService = require('../services/customer.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const customers = await customerService.list(req.query);
  res.json(customers);
});

exports.getById = asyncHandler(async (req, res) => {
  const customer = await customerService.getById(req.params.id);
  res.json(customer);
});

exports.create = asyncHandler(async (req, res) => {
  const customer = await customerService.create(req.body || {});
  res.status(201).json(customer);
});

exports.update = asyncHandler(async (req, res) => {
  const customer = await customerService.update(req.params.id, req.body || {});
  res.json(customer);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await customerService.remove(req.params.id);
  res.json(result);
});
