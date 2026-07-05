const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");
const nodemailer = require("nodemailer");

const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const emailQueue = new Queue("EmailQueue", { connection });

let transporter;

const initTransporter = () => {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        transporter = null;
    }
    return transporter;
};

const sendEmailDirect = async (to, subject, text) => {
    if (!to) return;
    try {
        const mailTransporter = initTransporter();
        if (!mailTransporter) {
            console.log(`[SMTP Offline] To: ${to} | Subject: ${subject} | Text: ${text}`);
            return;
        }
        await mailTransporter.sendMail({
            from: process.env.SMTP_FROM || '"Task Management" <noreply@taskmanagement.com>',
            to,
            subject,
            text
        });
    } catch (err) {
        console.error("Failed to send email inside worker:", err.message);
    }
};

const emailWorker = new Worker(
    "EmailQueue",
    async (job) => {
        const { to, subject, text } = job.data;
        await sendEmailDirect(to, subject, text);
    },
    { connection }
);

emailWorker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`Email job ${job.id} failed:`, err.message);
});

const sendLoginEmail = async (toEmail) => {
    await emailQueue.add("sendLoginEmail", {
        to: toEmail,
        subject: "Login Notification",
        text: `Login session started at ${new Date().toISOString()}.`
    });
};

const sendTaskCreatedEmail = async (toEmail, taskTitle) => {
    await emailQueue.add("sendTaskCreatedEmail", {
        to: toEmail,
        subject: "New Task Assigned",
        text: `Task "${taskTitle}" has been assigned to you.`
    });
};

const sendTaskCompletedEmail = async (toEmail, taskTitle) => {
    await emailQueue.add("sendTaskCompletedEmail", {
        to: toEmail,
        subject: "Task Completed Alert",
        text: `Task "${taskTitle}" has been marked as completed.`
    });
};

module.exports = {
    sendLoginEmail,
    sendTaskCreatedEmail,
    sendTaskCompletedEmail
};
