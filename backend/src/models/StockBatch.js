const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class StockBatch extends Model {
  get margin() {
    return Number(this.selling_price) - Number(this.purchase_price);
  }
}

const decimalGetter = (field) =>
  function () {
    const v = this.getDataValue(field);
    return v === null ? 0 : Number(v);
  };

StockBatch.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    supplier_id: { type: DataTypes.INTEGER, allowNull: true },
    purchase_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
      get: decimalGetter('purchase_price'),
    },
    selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
      get: decimalGetter('selling_price'),
    },
    quantity_added: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    quantity_remaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    notes: DataTypes.TEXT,
    received_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'StockBatch',
    tableName: 'stock_batches',
    indexes: [
      { fields: ['product_id'] },
      { fields: ['quantity_remaining'] },
      { fields: ['received_at'] },
    ],
  }
);

module.exports = StockBatch;
