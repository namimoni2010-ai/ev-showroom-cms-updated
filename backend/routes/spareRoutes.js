const express = require('express');
const router = express.Router();
const Spare = require('../models/SpareStock');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  try {
    const spare = await Spare.create(req.body);
    res.status(201).json(spare);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const spares = await Spare.find().sort({ createdAt: -1 });
    res.json(spares);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const spare = await Spare.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(spare);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Spare.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
