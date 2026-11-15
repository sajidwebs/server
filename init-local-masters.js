// Populate missing reference values only; preserve accounts and business records.
const db = require('./config/database');
const M = require('./models');
db.options.logging = false;
async function main() {
  if (!['localhost', '127.0.0.1', '::1'].includes(db.config.host)) throw new Error('Local databases only');
  await db.transaction(async transaction => {
    const ensure = async (model, where, defaults = {}) => (await model.findOrCreate({ where, defaults, transaction }))[0];
    for (const [name, level] of [['Admin',10],['HR',8],['NSM',6],['ZBM',5],['RBM',4],['ABM',3],['TBM',2],['MR',1],['Billing User',2]]) {
      await ensure(M.Role, { role_name: name }, { short_name: name, hierarchy_level: level });
    }
    const admin = await M.Role.findOne({ where: { role_name: 'Admin' }, transaction });
    const mr = await M.Role.findOne({ where: { role_name: 'MR' }, transaction });
    for (const user of await M.User.findAll({ transaction })) {
      if (!user.role_id) await user.update({ role_id: user.role === 'admin' ? admin.id : mr.id }, { transaction });
    }
    for (const module of ['Doctor Call','Chemist Call','Expense Entry','Expense Approval','User Master','Product Master','Reports','Sales']) {
      for (const action of ['view','create','update','approve']) {
        const permission = await ensure(M.Permission, { module, action });
        await ensure(M.RolePermission, { role_id: admin.id, permission_id: permission.id });
      }
    }
    for (const [expense_type, short_name] of [['Daily Allowance','DA'],['Travel Allowance','TA'],['Accommodation','HOTEL'],['Mobile','MOBILE'],['Miscellaneous','MISC']]) {
      await ensure(M.ExpenseType, { short_name }, { expense_type });
    }
    for (const [travel_type, short_name, requires_distance] of [['Bike','BIKE',true],['Car','CAR',true],['Bus','BUS',false],['Train','TRAIN',false],['Flight','FLIGHT',false],['Auto','AUTO',true]]) {
      await ensure(M.TravelMode, { short_name }, { travel_type, requires_distance });
    }
    for (const [type_name, short_name] of [['Gift','GIFT'],['Promotional Material','PROMO'],['Literature','LIT']]) await ensure(M.InputType, { type_name }, { short_name });
    for (const [class_name, short_name] of [['Regular','REG'],['Premium','PREM']]) await ensure(M.InputClass, { class_name }, { short_name });
    const general = await ensure(M.Division, { division_name: 'General' }, { code: 'GEN', short_name: 'GEN' });
    for (const [designation, days, calls] of [['MR',20,11],['TBM',18,10],['ABM',20,8],['RBM',18,6],['ZBM',15,5],['NSM',15,4]]) {
      const chemist_calls = calls >= 8 ? 3 : 2;
      await ensure(M.CallAverageSetup, { designation }, { min_field_working_days: days, daily_calls: calls, doctor_calls: calls-chemist_calls, chemist_calls, monthly_calls: days*calls, quarterly_calls: days*calls*3, yearly_calls: days*calls*12, effective_from: '2026-01-01' });
      await ensure(M.CoverageSetup, { designation, doctor_list_type: 'Core' }, { effective_from: '2026-01-01' });
      await ensure(M.WorkTypeSetup, { designation }, { effective_from: '2026-01-01' });
    }
    for (const [type_name, short_name, requires_gps] of [['Field Work','FW',true],['Office Work','OW',false],['Leave','LV',false],['Holiday','HOL',false],['Meeting','MTG',false],['Training','TRN',false]]) {
      await ensure(M.WorkTypeMaster, { type_name }, { short_name, requires_gps });
    }
    for (const [leave_type, leave_type_name, max_days_per_year] of [['CL','Casual Leave',12],['SL','Sick Leave',10],['EL','Earned Leave',15],['ML','Maternity Leave',90],['PL','Paternity Leave',7]]) {
      await ensure(M.LeavePolicyMaster, { leave_type }, { leave_type_name, max_days_per_year });
    }
    for (const product of await M.Product.findAll({ transaction })) {
      const values = {};
      if (!product.division_id) values.division_id = general.id;
      if (!product.category_id && product.category) values.category_id = (await ensure(M.ProductCategory, { category_name: product.category })).id;
      if (!product.pack_size_id && product.packSize) values.pack_size_id = (await ensure(M.PackSize, { pack_size: product.packSize })).id;
      if (!product.brand_group_id && product.brand) values.brand_group_id = (await ensure(M.BrandGroup, { brand_group_name: product.brand }, { division_id: general.id })).id;
      if (!product.unique_id) values.unique_id = product.code || `PROD-${product.id}`;
      if (Object.keys(values).length) await product.update(values, { transaction });
    }
    for (const doctor of await M.Doctor.findAll({ transaction })) {
      const values = {};
      if (!doctor.full_address && doctor.address) values.full_address = doctor.address;
      if (!doctor.mobile_number && doctor.phone && doctor.phone.length <= 15) values.mobile_number = doctor.phone;
      if (Object.keys(values).length) await doctor.update(values, { transaction });
    }
  });
  console.log('Reference defaults and legacy product links initialized; existing passwords preserved.');
}
main().then(() => db.close()).catch(async e => { console.error(e.message); await db.close(); process.exitCode = 1; });
