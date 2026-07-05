const mongoose = require("mongoose");
const ROLES = require("../constants/role.const");
const { STATUS } = require("../constants/status.const");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true,
    },
    isPrimary: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.ACTIVE,
    },
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, {
    timestamps: true,
});

userSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model("User", userSchema);