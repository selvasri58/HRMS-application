# HRMS Application - Full Stack

## Project Overview

This project is a modern Human Resources Management System (HRMS) developed as a full-stack web application. It aims to provide an efficient platform for managing various HR-related tasks, including employee data, attendance records, and leave applications.

### Key Features

* **Authentication & Authorization:** Secure user login with role-based access control (Employee, HR, Admin).
* **User Management:**
    * **Employee Registration:** HR users can register new employees (Employee & Manager roles).
    * **Employee Profile:** Employees can view their own profiles.
    * **Employee Listing:** HR can view and manage a list of all employees.
    * **Employee Deletion:** HR can delete employee records along with all associated data (attendance, leaves).
* **Attendance Management:**
    * **Mark Attendance:** Employees can mark their daily attendance with geolocation recording.
    * **Attendance History:** Employees can view their attendance history.
* **Leave Management:**
    * **Apply for Leave:** Employees can submit leave applications with start date, end date, return date, and reason.
    * **Application Status:** Employees can view the status of their leave applications.
    * **Manage Leaves (HR):** HR can view and manage (approve/decline) all pending leave applications.
* **Dashboard:** Role-specific dashboards for employees and HR personnel.

## Technologies Used

### Frontend (React.js)

* **React:** A JavaScript library for building user interfaces.
* **Material-UI (MUI):** A popular React UI framework for beautiful and responsive design components.
* **Axios:** Promise-based HTTP client for making API requests.
* **React Router DOM:** For declarative routing in React applications.
* **`date-fns` / `@mui/x-date-pickers`:** For robust date handling and date pickers.
* **`navigator.geolocation` API:** For browser-based location services.

### Backend (Node.js with Express.js)

* **Node.js:** JavaScript runtime environment.
* **Express.js:** Fast, unopinionated, minimalist web framework for Node.js.
* **MS SQL Server (via `mssql` package):** Relational database for data storage.
* **`jsonwebtoken` (JWT):** For secure authentication tokens.
* **`bcryptjs`:** For password hashing.
* **`dotenv`:** For managing environment variables.
* **Custom Middleware:** For authentication (`verifyToken`) and role-based authorization (`authorizeRole`).

## Setup and Installation

### Prerequisites

Before you begin, ensure you have the following installed:

* Node.js (LTS version recommended)
* npm (comes with Node.js) or Yarn
* Microsoft SQL Server (or access to an SQL Server instance)
* SQL Server Management Studio (SSMS) or Azure Data Studio (recommended for database management)

### 1. Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YourUsername/your-repo-name.git](https://github.com/YourUsername/your-repo-name.git)
    cd your-repo-name/backend # Or whatever your backend folder is named
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Database Setup (SQL Server):**
    * Create a new database (e.g., `HRMS_DB`).
    * Run the SQL scripts (you'll need to provide these, see "Database Schema" section below) to create necessary tables (`Users`, `Employee_Profiles`, `Attendance`, `Leave_Applications`, etc.) and set up relationships (foreign keys).
    * Ensure your `Users` table has `user_id`, `password`, `role` (e.g., 'Employee', 'HR', 'Admin').
4.  **Configure Environment Variables:**
    Create a `.env` file in your `backend` directory with the following variables:
    ```env
    DB_SERVER=your_sql_server_instance_name # e.g., localhost\SQLEXPRESS
    DB_DATABASE=HRMS_DB
    DB_USER=your_sql_user
    DB_PASSWORD=your_sql_password
    DB_PORT=1433 # Default SQL Server port
    JWT_SECRET=your_super_secret_jwt_key
    ```
5.  **Run the backend server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    The backend server should start on `http://localhost:5000`.

### 2. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend # Or whatever your frontend folder is named
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Configure API Base URL:**
    (If your frontend uses environment variables) Create a `.env` file in your `frontend` directory:
    ```env
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
    (Otherwise, ensure your `axios.defaults.baseURL` or individual Axios calls point to your backend.)
4.  **Run the frontend development server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    The frontend application should open in your browser at `http://localhost:3000`.

