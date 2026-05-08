const { Sequelize } = require('sequelize');

const logging = process.env.DB_LOGGING === 'true' ? console.log : false;

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging,
      define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      process.env.DB_NAME || 'habib_showroom',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging,
        define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      }
    );

module.exports = sequelize;
