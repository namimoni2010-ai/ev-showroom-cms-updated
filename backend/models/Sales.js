const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String },
  vehicleName: { type: String, required: true },
  vehicleType: { type: String },
  range: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], default: 'Cash' },
  salesDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', salesSchema);
