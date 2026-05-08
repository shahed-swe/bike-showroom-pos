const bikeModelService = require('../services/bikeModel.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  res.json(await bikeModelService.list(req.query));
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await bikeModelService.create(req.body || {}));
});

exports.update = asyncHandler(async (req, res) => {
  res.json(await bikeModelService.update(req.params.id, req.body || {}));
});

exports.remove = asyncHandler(async (req, res) => {
  res.json(await bikeModelService.remove(req.params.id));
});
