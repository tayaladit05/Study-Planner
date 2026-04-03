const Task = require("../models/task.model");

// GET /api/tasks/:goalId — get all tasks for a goal
const getTasksByGoal = async (req, res) => {
  try {
    const tasks = await Task.find({ goalId: req.params.goalId }).sort({ scheduledDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:goalId/today — get today's tasks
const getTodayTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const tasks = await Task.find({
      goalId: req.params.goalId,
      scheduledDate: { $gte: today, $lt: tomorrow }
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:taskId/status — mark task complete/skipped
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["completed", "skipped", "pending"];

    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status, ...(status === "completed" ? { completedAt: new Date() } : {}) },
      { new: true }
    );

    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task updated", task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:goalId/performance — track performance
const getPerformance = async (req, res) => {
  try {
    const tasks = await Task.find({ goalId: req.params.goalId });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const skipped = tasks.filter(t => t.status === "skipped").length;
    const delayed = tasks.filter(t => t.status === "delayed").length;
    const pending = tasks.filter(t => t.status === "pending").length;

    res.json({
      total,
      completed,
      skipped,
      delayed,
      pending,
      completionRate: total ? `${((completed / total) * 100).toFixed(1)}%` : "0%"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTasksByGoal, getTodayTasks, updateTaskStatus, getPerformance };