const sequelize = require('../config/database');

const User = require('./User');
const Supplier = require('./Supplier');
const Customer = require('./Customer');
const Brand = require('./Brand');
const BikeModel = require('./BikeModel');
const Product = require('./Product');
const StockBatch = require('./StockBatch');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const SaleItemBatch = require('./SaleItemBatch');
const Setting = require('./Setting');

// Brand <-> BikeModel
Brand.hasMany(BikeModel, { foreignKey: 'brand_id', as: 'models', onDelete: 'CASCADE' });
BikeModel.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

// Product <-> Brand / BikeModel
Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

BikeModel.hasMany(Product, { foreignKey: 'model_id', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(BikeModel, { foreignKey: 'model_id', as: 'model' });

// Stock
Product.hasMany(StockBatch, { foreignKey: 'product_id', as: 'batches', onDelete: 'CASCADE' });
StockBatch.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Supplier.hasMany(StockBatch, { foreignKey: 'supplier_id', as: 'batches', onDelete: 'SET NULL' });
StockBatch.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// Sale
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales', onDelete: 'SET NULL' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Sale, { foreignKey: 'created_by', as: 'sales', onDelete: 'SET NULL' });
Sale.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

Product.hasMany(SaleItem, { foreignKey: 'product_id', as: 'sale_items', onDelete: 'RESTRICT' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

SaleItem.hasMany(SaleItemBatch, { foreignKey: 'sale_item_id', as: 'batch_draws', onDelete: 'CASCADE' });
SaleItemBatch.belongsTo(SaleItem, { foreignKey: 'sale_item_id', as: 'sale_item' });

StockBatch.hasMany(SaleItemBatch, { foreignKey: 'batch_id', as: 'draws', onDelete: 'RESTRICT' });
SaleItemBatch.belongsTo(StockBatch, { foreignKey: 'batch_id', as: 'batch' });

module.exports = {
  sequelize,
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
  Setting,
};
