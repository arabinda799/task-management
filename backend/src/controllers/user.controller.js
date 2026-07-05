const userService = require("../services/user.service");
const ApiResponse = require("../utils/apiResponse");

const findAll = async (req, res) => {
    try {
        const response = await userService.findAll(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const findOne = async (req, res) => {
    try {
        const response = await userService.findOne(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const create = async (req, res) => {
    try {
        const response = await userService.create(req);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const update = async (req, res) => {
    try {
        const response = await userService.update(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const deleteUsers = async (req, res) => {
    try {
        const response = await userService.deleteUsers(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const getAssignees = async (req, res) => {
    try {
        const response = await userService.getAssignees(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const transferReports = async (req, res) => {
    try {
        const response = await userService.transferReports(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deleteUsers,
    getAssignees,
    transferReports
};
