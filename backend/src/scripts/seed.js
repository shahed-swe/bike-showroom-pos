require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  User,
  Supplier,
  Customer,
  Brand,
  BikeModel,
  Product,
  StockBatch,
  Sale,
  SaleItem,
  SaleItemBatch,
} = require('../models');
const { ensureDefaultAdmin, ensureDefaultSettings } = require('./bootstrap');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return d;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const result = [];
  while (result.length < n && copy.length) {
    result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return result;
};
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedSuppliers() {
  const data = [
    { name: 'Hero Distributor BD', phone: '01711-100100', email: 'hero.bd@example.com', address: 'Tejgaon, Dhaka' },
    { name: 'Honda Bangladesh Ltd', phone: '01811-200200', email: 'honda.bd@example.com', address: 'Gulshan, Dhaka' },
    { name: 'Yamaha Auto BD', phone: '01911-300300', email: 'yamaha.bd@example.com', address: 'Mirpur, Dhaka' },
    { name: 'Universal Parts Ltd', phone: '01711-400400', email: 'universal@example.com', address: 'Bangshal, Old Dhaka' },
    { name: 'Asian Motors', phone: '01811-500500', email: 'asian.motors@example.com', address: 'Chittagong' },
  ];
  const out = {};
  for (const d of data) {
    const [s] = await Supplier.findOrCreate({ where: { name: d.name }, defaults: d });
    out[d.name] = s;
  }
  return out;
}

async function seedBrandsAndModels() {
  const layout = {
    Hero: ['Splendor Plus', 'Glamour', 'Hunk 150R', 'Xtreme 200R'],
    Honda: ['CB Shine', 'X-Blade', 'CBR 150R'],
    Yamaha: ['FZ-S', 'MT-15', 'R15 V3'],
    Bajaj: ['Pulsar 150', 'Pulsar NS200', 'Discover 125'],
    TVS: ['Apache RTR 160', 'Raider 125', 'Sport 100'],
    Suzuki: ['GSX 125', 'Gixxer SF'],
    NGK: [],
    Bosch: [],
    Castrol: [],
    MRF: [],
  };
  const brands = {};
  const models = {};
  for (const [brandName, modelNames] of Object.entries(layout)) {
    const [brand] = await Brand.findOrCreate({ where: { name: brandName } });
    brands[brandName] = brand;
    models[brandName] = {};
    for (const modelName of modelNames) {
      const [m] = await BikeModel.findOrCreate({
        where: { brand_id: brand.id, name: modelName },
      });
      models[brandName][modelName] = m;
    }
  }
  return { brands, models };
}

async function seedProducts(brands, models) {
  const items = [
    // Bikes
    { name: 'Hero Splendor Plus', category: 'bike', brand: 'Hero', model: 'Splendor Plus', price: 125000, threshold: 2 },
    { name: 'Hero Hunk 150R', category: 'bike', brand: 'Hero', model: 'Hunk 150R', price: 165000, threshold: 2 },
    { name: 'Honda CB Shine', category: 'bike', brand: 'Honda', model: 'CB Shine', price: 145000, threshold: 2 },
    { name: 'Honda X-Blade', category: 'bike', brand: 'Honda', model: 'X-Blade', price: 195000, threshold: 2 },
    { name: 'Yamaha FZ-S V3', category: 'bike', brand: 'Yamaha', model: 'FZ-S', price: 280000, threshold: 2 },
    { name: 'Yamaha R15 V3', category: 'bike', brand: 'Yamaha', model: 'R15 V3', price: 525000, threshold: 1 },
    { name: 'Bajaj Pulsar 150', category: 'bike', brand: 'Bajaj', model: 'Pulsar 150', price: 188000, threshold: 2 },
    { name: 'Bajaj Pulsar NS200', category: 'bike', brand: 'Bajaj', model: 'Pulsar NS200', price: 285000, threshold: 2 },
    { name: 'TVS Apache RTR 160', category: 'bike', brand: 'TVS', model: 'Apache RTR 160', price: 215000, threshold: 2 },
    { name: 'Suzuki Gixxer SF', category: 'bike', brand: 'Suzuki', model: 'Gixxer SF', price: 295000, threshold: 1 },

    // Parts
    { name: 'NGK Spark Plug Standard', category: 'part', brand: 'NGK', price: 350, threshold: 15 },
    { name: 'NGK Spark Plug Iridium', category: 'part', brand: 'NGK', price: 850, threshold: 8 },
    { name: 'Castrol Power 1 4T 1L', category: 'part', brand: 'Castrol', price: 750, threshold: 20 },
    { name: 'Castrol Activ 4T 1L', category: 'part', brand: 'Castrol', price: 600, threshold: 20 },
    { name: 'Bosch Headlight Bulb H4', category: 'part', brand: 'Bosch', price: 450, threshold: 10 },
    { name: 'Bosch Battery 12V 9Ah', category: 'part', brand: 'Bosch', price: 4200, threshold: 4 },
    { name: 'MRF Rear Tyre 100/90-17', category: 'part', brand: 'MRF', price: 3800, threshold: 6 },
    { name: 'MRF Front Tyre 90/90-17', category: 'part', brand: 'MRF', price: 3200, threshold: 6 },
    { name: 'Brake Pad Set (Front)', category: 'part', brand: null, price: 850, threshold: 12 },
    { name: 'Chain & Sprocket Kit', category: 'part', brand: null, price: 2400, threshold: 6 },
    { name: 'Air Filter Standard', category: 'part', brand: null, price: 380, threshold: 15 },
    { name: 'Side Mirror Pair', category: 'part', brand: null, price: 480, threshold: 10 },
    { name: 'Clutch Cable', category: 'part', brand: null, price: 220, threshold: 12 },
    { name: 'Brake Cable', category: 'part', brand: null, price: 200, threshold: 12 },
  ];

  const skuCounter = { bike: 0, part: 0 };
  const products = [];

  for (const it of items) {
    const prefix = it.category === 'bike' ? 'BK' : 'PT';
    skuCounter[it.category] += 1;
    const sku = `${prefix}-${String(skuCounter[it.category]).padStart(5, '0')}`;

    const brand = it.brand ? brands[it.brand] : null;
    const model = it.model ? models[it.brand]?.[it.model] : null;

    const [p] = await Product.findOrCreate({
      where: { name: it.name },
      defaults: {
        sku,
        category: it.category,
        brand_id: brand ? brand.id : null,
        model_id: model ? model.id : null,
        current_selling_price: it.price,
        low_stock_threshold: it.threshold,
        unit: 'pcs',
      },
    });
    products.push(p);
  }
  return products;
}

async function seedStockBatches(products, suppliers) {
  const supplierList = Object.values(suppliers);

  for (const product of products) {
    const existing = await StockBatch.count({ where: { product_id: product.id } });
    if (existing > 0) continue;

    const isBike = product.category === 'bike';
    const sellingPrice = Number(product.current_selling_price);
    const numBatches = isBike ? randInt(1, 2) : randInt(1, 3);

    for (let i = 0; i < numBatches; i++) {
      const ageDays = randInt(15, 75) - i * 10;
      const margin = isBike ? 0.18 + Math.random() * 0.08 : 0.35 + Math.random() * 0.25;
      const purchasePrice = Math.round(sellingPrice / (1 + margin));
      const variance = 1 + (Math.random() * 0.06 - 0.03);
      const adjustedPurchase = Math.max(1, Math.round(purchasePrice * variance));
      const qty = isBike ? randInt(2, 5) : randInt(15, 40);

      await StockBatch.create(
        {
          product_id: product.id,
          supplier_id: pick(supplierList).id,
          purchase_price: adjustedPurchase,
          selling_price: sellingPrice,
          quantity_added: qty,
          quantity_remaining: qty,
          received_at: daysAgo(Math.max(1, ageDays)),
          notes: i === 0 ? 'Opening stock' : 'Replenishment',
        },
        {}
      );
    }
  }
}

async function seedCustomers() {
  const data = [
    { name: 'Karim Uddin', phone: '01911-000111', email: 'karim@example.com', address: 'Mirpur, Dhaka' },
    { name: 'Rahim Hossain', phone: '01711-000222', email: 'rahim@example.com', address: 'Dhanmondi, Dhaka' },
    { name: 'Fahim Ahmed', phone: '01811-000333', email: 'fahim@example.com', address: 'Uttara, Dhaka' },
    { name: 'Sayma Akter', phone: '01911-000444', email: 'sayma@example.com', address: 'Gulshan, Dhaka' },
    { name: 'Mohammad Ali', phone: '01711-000555', email: 'ali@example.com', address: 'Khulna' },
    { name: 'Hasan Khan', phone: '01811-000666', email: 'hasan@example.com', address: 'Chittagong' },
    { name: 'Tahmid Rahman', phone: '01911-000777', email: 'tahmid@example.com', address: 'Sylhet' },
    { name: 'Nusrat Jahan', phone: '01711-000888', email: 'nusrat@example.com', address: 'Bashundhara, Dhaka' },
  ];
  const out = [];
  for (const d of data) {
    const [c] = await Customer.findOrCreate({ where: { phone: d.phone }, defaults: d });
    out.push(c);
  }
  return out;
}

async function generateInvoiceNumber(forDate) {
  const ymd = `${forDate.getFullYear()}${String(forDate.getMonth() + 1).padStart(2, '0')}${String(
    forDate.getDate()
  ).padStart(2, '0')}`;
  const last = await Sale.findOne({
    where: { invoice_number: { [Op.like]: `INV-${ymd}-%` } },
    order: [['id', 'DESC']],
  });
  let n = 1;
  if (last) {
    const m = last.invoice_number.match(/-(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `INV-${ymd}-${String(n).padStart(4, '0')}`;
}

async function createBackdatedSale({ items, customer, paymentMethod, createdAt, adminId }) {
  return sequelize.transaction(async (t) => {
    const invoice_number = await generateInvoiceNumber(createdAt);

    const sale = await Sale.create(
      {
        invoice_number,
        customer_id: customer ? customer.id : null,
        customer_name: customer ? customer.name : null,
        customer_phone: customer ? customer.phone : null,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        total_cost: 0,
        profit: 0,
        payment_method: paymentMethod,
        payment_status: 'paid',
        created_by: adminId,
        created_at: createdAt,
        updated_at: createdAt,
      },
      { transaction: t }
    );

    let subtotal = 0;
    let totalCost = 0;
    let acceptedAny = false;

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) continue;

      const batches = await StockBatch.findAll({
        where: {
          product_id: item.product_id,
          quantity_remaining: { [Op.gt]: 0 },
          received_at: { [Op.lte]: createdAt },
        },
        order: [
          ['received_at', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction: t,
      });

      const totalAvailable = batches.reduce((s, b) => s + b.quantity_remaining, 0);
      if (totalAvailable < item.quantity) continue;

      let qtyNeeded = item.quantity;
      const itemUnitPrice = Number(item.unit_price);
      const itemTotalPrice = itemUnitPrice * item.quantity;
      let itemTotalCost = 0;
      const drawn = [];

      for (const batch of batches) {
        if (qtyNeeded <= 0) break;
        const take = Math.min(qtyNeeded, batch.quantity_remaining);
        itemTotalCost += take * Number(batch.purchase_price);
        drawn.push({ batch_id: batch.id, quantity: take, cost_per_unit: Number(batch.purchase_price) });
        batch.quantity_remaining -= take;
        await batch.save({ transaction: t });
        qtyNeeded -= take;
      }

      const saleItem = await SaleItem.create(
        {
          sale_id: sale.id,
          product_id: item.product_id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_price: itemUnitPrice,
          total_price: itemTotalPrice,
          total_cost: itemTotalCost,
          profit: itemTotalPrice - itemTotalCost,
          created_at: createdAt,
          updated_at: createdAt,
        },
        { transaction: t }
      );

      for (const d of drawn) {
        await SaleItemBatch.create(
          {
            sale_item_id: saleItem.id,
            batch_id: d.batch_id,
            quantity: d.quantity,
            cost_per_unit: d.cost_per_unit,
            created_at: createdAt,
            updated_at: createdAt,
          },
          { transaction: t }
        );
      }

      subtotal += itemTotalPrice;
      totalCost += itemTotalCost;
      acceptedAny = true;
    }

    if (!acceptedAny) {
      await sale.destroy({ transaction: t });
      return null;
    }

    sale.subtotal = subtotal;
    sale.total = subtotal;
    sale.total_cost = totalCost;
    sale.profit = subtotal - totalCost;
    sale.updated_at = createdAt;
    await sale.save({ transaction: t });

    return sale;
  });
}

async function seedSales(products, customers, adminId) {
  const existing = await Sale.count();
  if (existing > 0) {
    console.log(`✓ Sales already seeded (${existing} records) — skipping`);
    return;
  }

  const bikeProducts = products.filter((p) => p.category === 'bike');
  const partProducts = products.filter((p) => p.category === 'part');
  const paymentMethods = ['cash', 'cash', 'cash', 'bkash', 'card', 'nagad'];

  const totalSales = 28;
  let created = 0;

  for (let i = 0; i < totalSales; i++) {
    const ageDays = randInt(0, 40);
    const createdAt = daysAgo(ageDays);
    const customer = Math.random() > 0.25 ? pick(customers) : null;

    const items = [];

    // 30% chance bike sale (1 bike + maybe accessories), else parts-only
    if (Math.random() < 0.3 && bikeProducts.length > 0) {
      const bike = pick(bikeProducts);
      items.push({ product_id: bike.id, quantity: 1, unit_price: Number(bike.current_selling_price) });
      // Add 0-2 small parts as accessories
      const extras = pickN(partProducts, randInt(0, 2));
      for (const p of extras) {
        items.push({ product_id: p.id, quantity: randInt(1, 2), unit_price: Number(p.current_selling_price) });
      }
    } else {
      // Parts-only sale: 1 to 4 part items
      const sel = pickN(partProducts, randInt(1, 4));
      for (const p of sel) {
        items.push({ product_id: p.id, quantity: randInt(1, 3), unit_price: Number(p.current_selling_price) });
      }
    }

    if (items.length === 0) continue;

    const sale = await createBackdatedSale({
      items,
      customer,
      paymentMethod: pick(paymentMethods),
      createdAt,
      adminId,
    });

    if (sale) created += 1;
  }

  console.log(`✓ Created ${created} backdated sales`);
}

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureDefaultAdmin();
    await ensureDefaultSettings();

    const admin = await User.findOne({ where: { username: 'admin' } });

    console.log('Seeding suppliers…');
    const suppliers = await seedSuppliers();

    console.log('Seeding brands & models…');
    const { brands, models } = await seedBrandsAndModels();

    console.log('Seeding products…');
    const products = await seedProducts(brands, models);

    console.log('Seeding stock batches…');
    await seedStockBatches(products, suppliers);

    console.log('Seeding customers…');
    const customers = await seedCustomers();

    console.log('Seeding sales (FIFO + backdated)…');
    await seedSales(products, customers, admin.id);

    console.log('\n✓ Seed complete\n');
    console.log(`  Suppliers : ${Object.keys(suppliers).length}`);
    console.log(`  Brands    : ${Object.keys(brands).length}`);
    console.log(`  Products  : ${products.length}`);
    console.log(`  Customers : ${customers.length}`);
    console.log(`  Sales     : ${await Sale.count()}`);
    console.log(`  Batches   : ${await StockBatch.count()}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
