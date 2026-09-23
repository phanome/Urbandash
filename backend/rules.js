const BASE_FEE        = 35;
const RAIN_BONUS      = 15;
const PEAK_BONUS      = 20;
const STREAK_BONUS    = 150;
const STREAK_TARGET   = 5;
const LONG_DIST_BONUS = 25;
const LONG_DIST_KM    = 8;
const REJECTION_PEN   = 50;
const SHIFT_RATE      = 100;
const MIN_SHIFT_HOURS = 4;
const MAX_REJECTIONS  = 2;
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
function totalShiftHours(shifts) {
  return shifts.reduce((sum, s) => {
    const mins = toMinutes(s.logout) - toMinutes(s.login);
    return sum + mins / 60;
  }, 0);
}
function computePayout(driver) {
  const { deliveries, shifts } = driver;
  const shiftHours = totalShiftHours(shifts);
  const qualifiesShiftPay = shiftHours >= MIN_SHIFT_HOURS;
  const shiftPayExact = qualifiesShiftPay ? shiftHours * SHIFT_RATE : 0;
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
      streakCount = 0;
    } else {
      row.base = BASE_FEE;
      totalBase += BASE_FEE;
      if (d.conditions.includes('RAIN')) {
        row.rainBonus = RAIN_BONUS;
        totalRain += RAIN_BONUS;
      }
      if (d.conditions.includes('PEAK')) {
        row.peakBonus = PEAK_BONUS;
        totalPeak += PEAK_BONUS;
      }
      if (d.distanceKm > LONG_DIST_KM || d.conditions.includes('long-distance')) {
        row.distBonus = LONG_DIST_BONUS;
        totalDistance += LONG_DIST_BONUS;
      }
      totalTips += row.tip;
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