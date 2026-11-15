const assert = require('node:assert/strict');
const db = require('./config/database');
const M = require('./models');
async function main() {
  const qi = db.getQueryInterface().queryGenerator;
  const checks = Object.values(M).map(model => {
    const columns = Object.values(model.rawAttributes).filter(attr => ['STRING', 'TEXT'].includes(attr.type.key));
    if (!columns.length) return null;
    const condition = columns.map(attr => {
      const field = qi.quoteIdentifier(attr.field);
      return `(${field} ~* '^AUDIT-[a-f0-9]{8}' OR ${field} ILIKE 'SAMPLE-%' OR ${field} ILIKE 'sample.%' OR ${field} ILIKE 'Sample %' OR ${field} ILIKE '% Sample %' OR ${field} ILIKE 'Synthetic %')`;
    }).join(' OR ');
    return `SELECT '${model.tableName}' AS table_name, count(*)::int AS count FROM ${qi.quoteTable(model.tableName)} WHERE ${condition}`;
  }).filter(Boolean);
  const [rows] = await db.query(checks.join(' UNION ALL '));
  const remaining = rows.filter(row => row.count > 0);
  console.log('Remaining audit/placeholder records:', JSON.stringify(remaining));
  assert.equal(remaining.length, 0);
  const summary = {};
  for (const name of ['Headquarter', 'Territory', 'Doctor', 'Chemist', 'Stockist', 'Hospital', 'Product', 'DoctorClass', 'DoctorCategory', 'DoctorSpecialty', 'DoctorQualification', 'Division', 'BrandGroup']) {
    summary[name] = await M[name].count();
  }
  console.log('Business master counts:', JSON.stringify(summary));
  const headquarters = await M.Headquarter.findAll({ attributes: ['id', 'name', 'code', 'state', 'zone'], order: [['code', 'ASC']] });
  console.log('HQ master:', JSON.stringify(headquarters));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.close());
