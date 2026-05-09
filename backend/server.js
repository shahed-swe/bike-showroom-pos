require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const sequelize = require('./src/config/database');
require('./src/models'); // load models + associations
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { ensureDefaultAdmin, ensureDefaultSettings } = require('./src/scripts/bootstrap');

const app = express();
const PORT = process.env.PORT || 8088;

// Ensure folders exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
['products', 'receipts'].forEach((sub) => {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api', routes);

app.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connection established');

    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✓ Database synchronized');

    await ensureDefaultAdmin();
    await ensureDefaultSettings();

    app.listen(PORT, () => {
      console.log(`\n🏍️  Bike Showroom API running on http://localhost:${PORT}`);
      console.log(`📁 Uploads served from /uploads`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
