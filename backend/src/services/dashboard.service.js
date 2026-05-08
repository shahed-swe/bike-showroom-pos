const { Op, fn, col, literal } = require('sequelize');
const {
  Sale,
  SaleItem,
  Product,
  Customer,
  StockBatch,
} = require('../models');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function aggSales(where) {
  const r = await Sale.findOne({
    where,
    attributes: [
      [fn('COUNT', col('id')), 'sales_count'],
      [fn('COALESCE', fn('SUM', col('total')), 0), 'revenue'],
      [fn('COALESCE', fn('SUM', col('profit')), 0), 'profit'],
    ],
    raw: true,
  });
  return {
    sales_count: Number(r.sales_count || 0),
    revenue: Number(r.revenue || 0),
    profit: Number(r.profit || 0),
  };
}

async function summary() {
  const today = new Date();
  const todayStart = startOfDay(today);
  const monthStart = startOfMonth(today);
  const weekStart = daysAgo(7);

  const [todayStats, weekStats, monthStats, totalStats] = await Promise.all([
    aggSales({ created_at: { [Op.gte]: todayStart } }),
    aggSales({ created_at: { [Op.gte]: weekStart } }),
    aggSales({ created_at: { [Op.gte]: monthStart } }),
    aggSales({}),
  ]);

  const productCount = await Product.count({ where: { is_active: true } });
  const customerCount = await Customer.count();

  const stockRow = await StockBatch.findOne({
    attributes: [
      [
        fn('COALESCE', fn('SUM', literal('quantity_remaining * purchase_price')), 0),
        'value',
      ],
      [fn('COALESCE', fn('SUM', col('quantity_remaining')), 0), 'units'],
    ],
    raw: true,
  });

  const lowRow = await Product.findAll({
    where: { is_active: true },
    include: [{ model: StockBatch, as: 'batches', attributes: [] }],
    attributes: [
      'id',
      'low_stock_threshold',
      [fn('COALESCE', fn('SUM', col('batches.quantity_remaining')), 0), 'q'],
    ],
    group: ['Product.id'],
    having: literal('COALESCE(SUM("batches"."quantity_remaining"), 0) <= "Product"."low_stock_threshold"'),
    subQuery: false,
    raw: true,
  });

  return {
    today: todayStats,
    week: weekStats,
    month: monthStats,
    total: totalStats,
    counts: {
      products: productCount,
      customers: customerCount,
      low_stock: lowRow.length,
    },
    stock: { value: Number(stockRow?.value || 0), units: Number(stockRow?.units || 0) },
  };
}

async function salesTrend({ days = 30 } = {}) {
  const since = daysAgo(Number(days));
  const rows = await Sale.findAll({
    where: { created_at: { [Op.gte]: since } },
    attributes: [
      [fn('to_char', col('created_at'), 'YYYY-MM-DD'), 'date'],
      [fn('COUNT', col('id')), 'sales_count'],
      [fn('COALESCE', fn('SUM', col('total')), 0), 'revenue'],
      [fn('COALESCE', fn('SUM', col('profit')), 0), 'profit'],
      [fn('COALESCE', fn('SUM', col('total_cost')), 0), 'cost'],
    ],
    group: [literal("to_char(created_at, 'YYYY-MM-DD')")],
    order: [[literal("to_char(created_at, 'YYYY-MM-DD')"), 'ASC']],
    raw: true,
  });
  return rows.map((r) => ({
    date: r.date,
    sales_count: Number(r.sales_count),
    revenue: Number(r.revenue),
    profit: Number(r.profit),
    cost: Number(r.cost),
  }));
}

async function topProducts({ limit = 10, days = 30 } = {}) {
  const since = daysAgo(Number(days));
  const rows = await SaleItem.findAll({
    include: [
      { model: Sale, as: 'sale', attributes: [], where: { created_at: { [Op.gte]: since } } },
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'image'] },
    ],
    attributes: [
      'product_id',
      [fn('SUM', col('SaleItem.quantity')), 'units_sold'],
      [fn('SUM', col('total_price')), 'revenue'],
      [fn('SUM', col('SaleItem.profit')), 'profit'],
    ],
    group: ['SaleItem.product_id', 'product.id'],
    order: [[literal('revenue'), 'DESC']],
    limit: Number(limit),
    subQuery: false,
  });
  return rows.map((r) => {
    const o = r.toJSON();
    return {
      id: o.product?.id,
      name: o.product?.name,
      sku: o.product?.sku,
      category: o.product?.category,
      image: o.product?.image,
      units_sold: Number(o.units_sold),
      revenue: Number(o.revenue),
      profit: Number(o.profit),
    };
  });
}

async function categoryBreakdown({ days = 30 } = {}) {
  const since = daysAgo(Number(days));
  const rows = await SaleItem.findAll({
    include: [
      { model: Sale, as: 'sale', attributes: [], where: { created_at: { [Op.gte]: since } } },
      { model: Product, as: 'product', attributes: [] },
    ],
    attributes: [
      [col('product.category'), 'category'],
      [fn('SUM', col('SaleItem.quantity')), 'units_sold'],
      [fn('SUM', col('total_price')), 'revenue'],
      [fn('SUM', col('SaleItem.profit')), 'profit'],
    ],
    group: ['product.category'],
    raw: true,
    subQuery: false,
  });
  return rows.map((r) => ({
    category: r.category,
    units_sold: Number(r.units_sold),
    revenue: Number(r.revenue),
    profit: Number(r.profit),
  }));
}

async function recentSales({ limit = 10 } = {}) {
  const rows = await Sale.findAll({
    attributes: ['id', 'invoice_number', 'customer_name', 'total', 'profit', 'payment_method', 'created_at'],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
  });
  return rows.map((r) => r.toJSON());
}

async function profitAnalysis(product_id) {
  const purchases = await StockBatch.findAll({
    where: { product_id },
    attributes: ['received_at', 'purchase_price', 'selling_price', 'quantity_added'],
    order: [['received_at', 'ASC']],
  });

  const sales = await SaleItem.findAll({
    where: { product_id },
    include: [{ model: Sale, as: 'sale', attributes: ['created_at'] }],
    attributes: ['quantity', 'unit_price', 'total_price', 'total_cost', 'profit'],
    order: [[{ model: Sale, as: 'sale' }, 'created_at', 'ASC']],
  });

  const summaryRow = await SaleItem.findOne({
    where: { product_id },
    attributes: [
      [fn('COALESCE', fn('SUM', col('quantity')), 0), 'units_sold'],
      [fn('COALESCE', fn('SUM', col('total_price')), 0), 'revenue'],
      [fn('COALESCE', fn('SUM', col('total_cost')), 0), 'cost'],
      [fn('COALESCE', fn('SUM', col('profit')), 0), 'profit'],
    ],
    raw: true,
  });

  return {
    purchases: purchases.map((p) => ({
      date: p.received_at,
      purchase_price: Number(p.purchase_price),
      selling_price: Number(p.selling_price),
      quantity_added: p.quantity_added,
    })),
    sales: sales.map((s) => ({
      date: s.sale ? s.sale.created_at : null,
      quantity: s.quantity,
      unit_price: Number(s.unit_price),
      total_price: Number(s.total_price),
      total_cost: Number(s.total_cost),
      profit: Number(s.profit),
    })),
    summary: {
      units_sold: Number(summaryRow?.units_sold || 0),
      revenue: Number(summaryRow?.revenue || 0),
      cost: Number(summaryRow?.cost || 0),
      profit: Number(summaryRow?.profit || 0),
    },
  };
}

module.exports = {
  summary,
  salesTrend,
  topProducts,
  categoryBreakdown,
  recentSales,
  profitAnalysis,
};
