const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`user:${socket.user.id}`);
        socket.join(`role:${socket.user.role}`);

        socket.on("disconnect", () => {
            socket.leave(`user:${socket.user.id}`);
            socket.leave(`role:${socket.user.role}`);
        });
    });

    return io;
};

const emitTaskUpdate = (event, taskData) => {
    if (io) {
        console.log("WS Broadcast: task_updated", { event });
        io.emit("task_updated", { event, task: taskData });
    }
};

module.exports = {
    initSocket,
    emitTaskUpdate
};
