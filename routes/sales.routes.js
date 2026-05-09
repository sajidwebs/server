const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Sale, Projection, User, Product, Stockist, Headquarter, Territory } = require('../models');
const { authenticate } = require('../middleware/auth');

const roleRank = { admin: 100, nsm: 90, zbm: 80, rbm: 70, abm: 60, tbm: 50, mr: 40, user: 10 };
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const normalizeRole = (role = '') => role.toLowerCase().replace(/[^a-z]/g, '');
const userRank = (user) => roleRank[normalizeRole(user?.role)] || (normalizeRole(user?.role).includes('admin') ? 100 : 10);
const isAdminLike = (user) => userRank(user) >= 90 || normalizeRole(user?.role).includes('admin');

const ensureSalesTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS sales_targets (
      id SERIAL PRIMARY KEY, user_id INTEGER, hq_id INTEGER, territory_id INTEGER, product_id INTEGER NOT NULL,
      financial_year VARCHAR(20) NOT NULL, month INTEGER NOT NULL, target_strip INTEGER DEFAULT 0,
      rate DECIMAL(12,2) DEFAULT 0, target_value DECIMAL(14,2) DEFAULT 0,
      state VARCHAR(255), region VARCHAR(255), zone VARCHAR(255), division VARCHAR(255),
      created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_projection_entries (
      id SERIAL PRIMARY KEY, user_id INTEGER, hq_id INTEGER, territory_id INTEGER, product_id INTEGER NOT NULL,
      financial_year VARCHAR(20) NOT NULL, month INTEGER NOT NULL, projection_strip INTEGER DEFAULT 0,
      rate DECIMAL(12,2) DEFAULT 0, projection_value DECIMAL(14,2) DEFAULT 0,
      state VARCHAR(255), region VARCHAR(255), zone VARCHAR(255), division VARCHAR(255),
      created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS primary_sales (
      id SERIAL PRIMARY KEY, stockist_id INTEGER, invoice_no VARCHAR(255) NOT NULL, product_id INTEGER NOT NULL,
      batch_number VARCHAR(255), quantity_strip INTEGER DEFAULT 0, rate DECIMAL(12,2) DEFAULT 0,
      total_value DECIMAL(14,2) DEFAULT 0, sale_date DATE DEFAULT CURRENT_DATE,
      financial_year VARCHAR(20), month INTEGER, created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS secondary_sales (
      id SERIAL PRIMARY KEY, hq_id INTEGER, user_id INTEGER, stockist_id INTEGER, product_id INTEGER NOT NULL,
      financial_year VARCHAR(20) NOT NULL, month INTEGER NOT NULL, opening_strip INTEGER DEFAULT 0,
      opening_value DECIMAL(14,2) DEFAULT 0, sale_strip INTEGER DEFAULT 0, sale_value DECIMAL(14,2) DEFAULT 0,
      closing_strip INTEGER DEFAULT 0, closing_value DECIMAL(14,2) DEFAULT 0, rate DECIMAL(12,2) DEFAULT 0,
      state VARCHAR(255), region VARCHAR(255), zone VARCHAR(255), division VARCHAR(255),
      created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS expiry_entries (
      id SERIAL PRIMARY KEY, stockist_id INTEGER, credit_note_no VARCHAR(255) NOT NULL, product_id INTEGER NOT NULL,
      batch_number VARCHAR(255), quantity_strip INTEGER DEFAULT 0, rate DECIMAL(12,2) DEFAULT 0,
      total_value DECIMAL(14,2) DEFAULT 0, entry_date DATE DEFAULT CURRENT_DATE,
      financial_year VARCHAR(20), month INTEGER, created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_month_locks (
      id SERIAL PRIMARY KEY, financial_year VARCHAR(20) NOT NULL, month INTEGER NOT NULL,
      is_locked BOOLEAN DEFAULT false, locked_by INTEGER, locked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(financial_year, month)
    )`
  ];

  for (const query of queries) await sequelize.query(query);
  const alterQueries = [
    'ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS state VARCHAR(255)',
    'ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS region VARCHAR(255)',
    'ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS zone VARCHAR(255)',
    'ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS division VARCHAR(255)'
  ];
  for (const query of alterQueries) await sequelize.query(query);
};

const parseNumber = (value) => Number(value || 0);
const money = (value) => Number(parseFloat(value || 0).toFixed(2));
const monthFromDate = (date) => date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;
const financialYearFromDate = (date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  return d.getMonth() + 1 >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const hierarchyUserIds = async (user) => {
  if (isAdminLike(user)) return null;
  const users = await User.findAll({ attributes: ['id', 'reportingTo', 'assigned_manager_id', 'role'] });
  const byManager = new Map();
  users.forEach((item) => {
    const plain = item.get({ plain: true });
    [plain.reportingTo, plain.assigned_manager_id].filter(Boolean).forEach((managerId) => {
      if (!byManager.has(managerId)) byManager.set(managerId, []);
      byManager.get(managerId).push(plain.id);
    });
  });

  const visible = new Set([user.id]);
  const queue = [user.id];
  while (queue.length) {
    const id = queue.shift();
    (byManager.get(id) || []).forEach((childId) => {
      if (!visible.has(childId)) {
        visible.add(childId);
        queue.push(childId);
      }
    });
  }
  return Array.from(visible);
};

const appendVisibility = async (req, where, params) => {
  const ids = await hierarchyUserIds(req.user);
  if (!ids) return { where, params };
  return {
    where: `${where} AND (user_id IS NULL OR user_id IN (:visibleUserIds))`,
    params: { ...params, visibleUserIds: ids }
  };
};

const selectRows = async (table, req, extraWhere = '1=1', extraParams = {}) => {
  await ensureSalesTables();
  let where = extraWhere;
  let params = extraParams;
  if (req.query.financial_year) {
    where += ' AND financial_year = :financial_year';
    params.financial_year = req.query.financial_year;
  }
  if (req.query.month) {
    where += ' AND month = :month';
    params.month = Number(req.query.month);
  }
  if (req.query.product_id && req.query.product_id !== 'all') {
    where += ' AND product_id = :product_id';
    params.product_id = Number(req.query.product_id);
  }
  if (req.query.user_id && req.query.user_id !== 'all') {
    where += ' AND user_id = :user_id';
    params.user_id = Number(req.query.user_id);
  }
  if (['sales_targets', 'sales_projection_entries', 'secondary_sales'].includes(table)) {
    if (req.query.hq_id && req.query.hq_id !== 'all') {
      where += ' AND hq_id = :hq_id';
      params.hq_id = Number(req.query.hq_id);
    }
    if (req.query.state && req.query.state !== 'all') {
      where += ' AND state = :state';
      params.state = req.query.state;
    }
  }
  if (['sales_targets', 'sales_projection_entries', 'secondary_sales'].includes(table)) {
    ({ where, params } = await appendVisibility(req, where, params));
  }

  return sequelize.query(
    `SELECT * FROM ${table} WHERE ${where} ORDER BY financial_year DESC NULLS LAST, month DESC NULLS LAST, id DESC`,
    { replacements: params, type: QueryTypes.SELECT }
  );
};

const insertRow = async (table, payload) => {
  const keys = Object.keys(payload).filter((key) => payload[key] !== undefined);
  const columns = keys.map((key) => `"${key}"`).join(', ');
  const values = keys.map((key) => `:${key}`).join(', ');
  const [row] = await sequelize.query(
    `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *`,
    { replacements: payload, type: QueryTypes.SELECT }
  );
  return row;
};

const isMonthLocked = async (financialYear, month) => {
  if (!financialYear || !month) return false;
  await ensureSalesTables();
  const [lock] = await sequelize.query(
    'SELECT is_locked FROM sales_month_locks WHERE financial_year = :financialYear AND month = :month',
    { replacements: { financialYear, month: Number(month) }, type: QueryTypes.SELECT }
  );
  return lock?.is_locked === true;
};

const assertMonthOpen = async (financialYear, month) => {
  if (await isMonthLocked(financialYear, month)) {
    const error = new Error('This sales month is frozen. Unlock the month before adding or updating sales entries.');
    error.statusCode = 423;
    throw error;
  }
};

const handleRouteError = (res, error, fallback) => {
  res.status(error.statusCode || 500).json({ message: error.message || fallback });
};

const applyGeo = async (payload) => {
  const result = { ...payload };
  if (result.hq_id && (!result.state || !result.region || !result.zone)) {
    const hq = await Headquarter.findByPk(result.hq_id);
    if (hq) {
      result.state = result.state || hq.state;
      result.region = result.region || hq.region;
      result.zone = result.zone || hq.zone;
    }
  }
  if (result.territory_id && (!result.state || !result.region || !result.zone || !result.hq_id)) {
    const territory = await Territory.findByPk(result.territory_id);
    if (territory) {
      result.hq_id = result.hq_id || territory.hq_id;
      result.state = result.state || territory.state;
      result.region = result.region || territory.region;
      result.zone = result.zone || territory.zone;
    }
  }
  return result;
};

const makeTargetPayload = async (body, user) => {
  const rate = parseNumber(body.rate);
  const targetStrip = parseNumber(body.target_strip);
  return applyGeo({
    user_id: body.user_id || user.id,
    hq_id: body.hq_id || null,
    territory_id: body.territory_id || null,
    product_id: body.product_id,
    financial_year: body.financial_year,
    month: Number(body.month),
    target_strip: targetStrip,
    rate,
    target_value: money(body.target_value || targetStrip * rate),
    state: body.state || null,
    region: body.region || null,
    zone: body.zone || null,
    division: body.division || null,
    created_by: user.id
  });
};

const makeProjectionPayload = async (body, user) => {
  const rate = parseNumber(body.rate);
  const projectionStrip = parseNumber(body.projection_strip);
  return applyGeo({
    user_id: body.user_id || user.id,
    hq_id: body.hq_id || null,
    territory_id: body.territory_id || null,
    product_id: body.product_id,
    financial_year: body.financial_year,
    month: Number(body.month),
    projection_strip: projectionStrip,
    rate,
    projection_value: money(body.projection_value || projectionStrip * rate),
    state: body.state || null,
    region: body.region || null,
    zone: body.zone || null,
    division: body.division || null,
    created_by: user.id
  });
};

router.get('/', authenticate, async (req, res) => {
  try {
    const sales = await Sale.findAll({ order: [['date', 'DESC']] });
    res.json({ message: 'Sales retrieved successfully', sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const saleData = { ...req.body, userId: req.body.userId || req.user.id };
    saleData.totalAmount = saleData.totalAmount || money(parseNumber(saleData.quantity) * parseNumber(saleData.price));
    const newSale = await Sale.create(saleData);
    res.status(201).json({ message: 'Sale created successfully', sale: newSale });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sale' });
  }
});

router.get('/targets', authenticate, async (req, res) => res.json({ targets: await selectRows('sales_targets', req) }));
router.post('/targets', authenticate, async (req, res) => {
  try {
    await assertMonthOpen(req.body.financial_year, req.body.month);
    res.status(201).json({ target: await insertRow('sales_targets', await makeTargetPayload(req.body, req.user)) });
  } catch (error) {
    handleRouteError(res, error, 'Error creating target');
  }
});

router.get('/module-projections', authenticate, async (req, res) => res.json({ projections: await selectRows('sales_projection_entries', req) }));
router.post('/module-projections', authenticate, async (req, res) => {
  try {
    await assertMonthOpen(req.body.financial_year, req.body.month);
    res.status(201).json({ projection: await insertRow('sales_projection_entries', await makeProjectionPayload(req.body, req.user)) });
  } catch (error) {
    handleRouteError(res, error, 'Error creating projection');
  }
});

router.get('/primary', authenticate, async (req, res) => res.json({ primarySales: await selectRows('primary_sales', req) }));
router.post('/primary', authenticate, async (req, res) => {
  try {
    const saleDate = req.body.sale_date || new Date().toISOString().slice(0, 10);
    const financialYear = req.body.financial_year || financialYearFromDate(saleDate);
    const month = req.body.month || monthFromDate(saleDate);
    await assertMonthOpen(financialYear, month);
    const quantity = parseNumber(req.body.quantity_strip);
    const rate = parseNumber(req.body.rate);
    const primarySale = await insertRow('primary_sales', {
      stockist_id: req.body.stockist_id || null,
      invoice_no: req.body.invoice_no,
      product_id: req.body.product_id,
      batch_number: req.body.batch_number || null,
      quantity_strip: quantity,
      rate,
      total_value: money(req.body.total_value || quantity * rate),
      sale_date: saleDate,
      financial_year: financialYear,
      month,
      created_by: req.user.id
    });
    res.status(201).json({ primarySale });
  } catch (error) {
    handleRouteError(res, error, 'Error creating primary sale');
  }
});

router.get('/secondary', authenticate, async (req, res) => res.json({ secondarySales: await selectRows('secondary_sales', req) }));
router.post('/secondary', authenticate, async (req, res) => {
  try {
    await assertMonthOpen(req.body.financial_year, req.body.month);
    const rate = parseNumber(req.body.rate);
    const openingStrip = parseNumber(req.body.opening_strip);
    const saleStrip = parseNumber(req.body.sale_strip);
    const closingStrip = req.body.closing_strip !== undefined ? parseNumber(req.body.closing_strip) : Math.max(openingStrip - saleStrip, 0);
    const payload = await applyGeo({
      hq_id: req.body.hq_id || null,
      user_id: req.body.user_id || req.user.id,
      stockist_id: req.body.stockist_id || null,
      product_id: req.body.product_id,
      financial_year: req.body.financial_year,
      month: Number(req.body.month),
      opening_strip: openingStrip,
      opening_value: money(req.body.opening_value || openingStrip * rate),
      sale_strip: saleStrip,
      sale_value: money(req.body.sale_value || saleStrip * rate),
      closing_strip: closingStrip,
      closing_value: money(req.body.closing_value || closingStrip * rate),
      rate,
      created_by: req.user.id
    });
    res.status(201).json({ secondarySale: await insertRow('secondary_sales', payload) });
  } catch (error) {
    handleRouteError(res, error, 'Error creating secondary sale');
  }
});

router.get('/expiry', authenticate, async (req, res) => res.json({ expiryEntries: await selectRows('expiry_entries', req) }));
router.post('/expiry', authenticate, async (req, res) => {
  try {
    const entryDate = req.body.entry_date || new Date().toISOString().slice(0, 10);
    const financialYear = req.body.financial_year || financialYearFromDate(entryDate);
    const month = req.body.month || monthFromDate(entryDate);
    await assertMonthOpen(financialYear, month);
    const quantity = parseNumber(req.body.quantity_strip);
    const rate = parseNumber(req.body.rate);
    const expiryEntry = await insertRow('expiry_entries', {
      stockist_id: req.body.stockist_id || null,
      credit_note_no: req.body.credit_note_no,
      product_id: req.body.product_id,
      batch_number: req.body.batch_number || null,
      quantity_strip: quantity,
      rate,
      total_value: money(req.body.total_value || quantity * rate),
      entry_date: entryDate,
      financial_year: financialYear,
      month,
      created_by: req.user.id
    });
    res.status(201).json({ expiryEntry });
  } catch (error) {
    handleRouteError(res, error, 'Error creating expiry entry');
  }
});

router.get('/locks', authenticate, async (req, res) => {
  await ensureSalesTables();
  const locks = await sequelize.query('SELECT * FROM sales_month_locks ORDER BY financial_year DESC, month DESC', { type: QueryTypes.SELECT });
  res.json({ locks });
});

router.post('/locks', authenticate, async (req, res) => {
  await ensureSalesTables();
  const [lock] = await sequelize.query(
    `INSERT INTO sales_month_locks (financial_year, month, is_locked, locked_by, locked_at, updated_at)
     VALUES (:financial_year, :month, :is_locked, :locked_by, :locked_at, CURRENT_TIMESTAMP)
     ON CONFLICT (financial_year, month)
     DO UPDATE SET is_locked = EXCLUDED.is_locked, locked_by = EXCLUDED.locked_by, locked_at = EXCLUDED.locked_at, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    {
      replacements: {
        financial_year: req.body.financial_year,
        month: Number(req.body.month),
        is_locked: req.body.is_locked === true,
        locked_by: req.user.id,
        locked_at: req.body.is_locked ? new Date() : null
      },
      type: QueryTypes.SELECT
    }
  );
  res.status(201).json({ lock });
});

router.get('/dashboard', authenticate, async (req, res) => {
  await ensureSalesTables();
  const params = {
    financial_year: req.query.financial_year || financialYearFromDate(),
    month: Number(req.query.month || new Date().getMonth() + 1),
    product_id: req.query.product_id && req.query.product_id !== 'all' ? Number(req.query.product_id) : null,
    user_id: req.query.user_id && req.query.user_id !== 'all' ? Number(req.query.user_id) : null,
    hq_id: req.query.hq_id && req.query.hq_id !== 'all' ? Number(req.query.hq_id) : null,
    division_id: req.query.division_id && req.query.division_id !== 'all' ? Number(req.query.division_id) : null,
    state: req.query.state && req.query.state !== 'all' ? req.query.state : null
  };
  const productFilter = params.product_id ? ' AND product_id = :product_id' : '';
  const userFilter = params.user_id ? ' AND user_id = :user_id' : '';
  const hqFilter = params.hq_id ? ' AND hq_id = :hq_id' : '';
  const stateFilter = params.state ? ' AND state = :state' : '';
  const divisionFilter = params.division_id ? ' AND product_id IN (SELECT id FROM products WHERE division_id = :division_id)' : '';
  const [summary] = await sequelize.query(
    `SELECT
      COALESCE((SELECT SUM(target_value) FROM sales_targets WHERE financial_year = :financial_year AND month = :month${productFilter}${userFilter}${hqFilter}${stateFilter}${divisionFilter}), 0) AS target,
      COALESCE((SELECT SUM(projection_value) FROM sales_projection_entries WHERE financial_year = :financial_year AND month = :month${productFilter}${userFilter}${hqFilter}${stateFilter}${divisionFilter}), 0) AS projection,
      COALESCE((SELECT SUM(sale_value) FROM secondary_sales WHERE financial_year = :financial_year AND month = :month${productFilter}${userFilter}${hqFilter}${stateFilter}${divisionFilter}), 0) AS achieved,
      COALESCE((SELECT SUM(total_value) FROM primary_sales WHERE financial_year = :financial_year AND month = :month${productFilter}${divisionFilter}), 0) AS primary_sale,
      COALESCE((SELECT SUM(total_value) FROM expiry_entries WHERE financial_year = :financial_year AND month = :month${productFilter}${divisionFilter}), 0) AS expiry_value,
      COALESCE((SELECT is_locked FROM sales_month_locks WHERE financial_year = :financial_year AND month = :month), false) AS is_locked`,
    { replacements: params, type: QueryTypes.SELECT }
  );
  const target = parseNumber(summary.target);
  const achieved = parseNumber(summary.achieved);
  res.json({
    summary: {
      ...summary,
      monthName: monthNames[params.month - 1],
      financial_year: params.financial_year,
      achievementPercent: target ? money((achieved / target) * 100) : 0
    }
  });
});

router.get('/reports', authenticate, async (req, res) => {
  await ensureSalesTables();
  const financialYear = req.query.financial_year || financialYearFromDate();
  const where = [];
  const params = { financialYear };
  if (req.query.product_id && req.query.product_id !== 'all') {
    where.push('p.id = :product_id');
    params.product_id = Number(req.query.product_id);
  }
  if (req.query.division_id && req.query.division_id !== 'all') {
    where.push('p.division_id = :division_id');
    params.division_id = Number(req.query.division_id);
  }
  if (req.query.state && req.query.state !== 'all') {
    where.push('(t.state = :state OR pr.state = :state OR s.state = :state)');
    params.state = req.query.state;
  }
  if (req.query.hq_id && req.query.hq_id !== 'all') {
    where.push('(t.hq_id = :hq_id OR pr.hq_id = :hq_id OR s.hq_id = :hq_id)');
    params.hq_id = Number(req.query.hq_id);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await sequelize.query(
    `SELECT p.id AS product_id, p.name AS product_name,
      COALESCE(SUM(t.target_value), 0) AS target_value,
      COALESCE(SUM(pr.projection_value), 0) AS projection_value,
      COALESCE(SUM(s.sale_value), 0) AS achieved_value,
      COALESCE(SUM(e.total_value), 0) AS expiry_value
    FROM products p
    LEFT JOIN sales_targets t ON t.product_id = p.id AND t.financial_year = :financialYear
    LEFT JOIN sales_projection_entries pr ON pr.product_id = p.id AND pr.financial_year = :financialYear
    LEFT JOIN secondary_sales s ON s.product_id = p.id AND s.financial_year = :financialYear
    LEFT JOIN expiry_entries e ON e.product_id = p.id AND e.financial_year = :financialYear
    ${whereSql}
    GROUP BY p.id, p.name
    ORDER BY p.name ASC`,
    { replacements: params, type: QueryTypes.SELECT }
  );
  const report = rows.map((row) => {
    const target = parseNumber(row.target_value);
    const achieved = parseNumber(row.achieved_value);
    return { ...row, achievementPercent: target ? money((achieved / target) * 100) : 0 };
  });
  res.json({ report });
});

router.post('/seed-example', authenticate, async (req, res) => {
  await ensureSalesTables();
  const [product] = await Product.findAll({ limit: 1, order: [['id', 'ASC']] });
  const [stockist] = await Stockist.findAll({ limit: 1, order: [['id', 'ASC']] });
  const [hq] = await Headquarter.findAll({ limit: 1, order: [['id', 'ASC']] });
  const productId = product?.id || 1;
  const hqId = hq?.id || null;
  const common = { user_id: req.user.id, hq_id: hqId, product_id: productId, financial_year: '2026-2027', month: 4, rate: 100, created_by: req.user.id };
  await insertRow('sales_targets', await applyGeo({ ...common, target_strip: 100, target_value: 10000 }));
  await insertRow('sales_projection_entries', await applyGeo({ ...common, projection_strip: 200, projection_value: 20000 }));
  await insertRow('primary_sales', { stockist_id: stockist?.id || null, invoice_no: `INV-${Date.now()}`, product_id: productId, batch_number: 'BATCH-A1', quantity_strip: 150, rate: 100, total_value: 15000, sale_date: '2026-04-10', financial_year: '2026-2027', month: 4, created_by: req.user.id });
  await insertRow('secondary_sales', await applyGeo({ ...common, stockist_id: stockist?.id || null, opening_strip: 150, opening_value: 15000, sale_strip: 120, sale_value: 12000, closing_strip: 30, closing_value: 3000 }));
  await insertRow('expiry_entries', { stockist_id: stockist?.id || null, credit_note_no: `CN-${Date.now()}`, product_id: productId, batch_number: 'EXP-A1', quantity_strip: 5, rate: 100, total_value: 500, entry_date: '2026-04-20', financial_year: '2026-2027', month: 4, created_by: req.user.id });
  res.json({ message: 'Example sales module data created successfully' });
});

module.exports = router;
