const mongoose = require('mongoose');

const vehicleStockSchema = new mongoose.Schema({
  vehicleName: { type: String, required: true },
  vehicleModel: { type: String },
  vehicleType: { type: String },
  range: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  chassisNo: { type: String, unique: true, sparse: true },
  motorNo: { type: String },
  controllerNo: { type: String },
  chargerNo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleStockSchema);