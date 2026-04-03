// Core algorithm — redistributes missed/pending tasks across remaining days

const redistributeTasks = async (goalId, Task, Goal) => {
  const goal = await Goal.findById(goalId);
  if (!goal) throw new Error("Goal not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Find all pending tasks (missed or upcoming)
  const pendingTasks = await Task.find({
    goalId,
    status: { $in: ["pending", "delayed"] }
  }).sort({ scheduledDate: 1 });

  if (pendingTasks.length === 0) return { message: "No pending tasks to redistribute" };

  // 2. Calculate remaining days from today to deadline
  const deadline = new Date(goal.deadline);
  deadline.setUTCHours(0, 0, 0, 0);

  const remainingDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24)) + 1;

  if (remainingDays <= 0) {
    // Deadline passed — stack everything on today
    for (let i = 0; i < pendingTasks.length; i++) {
      pendingTasks[i].scheduledDate = today;
      pendingTasks[i].status = "delayed";
      await pendingTasks[i].save();
    }
    return { message: "Deadline passed, all tasks stacked on today", redistributed: pendingTasks.length };
  }

  // 3. Distribute pending tasks evenly across remaining days
  const topicsPerDay = Math.ceil(pendingTasks.length / remainingDays);
  const hoursPerTask = +(goal.hoursPerDay / topicsPerDay).toFixed(2);

  let dayOffset = 0;

  for (let i = 0; i < pendingTasks.length; i++) {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + dayOffset);

    pendingTasks[i].scheduledDate = newDate;
    pendingTasks[i].hoursAllocated = hoursPerTask;
    pendingTasks[i].status = "pending";
    await pendingTasks[i].save();

    // Move to next day after filling topicsPerDay slots
    if ((i + 1) % topicsPerDay === 0) dayOffset++;
  }

  return {
    message: "Tasks redistributed successfully",
    remainingDays,
    pendingTasks: pendingTasks.length,
    topicsPerDay
  };
};

module.exports = redistributeTasks;