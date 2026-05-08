const supplierService = require('../services/supplier.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const suppliers = await supplierService.list(req.query);
  res.json(suppliers);
});

exports.create = asyncHandler(async (req, res) => {
  const supplier = await supplierService.create(req.body || {});
  res.status(201).json(supplier);
});

exports.update = asyncHandler(async (req, res) => {
  const supplier = await supplierService.update(req.params.id, req.body || {});
  res.json(supplier);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await supplierService.remove(req.params.id);
  res.json(result);
});
