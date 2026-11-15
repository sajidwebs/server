const { sendApiError } = require('../utils/apiError');
const express = require('express');
const router = express.Router();
// Express 4 does not forward rejected async handlers to error middleware.
for (const method of ['get', 'post', 'put', 'delete']) {
  const register = router[method].bind(router);
  router[method] = (path, ...handlers) => register(path, ...handlers.map(handler =>
    (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next)
  ));
}
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Sale, Projection, User, Product, Stockist, Headquarter, Territory } = require('../models');
const { authenticate } = require('../middleware/auth');

const roleRank = { admin: 100, nsm: 90, zbm: 80, rbm: 70, abm: 60, tbm: 50, mr: 40, user: 10 };
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const normalizeRole = (role = '') => {
  const key = role.toLowerCase().replace(/[^a-z]/g, '');
  return ({ fieldrepresentative:'mr', areamanager:'abm', regionalmanager:'rbm', zonalmanager:'zbm', nationalmanager:'nsm', rsm:'rbm', zsm:'zbm' })[key] || key;
};
const userRank = (user) => roleRank[normalizeRole(user?.role)] || (normalizeRole(user?.role).includes('admin') ? 100 : 10);
const isAdminLike = (user) => userRank(user) >= 90 || normalizeRole(user?.role).includes('admin');

let salesTablesReady;
const ensureSalesTables = () => {
  if (!salesTablesReady) {
    salesTablesReady = createSalesTables().catch(error => {
      salesTablesReady = undefined;
      throw error;
    });
  }
  return salesTablesReady;
};
const createSalesTables = async () => {
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
    where: `${where} AND (user_id IN (:visibleUserIds) OR (user_id IS NULL AND created_by IN (:visibleUserIds)))`,
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
  if (req.query.month && req.query.month !== 'all') {
    where += ' AND month = :month';
    params.month = Number(req.query.month);
  }
  if (req.query.product_id && req.query.product_id !== 'all') {
    where += ' AND product_id = :product_id';
    params.product_id = Number(req.query.product_id);
  }
  const hasUser = ['sales_targets', 'sales_projection_entries', 'secondary_sales'].includes(table);
  if (req.query.user_id && req.query.user_id !== 'all') {
    where += ` AND ${hasUser ? 'user_id' : 'created_by'} = :user_id`;
    params.user_id = Number(req.query.user_id);
  }
  if (req.query.division_id && req.query.division_id !== 'all') {
    where += ' AND product_id IN (SELECT id FROM products WHERE division_id = :division_id)';
    params.division_id = Number(req.query.division_id);
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
  } else {
    const ids = await hierarchyUserIds(req.user);
    if (ids) { where += ' AND created_by IN (:visibleUserIds)'; params.visibleUserIds = ids; }
    if (req.query.hq_id && req.query.hq_id !== 'all') {
      where += ' AND stockist_id IN (SELECT id FROM stockists WHERE hq_id = :hq_id)'; params.hq_id = Number(req.query.hq_id);
    }
    if (req.query.state && req.query.state !== 'all') {
      where += ' AND stockist_id IN (SELECT id FROM stockists WHERE state = :state)'; params.state = req.query.state;
    }
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
  if ([400, 403, 404, 409, 423].includes(error.statusCode)) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return sendApiError(res, error);
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
    sendApiError(res, error);
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const saleData = { ...req.body, userId: req.body.userId || req.user.id };
    saleData.totalAmount = saleData.totalAmount || money(parseNumber(saleData.quantity) * parseNumber(saleData.price));
    const newSale = await Sale.create(saleData);
    res.status(201).json({ message: 'Sale created successfully', sale: newSale });
  } catch (error) {
    sendApiError(res, error);
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

// Aggregate each transaction stream separately; joining raw rows multiplies totals.
const reportData = async (req) => {
  const tables = ['sales_targets', 'sales_projection_entries', 'secondary_sales', 'primary_sales', 'expiry_entries'];
  const streams = await Promise.all(tables.map(table => selectRows(table, req)));
  const products = await Product.findAll({ attributes: ['id', 'name', 'division_id', 'status'], raw: true });
  return products.filter(p => (!req.query.product_id || req.query.product_id === 'all' || p.id === Number(req.query.product_id)) &&
    (!req.query.division_id || req.query.division_id === 'all' || p.division_id === Number(req.query.division_id)))
    .map(product => {
      const sum = (stream, key) => money(streams[stream].filter(row => row.product_id === product.id).reduce((total, row) => total + parseNumber(row[key]), 0));
      const target = sum(0, 'target_value'), achieved = sum(2, 'sale_value');
      return { product_id: product.id, product_name: product.name, target_value: target,
        projection_value: sum(1, 'projection_value'), achieved_value: achieved,
        primary_value: sum(3, 'total_value'), expiry_value: sum(4, 'total_value'),
        achievementPercent: target ? money(achieved / target * 100) : 0, status: product.status };
    }).filter(row => row.status === 'active' || row.target_value || row.projection_value || row.achieved_value || row.primary_value || row.expiry_value)
    .sort((a,b) => a.product_name.localeCompare(b.product_name));
};

router.get('/dashboard', authenticate, async (req, res) => {
  const financial_year = req.query.financial_year || financialYearFromDate();
  const month = req.query.month || String(new Date().getMonth() + 1);
  const report = await reportData({ user: req.user, query: { ...req.query, financial_year, month } });
  const sum = key => money(report.reduce((total,row) => total + row[key],0));
  const target = sum('target_value'), achieved = sum('achieved_value');
  const locks = month === 'all' ? [] : await sequelize.query('SELECT is_locked FROM sales_month_locks WHERE financial_year = :financial_year AND month = :month',
    { replacements: { financial_year, month: Number(month) }, type: QueryTypes.SELECT });
  res.json({ summary: { target, projection: sum('projection_value'), achieved,
    primary_sale: sum('primary_value'), expiry_value: sum('expiry_value'),
    is_locked: locks[0]?.is_locked || false, monthName: month === 'all' ? 'All months' : monthNames[Number(month)-1],
    financial_year, achievementPercent: target ? money(achieved / target * 100) : 0 } });
});

router.get('/reports', authenticate, async (req, res) => {
  const query = { ...req.query, financial_year: req.query.financial_year || financialYearFromDate() };
  res.json({ report: await reportData({user:req.user,query}) });
});

router.post('/seed-example', authenticate, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(409).json({ message: 'Example sales seeding is disabled on the deployed service.' });
  }
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
