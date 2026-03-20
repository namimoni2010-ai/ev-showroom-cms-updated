const mongoose = require('mongoose');

const vehicleStockSchema = new mongoose.Schema({
  vehicleName: { type: String, required: true },
  vehicleType: { type: String },
  range: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleStockSchema);
