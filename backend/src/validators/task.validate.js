const { body, param } = require("express-validator");
const validateResults = require("../middleware/validate");
const { TASK_STATUS } = require("../constants/status.const");

const validateIds = (value) => {
    const arr = Array.isArray(value) ? value : [value];
    if (arr.length === 0) {
        throw new Error("IDs cannot be empty");
    }
    const isMongoId = id => /^[0-9a-fA-F]{24}$/.test(id);
    if (!arr.every(isMongoId)) {
        throw new Error("All IDs must be valid MongoDB ObjectIds");
    }
    return true;
};

const createTaskValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Title is required"),

    body("description")
        .optional()
        .trim(),

    body("assignedTo")
        .optional({ checkFalsy: true })
        .isMongoId().withMessage("Invalid user ID format"),

    body("dueDate")
        .notEmpty().withMessage("Due date is required")
        .isISO8601().withMessage("Invalid due date format"),

    validateResults
];

const updateTaskValidator = [
    body("title")
        .optional()
        .trim()
        .notEmpty().withMessage("Title cannot be empty"),

    body("description")
        .optional()
        .trim(),

    body("assignedTo")
        .optional()
        .isMongoId().withMessage("Invalid user ID format"),

    body("dueDate")
        .optional()
        .notEmpty().withMessage("Due date cannot be empty")
        .isISO8601().withMessage("Invalid due date format"),

    body("status")
        .optional()
        .isIn(Object.values(TASK_STATUS)).withMessage("Invalid status value"),

    validateResults
];

const taskIdValidator = [
    param("id")
        .isMongoId().withMessage("Invalid task ID format"),

    validateResults
];

const bulkStatusValidator = [
    body("ids")
        .notEmpty().withMessage("IDs are required")
        .custom(validateIds),

    body("status")
        .notEmpty().withMessage("Status is required")
        .isIn(Object.values(TASK_STATUS)).withMessage("Invalid status value"),

    validateResults
];

const bulkDeleteValidator = [
    body("ids")
        .notEmpty().withMessage("IDs are required")
        .custom(validateIds),

    validateResults
];

module.exports = {
    createTaskValidator,
    updateTaskValidator,
    taskIdValidator,
    bulkStatusValidator,
    bulkDeleteValidator
};
