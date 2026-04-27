-- PRESTACONTROL PWA - DATABASE SCHEMA (MySQL)
-- Created for: Business Loan Management System

CREATE DATABASE IF NOT EXISTS prestacontrol_db;
USE prestacontrol_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role ENUM('Admin', 'Cobrador') NOT NULL DEFAULT 'Cobrador',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    document_id VARCHAR(20) NOT NULL UNIQUE, -- Cédula / DNI
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    photo_url TEXT,
    reference_name VARCHAR(100),
    reference_phone VARCHAR(20),
    status ENUM('Active', 'Inactive', 'Blocked') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_doc (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Loans Table
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    user_id INT NOT NULL, -- Who created the loan
    amount DECIMAL(15,2) NOT NULL, -- Principal
    interest_rate DECIMAL(5,2) NOT NULL, -- Percentage (e.g., 10.00)
    frequency ENUM('Diario', 'Semanal', 'Quincenal', 'Mensual') NOT NULL,
    installments_count INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_to_pay DECIMAL(15,2) NOT NULL, -- Principal + Interest
    balance_due DECIMAL(15,2) NOT NULL, -- Remaining to pay
    status ENUM('Pending', 'Active', 'Paid', 'Late', 'Defaulted') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_loan_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Installments (Cuotas) Table
CREATE TABLE IF NOT EXISTS installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL, -- Total scheduled for this cuota
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    arrears_amount DECIMAL(15,2) DEFAULT 0.00, -- Mora
    status ENUM('Pending', 'Partial', 'Paid', 'Late') DEFAULT 'Pending',
    paid_at TIMESTAMP NULL,
    CONSTRAINT fk_installment_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    installment_id INT NULL, -- Optional: Link to a specific installment if applicable
    user_id INT NOT NULL, -- Cobrador who received the payment
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'Efectivo',
    notes TEXT,
    CONSTRAINT fk_payment_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_installment FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Cash Flow (Caja) Table
CREATE TABLE IF NOT EXISTS cash_flow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('Income', 'Outcome') NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Préstamo', 'Pago', 'Gasto', 'Ajuste'
    description TEXT,
    user_id INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cash_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. System Config Table
CREATE TABLE IF NOT EXISTS system_configs (
    cfg_key VARCHAR(50) PRIMARY KEY,
    cfg_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial Data
INSERT INTO users (full_name, username, password_hash, role) 
VALUES ('Administrador Sistema', 'admin', 'admin123', 'Admin'); -- Note: Password will be hashed in backend
