const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", required: true },
  topic: { type: String, required: true },         // "Chapter 1 - Constitution"
  scheduledDate: { type: Date, required: true },   // which day this is planned
  hoursAllocated: { type: Number, required: true },
  status: { type: String, default: "pending" },    // pending | completed | skipped | delayed
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);