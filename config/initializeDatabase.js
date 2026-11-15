const db = require('./database');
require('../models');

// Create missing tables in two passes because the model associations contain cycles.
// Only add missing schema objects; never force-sync, drop or rewrite existing columns.
async function initializeDatabase() {
  await db.transaction(async transaction => {
    await db.query('SELECT pg_advisory_xact_lock(724631901)', { transaction });
    const qi = db.getQueryInterface();
    const tables = await qi.showAllTables({ transaction });
    const created = [];
    for (const model of Object.values(db.models)) {
      if (tables.includes(model.getTableName())) continue;
      const attributes = {};
      for (const [name, attribute] of Object.entries(model.rawAttributes)) {
        attributes[name] = { ...attribute };
        delete attributes[name].references;
      }
      await qi.createTable(model.getTableName(), attributes, { ...model.options, transaction });
      for (const index of model.options.indexes || []) {
        await qi.addIndex(model.getTableName(), { ...index, transaction });
      }
      created.push(model);
    }
    for (const model of Object.values(db.models)) {
      if (tables.includes(model.getTableName())) {
        const columns = await qi.describeTable(model.getTableName(), { transaction });
        for (const attribute of Object.values(model.rawAttributes)) {
          if (columns[attribute.field]) continue;
          if (attribute.primaryKey || attribute.autoIncrement) {
            throw new Error(`Explicit migration required for ${model.tableName}.${attribute.field}`);
          }
          const definition = { ...attribute };
          delete definition.Model;
          await qi.addColumn(model.getTableName(), attribute.field, definition, { transaction });
        }
      }
    }
    for (const model of created) {
      for (const attribute of Object.values(model.rawAttributes)) {
        if (!attribute.references) continue;
        await qi.addConstraint(model.getTableName(), {
          transaction, fields: [attribute.field], type: 'foreign key',
          references: { table: attribute.references.model, field: attribute.references.key },
          onDelete: attribute.onDelete || 'NO ACTION', onUpdate: attribute.onUpdate || 'CASCADE'
        });
      }
    }
    for (const model of Object.values(db.models)) {
      await model.findAll({ limit: 0, logging: false, transaction });
    }
  });
  console.log('Database schema initialized and verified.');
}

module.exports = initializeDatabase;
