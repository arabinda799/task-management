const express = require("express");
const router = express.Router();

const { loginValidator, registerValidator, refreshTokenValidator } = require("../validators/auth.validate");
const authController = require("../controllers/auth.controller");

router.post("/login", loginValidator, authController.login);
router.post("/register", registerValidator, authController.register);
router.post("/refresh", refreshTokenValidator, authController.refresh);
router.post("/logout", authController.logout);

module.exports = router;