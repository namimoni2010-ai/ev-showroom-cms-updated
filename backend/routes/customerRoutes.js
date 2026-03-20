const express = require('express');
const router = express.Router();
const { addCustomer, getCustomers, searchCustomers, getCustomerById, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addCustomer);
router.get('/', protect, getCustomers);
router.get('/search', protect, searchCustomers);
router.get('/:id', protect, getCustomerById);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;
