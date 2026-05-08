const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const decimalGetter = (field) =>
  function () {
    const v = this.getDataValue(field);
    return v === null ? 0 : Number(v);
  };

class SaleItem extends Model {}

SaleItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sale_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    product_name: { type: DataTypes.STRING(200), allowNull: false },
    product_sku: DataTypes.STRING(64),
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, get: decimalGetter('unit_price') },
    total_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false, get: decimalGetter('total_price') },
    total_cost: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('total_cost') },
    profit: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, get: decimalGetter('profit') },
  },
  {
    sequelize,
    modelName: 'SaleItem',
    tableName: 'sale_items',
    indexes: [{ fields: ['sale_id'] }, { fields: ['product_id'] }],
  }
);

module.exports = SaleItem;
