from flask import Flask, jsonify, request, render_template, session
from flask_mysqldb import MySQL
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import datetime
from contextlib import contextmanager
import os

app = Flask(__name__, template_folder='templates', static_folder='static')

# --- App Configuration ---
app.secret_key = os.urandom(24) 
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

CORS(app, supports_credentials=True)

# --- MySQL Configuration ---
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'srihari@05'
app.config['MYSQL_DB'] = 'laundry_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

# --- Helper Functions ---
@contextmanager
def get_db_cursor(commit=False):
    """Provides a database cursor and handles commits and closing."""
    cursor = mysql.connection.cursor()
    try:
        yield cursor
        if commit:
            mysql.connection.commit()
    except Exception as e:
        mysql.connection.rollback() # Rollback on error
        raise e
    finally:
        cursor.close()

def format_order(order):
    """ Converts a database row to a JSON-serializable format. """
    if order.get('items'):
        try:
            items_data = order['items']
            if isinstance(items_data, (bytes, bytearray)):
                items_data = items_data.decode('utf-8')
            order['items'] = json.loads(items_data)
        except (json.JSONDecodeError, TypeError):
            order['items'] = [] 
    if isinstance(order.get('created_at'), datetime.datetime):
        order['created_at'] = order['created_at'].isoformat()
    return order

# --- HTML Serving Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# --- Client API Routes ---
@app.route('/api/register', methods=['POST'])
def register_client():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({'error': 'Username, email, and password are required'}), 400

    try:
        with get_db_cursor(commit=True) as cur: # Use commit=True for write operations
            cur.execute("SELECT * FROM clients WHERE username = %s OR email = %s", (username, email))
            if cur.fetchone():
                return jsonify({'error': 'Username or email already exists'}), 409
            
            password_hash = generate_password_hash(password)
            cur.execute(
                "INSERT INTO clients (username, email, password_hash) VALUES (%s, %s, %s)",
                (username, email, password_hash)
            )
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Database error during registration: {e}")
        return jsonify({'error': 'Failed to register user'}), 500

@app.route('/api/login', methods=['POST'])
def login_client():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT * FROM clients WHERE username = %s", [username])
            client = cur.fetchone()
        
        if client and check_password_hash(client['password_hash'], password):
            return jsonify({'message': 'Login successful', 'username': client['username']})
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        print(f"Database error during login: {e}")
        return jsonify({'error': 'Failed to login'}), 500

# --- Admin API Routes ---
@app.route('/api/admin/check_session')
def check_admin_session():
    if session.get('admin_logged_in'):
        return jsonify(logged_in=True)
    return jsonify(logged_in=False), 401

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == 'admin' and password == 'admin123':
        session['admin_logged_in'] = True
        return jsonify({'message': 'Admin login successful'})
    else:
        return jsonify({'error': 'Invalid admin credentials'}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'message': 'Logout successful'}), 200

# --- Shared Order API Routes ---
@app.route('/api/orders', methods=['GET'])
def get_all_orders():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized access.'}), 401
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
            orders = cur.fetchall()
        
        formatted_orders = [format_order(order) for order in orders]
        return jsonify(formatted_orders)
    except Exception as e:
        print(f"A critical error occurred in get_all_orders: {e}")
        return jsonify({'error': 'A critical server error occurred.'}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    client_id = data.get('clientId')
    items = data.get('items', [])
    total_items = data.get('totalItems', 0)
    
    if not client_id or not items:
        return jsonify({'error': 'Client ID and items are required'}), 400

    try:
        with get_db_cursor(commit=True) as cur: # Use commit=True
            items_json = json.dumps(items)
            cur.execute(
                "INSERT INTO orders (client_id, items, total_items, status) VALUES (%s, %s, %s, %s)",
                (client_id, items_json, total_items, 'Received')
            )
        return jsonify({'message': 'Order created successfully'}), 201
    except Exception as e:
        print(f"Database error creating order: {e}")
        return jsonify({'error': 'Failed to create order'}), 500

@app.route('/api/orders/client/<client_id>', methods=['GET'])
def get_client_orders(client_id):
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT * FROM orders WHERE client_id = %s ORDER BY created_at DESC", [client_id])
            orders = cur.fetchall()
        formatted_orders = [format_order(order) for order in orders]
        return jsonify(formatted_orders)
    except Exception as e:
        print(f"Database error fetching client orders: {e}")
        return jsonify({'error': 'Failed to fetch client orders'}), 500

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized access.'}), 401
        
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({'error': 'New status is required'}), 400
        
    try:
        with get_db_cursor(commit=True) as cur: # Use commit=True
            cur.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
        return jsonify({'message': 'Order status updated successfully'})
    except Exception as e:
        print(f"Database error updating status: {e}")
        return jsonify({'error': 'Failed to update order status'}), 500

if __name__ == '__main__':
    app.run(debug=True)

