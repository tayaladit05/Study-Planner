const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use("/api/goals", require("./src/routes/goal.routes"));
app.use("/api/tasks", require("./src/routes/task.routes"));

app.get("/", (req, res) => res.send("Smart Study Planner API running"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));