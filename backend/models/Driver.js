const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  number: Number,
  time: String,           // "HH:MM"
  distanceKm: Number,     // null if rejected
  tip: Number,            // 0 if none
  conditions: [String],   // e.g. ["PEAK"], ["RAIN", "long-distance"], ["REJECTED"]
  disputed: { type: Boolean, default: false },
  note: String,
});

const shiftSchema = new mongoose.Schema({
  login: String,          // "HH:MM"
  logout: String,         // "HH:MM"
  label: String,          // e.g. "Morning", "Evening"
});

const driverSchema = new mongoose.Schema({
  driverId: { type: String, unique: true },
  name: String,
  shifts: [shiftSchema],
  deliveries: [deliverySchema],
});

module.exports = mongoose.model('Driver', driverSchema);
