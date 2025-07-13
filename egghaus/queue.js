// ===================================
// CUSTOMER QUEUE PAGE JAVASCRIPT
// ===================================

// Firebase imports
import { 
    collection, 
    query,
    orderBy,
    where,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// ===================================
// GLOBAL VARIABLES
// ===================================
let allOrders = [];
let ordersListener = null;
let refreshInterval = null;

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize the customer queue page
 */
async function initializeQueue() {
    console.log('🍵 Initializing customer queue...');
    
    try {
        // Show loading state
        showLoading(true);
        
        // Test Firebase connection
        if (!db) {
            throw new Error('Firebase not available');
        }
        
        // Set up real-time orders listener
        setupOrdersListener();
        
        // Set up auto-refresh every 30 seconds
        setupAutoRefresh();
        
        console.log('✅ Customer queue initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing queue:', error);
        showError('Unable to load order queue. Please refresh the page.');
    }
}

/**
 * Set up real-time orders listener for customer view
 */
function setupOrdersListener() {
    try {
        // Query for orders that are preparing or ready (visible to customers)
        const ordersQuery = query(
            collection(db, 'orders'),
            where('status', 'in', ['pending', 'preparing', 'ready']),
            orderBy('createdAt', 'asc') // Oldest orders first
        );

        // Set up real-time listener
        ordersListener = onSnapshot(ordersQuery, (snapshot) => {
            console.log('🔥 Customer queue update received');
            const orders = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const order = {
                    id: doc.id,
                    orderId: data.orderId,
                    customerName: data.customer?.name || data.customerInfo?.name || 'Customer',
                    status: data.status,
                    createdAt: data.createdAt?.toDate() || new Date()
                };
                orders.push(order);
            });

            allOrders = orders;
            console.log(`📊 Loaded ${orders.length} active orders for customer view`);
            
            // Update UI
            showLoading(false);
            displayQueue();
            
        }, (error) => {
            console.error('❌ Error in customer queue listener:', error);
            showLoading(false);
            showError('Unable to load current orders. Please try refreshing.');
        });

    } catch (error) {
        console.error('❌ Error setting up customer queue listener:', error);
        showLoading(false);
        showError('Unable to connect to order system.');
    }
}

/**
 * Set up auto-refresh every 30 seconds
 */
function setupAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up new interval
    refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing customer queue...');
        // The real-time listener handles updates automatically
        // This is just for logging/debugging
    }, 30000); // 30 seconds
}

// ===================================
// DISPLAY FUNCTIONS
// ===================================

/**
 * Display the customer queue
 */
function displayQueue() {
    const queueSection = document.getElementById('queueSection');
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    // Hide loading state
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Check if we have orders to display
    if (!allOrders || allOrders.length === 0) {
        showEmptyState();
        return;
    }
    
    // Show queue section and hide empty state
    if (queueSection) {
        queueSection.style.display = 'block';
    }
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Clear existing orders
    if (ordersList) {
        ordersList.innerHTML = '';
        
        // Create order items
        allOrders.forEach((order, index) => {
            const orderItem = createOrderItem(order, index);
            ordersList.appendChild(orderItem);
        });
    }
    
    console.log(`✅ Displayed ${allOrders.length} orders in customer queue`);
}

/**
 * Create an order item element for customer view
 * @param {Object} order - Order data
 * @param {number} index - Order index for animation delay
 * @returns {HTMLElement}
 */
function createOrderItem(order, index) {
    const item = document.createElement('div');
    item.className = 'order-item';
    item.style.animationDelay = `${index * 0.1}s`;

    const orderTime = order.createdAt ? 
        order.createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

    const statusInfo = getStatusInfo(order.status);

    // Normalize name to lowercase and use first word
    const nameRaw = order.customerName || 'customer';
    const nameNormalized = nameRaw.split(' ')[0].toLowerCase();
    const profileSrc = `egghaus/eggs/${nameNormalized}.png`;

    item.innerHTML = `
        <div class="order-number">
            #${order.orderId || order.id.slice(-6).toUpperCase()}
        </div>

        <div class="order-info">
            <img src="${profileSrc}" alt="${nameNormalized}" class="profile-icon" onerror="this.style.display='none';" />
            <div class="customer-name">${order.customerName}</div>
            <div class="order-time">Ordered at ${orderTime}</div>
        </div>

        <div class="order-status ${statusInfo.class}">
            ${statusInfo.icon} ${statusInfo.text}
        </div>
    `;

    return item;
}

/**
 * Get status display information
 * @param {string} status - Order status
 * @returns {Object} Status display info
 */
function getStatusInfo(status) {
    const statusMap = {
        'preparing': {
            text: 'Preparing',
            icon: '👩‍🍳',
            class: 'preparing'
        },
        'ready': {
            text: 'Ready!',
            icon: '✅',
            class: 'ready'
        }
    };
    
    return statusMap[status] || {
        text: 'In Progress',
        icon: '⏳',
        class: 'preparing'
    };
}

/**
 * Show empty state when no orders are active
 */
function showEmptyState() {
    const queueSection = document.getElementById('queueSection');
    const emptyState = document.getElementById('emptyState');
    
    if (queueSection) {
        queueSection.style.display = 'none';
    }
    if (emptyState) {
        emptyState.style.display = 'flex';
    }
    
    console.log('📭 No active orders - showing empty state');
}

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const queueSection = document.getElementById('queueSection');
    const emptyState = document.getElementById('emptyState');
    
    if (loadingState) {
        loadingState.style.display = show ? 'flex' : 'none';
    }
    
    if (show) {
        if (queueSection) queueSection.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    console.error('❌ Queue Error:', message);
    
    // Create error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        animation: slideInDown 0.3s ease-out;
        max-width: 90vw;
        text-align: center;
    `;
    
    notification.innerHTML = `⚠️ ${message}`;
    
    // Add CSS animation
    if (!document.querySelector('#slideInDownAnimation')) {
        const style = document.createElement('style');
        style.id = 'slideInDownAnimation';
        style.textContent = `
            @keyframes slideInDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===================================
// USER INTERACTIONS
// ===================================

/**
 * Manual refresh function
 */
function refreshQueue() {
    console.log('🔄 Manual refresh triggered');
    
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        // Add refreshing animation
        refreshBtn.classList.add('refreshing');
        
        // Remove animation after 1 second
        setTimeout(() => {
            refreshBtn.classList.remove('refreshing');
        }, 1000);
    }
    
    // Show brief loading state
    showLoading(true);
    
    // The real-time listener will handle the actual refresh
    setTimeout(() => {
        displayQueue();
    }, 500);
    
    // Show refresh feedback
    showRefreshFeedback();
}

/**
 * Show refresh feedback
 */
function showRefreshFeedback() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 0.8rem 1.2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        animation: slideInUp 0.3s ease-out;
        font-size: 0.9rem;
    `;
    
    notification.innerHTML = '🔄 Queue refreshed!';
    
    // Add CSS animation
    if (!document.querySelector('#slideInUpAnimation')) {
        const style = document.createElement('style');
        style.id = 'slideInUpAnimation';
        style.textContent = `
            @keyframes slideInUp {
                from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Format time ago string
 * @param {Date} date - Date to format
 * @returns {string} Time ago string
 */
function timeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
}

/**
 * Get order count by status
 * @returns {Object} Count object
 */
function getOrderCounts() {
    const counts = {
        preparing: 0,
        ready: 0,
        total: allOrders.length
    };
    
    allOrders.forEach(order => {
        if (order.status === 'preparing') counts.preparing++;
        if (order.status === 'ready') counts.ready++;
    });
    
    return counts;
}

// ===================================
// GLOBAL FUNCTION EXPOSURE
// ===================================

// Make functions available globally for HTML onclick handlers
window.refreshQueue = refreshQueue;

// ===================================
// INITIALIZATION ON DOM LOAD
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🍵 Customer queue page loaded');
    
    // Initialize the queue
    initializeQueue();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // R key to refresh
        if (event.key === 'r' || event.key === 'R') {
            if (!event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                refreshQueue();
            }
        }
        
        // Escape key to scroll to top
        if (event.key === 'Escape') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Add visibility change listener to refresh when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('👁️ Page became visible - refreshing queue');
            setTimeout(refreshQueue, 500);
        }
    });
});

// ===================================
// CLEANUP ON PAGE UNLOAD
// ===================================

window.addEventListener('beforeunload', () => {
    if (ordersListener) {
        ordersListener();
    }
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// ===================================
// PERFORMANCE MONITORING
// ===================================

/**
 * Log performance metrics
 */
window.addEventListener('load', () => {
    if (window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`🚀 Customer queue loaded in ${loadTime}ms`);
    }
});

console.log('🍵 Customer queue script loaded successfully!');
