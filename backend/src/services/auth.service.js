const argon2 = require("argon2");
const User = require("../models/user.model");
const UserSession = require("../models/userSession.model");
const { LoginLog } = require("../models/log.model");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const redisClient = require("../utils/redis");
const ApiResponse = require("../utils/apiResponse");
const { STATUS } = require("../constants/status.const");
const ROLES = require("../constants/role.const");
const { sendLoginEmail } = require("../utils/email");

const login = async (req) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const user = await User.findOne({ email, deletedAt: null }).select("username email password role status");

    if (!user) {
        await LoginLog.create({
            email,
            status: "failed",
            ipAddress,
            userAgent,
            failureReason: "User not found"
        });
        throw new Error("Invalid credentials");
    }

    if (user.status === "inactive") {
        await LoginLog.create({
            email,
            userId: user._id,
            status: "failed",
            ipAddress,
            userAgent,
            failureReason: "Account inactive"
        });
        throw new Error("Account is inactive");
    }

    if (user.status === "pending") {
        await LoginLog.create({
            email,
            userId: user._id,
            status: "failed",
            ipAddress,
            userAgent,
            failureReason: "Account pending"
        });
        throw new Error("Contact adminstrator to active account");
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
        await LoginLog.create({
            email,
            userId: user._id,
            status: "failed",
            ipAddress,
            userAgent,
            failureReason: "Incorrect password"
        });
        throw new Error("Invalid credentials");
    }

    const oldSessions = await UserSession.find({ userId: user._id });
    for (const session of oldSessions) {
        await redisClient.del(`refreshToken:${session.refreshToken}`);
    }
    await UserSession.deleteMany({ userId: user._id });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const ttlSeconds = 7 * 24 * 60 * 60;

    const sessionUser = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
    };

    await redisClient.set(`refreshToken:${refreshToken}`, JSON.stringify(sessionUser), "EX", ttlSeconds);

    await UserSession.create({
        userId: user._id,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt
    });

    await LoginLog.create({
        email,
        userId: user._id,
        status: "success",
        ipAddress,
        userAgent
    });

    sendLoginEmail(user.email).catch(() => {});

    return new ApiResponse(true, "Login successful", {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        accessToken,
        refreshToken
    });
};


const register = async (req) => {
    const { username, email, password } = req.body;

    try {
        await User.create({
            username,
            email,
            password: await argon2.hash(password),
            role: ROLES.EMPLOYEE,
            status: STATUS.PENDING
        });
        return new ApiResponse(true, "Registration successful");
    } catch (error) {
        if (error.code === 11000) {
            throw new Error("Email already exists");
        }
        throw error;
    }
}


const refreshToken = async (req) => {
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
        throw new Error("Refresh token is required");
    }

    const cachedData = await redisClient.get(`refreshToken:${oldRefreshToken}`);
    if (!cachedData) {
        throw new Error("Invalid or expired refresh token");
    }

    const sessionUser = JSON.parse(cachedData);
    const userId = sessionUser.id;

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
        throw new Error("User not found");
    }

    if (user.status === "inactive") {
        throw new Error("Account is inactive");
    }

    if (user.status === "pending") {
        throw new Error("Account is pending activation");
    }

    await redisClient.del(`refreshToken:${oldRefreshToken}`);

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken();

    const ttlSeconds = 7 * 24 * 60 * 60;
    const newSessionUser = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
    };
    await redisClient.set(`refreshToken:${newRefreshToken}`, JSON.stringify(newSessionUser), "EX", ttlSeconds);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await UserSession.findOneAndUpdate(
        { refreshToken: oldRefreshToken },
        { refreshToken: newRefreshToken, expiresAt }
    );

    return new ApiResponse(true, "Token refreshed successfully", {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    });
};

const logout = async (req) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await redisClient.del(`refreshToken:${refreshToken}`);
        await UserSession.deleteOne({ refreshToken });
    }
    return new ApiResponse(true, "Logged out successfully");
};

module.exports = {
    login,
    register,
    refreshToken,
    logout
};
