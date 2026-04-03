const router = require("express").Router();
const { createGoal, getGoals, redistribute } = require("../controllers/goal.controller");

router.post("/", createGoal);
router.get("/", getGoals);
router.post("/:goalId/redistribute", redistribute);

module.exports = router;