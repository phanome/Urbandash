const express  = require('express');
const router   = express.Router();
const Driver   = require('./models/Driver');
const { computePayout } = require('./rules');
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find({});
    const summaries = drivers.map((d) => {
      const p = computePayout(d);
      return {
        driverId:            p.driverId,
        name:                p.name,
        shifts:              p.shifts,
        shiftHours:          p.shiftHours,
        qualifiesShiftPay:   p.qualifiesShiftPay,
        completedDeliveries: p.summary.completedDeliveries,
        rejectedDeliveries:  p.summary.rejectedDeliveries,
        deactivationWarning: p.summary.deactivationWarning,
        grandTotal:          p.grandTotal,
      };
    });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/payout/:driverId', async (req, res) => {
  try {
    const driver = await Driver.findOne({ driverId: req.params.driverId });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    const result = computePayout(driver);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/calculate', (req, res) => {
  try {
    const driverData = req.body;
    if (!driverData.name || !driverData.shifts || !driverData.deliveries) {
      return res.status(400).json({ error: 'Missing required fields: name, shifts, deliveries' });
    }
    const result = computePayout(driverData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/drivers', async (req, res) => {
  try {
    const { name, driverId, shifts, deliveries } = req.body;
    if (!name || !shifts || !deliveries) {
      return res.status(400).json({ error: 'Missing required fields: name, shifts, deliveries' });
    }
    let id = driverId;
    if (!id) {
      const count = await Driver.countDocuments();
      id = `D-${101 + count}`;
    }
    const existing = await Driver.findOne({ driverId: id });
    if (existing) {
      return res.status(409).json({ error: `Driver ID ${id} already exists` });
    }
    const driver = await Driver.create({ name, driverId: id, shifts, deliveries });
    const result = computePayout(driver);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete('/drivers/:driverId', async (req, res) => {
  try {
    const result = await Driver.deleteOne({ driverId: req.params.driverId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ success: true, deleted: req.params.driverId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;