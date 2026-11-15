// Remove only AUDIT-<8 hex digits> records created by the CRUD audit and their dependants.
const db = require('./config/database');
const M = require('./models');
const { Op } = require('sequelize');
const marker = /^AUDIT-[a-f0-9]{8}(?:\b|@)/i;
async function main() {
  const models = Object.values(M);
  const selected = new Map(models.map(model => [model.tableName, new Set()]));
  const rows = new Map();
  for (const model of models) {
    const strings = Object.entries(model.rawAttributes).filter(([, attr]) => ['STRING', 'TEXT'].includes(attr.type.key));
    if (!strings.length) continue;
    const matches = await model.findAll({ where: { [Op.or]: strings.map(([field]) => ({ [field]: { [Op.iLike]: 'AUDIT-%' } })) } });
    for (const row of matches) {
      if (strings.some(([field]) => marker.test(row[field] || ''))) {
        selected.get(model.tableName).add(row.id);
        rows.set(`${model.tableName}:${row.id}`, { model, row });
      }
    }
  }
  // Include dependent audit-only rows with no display name, such as SVL and price history.
  let changed = true;
  while (changed) {
    changed = false;
    for (const model of models) {
      const clauses = [];
      for (const [field, attr] of Object.entries(model.rawAttributes)) {
        const table = attr.references?.model?.tableName || attr.references?.model;
        const ids = selected.get(table);
        if (ids?.size) clauses.push({ [field]: { [Op.in]: [...ids] } });
      }
      if (!clauses.length) continue;
      for (const row of await model.findAll({ where: { [Op.or]: clauses } })) {
        if (!selected.get(model.tableName).has(row.id)) {
          selected.get(model.tableName).add(row.id);
          rows.set(`${model.tableName}:${row.id}`, { model, row });
          changed = true;
        }
      }
    }
  }
  const counts = Object.fromEntries([...selected].filter(([, ids]) => ids.size).map(([table, ids]) => [table, ids.size]));
  console.log('Audit cleanup inventory:', JSON.stringify(counts));
  if (!process.argv.includes('--apply')) return;
  await db.transaction(async transaction => {
    for (const [table, ids] of selected) {
      if (!ids.size) continue;
      await M.AuditLog.destroy({ where: { table_name: table, record_id: { [Op.in]: [...ids] } }, transaction });
      const entity = { doctors: 'doctor', chemists: 'chemist', territories: 'territory', headquarters: 'headquarter', patches: 'patch', stockists: 'stockist', hospitals: 'hospital', svl: 'svl', input_allocations: 'input_allocation', notice_uploads: 'notice', sop_policies: 'sop_policy', rate_fixations: 'rate_fixation' }[table];
      if (entity) {
        const queues = await M.ApprovalQueue.findAll({ where: { entity_type: entity, entity_id: { [Op.in]: [...ids] } }, transaction });
        if (queues.length) {
          await M.ApprovalHistory.destroy({ where: { approval_queue_id: { [Op.in]: queues.map(row => row.id) } }, transaction });
          await M.ApprovalQueue.destroy({ where: { id: { [Op.in]: queues.map(row => row.id) } }, transaction });
        }
      }
    }
    const pending = new Map(rows);
    while (pending.size) {
      let progress = false;
      for (const [key, entry] of pending) {
        const referenced = [...pending.values()].some(other => other !== entry && Object.entries(other.model.rawAttributes).some(([field, attr]) => {
          const table = attr.references?.model?.tableName || attr.references?.model;
          return table === entry.model.tableName && other.row[field] === entry.row.id;
        }));
        if (referenced) continue;
        await entry.row.destroy({ transaction });
        pending.delete(key);
        progress = true;
      }
      if (!progress) throw new Error('Audit references contain a cycle; cleanup rolled back for review.');
    }
  });
  console.log('Audit records and their dependent metadata removed.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.close());
