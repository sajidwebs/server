const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Try .env first, then .envserver
dotenv.config({ path: path.join(__dirname, '../.env') });
if (process.env.NODE_ENV !== 'production' && !process.env.DB_PASSWORD && !process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '../.envserver') });
}

// Determine if we should use SSL based on the host
// Render PostgreSQL requires SSL, localhost typically doesn't
const host = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : process.env.DB_HOST;
const isRenderHost = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && host && host.includes('render.com'));

// Create Sequelize instance
const options = {
    host,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.DB_LOG_SQL === 'true' ? console.log : false,
    dialectOptions: isRenderHost ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
};
const sequelize = process.env.DATABASE_URL ? new Sequelize(process.env.DATABASE_URL, options) : new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  options
);

module.exports = sequelize;
