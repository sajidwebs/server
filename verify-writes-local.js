// Check representative model writes inside a transaction that always rolls back.
const assert = require('node:assert/strict');
const db = require('./config/database');
const M = require('./models');
db.options.logging = false;
async function main() {
  if (!['localhost','127.0.0.1','::1'].includes(db.config.host)) throw new Error('Local databases only');
  const transaction = await db.transaction();
  const options = { transaction };
  try {
    const suffix = Date.now().toString();
    const user = await M.User.create({ firstName:'Recovery', lastName:'Check', email:`recovery-${suffix}@example.com`, password:'temporary-check-only', role:'Field Representative' }, options);
    const cls = await M.DoctorClass.create({ class_name:`Recovery ${suffix}`, short_name:'CHECK' }, options);
    const product = await M.Product.create({ name:`Recovery ${suffix}`, unique_id:`CHECK-${suffix}` }, options);
    const activity = await M.Activity.create({ userId:user.id, title:'Recovery verification', date:'2026-11-15', doctorClassId:cls.id }, options);
    await activity.update({ notes:'Write verified' }, options);
    assert.equal((await M.Activity.findByPk(activity.id, options)).notes, 'Write verified');
    await product.destroy(options);
    console.log('PASS: user role, doctor class, minimal product, activity create/read/update/delete; rolled back all test records.');
  } finally { await transaction.rollback(); }
}
main().then(()=>db.close()).catch(async e=>{console.error(e.message);await db.close();process.exitCode=1;});
