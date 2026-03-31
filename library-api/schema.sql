-- Create the library database and tables for the Library Management System
CREATE DATABASE IF NOT EXISTS library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

CREATE TABLE IF NOT EXISTS users (
  enrollment_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','student') NOT NULL DEFAULT 'student'
);

CREATE TABLE IF NOT EXISTS books (
  book_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(100) NOT NULL,
  year VARCHAR(20) NOT NULL,
  cover_url VARCHAR(255) DEFAULT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS borrow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id VARCHAR(100) NOT NULL,
  book_id INT NOT NULL,
  borrow_date DATETIME NOT NULL,
  return_date DATETIME DEFAULT NULL,
  status ENUM('borrowed','returned') NOT NULL,
  FOREIGN KEY (enrollment_id) REFERENCES users(enrollment_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_hall_seats (
  seat_id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('available','reserved') NOT NULL DEFAULT 'available',
  enrollment_id VARCHAR(100) NULL,
  reserved_at DATETIME NULL,
  FOREIGN KEY (enrollment_id) REFERENCES users(enrollment_id) ON DELETE SET NULL
);
