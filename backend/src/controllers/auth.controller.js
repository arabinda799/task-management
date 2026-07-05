const ApiResponse = require("../utils/apiResponse");
const authService = require("../services/auth.service");

const login = async (req, res) => {
    try {
        const response = await authService.login(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const register = async (req, res) => {
    try {
        const response = await authService.register(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const refresh = async (req, res) => {
    try {
        const response = await authService.refreshToken(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const logout = async (req, res) => {
    try {
        const response = await authService.logout(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

module.exports = {
    login,
    register,
    refresh,
    logout
};
