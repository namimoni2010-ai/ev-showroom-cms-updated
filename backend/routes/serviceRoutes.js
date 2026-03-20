const express = require('express');
const router = express.Router();
const {
  addService, getServices, getServiceById, getServicesByCustomer,
  addPayment, getPaymentHistory, updateServicePayment, updateService, deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addService);
router.get('/', protect, getServices);
router.get('/customer/:customerId', protect, getServicesByCustomer);
router.get('/:id/payments', protect, getPaymentHistory);
router.get('/:id', protect, getServiceById);
router.post('/:id/payment', protect, addPayment);
router.put('/:id/payment', protect, updateServicePayment);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
