Laundry Management System (Python + MySQL)
This project is a web-based laundry management system with a client-side interface for placing orders and viewing history, and an admin panel for managing all orders.

Project Structure
laundry_management/
├── static/
│   └── js/
│       ├── main.js         # Client-side JavaScript
│       └── admin.js        # Admin-side JavaScript
├── templates/
│   ├── index.html        # Client HTML file
│   └── admin.html        # Admin HTML file
├── app.py                # Python Flask backend
├── database.sql          # MySQL database schema setup
├── requirements.txt      # Python dependencies
└── README.md             # This file

Setup and Installation
Follow these steps to get the project running on your local machine.

1. Prerequisites
Python 3.6+

MySQL Server (or MariaDB)

pip for installing Python packages

2. Set Up the Database
Log in to MySQL:
Open your terminal or command prompt and log in to your MySQL server as a user with administrative rights (e.g., root).

mysql -u root -p

Enter your password when prompted.

Create and Use the Database:
Run the following commands inside the MySQL prompt.

CREATE DATABASE laundry_db;
USE laundry_db;

Create the Tables:
Copy the entire content of the database.sql file and paste it into the MySQL prompt. This will create the clients and orders tables.

Exit MySQL:
You can now exit the MySQL prompt by typing:

exit;

3. Set Up the Python Backend
Create a Virtual Environment (Recommended):
Navigate to the project's root directory (laundry_management/) in your terminal and create a virtual environment.

python -m venv venv

Activate it:

Windows: venv\Scripts\activate

macOS/Linux: source venv/bin/activate

Install Dependencies:
Install all the required Python packages using the requirements.txt file.

pip install -r requirements.txt

Configure Database Connection:
Open app.py in a text editor. Find the MySQL configuration section and update the MYSQL_USER and MYSQL_PASSWORD with your own MySQL credentials.

# app.py
app.config['MYSQL_USER'] = 'your_mysql_username'
app.config['MYSQL_PASSWORD'] = 'your_mysql_password'

4. Run the Application
With your virtual environment still active, run the Flask application from the root directory.

python app.py

You should see output indicating that the server is running, usually at http://127.0.0.1:5000.

5. Access the Application
Open your web browser and navigate to:
https://www.google.com/search?q=http://127.0.0.1:5000

You can now register new users, log in, place orders, and access the admin panel.

Admin Access
To access the admin panel, navigate to https://www.google.com/search?q=http://127.0.0.1:5000/admin or click the "Admin" button on the client login page.

The default credentials are:

Username: admin

Password: admin123

These are hardcoded in the app.py file and can be changed there.
