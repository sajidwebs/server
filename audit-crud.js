// Creates only AUDIT-prefixed disposable records and removes them in reverse order.
// Run against a local API process connected to the intended test/database environment.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('./audit-http');
const db = require('./config/database');
const M = require('./models');
const base = process.env.SMOKE_API_URL || 'http://127.0.0.1:5060/api';
const suffix = crypto.randomBytes(4).toString('hex');
const tag = `AUDIT-${suffix}`;
const refs = {};
const cleanup = [];
const results = [];
let token;
async function request(path, method = 'GET', data, expected = [200, 201]) {
  const response = await http(`${base}/${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  const body = await response.json();
  assert.ok(expected.includes(response.status), `${method} ${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}
const fixture = (model, path, field, payload, options = {}) => ({ model, path, field, payload, ...options });
const fixtures = [
  fixture('Headquarter', 'headquarters', 'name', () => ({ name: tag, code: tag, state: 'Odisha', region: 'East', zone: 'East' })),
  fixture('Territory', 'territories', 'name', () => ({ name: tag, code: tag, state: 'Odisha', region: 'East', district: 'Khordha', hq_id: refs.Headquarter })),
  fixture('Role', 'roles', 'role_name', () => ({ role_name: tag, short_name: suffix })),
  fixture('User', 'admin/users', 'firstName', () => ({ firstName: tag, lastName: 'Test', email: `${tag}@example.invalid`, password: crypto.randomBytes(18).toString('hex'), role: 'user', hq_id: refs.Headquarter, territory_id: refs.Territory })),
  fixture('DoctorClass', 'master/doctor-classes', 'class_name', () => ({ class_name: tag, short_name: suffix })),
  fixture('DoctorCategory', 'master/doctor-categories', 'category_name', () => ({ category_name: tag, short_name: suffix })),
  fixture('DoctorSpecialty', 'master/doctor-specialties', 'specialty_name', () => ({ specialty_name: tag, short_name: suffix })),
  fixture('DoctorQualification', 'master/doctor-qualifications', 'qualification_name', () => ({ qualification_name: tag, short_name: suffix })),
  fixture('Doctor', 'doctors', 'firstName', () => ({ firstName: tag, lastName: 'Test', specialty_id: refs.DoctorSpecialty, hq_id: refs.Headquarter, territory_id: refs.Territory, email: `${tag}@example.invalid` })),
  fixture('Chemist', 'chemists', 'name', () => ({ name: tag, location: 'Sample Location', email: `${tag}@example.invalid`, hq_id: refs.Headquarter, territory_id: refs.Territory })),
  fixture('Division', 'products/divisions', 'division_name', () => ({ division_name: tag, code: tag, short_name: suffix })),
  fixture('ProductCategory', 'products/categories', 'category_name', () => ({ category_name: tag, short_name: suffix })),
  fixture('PackSize', 'products/pack-sizes', 'pack_size', () => ({ pack_size: tag, short_name: suffix })),
  fixture('BrandGroup', 'products/brand-groups', 'brand_group_name', () => ({ brand_group_name: tag, short_name: suffix, division_id: refs.Division })),
  fixture('Strength', 'products/strengths', 'strength_value', () => ({ strength_value: tag, short_name: suffix })),
  fixture('Product', 'products', 'name', () => ({ name: tag, unique_id: tag, code: tag, division_id: refs.Division, category_id: refs.ProductCategory, brand_group_id: refs.BrandGroup, pack_size_id: refs.PackSize, strength_id: refs.Strength, ptr: 80, mrp: 100 })),
  fixture('InputType', 'master/input-types', 'type_name', () => ({ type_name: tag, short_name: suffix })),
  fixture('InputClass', 'master/input-classes', 'class_name', () => ({ class_name: tag, short_name: suffix })),
  fixture('InputMaster', 'master/inputs', 'input_name', () => ({ input_name: tag, short_name: suffix, input_type_id: refs.InputType, input_class_id: refs.InputClass })),
  fixture('SampleMaster', 'master/samples', 'sample_name', () => ({ sample_name: tag, product_id: refs.Product, pack_size_id: refs.PackSize, sample_qty: 1 })),
  fixture('Patch', 'master/patches', 'patch_name', () => ({ patch_name: tag, state: 'Odisha', hq_id: refs.Headquarter })),
  fixture('Stockist', 'master/stockists', 'stockist_name', () => ({ stockist_name: tag, state: 'Odisha', hq_id: refs.Headquarter, territory_id: refs.Territory })),
  fixture('Hospital', 'master/hospitals', 'hospital_name', () => ({ hospital_name: tag, state: 'Odisha', hq_id: refs.Headquarter, territory_id: refs.Territory })),
  fixture('SVL', 'master/svl', null, () => ({ doctor_id: refs.Doctor, hq_id: refs.Headquarter, year: 2026 })),
  fixture('InputAllocation', 'master/input-allocations', 'product_input', () => ({ user_id: refs.User, input_id: refs.InputMaster, product_input: tag, qty: 1, start_date: '2026-11-01', end_date: '2026-11-30' })),
  fixture('NoticeUpload', 'master/notices', 'title', () => ({ notice_id: tag, title: tag, notice_document: 'https://example.invalid/sample.pdf', effective_date: '2026-11-01' })),
  fixture('SOPPolicy', 'master/sop-policies', 'designation', () => ({ designation: tag, start_date: '2026-11-01', sop_document: 'https://example.invalid/sample.pdf' })),
  fixture('RateFixation', 'master/rate-fixations', 'state', () => ({ state: tag, product_id: refs.Product, effective_from: '2026-11-01', ptr: 80 })),
  fixture('ExpenseType', 'expenses/expense-types', 'expense_type', () => ({ expense_type: tag, short_name: suffix })),
  fixture('TravelMode', 'expenses/travel-modes', 'travel_type', () => ({ travel_type: tag, short_name: suffix })),
  fixture('StandardFareChart', 'expenses/fare-charts', 'employee_name', () => ({ employee_name: tag, designation: 'MR', effective_from: '2026-11-01', employee_id: refs.User })),
  fixture('Expense', 'expenses', 'remarks', () => ({ user_id: refs.User, month: '11', year: '2026', date: '2026-11-15', remarks: tag, hq_id: refs.Headquarter, territory_id: refs.Territory })),
  fixture('CallAverageSetup', 'system-setup/call-average', 'doctor_calls', () => ({ designation: tag, doctor_calls: 0, chemist_calls: 0 }), { update: { doctor_calls: 0 }, verifyField: 'doctor_calls', verifyValue: 0 }),
  fixture('CoverageSetup', 'system-setup/coverage', 'designation', () => ({ designation: tag })),
  fixture('WorkTypeSetup', 'system-setup/work-type', 'field_work_days', () => ({ designation: tag }), { update: { field_work_days: 0 }, verifyField: 'field_work_days', verifyValue: 0 }),
  fixture('WorkTypeMaster', 'system-setup/work-type-master', null, () => ({ type_name: tag, short_name: suffix }), { noDelete: true }),
  fixture('LeavePolicyMaster', 'system-setup/leave-policy', 'leave_type_name', () => ({ leave_type: tag, leave_type_name: tag })),
  fixture('Activity', 'activities', 'title', () => ({ title: tag, date: '2026-11-15', doctorId: refs.Doctor })),
  fixture('DayCall', 'daycalls', 'purpose', () => ({ date: '2026-11-15', purpose: tag })),
  fixture('Business', 'business', 'productName', () => ({ doctorId: refs.Doctor, productId: refs.Product, productName: tag, quantity: 1, amount: 80, month: 11, year: 2026, date: '2026-11-15' })),
  fixture('Projection', 'projections', 'productName', () => ({ productId: refs.Product, productName: tag, month: 11, year: 2026, projectedQuantity: 1, projectedAmount: 80 })),
  fixture('Notification', 'notifications', 'title', () => ({ userId: refs.User, title: tag, message: 'Disposable audit notification' }), { update: { isRead: true }, updateSuffix: '/read', listQuery: () => `?userId=${refs.User}`, verifyField: 'isRead', verifyValue: true }),
  fixture('MarketingCampaign', 'marketing/campaigns', 'campaign_name', () => ({ campaign_code: tag, campaign_name: tag, start_date: '2026-11-01', end_date: '2026-11-30' }), { deletedStatus: 'cancelled' }),
  fixture('MarketingBrandStrategy', 'marketing/strategies', 'activity_name', () => ({ financial_year: '2026-2027', brand_name: tag, activity_name: tag })),
  fixture('MarketingRCPA', 'marketing/rcpa', 'rcpa_name', () => ({ rcpa_code: tag, rcpa_name: tag }), { deletedStatus: 'closed' })
];

async function main() {
  if (!['localhost', '127.0.0.1', '::1'].includes(db.config.host) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname) ||
      !/(^|_)(test|audit|crud)(_|$)/i.test(db.config.database)) {
    throw new Error('Write audits require an isolated LOCAL database and LOCAL API. Production or hosted databases are not permitted.');
  }
  const health = await (await http(`${new URL(base).origin}/health`)).json();
  assert.equal(health.testDatabase, db.config.database, 'The API must run in test mode against the same isolated database.');
  assert.equal(health.testHost, db.config.host);
  if (!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD) throw new Error('Set SMOKE_EMAIL and SMOKE_PASSWORD.');
  const login = await request('auth/login', 'POST', { email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD });
  token = login.token;
  try {
  for (const item of fixtures) {
    let id;
    try {
      const payload = item.payload();
      const response = await request(item.path, 'POST', payload);
      const record = response.id ? response : Object.values(response).find(value => value && typeof value === 'object' && value.id);
      assert.ok(record?.id, `Missing created ID: ${item.path}`);
      id = record.id;
      refs[item.model] = id;
      if (item.model === 'User') refs.testPassword = payload.password;
      cleanup.push({ ...item, id });
      const list = await request(item.path + (item.listQuery?.() || ''));
      const records = Array.isArray(list) ? list : Object.values(list).find(Array.isArray);
      assert.ok(records?.some(row => row.id === id), `Created record absent from list: ${item.path}`);
      if (item.field) {
        const update = item.update || { ...payload, [item.field]: `${tag} Updated` };
        await request(`${item.path}/${id}${item.updateSuffix || ''}`, 'PUT', update);
        const saved = await M[item.model].findByPk(id);
        assert.equal(saved[item.verifyField || item.field], item.verifyValue ?? `${tag} Updated`, `Update was not saved: ${item.path}`);
      }
      results.push({ path: item.path, status: 'PASS', create: true, read: true, update: Boolean(item.field) });
      console.log('PASS create/read/update', item.path);
    } catch (error) {
      results.push({ path: item.path, status: 'FAIL', error: error.message });
      console.error('FAIL', item.path, error.message);
    }
  }
  // Negative cases must return actionable client errors without corrupting records.
  await request('territories', 'POST', {}, [400]);
  await request('territories', 'POST', { name: tag, code: tag, region: 'East', state: 'Odisha', district: 'Khordha' }, [400, 409]);
  await request('territories', 'POST', { name: tag, code: `${tag}-FK`, region: 'East', state: 'Odisha', district: 'Khordha', hq_id: 2147483647 }, [409]);
  await request('doctors/2147483647', 'GET', undefined, [404]);
  await request('admin/reports?type=projection&startDate=invalid&endDate=2026-11-30', 'GET', undefined, [400]);
  await request(`admin/users/${login.user.id}`, 'DELETE', undefined, [409]);
  const newPassword = crypto.randomBytes(18).toString('hex');
  await request(`admin/users/${refs.User}`, 'PUT', { password: newPassword });
  const normalUser = await request('auth/login', 'POST', { email: `${tag}@example.invalid`, password: newPassword });
  const adminToken = token;
  token = normalUser.token;
  await request(`admin/users/${refs.User}`, 'PUT', { firstName: 'Denied' }, [403]);
  await request(`users/${refs.User}`, 'PUT', { role: 'admin' }, [403]);
  await request('system-setup/call-average', 'POST', { designation: 'Denied' }, [403]);
  token = adminToken;
  await request(`admin/users/${refs.User}`, 'PUT', { isActive: false });
  token = normalUser.token;
  await request('auth/profile', 'GET', undefined, [401]);
  token = adminToken;
  console.log('PASS validation, duplicate, foreign key, missing record, report dates, self-delete, password update, permissions and disabled-token checks');
  } finally {
  // Reverse order respects dependencies. Only records created by this run are touched.
  for (const item of [...cleanup].reverse()) {
    try {
      if (!item.noDelete) {
        await request(`${item.path}/${item.id}`, 'DELETE');
        const record = await M[item.model].findByPk(item.id);
        assert.ok(!record || record.isActive === false || record.status === (item.deletedStatus || 'inactive'), `Delete did not remove/deactivate ${item.path}`);
        console.log('PASS delete', item.path);
      }
    } catch (error) {
      results.push({ path: item.path, status: 'FAIL', operation: 'delete', error: error.message });
      console.error('FAIL delete', item.path, error.message);
    }
    // Soft deletes and linked metadata are cleaned up as test artifacts only.
    if (item.model === 'Product') await M.ProductPriceHistory.destroy({ where: { product_id: item.id } });
    if (item.model === 'Patch') await M.PatchHeadquarter.destroy({ where: { patch_id: item.id } });
    await M.AuditLog.destroy({ where: { table_name: M[item.model].tableName, record_id: item.id } });
    await M[item.model].destroy({ where: { id: item.id } });
  }
  }
  console.log('CRUD AUDIT SUMMARY', JSON.stringify({ resources: fixtures.length,
    passed: results.filter(result => result.status === 'PASS').length,
    failures: results.filter(result => result.status === 'FAIL') }));
  assert.equal(results.filter(result => result.status === 'FAIL').length, 0);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.close());
