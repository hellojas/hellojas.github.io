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

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize admin dashboard
 */
async function initializeAdmin() {
    console.log('🚀 Initializing admin dashboard...');
    
    try {
        // Show loading state
        showLoading(true);
        
        // Set up real-time orders listener
        setupOrdersListener();
        
        console.log('✅ Admin dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing admin:', error);
        showError('Failed to initialize admin dashboard');
    }
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
            console.log(`📊 Loaded ${orders.length} orders`);
            
            // Update UI
            showLoading(false);
            displayOrders(currentFilter);
            updateStatistics();
            
        }, (error) => {
            console.error('❌ Error in orders listener:', error);
            showLoading(false);
            showError('Failed to load orders');
        });

    } catch (error) {
        console.error('❌ Error setting up orders listener:', error);
        showLoading(false);
        showError('Failed to connect to database');
    }
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
    
    // Simple success feedback (you could make this fancier)
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
        animation: slideIn 0.3s ease-out;
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
    // You could implement a more sophisticated error display here
    alert(`Error: ${message}`);
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
    window.location.href = './index.html'; // or whatever your main app file is called
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

document.addEventListener('DOMContentLoaded', initializeAdmin);

// ===================================
// CLEANUP ON PAGE UNLOAD
// ===================================

window.addEventListener('beforeunload', () => {
    if (ordersListener) {
        ordersListener();
    }
});

console.log('🎯 Admin dashboard script loaded successfully!');
