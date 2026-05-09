require('dotenv').config();
const sequelize = require('../config/database');
require('../models');
const { ensureDefaultAdmin, ensureDefaultSettings } = require('./bootstrap');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureDefaultAdmin();
    await ensureDefaultSettings();

    console.log('\n✓ Seed complete — admin user + default settings ensured.\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
