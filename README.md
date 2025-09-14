#Laundry Management System


A full-stack web application for managing laundry orders. This system provides a seamless experience for both customers and administrators, featuring a separate client portal for placing orders and a secure admin dashboard for managing them.

Screenshots
A picture is worth a thousand words. Here’s what the application looks like.

Client Login

Client Dashboard

Admin Dashboard

**

**

**

Key Features
Client Authentication: Secure user registration and login system with password hashing.

Client Dashboard: An intuitive interface for clients to place new laundry orders and view their complete order history.

Dynamic Order Form: Clients can specify quantities for default items or add their own custom items to any order.

Admin Panel: A separate, secure dashboard for administrators to view and manage all client orders in one place.

Real-Time Status Updates: Admins can update the status of any order (e.g., "Processing", "Ready for Pickup", "Completed"), and the changes are immediately reflected.

RESTful API: A clean and organized backend API built with Flask to handle all data operations.

Tech Stack
Backend: Python (with Flask)

Database: MySQL

Frontend: HTML, Tailwind CSS, JavaScript

Password Security: Werkzeug for password hashing

Getting Started
Follow these instructions to set up and run the project on your local machine.

1. Prerequisites
Python 3.6+ installed.

MySQL Server (or a compatible alternative like MariaDB) installed and running.

pip for Python package installation.

2. Database Setup
Log in to MySQL as a user with administrative privileges (e.g., root).

mysql -u root -p

Create and use the database by running the following commands in the MySQL prompt.

CREATE DATABASE laundry_db;
USE laundry_db;

Create the necessary tables by copying the entire content of the database.sql file and pasting it into the MySQL prompt.

3. Backend Setup
Clone the Repository (or download the source code).

Create and Activate a Virtual Environment in the project's root directory.

# Create the environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

Install the Required Dependencies from the requirements.txt file.

pip install -r requirements.txt

Configure Your Database Connection by opening app.py and updating the MYSQL_USER and MYSQL_PASSWORD with your own credentials.

# Inside app.py
app.config['MYSQL_USER'] = 'your_mysql_username_here'
app.config['MYSQL_PASSWORD'] = 'your_mysql_password_here'

4. Running the Application
With your virtual environment still active, run the Flask application from the project's root directory.

python app.py

The server will start, typically on http://127.0.0.1:5000.

Usage
Client Portal
Navigate to https://www.google.com/search?q=http://127.0.0.1:5000 in your web browser.

You can create a new client account or log in with an existing one.

Once logged in, you can place new orders and view your history.

Admin Panel
Navigate to https://www.google.com/search?q=http://127.0.0.1:5000/admin or click the "Admin" button on the client login page.

Use the default credentials to log in:

Username: admin

Password: admin123

From the dashboard, you can view all orders and update their statuses.

Contributing
Contributions are welcome! If you have suggestions for improvements, please feel free to fork the repository and submit a pull request.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

License
This project is open-source. Feel free to use and modify it as you see fit.
