// Exercise authenticated portal API reads through the Vite proxy.
const assert = require('node:assert/strict');
const base = process.env.SMOKE_API_URL || 'http://127.0.0.1:3000/api';
async function main() {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.SMOKE_EMAIL || 'admin@pamsforce.com', password: process.env.SMOKE_PASSWORD || 'admin123' }) });
  assert.equal(login.status, 200, `Login failed: ${await login.clone().text()}`);
  const { token } = await login.json();
  assert.ok(token);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const paths = ['auth/profile','admin/dashboard-stats','admin/recent-activity','admin/users',
    ...['activity','sales','projection','performance','daily-visits','monthly-stats'].map(type=>`admin/reports?type=${type}&startDate=2025-01-01&endDate=2026-12-31`),
    'users','doctors','chemists','territories','headquarters','activities','sales','daycalls','projections','business','notifications',
    ...['targets','module-projections','primary','secondary','expiry','locks','dashboard','reports'].map(p=>`sales/${p}?financial_year=2026-2027&month=11`),
    'products','products/divisions','products/categories','products/pack-sizes','products/brand-groups','products/strengths',
    ...['doctor-classes','doctor-categories','doctor-specialties','doctor-qualifications','inputs','input-types','input-classes','samples','patches','stockists','hospitals','svl','input-allocations','notices','sop-policies','rate-fixations','audit-logs','data-counts'].map(p=>`master/${p}`),
    'roles','roles/permissions/all',...['expense-types','travel-modes','fare-charts','report?user_id=1&month=11&year=2026',''].map(p=>`expenses/${p}`),
    ...['call-average','coverage','work-type','work-type-master','leave-policy','compliance'].map(p=>`system-setup/${p}`),
    ...['dashboard','campaigns','strategies','rcpa'].map(p=>`marketing/${p}`)];
  let failures = 0;
  for (const p of paths) {
    const r = await fetch(`${base}/${p}`, { headers });
    if (!r.ok) { failures++; console.error('FAIL', r.status, p, (await r.text()).slice(0,350)); }
    else console.log('PASS', p);
  }
  console.log(`${paths.length - failures}/${paths.length} authenticated endpoint checks passed`);
  assert.equal(failures, 0);
}
main().catch(e=>{ console.error(e.message); process.exitCode=1; });
