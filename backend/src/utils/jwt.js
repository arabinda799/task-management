const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_SECRET;

const generateAccessToken = (payload) => {
    return jwt.sign(payload, accessSecret, {
        expiresIn: "15m",
    });
};

const crypto = require("crypto");

const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString("hex");
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, accessSecret);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken
};