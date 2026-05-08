const saleService = require('../services/sale.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const sales = await saleService.list(req.query);
  res.json(sales);
});

exports.getById = asyncHandler(async (req, res) => {
  const sale = await saleService.getById(req.params.id);
  res.json(sale);
});

exports.create = asyncHandler(async (req, res) => {
  const sale = await saleService.create(req.body || {}, req.user.id);
  res.status(201).json(sale);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await saleService.remove(req.params.id, req.user.role);
  res.json(result);
});
