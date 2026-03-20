const Customer = require('../models/Customer');

const addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchCustomers = async (req, res) => {
  const { q } = req.query;
  try {
    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addCustomer, getCustomers, searchCustomers, getCustomerById, updateCustomer, deleteCustomer };
