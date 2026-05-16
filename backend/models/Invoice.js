const mongoose = require('mongoose');

const spareItemSchema = new mongoose.Schema({
  description: { type: String },
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 }
}, { _id: false });

const otherChargeSchema = new mongoose.Schema({
  description: { type: String },
  amount: { type: Number, default: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceType: { type: String, enum: ['Sales Bill', 'Service Bill'], required: true },
  invoiceNo: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },

  // Company
  companyName: { type: String },
  companyAddress: { type: String },
  companyPhone: { type: String },
  companyEmail: { type: String },
  companyGST: { type: String },

  // Customer
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerEmail: { type: String },
  customerAddress: { type: String },

  // Vehicle
  vehicleName: { type: String },
  vehicleModel: { type: String },
  vehicleType: { type: String },
  vehicleCompany: { type: String },
  vehicleYear: { type: String },
  chassisNo: { type: String },
  motorNo: { type: String },
  controllerNo: { type: String },
  chargerNo: { type: String },

  // Service specific
  serviceType: { type: String },
  serviceDate: { type: Date },
  kmRun: { type: String },

  // Items
  spareItems: { type: [spareItemSchema], default: [] },
  labourCost: { type: Number, default: 0 },
  otherCharges: { type: [otherChargeSchema], default: [] },

  // Financials
  sparesTotal: { type: Number, default: 0 },
  otherTotal: { type: Number, default: 0 },
  grossTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  totalBill: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentMode: { type: String, default: 'Cash' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);