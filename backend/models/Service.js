const mongoose = require('mongoose');

const spareItemSchema = new mongoose.Schema({
  spareId: { type: mongoose.Schema.Types.ObjectId, ref: 'Spare' },
  spareName: { type: String, required: true },
  buyingPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true, default: 1 }
}, { _id: false });

const otherChargeSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String },
  vehicleName: { type: String, required: true },
  kmRun: { type: Number },
  serviceType: { type: String },
  labourCost: { type: Number, default: 0 },
  spareItems: { type: [spareItemSchema], default: [] },
  spareCost: { type: Number, default: 0 },
  otherCharges: { type: [otherChargeSchema], default: [] },
  otherChargesTotal: { type: Number, default: 0 },
  grossTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountedTotal: { type: Number, default: 0 },
  totalBill: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Completed'],
    default: 'Pending'
  },
  paymentCompletionDate: { type: Date },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], default: 'Cash' },
  serviceDate: { type: Date, default: Date.now },
  nextServiceDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);