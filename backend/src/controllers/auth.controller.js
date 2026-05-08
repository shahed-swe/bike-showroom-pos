const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  const data = await authService.login(username, password);
  res.json(data);
});

exports.register = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admin can create users');
  }
  const user = await authService.register(req.body || {});
  res.status(201).json(user);
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json(user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body || {};
  const result = await authService.changePassword(req.user.id, current_password, new_password);
  res.json(result);
});
