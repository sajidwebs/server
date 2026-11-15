// Additive recovery of a legacy LOCAL database. Never force-sync or truncate data.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const db = require('./config/database');
require('./models');
db.options.logging = false;

async function recover() {
  if (!['localhost', '127.0.0.1', '::1'].includes(db.config.host)) {
    throw new Error('Recovery is restricted to a local PostgreSQL database.');
  }
  await db.authenticate();
  const backupDir = path.join(__dirname, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `before-recovery-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
  const pgDump = process.env.PG_DUMP || 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe';
  const result = spawnSync(pgDump, ['-h', db.config.host, '-p', String(db.config.port || 5432),
    '-U', db.config.username, '-d', db.config.database, '-Fc', '-f', backup], {
    env: { ...process.env, PGPASSWORD: db.config.password }, encoding: 'utf8'
  });
  if (result.error || result.status !== 0) throw new Error(`Backup failed: ${result.error?.message || result.stderr}`);
  console.log('Backup saved:', backup);
  const qi = db.getQueryInterface();
  const tables = await qi.showAllTables();
  const counts = {};
  for (const table of tables) {
    const [rows] = await db.query(`SELECT count(*)::int AS count FROM ${qi.queryGenerator.quoteTable(table)}`);
    counts[table] = rows[0].count;
  }
  await db.transaction(async transaction => {
    const options = { transaction, logging: false };
    for (const [table, oldName, newName] of [
      ['doctor_categories', 'category_id', 'id'],
      ['doctor_specialties', 'specialty_id', 'id'],
      ['doctor_qualifications', 'qualification_id', 'id'],
      ['doctor_classes', 'category_name', 'class_name']
    ]) {
      if (!tables.includes(table)) continue;
      const columns = await qi.describeTable(table, options);
      if (columns[oldName] && !columns[newName]) {
        // Native rename preserves sequences, keys and existing foreign keys.
        await db.query(`ALTER TABLE ${qi.queryGenerator.quoteTable(table)} RENAME COLUMN ${qi.queryGenerator.quoteIdentifier(oldName)} TO ${qi.queryGenerator.quoteIdentifier(newName)}`, options);
        console.log('Renamed', table, oldName, 'to', newName);
      }
    }
    for (const model of Object.values(db.models)) {
      const table = model.getTableName();
      if (!tables.includes(table)) continue;
      const columns = await qi.describeTable(table, options);
      for (const attr of Object.values(model.rawAttributes)) {
        if (!columns[attr.field]?.special?.length || !attr.type.values) continue;
        for (const value of attr.type.values) {
          if (!columns[attr.field].special.includes(value)) {
            await db.query(qi.queryGenerator.pgEnumAdd(table, attr.field, value, {}), options);
            console.log('Added enum value', table, attr.field, value);
          }
        }
      }
      for (const attr of Object.values(model.rawAttributes)) {
        if (columns[attr.field]) continue;
        const definition = { ...attr };
        delete definition.references;
        delete definition.Model;
        if (definition.allowNull === false && definition.defaultValue === undefined && counts[table] > 0) {
          throw new Error(`Explicit backfill required for ${table}.${attr.field}`);
        }
        await qi.addColumn(table, attr.field, definition, options);
        console.log('Added', `${table}.${attr.field}`);
      }
      // Relax legacy required fields only where the current model permits null.
      for (const attr of Object.values(model.rawAttributes)) {
        if (columns[attr.field]?.allowNull === false && attr.allowNull === true) {
          await db.query(`ALTER TABLE ${qi.queryGenerator.quoteTable(table)} ALTER COLUMN ${qi.queryGenerator.quoteIdentifier(attr.field)} DROP NOT NULL`, options);
        }
      }
    }
    // Creates missing tables/indexes using Sequelize dependency ordering; existing tables are untouched.
    // Associations contain cycles. Create all missing tables first, then their
    // foreign keys, without Sequelize's cyclic sync altering legacy tables.
    const created = [];
    for (const model of Object.values(db.models)) {
      if (tables.includes(model.getTableName())) continue;
      const attrs = {};
      for (const [name, attr] of Object.entries(model.rawAttributes)) {
        attrs[name] = { ...attr };
        delete attrs[name].references;
      }
      await qi.createTable(model.getTableName(), attrs, { ...model.options, ...options });
      created.push(model);
      console.log('Created', model.tableName);
    }
    for (const model of created) {
      for (const attr of Object.values(model.rawAttributes)) {
        if (!attr.references) continue;
        await qi.addConstraint(model.getTableName(), {
          ...options, fields: [attr.field], type: 'foreign key',
          references: { table: attr.references.model, field: attr.references.key },
          onDelete: attr.onDelete || 'NO ACTION', onUpdate: attr.onUpdate || 'CASCADE'
        });
      }
      for (const index of model.options.indexes || []) {
        await qi.addIndex(model.getTableName(), { ...index, ...options });
      }
    }
    await db.query(`UPDATE users SET "fullName" = concat_ws(' ', "firstName", "lastName") WHERE "fullName" IS NULL`, options);
    for (const [table, count] of Object.entries(counts)) {
      const [rows] = await db.query(`SELECT count(*)::int AS count FROM ${qi.queryGenerator.quoteTable(table)}`, options);
      if (rows[0].count !== count) throw new Error(`Row count changed for ${table}`);
    }
  });
  for (const model of Object.values(db.models)) {
    await model.findAll({ limit: 1, logging: false });
  }
  console.log('Recovery verified: every model is readable; all original row counts preserved.');
}
recover().then(() => db.close()).catch(async error => {
  console.error(error.message, error.parent?.detail || '', error.stack);
  await db.close();
  process.exitCode = 1;
});
