const mongoose = require("mongoose");

const screenshotSchema = new mongoose.Schema({
  timestamp: String,
  missing: [String],
  image: String,
});

module.exports = mongoose.model("Screenshot", screenshotSchema);
