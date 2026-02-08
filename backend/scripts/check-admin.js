import poolPromise from '../src/models/db.js';

async function checkAdmin() {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, username, email, password_hash, created_at FROM admins');
    
    console.log('\n📊 Admins in database:\n');
    console.log(JSON.stringify(result.recordset, null, 2));
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
