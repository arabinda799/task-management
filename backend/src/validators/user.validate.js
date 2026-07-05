const { body, param } = require("express-validator");
const validateResults = require("../middleware/validate");
const ROLES = require("../constants/role.const");
const { STATUS } = require("../constants/status.const");

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

const createUserValidator = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please enter a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

    body("role")
        .notEmpty().withMessage("Role is required")
        .isIn(Object.values(ROLES)).withMessage("Invalid role"),

    body("reportsTo")
        .optional({ checkFalsy: true })
        .isMongoId().withMessage("Invalid reportsTo user ID format"),

    validateResults
];

const updateUserValidator = [
    body("username")
        .optional()
        .trim()
        .notEmpty().withMessage("Username cannot be empty"),

    body("email")
        .optional()
        .trim()
        .isEmail().withMessage("Please enter a valid email address")
        .normalizeEmail(),

    body("role")
        .optional()
        .isIn(Object.values(ROLES)).withMessage("Invalid role"),

    body("reportsTo")
        .optional({ checkFalsy: true })
        .isMongoId().withMessage("Invalid reportsTo user ID format"),

    body("password")
        .optional()
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

    body("status")
        .optional()
        .isIn(Object.values(STATUS)).withMessage("Invalid status"),

    validateResults
];

const userIdValidator = [
    param("id")
        .isMongoId().withMessage("Invalid user ID format"),

    validateResults
];

const bulkDeleteUserValidator = [
    body("ids")
        .notEmpty().withMessage("IDs are required")
        .custom(validateIds),

    validateResults
];

module.exports = {
    createUserValidator,
    updateUserValidator,
    userIdValidator,
    bulkDeleteUserValidator
};
