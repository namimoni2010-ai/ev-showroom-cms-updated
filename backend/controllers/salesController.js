const Sale = require('../models/Sales');
const Customer = require('../models/Customer');
const Vehicle = require('../models/VehicleStock');

const addSale = async (req, res) => {
  try {
    const { customerId, vehicleName, vehicleType, range, price, discount, paidAmount, salesDate, paymentMode } = req.body;
    const customer = await Customer.findById(customerId);
    const finalPrice = price - (discount || 0);
    const paid = paidAmount || 0;
    const pending = finalPrice - paid;
    const paymentStatus = pending <= 0 ? 'Paid' : 'Pending';

    const sale = await Sale.create({
      customerId,
      customerName: customer ? customer.name : '',
      vehicleName, vehicleType, range, price,
      discount: discount || 0, finalPrice,
      paidAmount: paid,
      pendingAmount: pending < 0 ? 0 : pending,
      paymentStatus,
      paymentMode: paymentMode || 'Cash',
      salesDate: salesDate || new Date()
    });

    // Auto-decrement vehicle stock
    await Vehicle.findOneAndUpdate(
      { vehicleName: { $regex: new RegExp(`^${vehicleName}$`, 'i') }, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } }
    );

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('customerId', 'name phone').sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSalesByCustomer = async (req, res) => {
  try {
    const sales = await Sale.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSalePayment = async (req, res) => {
  try {
    const { paidAmount } = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    sale.paidAmount = paidAmount;
    sale.pendingAmount = sale.finalPrice - paidAmount;
    sale.paymentStatus = sale.pendingAmount <= 0 ? 'Paid' : 'Pending';
    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addSale, getSales, getSalesByCustomer, updateSalePayment, updateSale, deleteSale };
