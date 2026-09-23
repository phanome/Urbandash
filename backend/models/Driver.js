const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
  number: Number,
  time: String,           
  distanceKm: Number,     
  tip: Number,            
  conditions: [String],   
  disputed: { type: Boolean, default: false },
  note: String,
});
const shiftSchema = new mongoose.Schema({
  login: String,          
  logout: String,         
  label: String,          
});
const driverSchema = new mongoose.Schema({
  driverId: { type: String, unique: true },
  name: String,
  shifts: [shiftSchema],
  deliveries: [deliverySchema],
});
module.exports = mongoose.model('Driver', driverSchema);