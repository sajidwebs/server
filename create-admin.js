const db = require('./config/database');
const { User } = require('./models');
const initializeDatabase = require('./config/initializeDatabase');
const { hashPassword } = require('./utils/password');

async function main() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).');
  }
  await initializeDatabase();
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: { firstName: 'System', lastName: 'Administrator', email,
      password: await hashPassword(password), role: 'admin', isActive: true }
  });
  if (!created && user.role !== 'admin') throw new Error('Email already belongs to a non-admin user.');
  console.log(created ? 'Administrator created.' : 'Administrator already exists; password unchanged.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => db.close());
