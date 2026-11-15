const assert = require('node:assert/strict');
const databasePath = require.resolve('./config/database');
const modelsPath = require.resolve('./models');
const calls = [];
let tables = [];
let fail = false;
const qi = {
  showAllTables: async () => tables,
  createTable: async (table, attributes) => {
    assert.ok(Object.values(attributes).every(attribute => !attribute.references));
    calls.push(`create:${table}`);
  },
  addIndex: async () => {},
  describeTable: async () => ({ id: {} }),
  addColumn: async (table, column) => calls.push(`column:${table}.${column}`),
  addConstraint: async table => {
    assert.ok(calls.includes('create:users'));
    assert.ok(calls.includes('create:roles'));
    calls.push(`fk:${table}`);
  }
};
const model = (table, reference) => ({
  tableName: table, getTableName: () => table, options: {},
  rawAttributes: { id: { field: 'id', primaryKey: true },
    link: { field: 'link', references: { model: reference, key: 'id' } } },
  findAll: async () => { if (fail) throw new Error('schema mismatch'); }
});
require.cache[databasePath] = { exports: {
  models: { User: model('users', 'roles'), Role: model('roles', 'users') },
  getQueryInterface: () => qi, query: async () => {},
  transaction: async work => {
    try { await work({}); calls.push('commit'); }
    catch (error) { calls.push('rollback'); throw error; }
  }
} };
require.cache[modelsPath] = { exports: {} };
const initialize = require('./config/initializeDatabase');
async function main() {
  await initialize();
  assert.ok(calls.indexOf('create:roles') < calls.indexOf('fk:users'));
  calls.length = 0;
  tables = ['users', 'roles'];
  await initialize();
  assert.ok(!calls.some(call => call.startsWith('create:')));
  assert.ok(calls.includes('column:users.link'));
  fail = true;
  await assert.rejects(initialize(), /schema mismatch/);
  assert.equal(calls.at(-1), 'rollback');
  console.log('PASS: fresh schema ordering, existing tables, additive columns, failure rollback.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
