const brandService = require('../services/brand.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  res.json(await brandService.list(req.query));
});

exports.getById = asyncHandler(async (req, res) => {
  res.json(await brandService.getById(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await brandService.create(req.body || {}));
});

exports.update = asyncHandler(async (req, res) => {
  res.json(await brandService.update(req.params.id, req.body || {}));
});

exports.remove = asyncHandler(async (req, res) => {
  res.json(await brandService.remove(req.params.id));
});
