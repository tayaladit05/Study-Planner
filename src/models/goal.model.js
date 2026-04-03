const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },        // e.g. "Complete Polity"
  topics: [{ type: String }],                     // ["Constitution", "Parliament", ...]
  totalDays: { type: Number, required: true },     // e.g. 10
  hoursPerDay: { type: Number, required: true },   // e.g. 2
  startDate: { type: Date, default: Date.now },
  deadline: { type: Date },                        // auto calculated
  status: { type: String, default: "active" }      // active | completed
}, { timestamps: true });

module.exports = mongoose.model("Goal", goalSchema);