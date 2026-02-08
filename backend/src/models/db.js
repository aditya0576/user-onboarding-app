// src/models/db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create a connection pool
const poolPromise = sql.connect(config)
  .then(pool => {
    console.log('✓ Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    throw err;
  });

export default poolPromise;
