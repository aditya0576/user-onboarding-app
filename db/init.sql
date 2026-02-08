-- User Onboarding Platform: Azure SQL Database Schema

-- Status Enum Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_status')
CREATE TABLE user_status (
    id INT IDENTITY(1,1) PRIMARY KEY,
    status VARCHAR(20) UNIQUE NOT NULL
);

-- Insert status values if they don't exist
IF NOT EXISTS (SELECT * FROM user_status WHERE status = 'PENDING')
INSERT INTO user_status (status) VALUES ('PENDING'), ('APPROVED'), ('REJECTED');

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (status_id) REFERENCES user_status(id)
);

-- Admin Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'admins')
CREATE TABLE admins (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Seed Data: Default Admin User
-- Password: Admin123! (hashed with bcrypt, salt rounds: 10)
-- Generated using: bcrypt.hash('Admin123!', 10)
IF NOT EXISTS (SELECT * FROM admins WHERE username = 'admin')
INSERT INTO admins (username, email, password_hash) VALUES 
('admin', 'admin@example.com', '$2b$10$qhZBDIgyjfKSU7q0.XjdSuV/VRI3wS4XvOaSTemcAbl.Y9n4cO0Om');
