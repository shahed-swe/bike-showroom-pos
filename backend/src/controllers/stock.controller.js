const stockService = require('../services/stock.service');
const asyncHandler = require('../utils/asyncHandler');

exports.listBatches = asyncHandler(async (req, res) => {
  const batches = await stockService.listBatches(req.query);
  res.json(batches);
});

exports.stockIn = asyncHandler(async (req, res) => {
  const batch = await stockService.stockIn(req.body || {});
  res.status(201).json(batch);
});

exports.updateBatch = asyncHandler(async (req, res) => {
  const batch = await stockService.updateBatch(req.params.id, req.body || {});
  res.json(batch);
});

exports.deleteBatch = asyncHandler(async (req, res) => {
  const result = await stockService.deleteBatch(req.params.id);
  res.json(result);
});

exports.priceHistory = asyncHandler(async (req, res) => {
  const rows = await stockService.priceHistory(req.params.product_id);
  res.json(rows);
});

exports.lowStock = asyncHandler(async (req, res) => {
  const rows = await stockService.lowStock();
  res.json(rows);
});
