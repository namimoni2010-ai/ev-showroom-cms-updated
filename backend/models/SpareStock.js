const mongoose = require('mongoose');

const spareStockSchema = new mongoose.Schema({
  spareName: { type: String, required: true },
  buyingPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  quantity: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 5 }   // Admin sets alert threshold per item
}, { timestamps: true });

module.exports = mongoose.model('Spare', spareStockSchema);
