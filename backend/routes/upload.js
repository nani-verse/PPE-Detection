const express = require('express');
const Screenshot = require('../models/Screenshot');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { image, missing, timestamp } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const screenshot = new Screenshot({
      image, // base64 string
      missing,
      timestamp: timestamp || new Date()
    });

    await screenshot.save();
    res.status(201).json({ message: 'Screenshot uploaded' });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const shots = await Screenshot.find().sort({ timestamp: -1 });
    res.json(shots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch screenshots' });
  }
});

module.exports = router;
