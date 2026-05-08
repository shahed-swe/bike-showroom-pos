const express = require('express');
const ctrl = require('../controllers/sale.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
