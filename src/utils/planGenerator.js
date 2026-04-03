// Takes topics, startDate, totalDays, hoursPerDay
// Returns an array of tasks spread across days

const generatePlan = (goalId, topics, startDate, totalDays, hoursPerDay) => {
  const tasks = [];
  const hoursPerTopic = hoursPerDay; // 1 topic = full day's hours for simplicity
  const topicsPerDay = Math.ceil(topics.length / totalDays);

  let dayIndex = 0;

  topics.forEach((topic, i) => {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + dayIndex);

    tasks.push({
      goalId,
      topic,
      scheduledDate,
      hoursAllocated: +(hoursPerDay / topicsPerDay).toFixed(2),
      status: "pending"
    });

    // Move to next day after filling topicsPerDay slots
    if ((i + 1) % topicsPerDay === 0) dayIndex++;
  });

  return tasks;
};

module.exports = generatePlan;