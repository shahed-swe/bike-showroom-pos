const express = require('express');
const ctrl = require('../controllers/stock.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/batches', ctrl.listBatches);
router.post('/in', ctrl.stockIn);
router.put('/batches/:id', ctrl.updateBatch);
router.delete('/batches/:id', ctrl.deleteBatch);
router.get('/price-history/:product_id', ctrl.priceHistory);
router.get('/low-stock', ctrl.lowStock);

module.exports = router;
