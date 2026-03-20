const Service = require('../models/Service');
const Customer = require('../models/Customer');
const Spare = require('../models/SpareStock');
const Payment = require('../models/Payment');

const addService = async (req, res) => {
  try {
    const { customerId, vehicleName, kmRun, serviceType, labourCost, spareItems, otherCharges, paidAmount, serviceDate, paymentMode } = req.body;
    const customer = await Customer.findById(customerId);

    const items = Array.isArray(spareItems) ? spareItems : [];
    const charges = Array.isArray(otherCharges) ? otherCharges : [];

    const spareCost = items.reduce((sum, item) => sum + (parseFloat(item.sellingPrice) || 0) * (parseFloat(item.quantity) || 1), 0);
    const labour = parseFloat(labourCost) || 0;
    const otherChargesTotal = charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalBill = labour + spareCost + otherChargesTotal;
    const paid = parseFloat(paidAmount) || 0;
    const pending = totalBill - paid;

    let paymentStatus = 'Pending';
    if (paid >= totalBill && totalBill > 0) paymentStatus = 'Completed';
    else if (paid > 0) paymentStatus = 'Partially Paid';

    const sDate = serviceDate ? new Date(serviceDate) : new Date();
    const nextServiceDate = new Date(sDate);
    nextServiceDate.setDate(nextServiceDate.getDate() + 90);

    const service = await Service.create({
      customerId,
      customerName: customer ? customer.name : '',
      vehicleName, kmRun, serviceType,
      labourCost: labour,
      spareItems: items,
      spareCost,
      otherCharges: charges,
      otherChargesTotal,
      totalBill,
      paidAmount: paid,
      pendingAmount: pending < 0 ? 0 : pending,
      paymentStatus,
      paymentMode: paymentMode || 'Cash',
      serviceDate: sDate,
      nextServiceDate,
      paymentCompletionDate: paymentStatus === 'Completed' ? new Date() : undefined
    });

    // Save initial payment record if paid > 0
    if (paid > 0) {
      await Payment.create({
        serviceId: service._id,
        customerName: customer ? customer.name : '',
        amount: paid,
        method: paymentMode || 'Cash',
        note: 'Initial payment',
        paymentDate: new Date()
      });
    }

    // Auto-decrement spare stock
    for (const item of items) {
      if (item.spareName && item.quantity > 0) {
        await Spare.findOneAndUpdate(
          { spareName: { $regex: new RegExp(`^${item.spareName}$`, 'i') }, quantity: { $gt: 0 } },
          { $inc: { quantity: -(parseFloat(item.quantity) || 1) } }
        );
      }
    }

    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find().populate('customerId', 'name phone').sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('customerId', 'name phone');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    const payments = await Payment.find({ serviceId: req.params.id }).sort({ paymentDate: 1 });
    res.json({ service, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getServicesByCustomer = async (req, res) => {
  try {
    const services = await Service.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add installment payment
const addPayment = async (req, res) => {
  try {
    const { amount, method, paymentDate, note } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const newPaid = service.paidAmount + (parseFloat(amount) || 0);
    const newPending = service.totalBill - newPaid;

    let paymentStatus = 'Pending';
    if (newPaid >= service.totalBill) paymentStatus = 'Completed';
    else if (newPaid > 0) paymentStatus = 'Partially Paid';

    service.paidAmount = newPaid;
    service.pendingAmount = newPending < 0 ? 0 : newPending;
    service.paymentStatus = paymentStatus;
    if (paymentStatus === 'Completed') service.paymentCompletionDate = new Date();
    await service.save();

    const payment = await Payment.create({
      serviceId: service._id,
      customerName: service.customerName,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      amount: parseFloat(amount),
      method: method || 'Cash',
      note: note || ''
    });

    res.json({ service, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ serviceId: req.params.id }).sort({ paymentDate: 1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateServicePayment = async (req, res) => {
  try {
    const { paidAmount } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    service.paidAmount = paidAmount;
    service.pendingAmount = service.totalBill - paidAmount;
    let paymentStatus = 'Pending';
    if (paidAmount >= service.totalBill) paymentStatus = 'Completed';
    else if (paidAmount > 0) paymentStatus = 'Partially Paid';
    service.paymentStatus = paymentStatus;
    if (paymentStatus === 'Completed') service.paymentCompletionDate = new Date();
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    await Payment.deleteMany({ serviceId: req.params.id });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addService, getServices, getServiceById, getServicesByCustomer, addPayment, getPaymentHistory, updateServicePayment, updateService, deleteService };
