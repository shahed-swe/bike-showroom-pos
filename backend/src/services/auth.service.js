const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ApiError } = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function login(username, password) {
  if (!username || !password) {
    throw new ApiError(400, 'Username and password required');
  }
  const user = await User.findOne({ where: { username } });
  if (!user || !user.validatePassword(password)) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  return { token, user: user.toSafeJSON() };
}

async function register({ username, password, full_name, role = 'staff' }) {
  if (!username || !password) {
    throw new ApiError(400, 'Username and password required');
  }
  const exists = await User.findOne({ where: { username } });
  if (exists) throw new ApiError(409, 'Username already exists');
  const user = await User.create({
    username,
    password_hash: password,
    full_name,
    role,
  });
  return user.toSafeJSON();
}

async function getMe(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user.toSafeJSON();
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password required');
  }
  const user = await User.findByPk(userId);
  if (!user || !user.validatePassword(currentPassword)) {
    throw new ApiError(401, 'Current password incorrect');
  }
  user.password_hash = newPassword;
  await user.save();
  return { ok: true };
}

module.exports = { login, register, getMe, changePassword, verifyToken, signToken };
