const express = require('express');
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/summary', ctrl.summary);
router.get('/sales-trend', ctrl.salesTrend);
router.get('/top-products', ctrl.topProducts);
router.get('/category-breakdown', ctrl.categoryBreakdown);
router.get('/recent-sales', ctrl.recentSales);
router.get('/profit-analysis/:product_id', ctrl.profitAnalysis);

module.exports = router;
