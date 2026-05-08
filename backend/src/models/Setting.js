const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Setting extends Model {}

Setting.init(
  {
    key: { type: DataTypes.STRING(64), primaryKey: true },
    value: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: false,
  }
);

module.exports = Setting;
