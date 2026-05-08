const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

exports.summary = asyncHandler(async (req, res) => {
  res.json(await dashboardService.summary());
});

exports.salesTrend = asyncHandler(async (req, res) => {
  res.json(await dashboardService.salesTrend(req.query));
});

exports.topProducts = asyncHandler(async (req, res) => {
  res.json(await dashboardService.topProducts(req.query));
});

exports.categoryBreakdown = asyncHandler(async (req, res) => {
  res.json(await dashboardService.categoryBreakdown(req.query));
});

exports.recentSales = asyncHandler(async (req, res) => {
  res.json(await dashboardService.recentSales(req.query));
});

exports.profitAnalysis = asyncHandler(async (req, res) => {
  res.json(await dashboardService.profitAnalysis(req.params.product_id));
});
