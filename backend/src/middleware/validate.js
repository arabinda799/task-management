const { validationResult } = require("express-validator");
const ApiResponse = require("../utils/apiResponse");

const validateResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = errors.array().map(err => err.msg).join(", ");
        return res.status(400).json(new ApiResponse(false, errorMsg));
    }
    next();
};

module.exports = validateResults;
