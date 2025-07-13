// ===================================
// ADMIN DASHBOARD JAVASCRIPT
// ===================================

// Firebase imports
import { 
    collection, 
    getDocs, 
    doc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    where,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// ===================================
// GLOBAL VARIABLES
// ===================================
let allOrders = [];
let currentFilter = 'all';
let ordersListener = null;
let selectedOrder = null;
let isLoggedIn = false;

// Admin password (in production, this should be handled more securely)
const ADMIN_PASSWORD = 'eggecutives';

// ===================================
// LOGIN FUNCTIONS
// ===================================

/**
 * Handle admin login form submission
 * @param {Event} event - Form submit event
 */
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('adminPassword');
    const errorElement = document.getElementById('loginError');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!passwordInput || !errorElement || !submitBtn) {
        console.error('Login form elements not found');
        return;
    }
    
    const enteredPassword = passwordInput.value.trim();
    const originalBtnText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = '🔓 Checking...';
    submitBtn.disabled = true;
    errorElement.style.display = 'none';
    
    try {
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (enteredPassword === ADMIN_PASSWORD) {
            console.log('✅ Admin login successful');
            
            // Hide login overlay
            const loginOverlay = document.getElementById('loginOverlay');
            const adminContainer = document.getElementById('adminContainer');
            
            if (loginOverlay && adminContainer) {
                loginOverlay.style.display = 'none';
                adminContainer.style.display = 'block';
            }
            
            // Set login status
            isLoggedIn = true;
            
            // Initialize admin dashboard with Firebase data
            await initializeAdmin();
            
        } else {
            // Show error for incorrect password
            errorElement.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
            
            // Add shake animation to the form
            const loginContainer = document.querySelector('.login-container');
            if (loginContainer) {
                loginContainer.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginContainer.style.animation = '';
                }, 500);
            }
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        errorElement.textContent = '❌ Login failed. Please try again.';
        errorElement.style.display = 'block';
        
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
};

/**
 * Check if user is logged in
 * @returns {boolean}
 */
function checkLoginStatus() {
    return isLoggedIn;
}

/**
 * Logout function (optional - for future use)
 */
window.adminLogout = function() {
    isLoggedIn = false;
    
    // Stop Firebase listeners
    if (ordersListener) {
        ordersListener();
        ordersListener = null;
    }
    
    // Show login overlay again
    const loginOverlay = document.getElementById('loginOverlay');
    const adminContainer = document.getElementById('adminContainer');
    
    if (loginOverlay && adminContainer) {
        loginOverlay.style.display = 'flex';
        adminContainer.style.display = 'none';
    }
    
    // Clear password field
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.value = '';
    }
    
    console.log('👋 Admin logged out');
};

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize admin dashboard (only after successful login)
 */
async function initializeAdmin() {
    if (!checkLoginStatus()) {
        console.warn('⚠️ Admin not logged in');
        return;
    }
    
    console.log('🚀 Initializing admin dashboard...');
    
    try {
        // Show loading state
        showLoading(true);
        
        // Test Firebase connection first
        const connectionStatus = await testFirebaseConnection();
        if (!connectionStatus) {
            throw new Error('Firebase connection failed');
        }
        
        // Set up real-time orders listener
        setupOrdersListener();
        
        console.log('✅ Admin dashboard initialized successfully');
        
        // Show welcome message
        showWelcomeMessage();
        
    } catch (error) {
        console.error('❌ Error initializing admin:', error);
        showError('Failed to initialize admin dashboard. Please check your connection and try again.');
    }
}

/**
 * Test Firebase connection
 * @returns {Promise<boolean>}
 */
async function testFirebaseConnection() {
    if (!db) {
        console.error('Firebase not available');
        return false;
    }

    try {
        // Try to read from orders collection
        const testQuery = query(collection(db, 'orders'));
        await getDocs(testQuery);
        console.log('✅ Firebase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        
        // Show helpful error message
        if (error.code === 'permission-denied') {
            showError('Database access denied. Please check Firestore security rules.');
        } else {
            showError(`Database connection failed: ${error.message}`);
        }
        
        return false;
    }
}

/**
 * Show welcome message after successful login
 */
function showWelcomeMessage() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            🎉 <span>Welcome to Egghaus Admin!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

/**
 * Set up real-time orders listener
 */
function setupOrdersListener() {
    if (!db) {
        console.error('Firebase not available');
        showError('Database connection not available');
        return;
    }

    try {
        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        // Set up real-time listener
        ordersListener = onSnapshot(ordersQuery, (snapshot) => {
            const orders = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                });
            });

            allOrders = orders;
            console.log(`📊 Loaded ${orders.length} orders from Firebase`);
            
            // Update UI
            showLoading(false);
            displayOrders(currentFilter);
            updateStatistics();
            
            // Show data loaded notification
            if (orders.length > 0) {
                showDataLoadedNotification(orders.length);
            }
            
        }, (error) => {
            console.error('❌ Error in orders listener:', error);
            showLoading(false);
            showError('Failed to load orders. Please refresh the page.');
        });

    } catch (error) {
        console.error('❌ Error setting up orders listener:', error);
        showLoading(false);
        showError('Failed to connect to database');
    }
}

/**
 * Show notification when data is loaded
 * @param {number} count - Number of orders loaded
 */
function showDataLoadedNotification(count) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #d4af37, #ffd700);
        color: #5d4037;
        padding: 0.8rem 1.2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        animation: slideInUp 0.3s ease-out;
        font-size: 0.9rem;
    `;
    notification.innerHTML = `📊 ${count} orders loaded from EggHaus Cloud Servers ☁️`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===================================
// ORDER DISPLAY FUNCTIONS
// ===================================

/**
 * Display orders in the grid
 * @param {string} filter - Filter status
 */
function displayOrders(filter = 'all') {
    const ordersGrid = document.getElementById('ordersGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!ordersGrid) return;

    // Filter orders
    let filteredOrders = allOrders;
    if (filter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === filter);
    }

    // Show empty state if no orders
    if (filteredOrders.length === 0) {
        ordersGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    // Hide empty state and show grid
    ordersGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Clear existing orders
    ordersGrid.innerHTML = '';

    // Create order cards
    filteredOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersGrid.appendChild(orderCard);
    });
    
    console.log(`📋 Displaying ${filteredOrders.length} orders (filter: ${filter})`);
}

/**
 * Create order card element
 * @param {Object} order - Order data
 * @returns {HTMLElement}
 */
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.onclick = () => openOrderModal(order);

    const statusClass = `status-${order.status || 'pending'}`;
    const statusText = getStatusText(order.status);
    
    // Format order time
    const orderTime = order.createdAt ? 
        order.createdAt.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Unknown';

    // Create items list
    const itemsList = order.items ? order.items.map(item => `
        <div class="order-item">
            <span class="item-name">
                ${item.name}
                <span class="item-quantity">(${item.quantity}x)</span>
            </span>
            <span class="item-price">$${item.total?.toFixed(2) || '0.00'}</span>
        </div>
    `).join('') : '<div class="order-item">No items</div>';

    // Get total from pricing or calculate
    const total = order.pricing?.total || order.total || 0;

    card.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">Order #${order.orderId || order.id}</div>
                <div class="order-time">${orderTime}</div>
            </div>
            <div class="order-status ${statusClass}">${statusText}</div>
        </div>
        
        <div class="order-customer">
            ${order.customer?.name || order.customerInfo?.name || 'Unknown Customer'}
        </div>
        
        <div class="order-items">
            <div class="order-items-title">Items Ordered</div>
            <div class="order-items-list">
                ${itemsList}
            </div>
        </div>
        
        <div class="order-footer">
            <div class="order-total">Total: $${total.toFixed(2)}</div>
            <div class="order-actions">
                ${createActionButtons(order)}
            </div>
        </div>
    `;

    return card;
}

/**
 * Create action buttons based on order status
 * @param {Object} order - Order data
 * @returns {string}
 */
function createActionButtons(order) {
    const status = order.status || 'pending';
    
    switch (status) {
        case 'pending':
            return `
                <button class="action-btn" onclick="updateOrderStatus('${order.id}', 'preparing', event)">
                    👩‍🍳 Start Preparing
                </button>
            `;
        case 'preparing':
            return `
                <button class="action-btn ready" onclick="updateOrderStatus('${order.id}', 'ready', event)">
                    ✅ Mark Ready
                </button>
            `;
        case 'ready':
            return `
                <button class="action-btn complete" onclick="updateOrderStatus('${order.id}', 'completed', event)">
                    📦 Mark Completed
                </button>
            `;
        case 'completed':
            return `
                <button class="action-btn" disabled>
                    ✅ Completed
                </button>
            `;
        default:
            return `
                <button class="action-btn" onclick="updateOrderStatus('${order.id}', 'preparing', event)">
                    Start Order
                </button>
            `;
    }
}

/**
 * Get status display text
 * @param {string} status - Order status
 * @returns {string}
 */
function getStatusText(status) {
    const statusMap = {
        'pending': '🟡 Pending',
        'preparing': '🟠 Preparing',
        'ready': '🟢 Ready',
        'completed': '✅ Completed',
        'cancelled': '❌ Cancelled'
    };
    return statusMap[status] || '❓ Unknown';
}

// ===================================
// ORDER STATUS MANAGEMENT
// ===================================

/**
 * Update order status
 * @param {string} orderId - Order document ID
 * @param {string} newStatus - New status
 * @param {Event} event - Click event
 */
async function updateOrderStatus(orderId, newStatus, event) {
    // Prevent card click
    if (event) {
        event.stopPropagation();
    }

    try {
        // Show loading state on button
        const button = event?.target;
        if (button) {
            const originalText = button.textContent;
            button.textContent = '⏳ Updating...';
            button.disabled = true;
        }

        // Update in Firebase
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
            [`${newStatus}At`]: serverTimestamp()
        });

        console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
        
        // Show success feedback
        showStatusUpdateSuccess(newStatus);

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        showError('Failed to update order status');
        
        // Reset button state
        if (event?.target) {
            event.target.disabled = false;
        }
    }
}

/**
 * Show status update success message
 * @param {string} status - New status
 */
function showStatusUpdateSuccess(status) {
    const messages = {
        'preparing': 'Order is now being prepared! 👩‍🍳',
        'ready': 'Order marked as ready for pickup! ✅',
        'completed': 'Order completed! 📦'
    };
    
    const message = messages[status] || 'Order status updated!';
    
    // Simple success feedback
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===================================
// FILTERING AND SEARCH
// ===================================

/**
 * Filter orders by status
 * @param {string} status - Status to filter by
 */
function filterOrders(status) {
    currentFilter = status;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-status="${status}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Display filtered orders
    displayOrders(status);
    
    console.log(`🔍 Filtered orders by status: ${status}`);
}

// ===================================
// STATISTICS
// ===================================

/**
 * Update dashboard statistics
 */
function updateStatistics() {
    if (!allOrders || allOrders.length === 0) {
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('pendingOrders').textContent = '0';
        document.getElementById('todayRevenue').textContent = '$0';
        return;
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter today's orders
    const todaysOrders = allOrders.filter(order => {
        const orderDate = order.createdAt || new Date();
        return orderDate >= today;
    });

    // Calculate statistics
    const totalOrders = todaysOrders.length;
    const pendingOrders = allOrders.filter(order => 
        ['pending', 'preparing'].includes(order.status)
    ).length;
    
    const todayRevenue = todaysOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.pricing?.total || order.total || 0), 0);

    // Update UI
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('todayRevenue').textContent = `$${todayRevenue.toFixed(2)}`;
    
    console.log(`📊 Statistics updated - Total: ${totalOrders}, Pending: ${pendingOrders}, Revenue: $${todayRevenue.toFixed(2)}`);
}

// ===================================
// MODAL FUNCTIONS
// ===================================

/**
 * Open order detail modal
 * @param {Object} order - Order data
 */
function openOrderModal(order) {
    selectedOrder = order;
    const modal = document.getElementById('orderModal');
    const modalTitle = document.getElementById('modalOrderId');
    const modalContent = document.getElementById('modalContent');
    const modalActionBtn = document.getElementById('modalActionBtn');

    if (!modal || !modalTitle || !modalContent || !modalActionBtn) return;

    // Update modal title
    modalTitle.textContent = `Order #${order.orderId || order.id}`;

    // Create detailed order content
    modalContent.innerHTML = createOrderDetailContent(order);

    // Update action button
    updateModalActionButton(order, modalActionBtn);

    // Show modal
    modal.style.display = 'flex';
}

/**
 * Close order modal
 */
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedOrder = null;
}

/**
 * Create detailed order content for modal
 * @param {Object} order - Order data
 * @returns {string}
 */
function createOrderDetailContent(order) {
    const orderTime = order.createdAt ? 
        order.createdAt.toLocaleString() : 'Unknown';
    
    const customer = order.customer || order.customerInfo || {};
    const items = order.items || [];
    const pricing = order.pricing || {};

    return `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="color: #3e2723; margin-bottom: 0.5rem;">Customer Information</h3>
            <p><strong>Name:</strong> ${customer.name || 'Unknown'}</p>
            ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
            ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
            <p><strong>Order Time:</strong> ${orderTime}</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="color: #3e2723; margin-bottom: 0.5rem;">Order Items</h3>
            ${items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>$${(item.total || 0).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="color: #3e2723; margin-bottom: 0.5rem;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; padding: 0.3rem 0;">
                <span>Subtotal:</span>
                <span>$${(pricing.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.3rem 0;">
                <span>Tax:</span>
                <span>$${(pricing.tax || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; font-weight: 700; border-top: 1px solid rgba(212, 175, 55, 0.2); margin-top: 0.5rem;">
                <span>Total:</span>
                <span>$${(pricing.total || order.total || 0).toFixed(2)}</span>
            </div>
        </div>

        ${order.instructions ? `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #3e2723; margin-bottom: 0.5rem;">Special Instructions</h3>
                <p style="background: rgba(212, 175, 55, 0.1); padding: 1rem; border-radius: 12px;">${order.instructions}</p>
            </div>
        ` : ''}

        <div>
            <h3 style="color: #3e2723; margin-bottom: 0.5rem;">Status</h3>
            <div class="order-status ${`status-${order.status || 'pending'}`}" style="display: inline-block;">
                ${getStatusText(order.status)}
            </div>
        </div>
    `;
}

/**
 * Update modal action button based on order status
 * @param {Object} order - Order data
 * @param {HTMLElement} button - Action button element
 */
function updateModalActionButton(order, button) {
    const status = order.status || 'pending';
    
    switch (status) {
        case 'pending':
            button.textContent = '👩‍🍳 Start Preparing';
            button.style.background = 'linear-gradient(135deg, #d4af37, #ffd700)';
            button.onclick = () => updateOrderFromModal('preparing');
            button.disabled = false;
            break;
        case 'preparing':
            button.textContent = '✅ Mark Ready';
            button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            button.onclick = () => updateOrderFromModal('ready');
            button.disabled = false;
            break;
        case 'ready':
            button.textContent = '📦 Mark Completed';
            button.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
            button.onclick = () => updateOrderFromModal('completed');
            button.disabled = false;
            break;
        case 'completed':
            button.textContent = '✅ Order Completed';
            button.style.background = '#d1d5db';
            button.disabled = true;
            break;
        default:
            button.textContent = 'Update Status';
            button.disabled = false;
    }
}

/**
 * Update order status from modal
 * @param {string} newStatus - New status
 */
async function updateOrderFromModal(newStatus) {
    if (!selectedOrder) return;
    
    try {
        await updateOrderStatus(selectedOrder.id, newStatus);
        closeOrderModal();
    } catch (error) {
        console.error('Error updating order from modal:', error);
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const ordersGrid = document.getElementById('ordersGrid');
    
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
    if (ordersGrid) {
        ordersGrid.style.display = show ? 'none' : 'grid';
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    console.error(message);
    
    // Create error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    notification.innerHTML = `⚠️ ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Refresh orders manually
 */
function refreshOrders() {
    console.log('🔄 Refreshing orders...');
    
    // The real-time listener will automatically update
    // But we can trigger a manual refresh if needed
    if (ordersListener) {
        showLoading(true);
        // Orders will be updated via the listener
        setTimeout(() => {
            showLoading(false);
        }, 1000);
    } else {
        // Reconnect if listener is lost
        setupOrdersListener();
    }
}

/**
 * Navigate to customer app
 */
function goToCustomerApp() {
    window.location.href = './queue.html';
}


/**
 * Navigate to sales analytics
 */
function goToSalesAnalytics() {
    window.location.href = './sales.html';
}

// ===================================
// GLOBAL FUNCTION EXPOSURE
// ===================================

// Make functions available globally for HTML onclick handlers
window.filterOrders = filterOrders;
window.updateOrderStatus = updateOrderStatus;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.updateOrderFromModal = updateOrderFromModal;
window.refreshOrders = refreshOrders;
window.goToCustomerApp = goToCustomerApp;

// ===================================
// INITIALIZATION ON DOM LOAD
// ===================================

// Only set up login form when DOM is loaded
// Don't initialize admin until after successful login
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Admin dashboard script loaded');
    
    // Focus on password input
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.focus();
    }
    
    // Add Enter key listener to password field
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                const form = this.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }
});

// ===================================
// CLEANUP ON PAGE UNLOAD
// ===================================

window.addEventListener('beforeunload', () => {
    if (ordersListener) {
        ordersListener();
    }
});

console.log('🎯 Admin dashboard script loaded successfully!');
