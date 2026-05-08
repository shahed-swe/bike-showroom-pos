const express = require('express');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', ctrl.login);
router.post('/register', authenticate, ctrl.register);
router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
