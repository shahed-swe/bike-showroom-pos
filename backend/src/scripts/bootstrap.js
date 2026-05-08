const { User, Setting } = require('../models');

async function ensureDefaultAdmin() {
  const count = await User.count();
  if (count === 0) {
    await User.create({
      username: 'admin',
      password_hash: 'admin123',
      full_name: 'Shop Owner',
      role: 'admin',
    });
    console.log('✓ Default admin created (username: admin, password: admin123)');
  }
}

async function ensureDefaultSettings() {
  const defaults = {
    shop_name: 'Habib Bike Showroom',
    shop_address: 'Bangladesh',
    shop_phone: '',
    currency: 'BDT',
    tax_rate: '0',
    receipt_footer: 'Thank you for your purchase!',
  };
  for (const [key, value] of Object.entries(defaults)) {
    await Setting.findOrCreate({ where: { key }, defaults: { value } });
  }
}

module.exports = { ensureDefaultAdmin, ensureDefaultSettings };
