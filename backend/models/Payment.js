const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  customerName: { type: String },
  paymentDate: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], default: 'Cash' },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
