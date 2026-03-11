const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Try .env first, then .envserver
dotenv.config({ path: './.env' });
if (!process.env.DB_PASSWORD) {
  dotenv.config({ path: './.envserver' });
}

// Determine if we should use SSL based on the host
// Render PostgreSQL requires SSL, localhost typically doesn't
const isRenderHost = process.env.DB_HOST && process.env.DB_HOST.includes('render.com');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: isRenderHost ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
        // TLS options for better compatibility with Render
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
          cipher: 'DEFAULT:!ECDHE+RSA+!aRSA+!HIGH:!MEDIUM:!LOW:!EXP:!eNULL:!MD5'
        }
      },
      // Additional pg options
      query_timeout: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;