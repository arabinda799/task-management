const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisClient.on("connect", () => console.log("Redis connected successfully"));

module.exports = redisClient;
