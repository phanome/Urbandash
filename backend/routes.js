const express  = require('express');
const router   = express.Router();
const Driver   = require('./models/Driver');
const { computePayout } = require('./rules');

/** GET /api/drivers — summary list of all drivers */
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find({});
    const summaries = drivers.map((d) => {
      const p = computePayout(d);
      return {
        driverId:            p.driverId,
        name:                p.name,
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

/** GET /api/payout/:driverId — full breakdown for one driver */
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

module.exports = router;
