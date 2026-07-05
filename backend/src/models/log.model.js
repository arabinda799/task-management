const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["success", "failed"],
            required: true,
            index: true,
        },
        ipAddress: {
            type: String,
            default: "",
        },
        userAgent: {
            type: String,
            default: "",
        },
        failureReason: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);


const emailLogSchema = new mongoose.Schema(
    {
        to: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        subject: {
            type: String,
            required: true,
        },
        template: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "sent", "failed"],
            default: "pending",
            index: true,
        },
        error: {
            type: String,
            default: null,
        },
        sentAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);


const LoginLog = mongoose.model("LoginLog", loginLogSchema);
const EmailLog = mongoose.model("EmailLog", emailLogSchema);

module.exports = {
    LoginLog,
    EmailLog,
};
