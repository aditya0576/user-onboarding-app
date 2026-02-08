require('dotenv').config({ path: '../backend/.env' });
const sql = require('mssql');

console.log('==========================================');
console.log('Testing Azure SQL with Explicit Auth');
console.log('==========================================\n');

// Try with explicit authentication type
const config = {
    server: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    },
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    }
};

console.log('Connection Details:');
console.log(`  Server: ${config.server}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log(`  Auth Type: ${config.authentication.type}`);
console.log(`  Auth UserName: ${config.authentication.options.userName}\n`);

console.log('Attempting to connect...\n');

sql.connect(config)
    .then(pool => {
        console.log('✓ Successfully connected to Azure SQL Database!\n');
        return pool.request().query('SELECT DB_NAME() AS DatabaseName, @@VERSION AS Version');
    })
    .then(result => {
        console.log('Database Info:');
        console.log(`  Database: ${result.recordset[0].DatabaseName}`);
        console.log(`  Version: ${result.recordset[0].Version.split('\n')[0]}\n`);
        return sql.close();
    })
    .then(() => {
        console.log('✓ Connection closed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.log('✗ Connection failed:');
        console.log(`  Error: ${err.message}`);
        console.log(`  Code: ${err.code}\n`);
        
        if (err.originalError) {
            console.log('Additional Details:');
            console.log(`  ${err.originalError.message}\n`);
        }
        
        process.exit(1);
    });
