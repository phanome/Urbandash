/**
 * UrbanDash Payout Rules Engine
 *
 * Rules:
 *  - Base:          ₹35/completed delivery
 *  - Rain bonus:    +₹15/delivery (14:00–16:00, declared rain hours)
 *  - Peak bonus:    +₹20/delivery (12:00–14:00 and 19:00–21:00)
 *  - Streak bonus:  ₹150 per 5 consecutive completions without rejection (resets after)
 *  - Long-distance: >8 km → +₹25
 *  - Rejection:     −₹50/rejected order (max 2/day triggers deactivation warning)
 *  - Shift pay:     ₹100/hour (minimum 4 hours logged across all shifts)
 *  - Tips:          100% passed to driver
 */

const BASE_FEE        = 35;
const RAIN_BONUS      = 15;
const PEAK_BONUS      = 20;
const STREAK_BONUS    = 150;
const STREAK_TARGET   = 5;
const LONG_DIST_BONUS = 25;
const LONG_DIST_KM    = 8;
const REJECTION_PEN   = 50;
const SHIFT_RATE      = 100; // per hour
const MIN_SHIFT_HOURS = 4;
const MAX_REJECTIONS  = 2;

/** Parse "HH:MM" → minutes since midnight */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/** Total logged hours across all shifts */
function totalShiftHours(shifts) {
  return shifts.reduce((sum, s) => {
    const mins = toMinutes(s.logout) - toMinutes(s.login);
    return sum + mins / 60;
  }, 0);
}

/**
 * Compute full payout breakdown for a driver document.
 * Returns a rich breakdown object used by the API.
 */
function computePayout(driver) {
  const { deliveries, shifts } = driver;

  // --- Shift pay ---
  const shiftHours = totalShiftHours(shifts);
  const qualifiesShiftPay = shiftHours >= MIN_SHIFT_HOURS;
  const shiftPay = qualifiesShiftPay ? Math.floor(shiftHours) * SHIFT_RATE : 0;
  // Note: spec says ₹100/hour — we use exact decimal hours
  const shiftPayExact = qualifiesShiftPay ? shiftHours * SHIFT_RATE : 0;

  // --- Per-delivery breakdown ---
  let streakCount   = 0;
  let streakBonuses = 0;
  let totalBase     = 0;
  let totalRain     = 0;
  let totalPeak     = 0;
  let totalDistance = 0;
  let totalPenalty  = 0;
  let totalTips     = 0;
  let rejectionCount = 0;

  const deliveryBreakdown = deliveries.map((d) => {
    const isRejected = d.conditions.includes('REJECTED');
    const row = {
      number:     d.number,
      time:       d.time,
      distanceKm: d.distanceKm,
      tip:        d.tip || 0,
      conditions: d.conditions,
      disputed:   d.disputed || false,
      note:       d.note || null,
      isRejected,
      base:       0,
      rainBonus:  0,
      peakBonus:  0,
      distBonus:  0,
      streakBonus:0,
      penalty:    0,
      rowTotal:   0,
    };

    if (isRejected) {
      rejectionCount++;
      row.penalty = -REJECTION_PEN;
      totalPenalty += -REJECTION_PEN;
      streakCount = 0; // streak resets on rejection
    } else {
      // Base
      row.base = BASE_FEE;
      totalBase += BASE_FEE;

      // Rain bonus: condition includes RAIN (14:00–16:00 declared)
      if (d.conditions.includes('RAIN')) {
        row.rainBonus = RAIN_BONUS;
        totalRain += RAIN_BONUS;
      }

      // Peak bonus
      if (d.conditions.includes('PEAK')) {
        row.peakBonus = PEAK_BONUS;
        totalPeak += PEAK_BONUS;
      }

      // Long-distance bonus (>8 km)
      if (d.distanceKm > LONG_DIST_KM || d.conditions.includes('long-distance')) {
        row.distBonus = LONG_DIST_BONUS;
        totalDistance += LONG_DIST_BONUS;
      }

      // Tips
      totalTips += row.tip;

      // Streak
      streakCount++;
      if (streakCount === STREAK_TARGET) {
        row.streakBonus = STREAK_BONUS;
        streakBonuses += STREAK_BONUS;
        streakCount = 0;
      }
    }

    row.rowTotal =
      row.base +
      row.rainBonus +
      row.peakBonus +
      row.distBonus +
      row.streakBonus +
      row.penalty +
      row.tip;

    return row;
  });

  const grandTotal =
    shiftPayExact +
    totalBase +
    totalRain +
    totalPeak +
    totalDistance +
    streakBonuses +
    totalPenalty +
    totalTips;

  return {
    driverId:    driver.driverId,
    name:        driver.name,
    shifts,
    shiftHours,
    qualifiesShiftPay,
    shiftPay:    shiftPayExact,
    deliveryBreakdown,
    summary: {
      completedDeliveries: deliveries.filter(d => !d.conditions.includes('REJECTED')).length,
      rejectedDeliveries:  rejectionCount,
      deactivationWarning: rejectionCount >= MAX_REJECTIONS,
      totalBase,
      totalRain,
      totalPeak,
      totalDistance,
      streakBonuses,
      totalPenalty,
      totalTips,
    },
    grandTotal,
  };
}

module.exports = { computePayout };
