const Goal = require("../models/goal.model");
const Task = require("../models/task.model");
const generatePlan = require("../utils/planGenerator");
const redistributeTasks = require("../utils/redistributor");

// POST /api/goals — create goal + auto generate plan
const createGoal = async (req, res) => {
  try {
    const { title, topics, totalDays, hoursPerDay } = req.body;

    if (!title || !topics || !totalDays || !hoursPerDay)
      return res.status(400).json({ error: "All fields required" });

    if (!Array.isArray(topics) || topics.length === 0)
      return res.status(400).json({ error: "Topics must be a non-empty array" });

    const startDate = new Date();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + totalDays - 1);

    const goal = await Goal.create({ title, topics, totalDays, hoursPerDay, startDate, deadline });

    // Auto generate daily plan
    const taskData = generatePlan(goal._id, topics, startDate, totalDays, hoursPerDay);
    await Task.insertMany(taskData);

    res.status(201).json({ message: "Goal created and plan generated", goal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/goals — get all goals
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/goals/:goalId/redistribute — trigger redistribution
const redistribute = async (req, res) => {
  try {
    const result = await redistributeTasks(req.params.goalId, Task, Goal);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createGoal, getGoals, redistribute };