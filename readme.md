# Supplier Management System for Company A

##### This is a backend management platform for suppliers working with A Company. It provides core features including product submission, inventory tracking, stock operations, and account permission control. The system is securely deployed on AWS EC2 with FastAPI backend and MySQL database.

## Test account and password

| Account | Email        | Password |
|---------|--------------|----------|
| c1008   | 123@123.com  | 123456   |


## Key Features

#### Product Submission
- Suppliers can submit new products for approval
- Input fields include name, category, size, barcode, unit, cost, and price
- Supports automatic gross profit calculation

#### Product Search & Inventory Management
- Keyword and barcode-based search
- View product details, current stock, and pricing status
- Filterable product list with real-time updates

#### Stock In/Out Record Management
- Create stock-in and stock-out entries
- Automatically updates inventory levels
- Tracks record history and timestamps

#### Account Registration & Permission System
- Supports main and sub-account structure
- Role-based access control by department
- Secure login with email verification and JWT token authentication

---

## Technology Stack & Architecture

**Frontend**：HTML, CSS, JavaScript, Fetch API

**Backend**：Python, FastAPI

**Database**：MySQL (Hosted on AWS RDS)

**Deployment**：AWS EC2 + Uvicorn + Nginx + HTTPS (Let’s Encrypt)

**Auth System**：JWT Token

**Utilities**：bcrypt, BackgroundTasks, Email SMTP for code verification

---

## Project Structure Overview
