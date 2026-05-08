require('dotenv').config();
const sequelize = require('../config/database');
require('../models');
const { ensureDefaultAdmin, ensureDefaultSettings } = require('./bootstrap');

(async () => {
  try {
    await sequelize.authenticate();
    const force = process.argv.includes('--force');
    await sequelize.sync({ force, alter: !force });
    await ensureDefaultAdmin();
    await ensureDefaultSettings();
    console.log(force ? '✓ Database reset & synced' : '✓ Database synced (alter)');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
})();
