const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoute = require("./routes/auth.route");
const taskRoute = require("./routes/task.route");
const userRoute = require("./routes/user.route");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/users", userRoute);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Task Management API Running"
    });
});

module.exports = app;