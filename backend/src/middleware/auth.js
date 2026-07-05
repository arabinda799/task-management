const User = require("../models/user.model");
const { verifyAccessToken } = require("../utils/jwt");
const redisClient = require("../utils/redis");
const ApiResponse = require("../utils/apiResponse");

const authGuard = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json(new ApiResponse(false, "Header token misisng"));
        }

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            return res.status(401).json(new ApiResponse(false, "Invalid or expired token"));
        }

        let user;
        const cacheKey = `user:${decoded.id}`;
        const cachedUser = await redisClient.get(cacheKey);

        if (cachedUser) {
            user = JSON.parse(cachedUser);
        } else {
            const dbUser = await User.findOne({ _id: decoded.id, deletedAt: null }).select("id, email, role");
            if (!dbUser) {
                return res.status(401).json(new ApiResponse(false, "Invalid or expired token"));
            }

            if (dbUser.status === "inactive") {
                return res.status(401).json(new ApiResponse(false, "Invalid or expired token"));
            }

            if (dbUser.status === "pending") {
                return res.status(401).json(new ApiResponse(false, "Account pending activation"));
            }

            user = {
                id: dbUser._id.toString(),
                email: dbUser.email,
                role: dbUser.role
            };

            await redisClient.set(cacheKey, JSON.stringify(user), "EX", 900);
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json(new ApiResponse(false, error.message));
    }
};

module.exports = authGuard;
