const sequelize = require('./config/database');
const {
  User,
  Doctor,
  Headquarter,
  Product,
  InputMaster,
  SampleMaster,
  Chemist,
  Sale
} = require('./models');

const tableNames = [
  'patches',
  'patch_headquarters',
  'stockists',
  'hospitals',
  'svl',
  'input_allocations',
  'notice_uploads',
  'sop_policies',
  'rate_fixations'
];

async function addCompatibilityColumns() {
  for (const table of tableNames) {
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`);
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await sequelize.query(`UPDATE ${table} SET "isActive" = COALESCE(is_active, true) WHERE "isActive" IS NULL`);
    await sequelize.query(`UPDATE ${table} SET "createdAt" = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE "createdAt" IS NULL`);
    await sequelize.query(`UPDATE ${table} SET "updatedAt" = COALESCE(updated_at, CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL`);
  }
}

async function count(table) {
  const [rows] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return rows[0].count;
}

async function seedGovernanceData() {
  const admin = await User.findOne({ where: { email: 'admin@pamsforce.com' } });
  const user = await User.findOne({ where: { isActive: true } });
  const doctor = await Doctor.findOne({ where: { isActive: true } });
  const chemist = await Chemist.findOne({ where: { isActive: true } });
  const hq = await Headquarter.findOne({ where: { isActive: true } });
  const product = await Product.findOne();
  const input = await InputMaster.findOne();
  const sample = await SampleMaster.findOne();
  const actorId = admin?.id || user?.id || 1;

  let patchId;
  if (await count('patches') === 0 && hq) {
    const [rows] = await sequelize.query(
      `INSERT INTO patches (patch_name, state, hq_id, pincode, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES ('Central Patch', :state, :hqId, '751001', true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      { replacements: { state: hq.state || 'Odisha', hqId: hq.id, actorId } }
    );
    patchId = rows[0].id;
  } else {
    const [rows] = await sequelize.query(`SELECT id FROM patches ORDER BY id LIMIT 1`);
    patchId = rows[0]?.id;
  }

  if (patchId && hq && await count('patch_headquarters') === 0) {
    await sequelize.query(
      `INSERT INTO patch_headquarters (patch_id, hq_id, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES (:patchId, :hqId, true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      { replacements: { patchId, hqId: hq.id, actorId } }
    );
  }

  if (await count('stockists') === 0 && hq) {
    await sequelize.query(
      `INSERT INTO stockists (stockist_name, mobile, contact_person, hq_id, state, address, patch_id, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES ('PAMS Central Stockist', '9876500101', 'Ramesh Kumar', :hqId, :state, 'Main Market', :patchId, true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: { hqId: hq.id, state: hq.state || 'Odisha', patchId, actorId } }
    );
  }

  if (await count('hospitals') === 0 && hq) {
    await sequelize.query(
      `INSERT INTO hospitals (hospital_name, mobile, contact_person, hq_id, state, address, patch_id, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES ('City Care Hospital', '9876500102', 'Dr Admin Desk', :hqId, :state, 'Station Road', :patchId, true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: { hqId: hq.id, state: hq.state || 'Odisha', patchId, actorId } }
    );
  }

  if (await count('svl') === 0 && doctor && hq) {
    await sequelize.query(
      `INSERT INTO svl (doctor_id, hq_id, visit_frequency, priority, year, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES (:doctorId, :hqId, 'Weekly', 1, EXTRACT(YEAR FROM CURRENT_DATE)::int, true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      { replacements: { doctorId: doctor.id, hqId: hq.id, actorId } }
    );
  }

  if (await count('input_allocations') === 0 && user && input) {
    await sequelize.query(
      `INSERT INTO input_allocations (user_id, input_id, product_input, qty, start_date, end_date, allocation_type, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES (:userId, :inputId, 'LBL', 50, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 'quarterly', true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: { userId: user.id, inputId: input.id, actorId } }
    );
  }

  if (await count('notice_uploads') === 0) {
    await sequelize.query(
      `INSERT INTO notice_uploads (notice_id, title, notice_document, effective_date, audience, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES ('NOTICE-001', 'Monthly field plan notice', 'notice-001.pdf', CURRENT_DATE, 'all', true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: { actorId } }
    );
  }

  if (await count('sop_policies') === 0) {
    await sequelize.query(
      `INSERT INTO sop_policies (designation, sop_document, probation_policy, regular_policy, whistle_blower_policy, start_date, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES ('MR', 'mr-sop.pdf', 'Probation users follow manager-approved daily reporting.', 'Regular users follow monthly coverage and call-average policy.', 'Report policy violations to HO.', CURRENT_DATE, true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: { actorId } }
    );
  }

  if (await count('rate_fixations') === 0 && product) {
    await sequelize.query(
      `INSERT INTO rate_fixations (state, product_id, sample_id, input_id, pts, ptr, mrp, nrv, effective_from, is_active, "isActive", created_by, created_at, updated_at, "createdAt", "updatedAt")
       VALUES (:state, :productId, :sampleId, :inputId, 80.00, 95.00, 120.00, 75.00, CURRENT_DATE, true, true, :actorId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: { state: hq?.state || 'Odisha', productId: product.id, sampleId: sample?.id || null, inputId: input?.id || null, actorId } }
    );
  }

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  const currentDate = new Date().toISOString().slice(0, 10);
  const salesThisMonth = await Sale.count({
    where: {
      date: {
        [require('sequelize').Op.gte]: currentMonthStart.toISOString().slice(0, 10)
      }
    }
  });

  if (salesThisMonth === 0 && user && product) {
    await Sale.create({
      userId: user.id,
      productId: product.id,
      productName: product.name,
      quantity: 25,
      price: 120,
      totalAmount: 3000,
      chemistId: chemist?.id || null,
      date: currentDate
    });
  }
}

async function main() {
  await sequelize.authenticate();
  await addCompatibilityColumns();
  await seedGovernanceData();

  for (const table of [...tableNames, 'sales']) {
    console.log(`${table}: ${await count(table)}`);
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error(error);
  await sequelize.close();
  process.exit(1);
});
