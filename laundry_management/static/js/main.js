document.addEventListener('DOMContentLoaded', () => {
    // A central place to store all element references
    const elements = {
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        showRegisterLink: document.getElementById('show-register-form'),
        showLoginLink: document.getElementById('show-login-form'),
        logoutButton: document.getElementById('logout-button'),
        userIdDisplay: document.getElementById('user-id'),
        newOrderSection: document.getElementById('new-order-section'),
        historySection: document.getElementById('history-section'),
        navNewOrder: document.getElementById('nav-new-order'),
        navHistory: document.getElementById('nav-history'),
        newOrderForm: document.getElementById('new-order-form'),
        clothingItemsContainer: document.getElementById('clothing-items'),
        addCustomItemButton: document.getElementById('add-custom-item'),
        totalItemsDisplay: document.getElementById('total-items-count'),
        submitOrderButton: document.getElementById('submit-order-button'),
        submitOrderText: document.getElementById('submit-order-text'),
        submitOrderSpinner: document.getElementById('submit-order-spinner'),
        historyTableBody: document.getElementById('history-table-body'),
        historySpinner: document.getElementById('history-spinner-row'),
        loginError: document.getElementById('login-error'),
        registerError: document.getElementById('register-error'),
        loginSpinner: document.getElementById('login-spinner'),
        loginButtonText: document.getElementById('login-button-text'),
        registerSpinner: document.getElementById('register-spinner'),
        registerButtonText: document.getElementById('register-button-text'),
        modal: document.getElementById('notification-modal'),
        modalMessage: document.getElementById('modal-message'),
        modalCloseButton: document.getElementById('modal-close'),
    };

    const API_BASE_URL = 'http://127.0.0.1:5000/api';
    let currentUser = localStorage.getItem('laundry_user');

    // --- UI Helpers ---
    const toggleButtonLoading = (spinner, text, isLoading, button = null) => {
        if (!spinner || !text) return;
        spinner.classList.toggle('hidden', !isLoading);
        text.classList.toggle('hidden', isLoading);
        if (button) button.disabled = isLoading;
    };

    const showModal = (message) => {
        elements.modalMessage.textContent = message;
        elements.modal.classList.remove('hidden');
    };

    const handleNavClick = (activeTab) => {
        const isNewOrder = activeTab === 'new-order';
        
        elements.newOrderSection.classList.toggle('hidden', !isNewOrder);
        elements.historySection.classList.toggle('hidden', isNewOrder);
        
        elements.navNewOrder.classList.toggle('border-blue-600', isNewOrder);
        elements.navNewOrder.classList.toggle('text-blue-600', isNewOrder);
        elements.navNewOrder.classList.toggle('text-gray-500', !isNewOrder);
        elements.navNewOrder.classList.toggle('border-transparent', !isNewOrder);

        elements.navHistory.classList.toggle('border-blue-600', !isNewOrder);
        elements.navHistory.classList.toggle('text-blue-600', !isNewOrder);
        elements.navHistory.classList.toggle('text-gray-500', isNewOrder);
        elements.navHistory.classList.toggle('border-transparent', isNewOrder);

        if (!isNewOrder) fetchOrderHistory();
    };

    const updateView = () => {
        currentUser = localStorage.getItem('laundry_user');
        const isUserLoggedIn = !!currentUser;
        elements.authContainer.classList.toggle('hidden', isUserLoggedIn);
        elements.appContainer.classList.toggle('hidden', !isUserLoggedIn);
        if (isUserLoggedIn) {
            elements.userIdDisplay.textContent = currentUser;
            initializeDefaultItems();
            fetchOrderHistory();
        }
        lucide.createIcons();
    };

    // --- New Order Logic ---
    const addClothingItem = (name = '', quantity = 1, isCustom = false) => {
        const div = document.createElement('div');
        div.className = 'grid grid-cols-12 gap-2 items-center';
        div.innerHTML = `
            <div class="col-span-6">
                <input type="text" value="${name}" class="form-input text-sm" ${!isCustom ? 'readonly style="background-color: #e5e7eb; cursor: not-allowed;"' : ''} placeholder="Item Name" required>
            </div>
            <div class="col-span-4">
                <div class="flex items-center border rounded-md">
                    <button type="button" class="quantity-btn decrease-btn p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-l-md transition-colors">-</button>
                    <input type="number" min="1" value="${quantity}" class="w-12 text-center quantity-input border-y" required>
                    <button type="button" class="quantity-btn increase-btn p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-r-md transition-colors">+</button>
                </div>
            </div>
            <div class="col-span-2 text-right">
                <button type="button" class="remove-item-btn text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>`;
        elements.clothingItemsContainer.appendChild(div);
        lucide.createIcons();
        updateTotalItems();
    };

    const updateTotalItems = () => {
        let total = 0;
        elements.clothingItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
            total += parseInt(input.value, 10) || 0;
        });
        elements.totalItemsDisplay.textContent = total;
    };

    const initializeDefaultItems = () => {
        elements.clothingItemsContainer.innerHTML = '';
        addClothingItem('Shirts', 1);
        addClothingItem('Pants', 1);
        addClothingItem('Saree', 1);
    };

    // --- API Call Functions ---
    const fetchAPI = async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                let errorData;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                } else {
                    const textError = await response.text();
                    errorData = { error: textError || `Server returned status ${response.status}` };
                }
                throw new Error(errorData.error || 'An unknown error occurred');
            }
            if (response.status === 201 || response.status === 204) {
                 return { message: 'Action completed successfully' };
            }
            return response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        elements.registerError.textContent = '';
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username.trim() || !email.trim() || !password.trim()) {
            return elements.registerError.textContent = 'Please fill out all fields.';
        }
        if (password !== confirmPassword) {
            return elements.registerError.textContent = 'Passwords do not match.';
        }
        
        toggleButtonLoading(elements.registerSpinner, elements.registerButtonText, true, e.target.querySelector('button'));
        try {
            const data = await fetchAPI('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            showModal(data.message || 'Registration successful! Please log in.');
            elements.registerForm.classList.add('hidden');
            elements.loginForm.classList.remove('hidden');
        } catch (error) {
            elements.registerError.textContent = error.message;
        } finally {
            toggleButtonLoading(elements.registerSpinner, elements.registerButtonText, false, e.target.querySelector('button'));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        elements.loginError.textContent = '';
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username.trim() || !password.trim()) {
            return elements.loginError.textContent = 'Please fill out all fields.';
        }

        toggleButtonLoading(elements.loginSpinner, elements.loginButtonText, true, e.target.querySelector('button'));
        try {
            const data = await fetchAPI('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            localStorage.setItem('laundry_user', data.username);
            updateView();
        } catch (error) {
            elements.loginError.textContent = error.message;
        } finally {
             toggleButtonLoading(elements.loginSpinner, elements.loginButtonText, false, e.target.querySelector('button'));
        }
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        const items = Array.from(elements.clothingItemsContainer.querySelectorAll('.grid')).map(row => {
            const nameInput = row.querySelector('input[type="text"]');
            const quantityInput = row.querySelector('input[type="number"]');
            return {
                name: nameInput.value.trim(),
                quantity: parseInt(quantityInput.value, 10)
            };
        }).filter(item => item.name && item.quantity > 0);

        if (items.length === 0) {
            return showModal('Please add at least one item.');
        }

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        
        toggleButtonLoading(elements.submitOrderSpinner, elements.submitOrderText, true, elements.submitOrderButton);
        try {
            const data = await fetchAPI('/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: currentUser, items, totalItems }),
            });
            showModal(data.message || 'Order created successfully!');
            initializeDefaultItems();
            // Automatically switch to history tab for immediate feedback
            handleNavClick('history');
        } catch (error) {
            showModal(`Error: ${error.message}`);
        } finally {
            toggleButtonLoading(elements.submitOrderSpinner, elements.submitOrderText, false, elements.submitOrderButton);
        }
    };

    const fetchOrderHistory = async () => {
        if (!currentUser) return;
        elements.historyTableBody.innerHTML = ''; 
        elements.historySpinner.classList.remove('hidden');

        try {
            const orders = await fetchAPI(`/orders/client/${currentUser}`);
            elements.historySpinner.classList.add('hidden');
            if (orders.length === 0) {
                elements.historyTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No order history found.</td></tr>';
            } else {
                orders.forEach(order => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b hover:bg-gray-50';
                    const statusClasses = { 'Received': 'bg-blue-100 text-blue-800', 'Processing': 'bg-yellow-100 text-yellow-800', 'Ready for Pickup': 'bg-green-100 text-green-800', 'Completed': 'bg-gray-200 text-gray-800', 'Declined': 'bg-red-100 text-red-800' };
                    tr.innerHTML = `
                        <td class="table-cell font-mono text-sm">${order.id}</td>
                        <td class="table-cell">${new Date(order.created_at).toLocaleDateString()}</td>
                        <td class="table-cell">${order.total_items}</td>
                        <td class="table-cell"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusClasses[order.status] || 'bg-gray-100'}">${order.status}</span></td>
                        <td class="table-cell"><ul class="text-xs list-disc list-inside">${order.items.map(item => `<li>${item.name}: ${item.quantity}</li>`).join('')}</ul></td>`;
                    elements.historyTableBody.appendChild(tr);
                });
            }
        } catch (error) {
            elements.historySpinner.classList.add('hidden');
            elements.historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Error: ${error.message}</td></tr>`;
        }
    };

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        elements.loginForm?.addEventListener('submit', handleLogin);
        elements.registerForm?.addEventListener('submit', handleRegister);
        elements.showRegisterLink?.addEventListener('click', (e) => { e.preventDefault(); elements.loginForm.classList.add('hidden'); elements.registerForm.classList.remove('hidden'); });
        elements.showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); elements.registerForm.classList.add('hidden'); elements.loginForm.classList.remove('hidden'); });
        elements.logoutButton?.addEventListener('click', () => { localStorage.removeItem('laundry_user'); updateView(); });
        elements.navNewOrder?.addEventListener('click', () => handleNavClick('new-order'));
        elements.navHistory?.addEventListener('click', () => handleNavClick('history'));
        elements.newOrderForm?.addEventListener('submit', handleSubmitOrder);
        elements.addCustomItemButton?.addEventListener('click', () => addClothingItem('', 1, true));
        elements.modalCloseButton?.addEventListener('click', () => elements.modal.classList.add('hidden'));

        elements.clothingItemsContainer?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const itemRow = target.closest('.grid');
            const quantityInput = itemRow.querySelector('.quantity-input');
            let quantity = parseInt(quantityInput.value, 10);
            if (target.classList.contains('increase-btn')) quantityInput.value = quantity + 1;
            else if (target.classList.contains('decrease-btn') && quantity > 1) quantityInput.value = quantity - 1;
            else if (target.classList.contains('remove-item-btn')) itemRow.remove();
            updateTotalItems();
        });
        
        elements.clothingItemsContainer?.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                if (parseInt(e.target.value, 10) < 1) e.target.value = 1;
                updateTotalItems();
            }
        });
    }

    // --- App Initialization ---
    function init() {
        setupEventListeners();
        updateView();
    }

    init();
});

