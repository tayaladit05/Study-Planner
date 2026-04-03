const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/goals", require("./src/routes/goals.routes"));
app.use("/api/tasks", require("./src/routes/tasks.routes"));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));