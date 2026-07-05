require("dotenv").config();

const argon2 = require("argon2");

const conn = require('./db');

const User = require("../models/user.model");
const ROLES = require("../constants/role.const");

async function seed() {
    try {
        await conn();

        await User.deleteMany();
        const password = await argon2.hash("Test@123");

        const manager = await User.create({
            username: "Admin",
            email: "admin@test.com",
            password,
            role: ROLES.MANAGER,
            isPrimary: true
        });

        const tl = await User.create({
            username: "TL 1",
            email: "tl1@test.com",
            password,
            role: ROLES.TEAM_LEAD,
            reportsTo: manager._id,
        });

        await User.create(
            {
                username: "Emp 1",
                email: "emp1@test.com",
                password,
                role: ROLES.EMPLOYEE,
                reportsTo: tl._id,
            }
        );

        console.log("Seeded successfully");
        process.exit(0);
    } catch (error) {
        console.error("Seeder error:", error);
        process.exit(1);
    }
}

seed();