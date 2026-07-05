const express = require("express");
const router = express.Router();

const authGuard = require("../middleware/auth");
const permissionGuard = require("../middleware/permission");
const userController = require("../controllers/user.controller");
const {
    createUserValidator,
    updateUserValidator,
    userIdValidator,
    bulkDeleteUserValidator
} = require("../validators/user.validate");
const ROLES = require("../constants/role.const");

router.get("/", authGuard, permissionGuard(ROLES.MANAGER, ROLES.TEAM_LEAD), userController.findAll);
router.get("/assignees", authGuard, userController.getAssignees);
router.post("/", authGuard, permissionGuard(ROLES.MANAGER, ROLES.TEAM_LEAD), createUserValidator, userController.create);
router.get("/:id", authGuard, permissionGuard(ROLES.MANAGER, ROLES.TEAM_LEAD), userIdValidator, userController.findOne);
router.put("/:id", authGuard, permissionGuard(ROLES.MANAGER, ROLES.TEAM_LEAD), userIdValidator, updateUserValidator, userController.update);
router.put("/:id/transfer-reports", authGuard, permissionGuard(ROLES.MANAGER), userIdValidator, userController.transferReports);
router.delete("/", authGuard, permissionGuard(ROLES.MANAGER, ROLES.TEAM_LEAD), bulkDeleteUserValidator, userController.deleteUsers);

module.exports = router;
