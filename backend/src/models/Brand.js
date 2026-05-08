const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Brand extends Model {}

Brand.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
    logo: DataTypes.STRING(255),
    notes: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'Brand',
    tableName: 'brands',
  }
);

module.exports = Brand;
