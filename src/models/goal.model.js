const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },        // e.g. "Complete Polity"
  topics: [{
    name: { type: String, required: true },
    hoursNeeded: { type: Number, required: true, min: 0.25 },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" }
  }],
  totalDays: { type: Number, required: true },     // e.g. 10
  hoursPerDay: { type: Number, required: true },   // e.g. 2
  startDate: { type: Date, default: Date.now },
  deadline: { type: Date },                        // auto calculated
  status: { type: String, default: "active" }      // active | completed
}, { timestamps: true });

module.exports = mongoose.model("Goal", goalSchema);