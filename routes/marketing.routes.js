const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  MarketingCampaign,
  MarketingBrandStrategy,
  MarketingRCPA,
  MarketingRCPAEntry,
  Product,
  InputMaster,
  User,
  Division,
  Doctor,
  Chemist
} = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const marketingRoles = 'ADMIN,MARKETING,NSM,RBM';
const writeRoles = 'ADMIN,MARKETING';
const asNumber = (value, fallback = 0) => (value === undefined || value === null || value === '' ? fallback : Number(value));

const calculateCampaignValues = (payload) => {
  const qty = asNumber(payload.qty_per_visit);
  const recurrence = Math.max(asNumber(payload.recurrence_count, 1), 1);
  const unitValue = asNumber(payload.input_unit_value);
  const rx = asNumber(payload.prescription_per_month);
  const stripSale = asNumber(payload.strip_sale_per_rx);
  return {
    ...payload,
    recurrence_count: recurrence,
    total_investment: payload.total_investment ?? qty * recurrence * unitValue,
    total_sale_per_month: payload.total_sale_per_month ?? rx * stripSale
  };
};

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.findAll();
    const totalCampaigns = campaigns.length;
    const closed = campaigns.filter((item) => item.status === 'closed').length;
    const running = campaigns.filter((item) => item.status === 'running').length;
    const totals = campaigns.reduce((acc, item) => {
      acc.investment += Number(item.total_investment || 0);
      acc.roi += Number(item.expected_roi || 0);
      acc.newPrescribers += Number(item.new_prescribers_added || 0);
      acc.hqBelow90 += Number(item.hq_below_90 || 0);
      acc.hqBelow70 += Number(item.hq_below_70 || 0);
      acc.hqAt100 += Number(item.hq_at_100 || 0);
      acc.salesGrowth += Number(item.sales_growth || 0);
      return acc;
    }, { investment: 0, roi: 0, newPrescribers: 0, hqBelow90: 0, hqBelow70: 0, hqAt100: 0, salesGrowth: 0 });

    res.json({
      totalCampaigns,
      closed,
      running,
      totalInvestment: totals.investment,
      roi: totals.roi,
      newPrescribersAdded: totals.newPrescribers,
      salesGrowth: totalCampaigns ? totals.salesGrowth / totalCampaigns : 0,
      hqBelow90: totals.hqBelow90,
      hqBelow70: totals.hqBelow70,
      hqAt100: totals.hqAt100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const { status, campaign_for, q } = req.query;
    const where = {};
    if (status) where.status = status;
    if (campaign_for) where.campaign_for = campaign_for;
    if (q) where.campaign_name = { [Op.iLike]: `%${q}%` };
    const campaigns = await MarketingCampaign.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'code'] },
        { model: InputMaster, as: 'input', attributes: ['id', 'input_name'] },
        { model: User, as: 'allocatedUser', attributes: ['id', 'firstName', 'lastName', 'fullName'] }
      ],
      order: [['start_date', 'DESC']]
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/campaigns/:id', authenticate, async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/campaigns', authenticate, authorize(writeRoles), async (req, res) => {
  try {
    const campaign = await MarketingCampaign.create(calculateCampaignValues({
      ...req.body,
      created_by: req.user.id
    }));
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/campaigns/:id', authenticate, authorize(writeRoles), async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    await campaign.update(calculateCampaignValues({ ...req.body, updated_by: req.user.id }));
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/campaigns/:id', authenticate, authorize(writeRoles), async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    await campaign.update({ status: 'cancelled', updated_by: req.user.id });
    res.json({ message: 'Campaign cancelled successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/strategies', authenticate, async (req, res) => {
  try {
    const strategies = await MarketingBrandStrategy.findAll({
      include: [{ model: Division, as: 'division', attributes: ['id', 'division_name', 'short_name'] }],
      order: [['financial_year', 'DESC'], ['brand_name', 'ASC']]
    });
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategies', authenticate, authorize(writeRoles), async (req, res) => {
  try {
    const strategy = await MarketingBrandStrategy.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/strategies/:id', authenticate, authorize(writeRoles), async (req, res) => {
  try {
    const strategy = await MarketingBrandStrategy.findByPk(req.params.id);
    if (!strategy) return res.status(404).json({ error: 'Brand strategy not found' });
    await strategy.update({ ...req.body, updated_by: req.user.id });
    res.json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/rcpa', authenticate, async (req, res) => {
  try {
    const rcpas = await MarketingRCPA.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'code'] },
        { model: MarketingRCPAEntry, as: 'entries' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(rcpas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rcpa', authenticate, authorize(marketingRoles), async (req, res) => {
  try {
    const rcpa = await MarketingRCPA.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(rcpa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rcpa/:id', authenticate, authorize(marketingRoles), async (req, res) => {
  try {
    const rcpa = await MarketingRCPA.findByPk(req.params.id);
    if (!rcpa) return res.status(404).json({ error: 'RCPA not found' });
    await rcpa.update({ ...req.body, updated_by: req.user.id });
    res.json(rcpa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/rcpa/:id/entries', authenticate, async (req, res) => {
  try {
    const entries = await MarketingRCPAEntry.findAll({
      where: { rcpa_id: req.params.id },
      include: [
        { model: Doctor, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
        { model: Chemist, as: 'chemist', attributes: ['id', 'name'] }
      ],
      order: [['submitted_at', 'DESC']]
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rcpa/:id/entries', authenticate, async (req, res) => {
  try {
    const rcpa = await MarketingRCPA.findByPk(req.params.id);
    if (!rcpa) return res.status(404).json({ error: 'RCPA not found' });
    const competitors = Array.isArray(req.body.competitors) ? req.body.competitors : [];
    const competitorTotal = competitors.reduce((sum, item) => sum + asNumber(item.rx_per_week), 0);
    const entry = await MarketingRCPAEntry.create({
      ...req.body,
      rcpa_id: rcpa.id,
      competitors,
      total_business_strips: req.body.total_business_strips ?? asNumber(req.body.own_rx_per_week) + competitorTotal,
      submitted_by: req.user.id
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
