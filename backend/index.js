const express = require("express");
const mongoose = require("mongoose");
const Screenshot = require("./models/Screenshot");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/ppe-detection", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Upload screenshot
app.post("/upload", async (req, res) => {
  try {
    const { timestamp, image, location, source, detections } = req.body;

    console.log("Received payload:", req.body);  // Debug line

    const screenshot = new Screenshot({
      timestamp: new Date(),  // Always use server time
      image,
      location: location || "Unknown",
      source: source || "live",
      detections: detections || [],
    });

    await screenshot.save();
    res.status(200).json({ message: "Screenshot saved successfully" });
  } catch (err) {
    console.error("Error saving screenshot:", err);
    res.status(500).json({ error: "Failed to save screenshot" });
  }
});


// ✅ Get ALL screenshots (not just 3)
app.get("/screenshots", async (req, res) => {
  try {
    const allScreenshots = await Screenshot.find().sort({ timestamp: -1 });
    res.json(allScreenshots);
  } catch (err) {
    console.error("Error fetching screenshots:", err);
    res.status(500).send("Error");
  }
});

app.listen(5000, () => {
  console.log("Node.js server running on http://localhost:5000");
});

app.delete("/screenshots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Screenshot.findByIdAndDelete(id);
    res.status(200).json({ message: "Screenshot deleted successfully" });
  } catch (err) {
    console.error("Error deleting screenshot:", err);
    res.status(500).json({ error: "Failed to delete screenshot" });
  }
});

