/**
 * Seed Admin User
 * 
 * Creates an admin user in the database if one doesn't exist
 * 
 * Usage: cd backend && node ../e2e-tests/seed-admin.js
 */

import poolPromise from './db.js';
import bcrypt from 'bcrypt';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function seedAdmin() {
  try {
    log('\n🔧 Seeding Admin User...\n', colors.blue);

    const adminUser = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123!'
    };

    const pool = await poolPromise;
    
    // Check if admin already exists
    log('Checking if admin user already exists...', colors.yellow);
    const checkResult = await pool.request()
      .input('username', adminUser.username)
      .query('SELECT * FROM admins WHERE username = @username');
    
    if (checkResult.recordset.length > 0) {
      log('✅ Admin user already exists!', colors.green);
      log(`   Username: ${adminUser.username}`, colors.green);
      log(`   Email: ${checkResult.recordset[0].email}`, colors.green);
      await pool.close();
      return;
    }

    // Hash password
    log('Hashing admin password...', colors.yellow);
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);

    // Insert admin user
    log('Inserting admin user into database...', colors.yellow);
    await pool.request()
      .input('username', adminUser.username)
      .input('email', adminUser.email)
      .input('password_hash', hashedPassword)
      .query(`
        INSERT INTO admins (username, email, password_hash, created_at)
        VALUES (@username, @email, @password_hash, GETDATE())
      `);

    log('\n✅ Admin user created successfully!', colors.green);
    log(`   Username: ${adminUser.username}`, colors.green);
    log(`   Email: ${adminUser.email}`, colors.green);
    log(`   Password: ${adminUser.password}`, colors.green);
    log('\n🔐 Use these credentials to login to admin dashboard\n', colors.blue);

    await pool.close();

  } catch (error) {
    log(`\n❌ Error seeding admin: ${error.message}`, colors.red);
    log(error.stack, colors.red);
    process.exit(1);
  }
}

seedAdmin();
