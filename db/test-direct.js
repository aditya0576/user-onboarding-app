import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../backend/.env') });

async function testDirect() {
  const connectionString = `Server=${process.env.DB_HOST},${process.env.DB_PORT};Database=${process.env.DB_NAME};User Id=${process.env.DB_USER};Password=${process.env.DB_PASSWORD};Encrypt=true;TrustServerCertificate=false`;
  
  console.log('Testing with connection string format...\n');
  console.log('Connection String (password hidden):');
  console.log(connectionString.replace(process.env.DB_PASSWORD, '***'));
  console.log('');
  
  try {
    const pool = await sql.connect(connectionString);
    console.log('✓ Connected successfully!');
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✓ Query successful:', result.recordset);
    await pool.close();
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Code:', error.code);
  }
}

testDirect();
