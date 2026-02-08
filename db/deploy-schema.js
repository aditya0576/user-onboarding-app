import sql from 'mssql';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../backend/.env') });

async function deploySchema() {
  console.log('==========================================');
  console.log('Deploying Schema to Azure SQL Database');
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
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 30000
    }
  };

  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}\n`);

  let pool;

  try {
    // Connect to database
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('✓ Connected successfully\n');

    // Read SQL file
    console.log('Reading init.sql...');
    const sqlScript = readFileSync(join(__dirname, 'init.sql'), 'utf8');
    
    // For T-SQL, split by GO or by double newline for batches
    // Remove comments first
    const cleanedScript = sqlScript
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by double semicolons or execute as single batch
    const statements = cleanedScript
      .split(';;')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // If no double semicolons, execute the whole script as one batch
    if (statements.length === 0 || statements.length === 1) {
      console.log('Executing SQL script as single batch...\n');
      try {
        await pool.request().batch(cleanedScript);
        console.log('✓ Schema created successfully\n');
      } catch (err) {
        console.error('✗ Deployment failed:', err.message);
        throw err;
      }
    } else {
      console.log(`✓ Found ${statements.length} SQL batches\n`);
      // Execute each statement
      console.log('Executing SQL statements...');
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            await pool.request().batch(statement);
            console.log(`✓ Batch ${i + 1}/${statements.length} executed`);
          } catch (err) {
            console.error(`✗ Batch ${i + 1} failed:`, err.message);
            // Continue with other statements
          }
        }
      }
    }

    console.log('\n==========================================');
    console.log('Schema Deployed Successfully!');
    console.log('==========================================\n');

    // Verify tables were created
    console.log('Verifying tables...');
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log('\nCreated Tables:');
    result.recordset.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n✗ Error deploying schema:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('1. Database connection details in backend/.env');
    console.error('2. Azure SQL firewall rules allow your IP');
    console.error('3. Database credentials are correct');
    process.exit(1);
  } finally {
    if (pool) {
      await sql.close();
    }
  }
}

// Run deployment
deploySchema();
