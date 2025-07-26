const express = require("express");
const mongoose = require("mongoose");
const Screenshot = require("./models/Screenshot");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose.connect("mongodb://127.0.0.1:27017/ppe-detection", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post("/upload", async (req, res) => {
  try {
    const { timestamp, missing, image } = req.body;
    const screenshot = new Screenshot({ timestamp, missing, image });
    await screenshot.save();
    res.status(200).json({ message: "Screenshot saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save screenshot" });
  }
});

app.get("/screenshots", async (req, res) => {
  try {
    const screenshots = await Screenshot.find().sort({ timestamp: -1 });
    res.json(screenshots);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch screenshots" });
  }
});

app.listen(5000, () => {
  console.log("Node.js server running on http://localhost:5000");
});
