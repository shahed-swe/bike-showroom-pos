const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Product extends Model {}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sku: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
    name: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
    category: {
      type: DataTypes.ENUM('bike', 'part'),
      allowNull: false,
    },
    brand_id: { type: DataTypes.INTEGER, allowNull: true },
    model_id: { type: DataTypes.INTEGER, allowNull: true },
    description: DataTypes.TEXT,
    image: DataTypes.STRING(255),
    unit: { type: DataTypes.STRING(32), defaultValue: 'pcs' },
    current_selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      get() {
        const v = this.getDataValue('current_selling_price');
        return v === null ? 0 : Number(v);
      },
    },
    low_stock_threshold: { type: DataTypes.INTEGER, defaultValue: 5 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    indexes: [
      { fields: ['category'] },
      { fields: ['is_active'] },
      { fields: ['name'] },
      { fields: ['brand_id'] },
      { fields: ['model_id'] },
    ],
  }
);

module.exports = Product;
