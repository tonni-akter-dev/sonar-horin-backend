# Task Manager API (Backend)

A simple RESTful API for managing tasks with authentication. Built with **Node.js, Express, MongoDB**, and **JWT authentication**.

---

## 🛠 Features

- User authentication (signup/login)
- CRUD operations for tasks:
  - Create task
  - Read tasks (for the authenticated user)
  - Update task
  - Delete task


## 🚀 Live Demo / Deployed Link

[Deployed Backend API](https://task-manager-backend-9vhp.onrender.com/)

---

## 📝 API Endpoints

The Task Manager backend provides the following endpoints:

| Method | Endpoint        | Description                          | Body / Params                         |
|--------|----------------|--------------------------------------|---------------------------------------|
| POST   | /auth/signup    | Register a new user                  | `{ "name": "Tonni Akter", "email": "tonniakterbithi@gmail.com", "password": "Test1234" }` |
| POST   | /auth/login     | Login user                           | `{"email": "tonniakterbithi@gmail.com", "password": "Test1234" }` |
| GET    | /tasks          | Get all tasks for the authenticated user | None (JWT in Authorization header)    |
| POST   | /tasks          | Add a new task                        | `{ "title": "New Task" }`             |
| PUT    | /tasks/:id      | Update a task by ID                   | `{ "title": "Updated Task" }`         |
| DELETE | /tasks/:id      | Delete a task by ID                   | None (JWT in Authorization header)    |


## 📁 GitHub Repository

[GitHub Repo](https://github.com/tonni-akter-dev/task-manager-backend.git)
 
---
## ⚡ Setup Steps
Follow these steps to run the backend locally:

```bash
git clone https://github.com/tonni-akter-dev/task-manager-backend.git
cd task-manager-backend
npm install
npm run dev

