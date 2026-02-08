/**
 * Reset Admin Password
 * 
 * Deletes existing admin and creates a new one with proper password
 * 
 * Usage: cd backend && node scripts/reset-admin.js
 */

import poolPromise from '../src/models/db.js';
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

async function resetAdmin() {
  try {
    log('\n🔧 Resetting Admin User...\n', colors.blue);

    const adminUser = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123!'
    };

    const pool = await poolPromise;
    
    // Delete existing admin
    log('Deleting existing admin user...', colors.yellow);
    await pool.request()
      .input('username', adminUser.username)
      .query('DELETE FROM admins WHERE username = @username');

    // Hash password
    log('Hashing admin password...', colors.yellow);
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    log(`Password hash length: ${hashedPassword.length}`, colors.yellow);
    log(`Password hash: ${hashedPassword.substring(0, 30)}...`, colors.yellow);

    // Insert admin user
    log('Inserting new admin user...', colors.yellow);
    await pool.request()
      .input('username', adminUser.username)
      .input('email', adminUser.email)
      .input('password_hash', hashedPassword)
      .query(`
        INSERT INTO admins (username, email, password_hash, created_at)
        VALUES (@username, @email, @password_hash, GETDATE())
      `);

    // Verify
    log('\nVerifying admin user...', colors.yellow);
    const verifyResult = await pool.request()
      .input('username', adminUser.username)
      .query('SELECT username, email, LEN(password_hash) as hash_length FROM admins WHERE username = @username');
    
    if (verifyResult.recordset.length > 0) {
      const admin = verifyResult.recordset[0];
      log('\n✅ Admin user created successfully!', colors.green);
      log(`   Username: ${admin.username}`, colors.green);
      log(`   Email: ${admin.email}`, colors.green);
      log(`   Hash Length: ${admin.hash_length} characters`, colors.green);
      log(`   Password: ${adminUser.password}`, colors.green);
      log('\n🔐 Use these credentials to login\n', colors.blue);
    }

    await pool.close();

  } catch (error) {
    log(`\n❌ Error resetting admin: ${error.message}`, colors.red);
    log(error.stack, colors.red);
    process.exit(1);
  }
}

resetAdmin();
