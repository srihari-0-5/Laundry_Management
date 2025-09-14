document.addEventListener('DOMContentLoaded', () => {
    // A central place for all DOM element references
    const elements = {
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container'),
        loginForm: document.getElementById('admin-login-form'),
        logoutButton: document.getElementById('admin-logout-button'),
        ordersTableBody: document.getElementById('orders-table-body'),
        loginError: document.getElementById('admin-login-error'),
        loginSpinner: document.getElementById('admin-login-spinner'),
        loginButtonText: document.getElementById('admin-login-button-text'),
        adminUserId: document.getElementById('admin-user-id'),
        spinnerRow: document.getElementById('admin-spinner-row'),
        modal: document.getElementById('admin-notification-modal'),
        modalMessage: document.getElementById('admin-modal-message'),
        modalCloseButton: document.getElementById('admin-modal-close'),
    };

    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    // --- UI Helpers ---
    const toggleButtonLoading = (isLoading) => {
        elements.loginSpinner.classList.toggle('hidden', !isLoading);
        elements.loginButtonText.classList.toggle('hidden', isLoading);
        elements.loginForm.querySelector('button').disabled = isLoading;
    };

    const showModal = (message) => {
        elements.modalMessage.textContent = message;
        elements.modal.classList.remove('hidden');
    };
    
    // --- Status Color Logic ---
    const getStatusClasses = (status) => {
        switch (status) {
            case 'Received': return 'status-received';
            case 'Processing': return 'status-processing';
            case 'Ready for Pickup': return 'status-ready';
            case 'Completed': return 'status-completed';
            case 'Declined': return 'status-declined';
            default: return 'status-completed'; // Default gray
        }
    };

    const updateSelectColor = (selectElement) => {
        // Remove all possible status classes first
        selectElement.classList.remove('status-received', 'status-processing', 'status-ready', 'status-completed', 'status-declined');
        // Add the class that matches the current value
        selectElement.classList.add(getStatusClasses(selectElement.value));
    };


    // --- Core Functions ---
    const updateView = (isLoggedIn) => {
        elements.authContainer.classList.toggle('hidden', isLoggedIn);
        elements.appContainer.classList.toggle('hidden', !isLoggedIn);
        if (isLoggedIn) {
            fetchAllOrders();
        }
    };

    // --- API Calls ---
    const fetchAPI = async (endpoint, options = {}) => {
        // Ensure credentials are included in every request to maintain the session
        options.credentials = 'include';
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (response.status === 401) { // Unauthorized
                updateView(false); // Force logout on session expiry
                throw new Error('Session expired. Please log in again.');
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred' }));
                throw new Error(errorData.error);
            }
            if (response.status === 204 || (response.headers.get('Content-Length') || '0') === '0') {
                return null; // No content to parse
            }
            return response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    };

    const checkSession = async () => {
        try {
            await fetchAPI('/admin/check_session');
            updateView(true);
        } catch (error) {
            updateView(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        elements.loginError.textContent = '';
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();

        if (!username || !password) {
            return elements.loginError.textContent = 'Please provide username and password.';
        }

        toggleButtonLoading(true);
        try {
            const data = await fetchAPI('/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            elements.adminUserId.textContent = username;
            updateView(true);
        } catch (error) {
            elements.loginError.textContent = error.message;
        } finally {
            toggleButtonLoading(false);
        }
    };
    
    const handleLogout = async () => {
        try {
            await fetchAPI('/admin/logout', { method: 'POST' });
        } catch(error) {
            console.error("Logout failed, clearing session locally.", error);
        } finally {
            // Force view update regardless of API call success
            updateView(false); 
        }
    };

    const fetchAllOrders = async () => {
        elements.spinnerRow.classList.remove('hidden');
        elements.ordersTableBody.innerHTML = ''; // Clear previous
        elements.ordersTableBody.appendChild(elements.spinnerRow);


        try {
            const orders = await fetchAPI('/orders');
            elements.spinnerRow.classList.add('hidden');

            if (!orders || orders.length === 0) {
                elements.ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No orders found.</td></tr>';
                return;
            }

            orders.forEach(order => {
                const tr = document.createElement('tr');
                tr.className = 'border-b hover:bg-gray-50';
                
                const selectId = `status-select-${order.id}`;
                tr.innerHTML = `
                    <td class="table-cell font-mono text-sm">${order.id}</td>
                    <td class="table-cell font-semibold">${order.client_id}</td>
                    <td class="table-cell">${new Date(order.created_at).toLocaleDateString()}</td>
                    <td class="table-cell text-center">${order.total_items}</td>
                    <td class="table-cell">
                        <div class="relative">
                             <select id="${selectId}" data-order-id="${order.id}" class="status-select">
                                <option value="Received" ${order.status === 'Received' ? 'selected' : ''}>Received</option>
                                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Ready for Pickup" ${order.status === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
                                <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Declined" ${order.status === 'Declined' ? 'selected' : ''}>Declined</option>
                            </select>
                        </div>
                    </td>
                    <td class="table-cell"><ul class="text-xs list-disc list-inside">${order.items.map(item => `<li>${item.name}: ${item.quantity}</li>`).join('')}</ul></td>
                `;
                elements.ordersTableBody.appendChild(tr);

                const selectElement = document.getElementById(selectId);
                updateSelectColor(selectElement); // Set initial color
            });

        } catch (error) {
            elements.spinnerRow.classList.add('hidden');
            elements.ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500">Error: ${error.message}</td></tr>`;
        }
    };
    
    const handleStatusChange = async (e) => {
        if (e.target.classList.contains('status-select')) {
            const select = e.target;
            const orderId = select.dataset.orderId;
            const newStatus = select.value;

            updateSelectColor(select); // Update color immediately on change

            try {
                await fetchAPI(`/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });
                showModal(`Order #${orderId} status updated to "${newStatus}".`);
            } catch (error) {
                 showModal(`Failed to update status for Order #${orderId}.`);
                 // Re-fetch all orders to ensure UI is consistent with backend state
                 fetchAllOrders(); 
            }
        }
    };


    // --- Event Listeners Setup ---
    function setupEventListeners() {
        elements.loginForm?.addEventListener('submit', handleLogin);
        elements.logoutButton?.addEventListener('click', handleLogout);
        elements.ordersTableBody?.addEventListener('change', handleStatusChange);
        elements.modalCloseButton?.addEventListener('click', () => elements.modal.classList.add('hidden'));
    }

    // --- App Initialization ---
    function init() {
        setupEventListeners();
        checkSession();
        lucide.createIcons();
    }

    init();
});

