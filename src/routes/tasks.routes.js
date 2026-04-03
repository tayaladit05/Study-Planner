const router = require("express").Router();
const { getTasksByGoal, getTodayTasks, updateTaskStatus, getPerformance } = require("../controllers/task.controller");

router.get("/:goalId", getTasksByGoal);
router.get("/:goalId/today", getTodayTasks);
router.patch("/:taskId/status", updateTaskStatus);
router.get("/:goalId/performance", getPerformance);

module.exports = router;