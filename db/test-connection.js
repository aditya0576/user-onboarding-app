import sql from 'mssql';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../backend/.env') });

async function testConnection() {
  console.log('==========================================');
  console.log('Testing Azure SQL Database Connection');
  console.log('==========================================\n');

  const config = {
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true
    }
  };

  console.log('Connection Details:');
  console.log(`  Server: ${config.server}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Encrypt: ${config.options.encrypt}\n`);

  try {
    console.log('Attempting to connect...');
    const pool = await sql.connect(config);
    console.log('✓ Connection successful!\n');

    // Test query
    console.log('Executing test query...');
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✓ Query executed successfully');
    console.log(`  Result: ${JSON.stringify(result.recordset)}\n`);

    // Check database version
    const version = await pool.request().query('SELECT @@VERSION as version');
    console.log('Database Information:');
    console.log(`  Version: ${version.recordset[0].version.split('\n')[0]}\n`);

    // List tables (if any)
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    if (tables.recordset.length > 0) {
      console.log('Existing Tables:');
      tables.recordset.forEach(table => {
        console.log(`  - ${table.TABLE_NAME}`);
      });
    } else {
      console.log('No tables found. Run "npm run deploy" to create schema.');
    }

    console.log('\n==========================================');
    console.log('Connection Test: PASSED ✓');
    console.log('==========================================\n');

    await pool.close();

  } catch (error) {
    console.error('\n✗ Connection failed:');
    console.error(`  Error: ${error.message}`);
    if (error.code) console.error(`  Code: ${error.code}\n`);
    
    console.error('Troubleshooting:');
    console.error('1. Verify backend/.env has correct DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('2. Check Azure SQL firewall rules allow your IP address');
    console.error('3. Verify database server and credentials are correct');
    console.error('4. Ensure SQL Authentication is enabled (not just Azure AD)\n');
    
    process.exit(1);
  }
}

// Run test
testConnection();
