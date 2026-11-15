const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const db = require('./config/database');
const M = require('./models');
const { Op, QueryTypes } = require('sequelize');
const catalog = require('./company-catalog.json');
const normalize = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

async function syncCompanyCatalog() {
  const summary = { products: [], removedProducts: [], retiredProducts: [], removedCategories: [], retiredCategories: [] };
  const snapshot = {};
  for (const name of ['Product', 'ProductCategory', 'Division', 'BrandGroup', 'PackSize', 'Strength', 'ProductPriceHistory','MarketingCampaign','MarketingBrandStrategy','MarketingRCPA']) {
    snapshot[name] = await M[name].findAll({ raw: true });
  }
  const backupDir = path.join(__dirname, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, `before-company-catalog-${Date.now()}.json`), JSON.stringify(snapshot, null, 2));
  await db.transaction(async transaction => {
    await db.query('SELECT pg_advisory_xact_lock(724631903)', { transaction });
    const admin = await M.User.findOne({ where: { role: 'admin', isActive: true }, transaction });
    if (!admin) throw new Error('An active administrator is required.');
    const owner = { created_by: admin.id };
    const divisions = new Map();
    for (const item of catalog.divisions) {
      const matches = snapshot.Division.filter(row => normalize(row.division_name) === normalize(item.name));
      if(matches.length > 1) throw new Error(`Multiple division records match ${item.name}`);
      const division = matches.length ? await M.Division.findByPk(matches[0].id,{transaction}) : await M.Division.create({division_name:item.name,short_name:item.shortName,code:item.code,...owner},{transaction});
      await division.update({division_name:item.name,status:'active'},{transaction});
      divisions.set(item.name,division.id);
    }
    const obsoleteDivisionIds = snapshot.Division.filter(row => normalize(row.division_name) === 'PAMSFORCE' || row.code === 'PAMSFORCE').map(row => row.id);
    const categoryIds = [];
    for (const item of catalog.categories) {
      const [category] = await M.ProductCategory.findOrCreate({ where: { category_name: item.name },
        defaults: { short_name: item.shortName, category_type: 'form', ...owner }, transaction });
      await category.update({ status: 'active', category_type: 'form' }, { transaction });
      categoryIds.push(category.id);
    }
    const productIds = [];
    const brandIds = [];
    for (const item of catalog.products) {
      const matches = snapshot.Product.filter(row => normalize(row.name) === normalize(item.name));
      if (matches.length > 1) throw new Error(`Multiple existing records match ${item.name}; resolve duplicates before importing.`);
      const category = await M.ProductCategory.findOne({ where: { category_name: item.category }, transaction });
      const brandName = item.brandGroup || item.name;
      const priorBrands = snapshot.BrandGroup.filter(row => normalize(row.brand_group_name) === normalize(brandName));
      const existingBrand = matches[0]?.brand_group_id ? priorBrands.find(row=>row.id === matches[0].brand_group_id) : priorBrands[0];
      const [brand] = existingBrand ? [await M.BrandGroup.findByPk(existingBrand.id,{transaction})] : await M.BrandGroup.findOrCreate({ where: { brand_group_name:brandName, division_id:null },
        defaults: { short_name: item.code, ...owner }, transaction });
      await brand.update({ status: 'active', ...(obsoleteDivisionIds.includes(brand.division_id) ? {division_id:null} : {}) }, { transaction });
      brandIds.push(brand.id);
      const previousDivision = matches[0]?.division_id;
      const divisionId = previousDivision && !obsoleteDivisionIds.includes(previousDivision) ? previousDivision : item.division ? divisions.get(item.division) : null;
      const values = { name: item.name, short_name: item.name, division_id: divisionId,
        brand_group_id: brand.id, category_id: category?.id || null, category: item.category,
        brand: item.name, manufacturer: catalog.company, status: 'active', isActive: true,
        description: item.url ? `${catalog.company} product. Official product information: ${item.url}` : `${catalog.company} product. Source: ${item.source}. Commercial details await confirmation.`, updated_by: admin.id };
      let product;
      if (matches.length) {
        product = await M.Product.findByPk(matches[0].id, { transaction });
        await product.update(values, { transaction });
      } else {
        product = await M.Product.create({ ...values, unique_id: item.code, code: item.code,
          pts: null, ptr: null, mrp: null, nrv: null, gstRate: null, schedule: null, ...owner }, { transaction });
      }
      productIds.push(product.id);
      summary.products.push(item.name);
    }
    const tables = await db.getQueryInterface().showAllTables({ transaction });
    const references = [];
    for (const model of Object.values(M)) {
      if (model === M.ProductPriceHistory) continue;
      for (const [field, attr] of Object.entries(model.rawAttributes)) {
        if (['product_id', 'productId'].includes(field)) references.push({ model, field });
      }
    }
    for (const product of await M.Product.findAll({ where: { id: { [Op.notIn]: productIds } }, transaction })) {
      let linked = false;
      for (const { model, field } of references) {
        if (await model.count({ where: { [field]: product.id }, transaction })) { linked = true; break; }
      }
      for (const table of ['sales_targets', 'sales_projection_entries', 'primary_sales', 'secondary_sales', 'expiry_entries']) {
        if (!linked && tables.includes(table)) {
          const [row] = await db.query(`SELECT count(*)::int AS count FROM "${table}" WHERE product_id = :id`,
            { replacements: { id: product.id }, type: QueryTypes.SELECT, transaction });
          linked = row.count > 0;
        }
      }
      if (linked) {
        await product.update({ status: 'inactive', isActive: false }, { transaction });
        summary.retiredProducts.push(product.name);
      } else {
        await M.ProductPriceHistory.destroy({ where: { product_id: product.id }, transaction });
        await product.destroy({ transaction });
        summary.removedProducts.push(product.name);
      }
    }
    for (const category of await M.ProductCategory.findAll({ where: { id: { [Op.notIn]: categoryIds } }, transaction })) {
      if (await M.Product.count({ where: { category_id: category.id }, transaction })) {
        await category.update({ status: 'inactive' }, { transaction });
        summary.retiredCategories.push(category.category_name);
      } else {
        await category.destroy({ transaction });
        summary.removedCategories.push(category.category_name);
      }
    }
    // Hide unrelated old catalogue choices while retaining their historical references.
    await M.BrandGroup.update({ status: 'inactive' }, { where: { id: { [Op.notIn]: brandIds } }, transaction });
    // Remove the incorrect Pamsforce master; preserve unrelated divisions and all historical records.
    for(const id of obsoleteDivisionIds) {
      for(const model of Object.values(M)) for(const field of ['division_id','allocated_division_id']) {
        if(model.rawAttributes[field]) await model.update({[field]:null},{where:{[field]:id},transaction});
      }
      await M.Division.destroy({where:{id},transaction});
    }
    const active = await M.Product.findAll({ where: { status: 'active' }, transaction });
    assert.deepEqual(active.map(row => row.name).sort(), catalog.products.map(row => row.name).sort());
    assert.equal(await M.ProductCategory.count({ where: { status: 'active' }, transaction }), categoryIds.length);
  });
  console.log('Company catalogue synchronized:', JSON.stringify(summary));
  return summary;
}

module.exports = syncCompanyCatalog;
if (require.main === module) {
  if (!process.argv.includes('--apply')) {
    console.log('Preview:', JSON.stringify(catalog, null, 2));
    console.log('Pass --apply to synchronize the catalogue and remove unreferenced unrelated products/categories.');
  } else {
    syncCompanyCatalog().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.close());
  }
}
