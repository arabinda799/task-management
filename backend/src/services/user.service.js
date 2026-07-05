const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");
const ROLES = require("../constants/role.const");
const argon2 = require("argon2");

const findAll = async (req) => {
    const { role, id: userId } = req.user;
    const { sortBy, sortOrder, page, limit, search, userType } = req.query;
    let query = { deletedAt: null };

    if (role === ROLES.TEAM_LEAD) {
        query.reportsTo = userId;
    } else if (role === ROLES.MANAGER) {
        query._id = { $ne: userId };
    } else {
        throw new Error("Access denied");
    }

    if (userType) {
        const roleMap = {
            MANAGER: ROLES.MANAGER,
            TEAMLEAD: ROLES.TEAM_LEAD,
            EMPLOYEE: ROLES.EMPLOYEE
        };
        query.role = roleMap[userType.toUpperCase()] || userType;
    }

    if (search) {
        query.$and = [
            {
                $or: [
                    { username: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            }
        ];
    }

    let sortQuery = {};
    if (sortBy) {
        sortQuery[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
        sortQuery.createdAt = -1;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query).sort(sortQuery).skip(skip).limit(limitNum).populate("reportsTo", "username role").select("-password");

    const formattedUsers = users.map(user => {
        const u = user.toObject();
        if (u.role) u.role = u.role.toUpperCase();
        if (u.status) u.status = u.status.toUpperCase();
        if (u.reportsTo && u.reportsTo.role) {
            u.reportsTo.role = u.reportsTo.role.toUpperCase();
        }
        return u;
    });

    return new ApiResponse(true, "Users retrieved successfully", {
        users: formattedUsers,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    });
};

const findOne = async (req) => {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const user = await User.findOne({ _id: id, deletedAt: null }).populate("reportsTo", "username role").select("-password");
    if (!user) {
        throw new Error("User not found");
    }

    if (role === ROLES.TEAM_LEAD && user.reportsTo?.toString() !== userId) {
        throw new Error("Access denied");
    }

    const u = user.toObject();
    if (u.role) u.role = u.role.toUpperCase();
    if (u.reportsTo && u.reportsTo.role) {
        u.reportsTo.role = u.reportsTo.role.toUpperCase();
    }

    return new ApiResponse(true, "", u);
};

const create = async (req) => {
    const { username, email, password, role } = req.body;
    let { reportsTo } = req.body;
    const { role: creatorRole, id: creatorId } = req.user;

    const existingUser = await User.findOne({ email, deletedAt: null });
    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await argon2.hash(password);

    if (creatorRole === ROLES.TEAM_LEAD) {
        if (role !== ROLES.EMPLOYEE) {
            throw new Error("Invalid role selection");
        }
        reportsTo = creatorId;
    } else if (creatorRole === ROLES.MANAGER) {
        if (role === ROLES.EMPLOYEE) {
            if (!reportsTo) {
                throw new Error("reportsTo is required");
            }
            const tl = await User.findOne({ _id: reportsTo, role: ROLES.TEAM_LEAD, deletedAt: null });
            if (!tl) {
                throw new Error("Invalid team lead");
            }
        } else if (role === ROLES.TEAM_LEAD) {
            reportsTo = reportsTo || creatorId;
        } else if (role === ROLES.MANAGER) {
            reportsTo = null;
        }
    }

    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
        reportsTo
    });

    return new ApiResponse(true, "User created successfully", {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        reportsTo: newUser.reportsTo
    });
};

const update = async (req) => {
    const { id } = req.params;
    const { username, email, role, reportsTo, password, status } = req.body;
    const { role: actorRole, id: actorId } = req.user;

    const user = await User.findOne({ _id: id, deletedAt: null });
    if (!user) {
        throw new Error("User not found");
    }

    if (actorRole === ROLES.TEAM_LEAD) {
        if (user.reportsTo?.toString() !== actorId) {
            throw new Error("Access denied");
        }
        if (role !== undefined && role !== ROLES.EMPLOYEE) {
            throw new Error("Role update restricted");
        }
        if (reportsTo !== undefined && reportsTo !== actorId) {
            throw new Error("Reports update restricted");
        }
    }

    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, deletedAt: null });
        if (existingUser) {
            throw new Error("Email already exists");
        }
    }

    if (username !== undefined) {
        user.username = username;
    }
    if (email !== undefined) {
        user.email = email;
    }
    if (role !== undefined && role !== user.role) {
        if (user.role === ROLES.TEAM_LEAD && role === ROLES.EMPLOYEE) {
            const reportsCount = await User.countDocuments({ reportsTo: id, deletedAt: null });
            if (reportsCount > 0) {
                throw new Error("Cannot downgrade Team Lead with active direct reports");
            }
        }
        user.role = role;
    }

    if (reportsTo !== undefined) {
        if (reportsTo) {
            if (user.role === ROLES.EMPLOYEE) {
                const tl = await User.findOne({ _id: reportsTo, role: ROLES.TEAM_LEAD, deletedAt: null });
                if (!tl) {
                    throw new Error("Invalid team lead");
                }
            }
            user.reportsTo = reportsTo;
        } else {
            user.reportsTo = null;
        }
    }

    if (status !== undefined) {
        user.status = status.toLowerCase();
    }

    if (password) {
        const argon2 = require("argon2");
        user.password = await argon2.hash(password);
    }

    await user.save();
    return new ApiResponse(true, "User updated successfully", {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        reportsTo: user.reportsTo,
        status: user.status.toUpperCase()
    });
};

const deleteUsers = async (req) => {
    const { ids } = req.body;
    const { id: actorId, role: actorRole } = req.user;
    const idList = Array.isArray(ids) ? ids : [ids];

    if (actorRole === ROLES.TEAM_LEAD) {
        const users = await User.find({ _id: { $in: idList }, deletedAt: null });
        const isTeamMembers = users.every(u => u.reportsTo?.toString() === actorId);
        if (!isTeamMembers) {
            throw new Error("Access denied");
        }
    }

    await User.updateMany(
        { _id: { $in: idList }, deletedAt: null },
        { $set: { deletedAt: new Date() } }
    );

    return new ApiResponse(true, "Deleted successfully");
};

const getAssignees = async (req) => {
    const { role, id: userId } = req.user;
    let query = { deletedAt: null };

    if (role === ROLES.EMPLOYEE) {
        query._id = userId;
    } else if (role === ROLES.TEAM_LEAD) {
        query.$or = [
            { _id: userId },
            { reportsTo: userId, role: ROLES.EMPLOYEE }
        ];
    } else if (role === ROLES.MANAGER) {
        query.role = { $in: [ROLES.TEAM_LEAD, ROLES.EMPLOYEE, ROLES.MANAGER] };
    }

    const users = await User.find(query).select("username email role");
    return new ApiResponse(true, "Assignees retrieved successfully", users);
};

const transferReports = async (req) => {
    const { id } = req.params;
    const { newReportsToId } = req.body;

    const oldTL = await User.findOne({ _id: id, role: ROLES.TEAM_LEAD, deletedAt: null });
    if (!oldTL) {
        throw new Error("Source Team Lead not found");
    }

    const newTL = await User.findOne({ _id: newReportsToId, role: ROLES.TEAM_LEAD, deletedAt: null });
    if (!newTL) {
        throw new Error("Target Team Lead not found");
    }

    if (id === newReportsToId) {
        throw new Error("Source and target Team Leads cannot be the same");
    }

    await User.updateMany(
        { reportsTo: id, deletedAt: null },
        { $set: { reportsTo: newReportsToId } }
    );

    return new ApiResponse(true, "Reports transferred successfully");
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deleteUsers,
    getAssignees,
    transferReports
};
