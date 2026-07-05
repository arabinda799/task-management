require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const conn = require("./src/config/db");
const { initSocket } = require("./src/utils/socket");

const PORT = process.env.PORT || 5000;

const start = async () => {
    await conn();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => {
        console.log(`Server started and running on port ${PORT}`);
    });
}

start();
