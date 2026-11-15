const db = require('./config/database');
const M = require('./models');
const { Op } = require('sequelize');
async function main() {
  const updated = {};
  await db.transaction(async transaction => {
    for (const modelName of ['User', 'Doctor', 'Chemist']) {
      const rows = await M[modelName].findAll({ where: { email: { [Op.like]: '%@example.invalid' } }, transaction });
      for (const row of rows) {
        const local = modelName === 'User' && row.username ? row.username : row.email.split('@')[0];
        const email = `${local}@pamsforce.com`.toLowerCase();
        const collision = await M[modelName].findOne({ where: { email }, transaction });
        if (collision && collision.id !== row.id) throw new Error(`Email already belongs to another ${modelName}: ${email}`);
        await row.update({ email }, { transaction });
      }
      updated[modelName] = rows.length;
    }
  });
  console.log('Regional email addresses updated:', JSON.stringify(updated));
  const users = await M.User.findAll({ attributes: ['fullName', 'username', 'email'], where: { employeeId: { [Op.like]: 'MR-%' } } });
  console.log(JSON.stringify(users));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.close());
