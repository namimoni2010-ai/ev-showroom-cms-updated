const express = require('express');
const router = express.Router();
const { addSale, getSales, getSalesByCustomer, updateSalePayment, updateSale, deleteSale } = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addSale);
router.get('/', protect, getSales);
router.get('/customer/:customerId', protect, getSalesByCustomer);
router.put('/:id/payment', protect, updateSalePayment);
router.put('/:id', protect, updateSale);
router.delete('/:id', protect, deleteSale);

module.exports = router;
