const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

class User extends Model {
  validatePassword(plain) {
    return bcrypt.compareSync(plain, this.password_hash);
  }

  toSafeJSON() {
    const { password_hash, ...rest } = this.toJSON();
    return rest;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, len: [3, 64] },
    },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    full_name: { type: DataTypes.STRING(128) },
    role: {
      type: DataTypes.ENUM('admin', 'staff'),
      defaultValue: 'admin',
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

User.beforeCreate((user) => {
  if (user.password_hash && !user.password_hash.startsWith('$2')) {
    user.password_hash = bcrypt.hashSync(user.password_hash, 10);
  }
});

User.beforeUpdate((user) => {
  if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
    user.password_hash = bcrypt.hashSync(user.password_hash, 10);
  }
});

module.exports = User;
