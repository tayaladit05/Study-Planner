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

    if (Number(totalDays) <= 0 || Number(hoursPerDay) <= 0)
      return res.status(400).json({ error: "totalDays and hoursPerDay must be greater than 0" });

    const startDate = new Date();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + totalDays - 1);

    const plan = generatePlan(
      null,
      topics,
      startDate,
      Number(totalDays),
      Number(hoursPerDay)
    );

    if (!plan.summary.normalizedTopics.length)
      return res.status(400).json({
        error: "Each topic must include a valid name and positive hoursNeeded"
      });

    const goal = await Goal.create({
      title,
      topics: plan.summary.normalizedTopics,
      totalDays: Number(totalDays),
      hoursPerDay: Number(hoursPerDay),
      startDate,
      deadline
    });

    const taskData = plan.tasks.map((task) => ({ ...task, goalId: goal._id }));
    if (taskData.length) await Task.insertMany(taskData);

    res.status(201).json({
      message: plan.summary.feasible
        ? "Goal created and realistic plan generated"
        : plan.summary.recommendation.message,
      goal,
      planSummary: plan.summary
    });
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