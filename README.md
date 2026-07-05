# Task Management System

A full-stack task management application built using Express, MongoDB, Redis, Socket.io, BullMQ, and Angular 18.

## Structure
* **backend**: API and Socket.io.
* **frontend**: Angular 18

## Prerequisites
* **Node.js** (v22+)
* **MongoDB** (running on port `27017`)
* **Redis / Memurai** (running on port `6379`)
* **Angular18**

## Installation and Startup

### 1. Setup Backend
Open a terminal in the `backend` directory:
```bash
cd backend
npm install
```
Config your env vars in `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/task_management
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://127.0.0.1:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Task Management <your_email@gmail.com>"
SMTP_SECURE=false
```
Seed some dummy datas
```bash
npm run seed
```
Start the backend development server:
```bash
npm run dev
```

### 2. Setup Frontend
Open a new terminal in the `frontend` directory:
```bash
cd frontend
npm install
```
Start the Angular development server:
```bash
npm start
```
