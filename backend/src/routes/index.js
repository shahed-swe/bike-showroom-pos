const express = require('express');
const auth = require('./auth.routes');
const products = require('./product.routes');
const stock = require('./stock.routes');
const sales = require('./sale.routes');
const customers = require('./customer.routes');
const suppliers = require('./supplier.routes');
const brands = require('./brand.routes');
const models = require('./bikeModel.routes');
const dashboard = require('./dashboard.routes');

const router = express.Router();

router.get('/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

router.use('/auth', auth);
router.use('/products', products);
router.use('/stock', stock);
router.use('/sales', sales);
router.use('/customers', customers);
router.use('/suppliers', suppliers);
router.use('/brands', brands);
router.use('/models', models);
router.use('/dashboard', dashboard);

module.exports = router;
