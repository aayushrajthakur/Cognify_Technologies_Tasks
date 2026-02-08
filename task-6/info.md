Task 6 – Database Integration & User Authentication
Objective
Integrate a MySQL database and implement user authentication for secure data handling.

Prerequisites
Node.js  and npm installed

MySQL server running locally or remotely

Database created with the correct schema

Environment variables configured for credentials

Database Setup
Create a database named task and the following tables:

sql
CREATE DATABASE task;
USE task;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL
);

CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  age INT,
  password VARCHAR(255)
);

And exchange the credentials with yours.