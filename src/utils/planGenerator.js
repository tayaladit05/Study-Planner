// Input topic supports both formats:
// 1) "Polity"
// 2) { name: "Polity", hoursNeeded: 6, priority: "high" }

const PRIORITY_WEIGHT = {
  high: 3,
  medium: 2,
  low: 1
};

const normalizePriority = (value) => {
  const normalized = String(value || "medium").toLowerCase();
  return PRIORITY_WEIGHT[normalized] ? normalized : "medium";
};

const normalizeTopics = (topics) => {
  return topics
    .map((topic) => {
      if (typeof topic === "string") {
        const name = topic.trim();
        if (!name) return null;
        return { name, hoursNeeded: 1, priority: "medium" };
      }

      if (!topic || typeof topic !== "object") return null;

      const name = String(topic.name || topic.topic || "").trim();
      const hoursNeeded = Number(topic.hoursNeeded ?? topic.timeNeeded ?? topic.hours);
      const priority = normalizePriority(topic.priority);

      if (!name || !Number.isFinite(hoursNeeded) || hoursNeeded <= 0) return null;

      return {
        name,
        hoursNeeded: +hoursNeeded.toFixed(2),
        priority
      };
    })
    .filter(Boolean);
};

const generatePlan = (goalId, topics, startDate, totalDays, hoursPerDay) => {
  const normalizedTopics = normalizeTopics(topics);
  const sortedTopics = [...normalizedTopics].sort((a, b) => {
    const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (byPriority !== 0) return byPriority;
    return b.hoursNeeded - a.hoursNeeded;
  });

  const days = Array.from({ length: totalDays }, (_, dayOffset) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return { date, remainingHours: +hoursPerDay.toFixed(2) };
  });

  const tasks = [];
  const unscheduledTopics = [];

  sortedTopics.forEach((topic) => {
    let remainingTopicHours = topic.hoursNeeded;

    for (let i = 0; i < days.length && remainingTopicHours > 0; i++) {
      const day = days[i];
      if (day.remainingHours <= 0) continue;

      const chunk = +Math.min(day.remainingHours, remainingTopicHours).toFixed(2);
      if (chunk <= 0) continue;

      tasks.push({
        goalId,
        topic: topic.name,
        topicPriority: topic.priority,
        scheduledDate: day.date,
        hoursAllocated: chunk,
        status: "pending"
      });

      day.remainingHours = +(day.remainingHours - chunk).toFixed(2);
      remainingTopicHours = +(remainingTopicHours - chunk).toFixed(2);
    }

    if (remainingTopicHours > 0) {
      unscheduledTopics.push({
        topic: topic.name,
        priority: topic.priority,
        hoursRemaining: +remainingTopicHours.toFixed(2)
      });
    }
  });

  const totalRequestedHours = +normalizedTopics
    .reduce((sum, topic) => sum + topic.hoursNeeded, 0)
    .toFixed(2);
  const totalScheduledHours = +tasks
    .reduce((sum, task) => sum + task.hoursAllocated, 0)
    .toFixed(2);
  const totalAvailableHours = +(totalDays * hoursPerDay).toFixed(2);
  const bufferHours = +days.reduce((sum, day) => sum + day.remainingHours, 0).toFixed(2);
  const additionalHoursNeeded = +unscheduledTopics
    .reduce((sum, topic) => sum + topic.hoursRemaining, 0)
    .toFixed(2);

  const feasible = unscheduledTopics.length === 0;

  const summary = {
    feasible,
    normalizedTopics,
    totalRequestedHours,
    totalScheduledHours,
    totalAvailableHours,
    bufferHours,
    unscheduledTopics,
    recommendation: feasible
      ? "Plan generated successfully within your current timeline."
      : {
          message: `These least-priority topics could not fit in the current plan: ${unscheduledTopics.map((topic) => topic.topic).join(", ")}. If you want to include them in your target, try increasing the deadline or time per day.`,
          additionalHoursNeeded,
          suggestedMinimumHoursPerDay: +(totalRequestedHours / totalDays).toFixed(2),
          suggestedAdditionalDays: Math.ceil(additionalHoursNeeded / hoursPerDay)
        }
  };

  return { tasks, summary };
};

module.exports = generatePlan;