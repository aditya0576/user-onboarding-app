import bcrypt from 'bcrypt';

// Generate bcrypt hash for default admin password
const password = 'admin123';
const saltRounds = 10;

console.log('Generating bcrypt hash for default admin password...\n');

try {
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('==========================================');
  console.log('Bcrypt Hash Generated Successfully');
  console.log('==========================================\n');
  console.log(`Password: ${password}`);
  console.log(`Salt Rounds: ${saltRounds}\n`);
  console.log('Hash:');
  console.log(hash);
  console.log('\n==========================================');
  console.log('Update db/init.sql with this hash');
  console.log('==========================================\n');
  console.log('Replace the INSERT statement in init.sql:');
  console.log(`INSERT IGNORE INTO admins (username, email, password_hash) VALUES`);
  console.log(`('admin', 'admin@example.com', '${hash}');\n`);
} catch (err) {
  console.error('Error generating hash:', err);
  process.exit(1);
}
