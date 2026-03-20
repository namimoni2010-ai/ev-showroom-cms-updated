const Customer = require('../models/Customer');
const Sale = require('../models/Sales');
const Service = require('../models/Service');
const Vehicle = require('../models/VehicleStock');
const Spare = require('../models/SpareStock');

const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalSales = await Sale.countDocuments();
    const totalServices = await Service.countDocuments();

    // Pending amounts
    const salesPending = await Sale.aggregate([
      { $match: { paymentStatus: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);
    const servicesPending = await Service.aggregate([
      { $match: { paymentStatus: { $in: ['Pending', 'Partially Paid'] } } },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);
    const totalPending = (salesPending[0]?.total || 0) + (servicesPending[0]?.total || 0);

    // Pending sales with date
    const pendingSales = await Sale.find({ paymentStatus: 'Pending' })
      .populate('customerId', 'name phone')
      .select('customerName pendingAmount customerId vehicleName finalPrice paidAmount salesDate')
      .sort({ salesDate: 1 });

    // Pending + Partially Paid services with date
    const pendingServices = await Service.find({ paymentStatus: { $in: ['Pending', 'Partially Paid'] } })
      .populate('customerId', 'name phone')
      .select('customerName pendingAmount customerId vehicleName totalBill paidAmount paymentStatus serviceDate paymentCompletionDate')
      .sort({ serviceDate: 1 });

    // Service reminders
    const today = new Date();
    const windowDate = new Date();
    windowDate.setDate(today.getDate() + 30);

    const serviceReminders = await Service.find({ nextServiceDate: { $lte: windowDate } })
      .populate('customerId', 'name phone')
      .sort({ nextServiceDate: 1 })
      .limit(50);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const salesForReminder = await Sale.find({
      salesDate: { $gte: sixtyDaysAgo, $lte: ninetyDaysAgo }
    }).populate('customerId', 'name phone').sort({ salesDate: 1 });

    const salesReminders = [];
    for (const sale of salesForReminder) {
      const hasService = await Service.exists({
        customerId: sale.customerId,
        vehicleName: { $regex: new RegExp(`^${sale.vehicleName}$`, 'i') }
      });
      if (!hasService) {
        const dueDate = new Date(sale.salesDate);
        dueDate.setDate(dueDate.getDate() + 90);
        salesReminders.push({
          _id: sale._id,
          customerName: sale.customerName,
          customerId: sale.customerId,
          vehicleName: sale.vehicleName,
          serviceDate: sale.salesDate,
          nextServiceDate: dueDate,
          source: 'sale'
        });
      }
    }

    // Low vehicle stock (qty <= 1)
    const lowVehicleStock = await Vehicle.find({ quantity: { $lte: 1 } })
      .select('vehicleName vehicleType quantity price').sort({ quantity: 1 });

    // Low spare stock - use minStockLevel per item (admin-defined)
    const allSpares = await Spare.find();
    const lowSpareStock = allSpares
      .filter(s => s.quantity <= (s.minStockLevel || 5))
      .map(s => ({
        _id: s._id,
        spareName: s.spareName,
        quantity: s.quantity,
        minStockLevel: s.minStockLevel || 5,
        sellingPrice: s.sellingPrice,
        reorderQty: Math.max(0, (s.minStockLevel || 5) - s.quantity),
        status: s.quantity === 0 ? 'Out of Stock' : 'Low Stock'
      }))
      .sort((a, b) => a.quantity - b.quantity);

    res.json({
      totalCustomers, totalSales, totalServices, totalPending,
      pendingSales, pendingServices,
      serviceReminders, salesReminders,
      lowVehicleStock, lowSpareStock
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboardStats };
