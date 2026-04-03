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
const topicsList = document.getElementById("topicsList");
const addTopicBtn = document.getElementById("addTopicBtn");

let currentGoal = null;
let topics = [];
let topicIdCounter = 0;

function renderTopics() {
  topicsList.innerHTML = "";
  
  if (topics.length === 0) {
    topicsList.innerHTML = "<p>No topics added yet.</p>";
    return;
  }

  topics.forEach((topic) => {
    const div = document.createElement("div");
    div.className = "topic-entry";
    div.innerHTML = `
      <input type="text" placeholder="Topic name" value="${topic.name}" data-field="name" data-id="${topic.id}" />
      <input type="number" min="0.25" step="0.25" placeholder="Hours" value="${topic.hoursNeeded}" data-field="hoursNeeded" data-id="${topic.id}" />
      <select data-field="priority" data-id="${topic.id}">
        <option value="low" ${topic.priority === "low" ? "selected" : ""}>Low</option>
        <option value="medium" ${topic.priority === "medium" ? "selected" : ""}>Medium</option>
        <option value="high" ${topic.priority === "high" ? "selected" : ""}>High</option>
      </select>
      <button type="button" class="remove-topic">Remove</button>
    `;

    const nameInput = div.querySelector('input[data-field="name"]');
    const hoursInput = div.querySelector('input[data-field="hoursNeeded"]');
    const prioritySelect = div.querySelector('select[data-field="priority"]');
    const removeBtn = div.querySelector(".remove-topic");

    nameInput.addEventListener("change", (e) => {
      const topicObj = topics.find((t) => t.id === topic.id);
      if (topicObj) topicObj.name = e.target.value;
    });

    hoursInput.addEventListener("change", (e) => {
      const topicObj = topics.find((t) => t.id === topic.id);
      if (topicObj) topicObj.hoursNeeded = Number(e.target.value);
    });

    prioritySelect.addEventListener("change", (e) => {
      const topicObj = topics.find((t) => t.id === topic.id);
      if (topicObj) topicObj.priority = e.target.value;
    });

    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      topics = topics.filter((t) => t.id !== topic.id);
      renderTopics();
    });

    topicsList.appendChild(div);
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

  if (topics.length === 0) {
    formMessage.textContent = "Please add at least one topic";
    return;
  }

  const invalidTopic = topics.find((t) => !t.name.trim() || !t.hoursNeeded || t.hoursNeeded <= 0);
  if (invalidTopic) {
    formMessage.textContent = "Each topic must have a name and positive hours needed";
    return;
  }

  const payload = {
    title: document.getElementById("title").value.trim(),
    topics: topics.map((t) => ({
      name: t.name,
      hoursNeeded: t.hoursNeeded,
      priority: t.priority
    })),
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
  topics = [];
  renderTopics();
  await fetchGoals();
});

addTopicBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const newTopic = {
    id: topicIdCounter++,
    name: "",
    hoursNeeded: 1,
    priority: "medium"
  };
  topics.push(newTopic);
  renderTopics();
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

renderTopics();
fetchGoals();
