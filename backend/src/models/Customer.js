const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Customer extends Model {}

Customer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false, validate: { notEmpty: true } },
    phone: DataTypes.STRING(32),
    email: { type: DataTypes.STRING(160), validate: { isEmail: { msg: 'Invalid email' } } },
    address: DataTypes.TEXT,
    notes: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
  }
);

module.exports = Customer;
