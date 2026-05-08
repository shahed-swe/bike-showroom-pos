const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const decimalGetter = (field) =>
  function () {
    const v = this.getDataValue(field);
    return v === null ? 0 : Number(v);
  };

class Sale extends Model {}

Sale.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_number: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: true },
    customer_name: DataTypes.STRING(160),
    customer_phone: DataTypes.STRING(32),
    subtotal: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('subtotal') },
    discount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('discount') },
    tax: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('tax') },
    total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('total') },
    total_cost: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('total_cost') },
    profit: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('profit') },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'bkash', 'nagad', 'bank', 'other'),
      defaultValue: 'cash',
    },
    payment_status: {
      type: DataTypes.ENUM('paid', 'pending', 'partial'),
      defaultValue: 'paid',
    },
    notes: DataTypes.TEXT,
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['created_at'] },
      { fields: ['invoice_number'] },
    ],
  }
);

module.exports = Sale;
