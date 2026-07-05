const Task = require("../models/Task.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");
const ROLES = require("../constants/role.const");
const { sendTaskCreatedEmail, sendTaskCompletedEmail } = require("../utils/email");
const { emitTaskUpdate } = require("../utils/socket");

const create = async (req) => {
    let { title, description, assignedTo, dueDate } = req.body;
    const { id: userId, role } = req.user;

    if (role === ROLES.EMPLOYEE) {
        assignedTo = userId;
    } else if (role === ROLES.TEAM_LEAD) {
        if (assignedTo !== userId) {
            const assignee = await User.findOne({ _id: assignedTo, deletedAt: null });
            if (!assignee || assignee.reportsTo?.toString() !== userId) {
                throw new Error("Invalid assignee");
            }
        }
    }

    const task = await Task.create({
        title,
        description,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId
    });

    const assignee = await User.findOne({ _id: assignedTo, deletedAt: null });
    if (assignee && assignee.email) {
        sendTaskCreatedEmail(assignee.email, title).catch(() => {});
    }

    emitTaskUpdate("create", task);

    return new ApiResponse(true, "Task created successfully");
};

const update = async (req) => {
    const { id } = req.params;
    const { title, description, assignedTo, dueDate, status } = req.body;
    const { id: userId, role } = req.user;

    const task = await Task.findOne({ _id: id, deletedAt: null });
    if (!task) {
        throw new Error("Task not found");
    }

    if (role === ROLES.EMPLOYEE) {
        if (task.createdBy.toString() !== userId && task.assignedTo.toString() !== userId) {
            throw new Error("Access denied");
        }
        if (assignedTo !== undefined && assignedTo !== userId) {
            throw new Error("Invalid assignee");
        }
    } else if (role === ROLES.TEAM_LEAD) {
        const isOwner = task.createdBy.toString() === userId || task.assignedTo.toString() === userId;
        let isTeamTask = false;

        if (!isOwner) {
            const creator = await User.findOne({ _id: task.createdBy, deletedAt: null });
            const assignee = await User.findOne({ _id: task.assignedTo, deletedAt: null });
            const creatorReports = creator?.reportsTo?.toString() === userId;
            const assigneeReports = assignee?.reportsTo?.toString() === userId;
            isTeamTask = creatorReports || assigneeReports;
        }

        if (!isOwner && !isTeamTask) {
            throw new Error("Access denied");
        }

        if (assignedTo !== undefined && assignedTo !== userId) {
            const assignee = await User.findOne({ _id: assignedTo, deletedAt: null });
            if (!assignee || assignee.reportsTo?.toString() !== userId) {
                throw new Error("Invalid assignee");
            }
        }
    }

    if (title !== undefined) {
        task.title = title;
    }
    if (description !== undefined) {
        task.description = description;
    }
    if (assignedTo !== undefined) {
        task.assignedTo = assignedTo;
    }
    if (dueDate !== undefined) {
        task.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (status !== undefined) {
        task.status = status.toLowerCase();
    }
    task.updatedBy = userId;

    await task.save();
    emitTaskUpdate("update", task);
    return new ApiResponse(true, "Task updated successfully", task);
};

const updateStatus = async (req) => {
    const { ids, status } = req.body;
    const { id: userId, role } = req.user;
    const idList = Array.isArray(ids) ? ids : [ids];

    if (role === ROLES.EMPLOYEE) {
        const tasks = await Task.find({ _id: { $in: idList }, deletedAt: null });
        const hasAccess = tasks.every(t => t.createdBy.toString() === userId || t.assignedTo.toString() === userId);
        if (!hasAccess) {
            throw new Error("Access denied");
        }
    } else if (role === ROLES.TEAM_LEAD) {
        const tasks = await Task.find({ _id: { $in: idList }, deletedAt: null });
        for (const t of tasks) {
            const isOwner = t.createdBy.toString() === userId || t.assignedTo.toString() === userId;
            let isTeamTask = false;
            if (!isOwner) {
                const creator = await User.findOne({ _id: t.createdBy, deletedAt: null });
                const assignee = await User.findOne({ _id: t.assignedTo, deletedAt: null });
                const creatorReports = creator?.reportsTo?.toString() === userId;
                const assigneeReports = assignee?.reportsTo?.toString() === userId;
                isTeamTask = creatorReports || assigneeReports;
            }
            if (!isOwner && !isTeamTask) {
                throw new Error("Access denied");
            }
        }
    }

    await Task.updateMany(
        { _id: { $in: idList }, deletedAt: null },
        { $set: { status, updatedBy: userId } }
    );

    if (status === "completed") {
        const completedTasks = await Task.find({ _id: { $in: idList }, deletedAt: null });
        for (const t of completedTasks) {
            const creator = await User.findOne({ _id: t.createdBy, deletedAt: null });
            if (creator && creator.email) {
                sendTaskCompletedEmail(creator.email, t.title).catch(() => {});
            }
        }
    }

    emitTaskUpdate("updateStatus", { ids: idList, status });

    return new ApiResponse(true, "Status updated successfully");
};

const deleteTasks = async (req) => {
    const { ids } = req.body;
    const { id: userId, role } = req.user;
    const idList = Array.isArray(ids) ? ids : [ids];

    if (role === ROLES.EMPLOYEE) {
        const tasks = await Task.find({ _id: { $in: idList }, deletedAt: null });
        const hasAccess = tasks.every(t => t.createdBy.toString() === userId || t.assignedTo.toString() === userId);
        if (!hasAccess) {
            throw new Error("Access denied");
        }
    } else if (role === ROLES.TEAM_LEAD) {
        const tasks = await Task.find({ _id: { $in: idList }, deletedAt: null });
        for (const t of tasks) {
            const isOwner = t.createdBy.toString() === userId || t.assignedTo.toString() === userId;
            let isTeamTask = false;
            if (!isOwner) {
                const creator = await User.findOne({ _id: t.createdBy, deletedAt: null });
                const assignee = await User.findOne({ _id: t.assignedTo, deletedAt: null });
                const creatorReports = creator?.reportsTo?.toString() === userId;
                const assigneeReports = assignee?.reportsTo?.toString() === userId;
                isTeamTask = creatorReports || assigneeReports;
            }
            if (!isOwner && !isTeamTask) {
                throw new Error("Access denied");
            }
        }
    }

    await Task.updateMany(
        { _id: { $in: idList }, deletedAt: null },
        { $set: { deletedAt: new Date(), deletedBy: userId } }
    );

    emitTaskUpdate("delete", { ids: idList });

    return new ApiResponse(true, "Deleted successfully");
};

const findAll = async (req) => {
    const { id: userId, role } = req.user;
    const { limit, page, search, status, sortBy, sortOrder, userType } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let query = { deletedAt: null };

    if (role === ROLES.EMPLOYEE) {
        query.$or = [{ createdBy: userId }, { assignedTo: userId }];
    } else if (role === ROLES.TEAM_LEAD) {
        const teamMembers = await User.find({ reportsTo: userId, deletedAt: null }).select("_id");
        const memberIds = teamMembers.map(m => m._id);
        query.$or = [
            { createdBy: { $in: [userId, ...memberIds] } },
            { assignedTo: { $in: [userId, ...memberIds] } }
        ];
    }

    if (status) {
        query.status = status;
    }

    if (userType) {
        if (userType === "self") {
            query.assignedTo = userId;
        } else if (userType === "teamLead") {
            if (role === ROLES.MANAGER) {
                const tls = await User.find({ role: ROLES.TEAM_LEAD, deletedAt: null }).select("_id");
                query.assignedTo = { $in: tls.map(t => t._id) };
            } else if (role === ROLES.TEAM_LEAD) {
                query.assignedTo = userId;
            }
        } else if (userType === "employee") {
            if (role === ROLES.MANAGER) {
                const emps = await User.find({ role: ROLES.EMPLOYEE, deletedAt: null }).select("_id");
                query.assignedTo = { $in: emps.map(e => e._id) };
            } else if (role === ROLES.TEAM_LEAD) {
                const emps = await User.find({ role: ROLES.EMPLOYEE, reportsTo: userId, deletedAt: null }).select("_id");
                query.assignedTo = { $in: emps.map(e => e._id) };
            }
        }
    }

    if (search) {
        query.$and = [
            {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
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

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query).sort(sortQuery).skip(skip).limit(limitNum).populate("assignedTo", "username role");

    const formattedTasks = tasks.map(task => {
        const t = task.toObject();
        if (t.assignedTo && t.assignedTo.role) {
            t.assignedTo.role = t.assignedTo.role.toUpperCase();
        }
        const isPast = t.dueDate && new Date(t.dueDate) < new Date();
        if (t.status === "pending" && isPast) {
            t.status = "OVERDUE";
        } else if (t.status) {
            t.status = t.status.toUpperCase();
        }
        return t;
    });

    return new ApiResponse(true, "Tasks retrieved successfully", {
        tasks: formattedTasks,
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
    const { id: userId, role } = req.user;

    const task = await Task.findOne({ _id: id, deletedAt: null }).populate("assignedTo", "username role");
    if (!task) {
        throw new Error("Task not found");
    }

    if (role === ROLES.EMPLOYEE) {
        if (task.createdBy.toString() !== userId && task.assignedTo?._id?.toString() !== userId) {
            throw new Error("Access denied");
        }
    } else if (role === ROLES.TEAM_LEAD) {
        const isOwner = task.createdBy.toString() === userId || task.assignedTo?._id?.toString() === userId;
        let isTeamTask = false;
        if (!isOwner) {
            const creator = await User.findOne({ _id: task.createdBy, deletedAt: null });
            const assignee = await User.findOne({ _id: task.assignedTo?._id || task.assignedTo, deletedAt: null });
            const creatorReports = creator?.reportsTo?.toString() === userId;
            const assigneeReports = assignee?.reportsTo?.toString() === userId;
            isTeamTask = creatorReports || assigneeReports;
        }
        if (!isOwner && !isTeamTask) {
            throw new Error("Access denied");
        }
    }

    const t = task.toObject();
    if (t.assignedTo && t.assignedTo.role) {
        t.assignedTo.role = t.assignedTo.role.toUpperCase();
    }
    const isPast = t.dueDate && new Date(t.dueDate) < new Date();
    if (t.status === "pending" && isPast) {
        t.status = "OVERDUE";
    } else if (t.status) {
        t.status = t.status.toUpperCase();
    }

    return new ApiResponse(true, "", t);
};

const getDashboardStats = async (req) => {
    const { role, id: userId } = req.user;

    let taskQuery = { deletedAt: null };
    let userQuery = { deletedAt: null };

    if (role === ROLES.EMPLOYEE) {
        taskQuery.assignedTo = userId;
    } else if (role === ROLES.TEAM_LEAD) {
        taskQuery.$or = [
            { createdBy: userId },
            { assignedTo: userId }
        ];
        const reports = await User.find({ reportsTo: userId, deletedAt: null }).select("_id");
        const reportIds = reports.map(r => r._id);
        taskQuery.$or.push({ assignedTo: { $in: reportIds } });
        userQuery.reportsTo = userId;
    }

    const totalTasks = await Task.countDocuments(taskQuery);
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: "pending" });
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: "completed" });
    const totalUsers = await User.countDocuments(userQuery);

    return new ApiResponse(true, "Dashboard stats retrieved", {
        totalTasks,
        pendingTasks,
        completedTasks,
        totalUsers
    });
};

module.exports = {
    create,
    update,
    updateStatus,
    deleteTasks,
    findAll,
    findOne,
    getDashboardStats
};
