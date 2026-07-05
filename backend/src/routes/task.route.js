const express = require("express");
const router = express.Router();

const authGuard = require("../middleware/auth");
const taskController = require("../controllers/task.controller");
const {
    createTaskValidator,
    updateTaskValidator,
    taskIdValidator,
    bulkStatusValidator,
    bulkDeleteValidator
} = require("../validators/task.validate");

router.post("/", authGuard, createTaskValidator, taskController.create);
router.get("/", authGuard, taskController.findAll);
router.get("/dashboard/stats", authGuard, taskController.getDashboardStats);
router.get("/:id", authGuard, taskIdValidator, taskController.findOne);
router.put("/:id", authGuard, taskIdValidator, updateTaskValidator, taskController.update);
router.patch("/status", authGuard, bulkStatusValidator, taskController.updateStatus);
router.delete("/", authGuard, bulkDeleteValidator, taskController.deleteTasks);

module.exports = router;
