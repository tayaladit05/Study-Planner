const apiBase = "/api";

const goalForm = document.getElementById("goalForm");
const formMessage = document.getElementById("formMessage");
const goalsList = document.getElementById("goalsList");
const selectedGoal = document.getElementById("selectedGoal");
const output = document.getElementById("output");
const refreshGoalsBtn = document.getElementById("refreshGoals");
const loadTasksBtn = document.getElementById("loadTasksBtn");
const loadTodayBtn = document.getElementById("loadTodayBtn");
const loadPerformanceBtn = document.getElementById("loadPerformanceBtn");
const redistributeBtn = document.getElementById("redistributeBtn");

let currentGoal = null;

function parseTopicsInput(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());

      if (parts.length === 1) {
        return { name: parts[0], hoursNeeded: 1, priority: "medium" };
      }

      const [name, hours, priority] = parts;
      return {
        name,
        hoursNeeded: Number(hours),
        priority: String(priority || "medium").toLowerCase()
      };
    });
}

function renderJson(data) {
  output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

function setSelectedGoal(goal) {
  currentGoal = goal;
  if (!goal) {
    selectedGoal.textContent = "No goal selected.";
    loadTasksBtn.disabled = true;
    loadTodayBtn.disabled = true;
    loadPerformanceBtn.disabled = true;
    redistributeBtn.disabled = true;
    return;
  }

  selectedGoal.innerHTML = `
    <div><strong>Title:</strong> ${goal.title}</div>
    <div><strong>Days:</strong> ${goal.totalDays}</div>
    <div><strong>Hours/Day:</strong> ${goal.hoursPerDay}</div>
    <div><strong>Status:</strong> ${goal.status}</div>
    <div><strong>Start:</strong> ${new Date(goal.startDate).toLocaleDateString()}</div>
    <div><strong>Deadline:</strong> ${new Date(goal.deadline).toLocaleDateString()}</div>
  `;

  loadTasksBtn.disabled = false;
  loadTodayBtn.disabled = false;
  loadPerformanceBtn.disabled = false;
  redistributeBtn.disabled = false;
}

async function fetchGoals() {
  const response = await fetch(`${apiBase}/goals`);
  const goals = await response.json();

  goalsList.innerHTML = "";
  if (!goals.length) {
    goalsList.textContent = "No goals found.";
    return;
  }

  goals.forEach((goal) => {
    const item = document.createElement("div");
    item.className = "goal-item";
    item.innerHTML = `
      <div><strong>${goal.title}</strong></div>
      <div>Days: ${goal.totalDays} | Hours/Day: ${goal.hoursPerDay}</div>
      <div>Status: ${goal.status}</div>
      <button type="button">Select</button>
    `;
    item.querySelector("button").addEventListener("click", () => setSelectedGoal(goal));
    goalsList.appendChild(item);
  });
}

function renderTasks(tasks, title) {
  if (!tasks.length) {
    output.textContent = `${title}: No tasks found.`;
    return;
  }

  output.innerHTML = `<h3>${title}</h3>`;

  tasks.forEach((task) => {
    const taskItem = document.createElement("div");
    taskItem.className = "task-item";
    taskItem.innerHTML = `
      <div><strong>Topic:</strong> ${task.topic}</div>
      <div><strong>Priority:</strong> ${task.topicPriority || "medium"}</div>
      <div><strong>Date:</strong> ${new Date(task.scheduledDate).toLocaleDateString()}</div>
      <div><strong>Hours:</strong> ${task.hoursAllocated}</div>
      <div><strong>Status:</strong> ${task.status}</div>
      <select>
        <option value="pending">pending</option>
        <option value="completed">completed</option>
        <option value="skipped">skipped</option>
      </select>
      <button type="button">Update Status</button>
    `;

    const select = taskItem.querySelector("select");
    select.value = task.status;
    taskItem.querySelector("button").addEventListener("click", async () => {
      const response = await fetch(`${apiBase}/tasks/${task._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: select.value })
      });
      const result = await response.json();
      renderJson(result);
      if (currentGoal) {
        await loadTasks(currentGoal._id);
      }
    });

    output.appendChild(taskItem);
  });
}

async function loadTasks(goalId) {
  const response = await fetch(`${apiBase}/tasks/${goalId}`);
  const tasks = await response.json();
  renderTasks(tasks, "All Tasks");
}

async function loadTodayTasks(goalId) {
  const response = await fetch(`${apiBase}/tasks/${goalId}/today`);
  const tasks = await response.json();
  renderTasks(tasks, "Today Tasks");
}

async function loadPerformance(goalId) {
  const response = await fetch(`${apiBase}/tasks/${goalId}/performance`);
  const data = await response.json();
  renderJson(data);
}

goalForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: document.getElementById("title").value.trim(),
    topics: parseTopicsInput(document.getElementById("topics").value),
    totalDays: Number(document.getElementById("totalDays").value),
    hoursPerDay: Number(document.getElementById("hoursPerDay").value)
  };

  const response = await fetch(`${apiBase}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  formMessage.textContent = result.error || result.message || "Done";
  renderJson(result);
  goalForm.reset();
  await fetchGoals();
});

refreshGoalsBtn.addEventListener("click", fetchGoals);

loadTasksBtn.addEventListener("click", () => currentGoal && loadTasks(currentGoal._id));
loadTodayBtn.addEventListener("click", () => currentGoal && loadTodayTasks(currentGoal._id));
loadPerformanceBtn.addEventListener("click", () => currentGoal && loadPerformance(currentGoal._id));
redistributeBtn.addEventListener("click", async () => {
  if (!currentGoal) return;
  const response = await fetch(`${apiBase}/goals/${currentGoal._id}/redistribute`, { method: "POST" });
  const result = await response.json();
  renderJson(result);
  await fetchGoals();
});

fetchGoals();
