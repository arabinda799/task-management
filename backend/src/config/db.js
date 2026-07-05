const mongoose = require("mongoose");

const conn = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongo connected");
    } catch (error) {
        console.error("Mongo connection failed, Error: ", error.message);
        process.exit(1);
    }
}

module.exports = conn;