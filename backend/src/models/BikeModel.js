const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class BikeModel extends Model {}

BikeModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    brand_id: { type: DataTypes.INTEGER, allowNull: false },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },
    notes: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'BikeModel',
    tableName: 'models',
    indexes: [{ unique: true, fields: ['brand_id', 'name'] }],
  }
);

module.exports = BikeModel;
