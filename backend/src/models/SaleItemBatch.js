const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const decimalGetter = (field) =>
  function () {
    const v = this.getDataValue(field);
    return v === null ? 0 : Number(v);
  };

class SaleItemBatch extends Model {}

SaleItemBatch.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sale_item_id: { type: DataTypes.INTEGER, allowNull: false },
    batch_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    cost_per_unit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get: decimalGetter('cost_per_unit'),
    },
  },
  {
    sequelize,
    modelName: 'SaleItemBatch',
    tableName: 'sale_item_batches',
    indexes: [{ fields: ['sale_item_id'] }, { fields: ['batch_id'] }],
  }
);

module.exports = SaleItemBatch;
