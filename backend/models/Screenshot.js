// backend/models/Screenshot.js
const mongoose = require("mongoose");

const screenshotSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  image: String,
  location: { type: String, default: "Unknown" },
  source: { type: String, enum: ["live", "upload"], default: "live" },
  detections: {
    type: [
      {
        item: String,
        confidence: Number
      }
    ],
    default: [] // ✅ Ensures it's never undefined
  }
});

module.exports = mongoose.model("Screenshot", screenshotSchema);
