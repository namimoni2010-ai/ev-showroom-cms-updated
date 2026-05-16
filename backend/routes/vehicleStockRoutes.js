const express = require('express');
const router = express.Router();
const Vehicle = require('../models/VehicleStock');
const { protect } = require('../middleware/authMiddleware');

// Add vehicle
router.post('/', protect, async (req, res) => {
  try {
    const v = await Vehicle.create(req.body);
    res.status(201).json(v);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Chassis number already exists' });
    res.status(500).json({ message: err.message });
  }
});

// Get all vehicles
router.get('/', protect, async (req, res) => {
  try {
    const v = await Vehicle.find().sort({ createdAt: -1 });
    res.json(v);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Search vehicles by chassis / model / motor
router.get('/search', protect, async (req, res) => {
  const { q } = req.query;
  try {
    const vehicles = await Vehicle.find({
      $or: [
        { chassisNo: { $regex: q, $options: 'i' } },
        { vehicleName: { $regex: q, $options: 'i' } },
        { vehicleModel: { $regex: q, $options: 'i' } },
        { motorNo: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);
    res.json(vehicles);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get by chassis number (for auto-fill)
router.get('/chassis/:chassisNo', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      chassisNo: { $regex: new RegExp(`^${req.params.chassisNo}$`, 'i') }
    });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle details not found.' });
    res.json(vehicle);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update vehicle
router.put('/:id', protect, async (req, res) => {
  try {
    const v = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(v);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Chassis number already exists' });
    res.status(500).json({ message: err.message });
  }
});

// Delete vehicle
router.delete('/:id', protect, async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;