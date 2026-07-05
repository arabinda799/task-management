const taskService = require("../services/task.service");
const ApiResponse = require("../utils/apiResponse");

const create = async (req, res) => {
    try {
        const response = await taskService.create(req);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const update = async (req, res) => {
    try {
        const response = await taskService.update(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const updateStatus = async (req, res) => {
    try {
        const response = await taskService.updateStatus(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const deleteTasks = async (req, res) => {
    try {
        const response = await taskService.deleteTasks(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const findAll = async (req, res) => {
    try {
        const response = await taskService.findAll(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const findOne = async (req, res) => {
    try {
        const response = await taskService.findOne(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const response = await taskService.getDashboardStats(req);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json(new ApiResponse(false, error.message));
    }
};

module.exports = {
    create,
    update,
    updateStatus,
    deleteTasks,
    findAll,
    findOne,
    getDashboardStats
};
