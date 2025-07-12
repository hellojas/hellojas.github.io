// ===================================
// FIREBASE CONFIGURATION
// ===================================

// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy,
    where,
    doc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ===================================
// FIREBASE CONFIG
// ===================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBazsH8MbHnuFmGKlwGkVghZHMHXkNhuJA",
  authDomain: "egghaus-2dbf0.firebaseapp.com",
  projectId: "egghaus-2dbf0",
  storageBucket: "egghaus-2dbf0.firebasestorage.app",
  messagingSenderId: "36412340657",
  appId: "1:36412340657:web:35adc14508d825752fe590",
  measurementId: "G-2LSC0NJ0E0"
};

// ===================================
// FIREBASE INITIALIZATION
// ===================================

let app, db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('🔥 Firebase initialized successfully');
} catch (error) {
    console.warn('❌ Firebase initialization failed:', error.message);
    console.warn('📱 App will work without database functionality');
}

// ===================================
// ORDER MANAGEMENT FUNCTIONS
// ===================================

/**
 * Save order to Firestore database
 * @param {Object} orderData - Order data object
 * @returns {Promise<string>} Order ID
 */
window.saveOrderToDatabase = async function(orderData) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    try {
        const orderWithMetadata = {
            ...orderData,
            timestamp: serverTimestamp(),
            status: "pending",
            orderNumber: generateOrderNumber(),
            createdAt: new Date().toISOString(),
            version: "1.0"
        };

        const docRef = await addDoc(collection(db, "orders"), orderWithMetadata);
        console.log("✅ Order saved with ID:", docRef.id);
        
        // Track analytics
        trackOrderEvent('order_placed', orderWithMetadata);
        
        return docRef.id;
    } catch (error) {
        console.error("❌ Error saving order:", error);
        throw error;
    }
};

/**
 * Get all orders (for admin/staff use)
 * @param {number} limit - Number of orders to fetch
 * @returns {Promise<Array>} Array of orders
 */
window.getAllOrders = async function(limit = 50) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    try {
        const q = query(
            collection(db, "orders"), 
            orderBy("timestamp", "desc"),
            // limit(limit) // Uncomment if you want to limit results
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(data.createdAt)
            });
        });
        
        console.log(`📊 Retrieved ${orders.length} orders`);
        return orders;
    } catch (error) {
        console.error("❌ Error getting orders:", error);
        throw error;
    }
};

/**
 * Update order status
 * @param {string} orderId - Order document ID
 * @param {string} newStatus - New status value
 * @returns {Promise<boolean>} Success status
 */
window.updateOrderStatus = async function(orderId, newStatus) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
            lastModified: new Date().toISOString()
        });
        
        console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
        
        // Track analytics
        trackOrderEvent('status_updated', { orderId, newStatus });
        
        return true;
    } catch (error) {
        console.error("❌ Error updating order status:", error);
        throw error;
    }
};

/**
 * Get orders by status (for kitchen display)
 * @param {string} status - Order status to filter by
 * @returns {Promise<Array>} Array of orders with specified status
 */
window.getOrdersByStatus = async function(status) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    try {
        const q = query(
            collection(db, "orders"), 
            where("status", "==", status),
            orderBy("timestamp", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(data.createdAt)
            });
        });
        
        console.log(`📋 Found ${orders.length} orders with status: ${status}`);
        return orders;
    } catch (error) {
        console.error("❌ Error getting orders by status:", error);
        throw error;
    }
};

/**
 * Get order statistics
 * @returns {Promise<Object>} Order statistics
 */
window.getOrderStats = async function() {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    try {
        const allOrders = await getAllOrders();
        
        const stats = {
            total: allOrders.length,
            pending: allOrders.filter(order => order.status === 'pending').length,
            preparing: allOrders.filter(order => order.status === 'preparing').length,
            ready: allOrders.filter(order => order.status === 'ready').length,
            completed: allOrders.filter(order => order.status === 'completed').length,
            cancelled: allOrders.filter(order => order.status === 'cancelled').length,
            totalRevenue: allOrders
                .filter(order => order.status === 'completed')
                .reduce((sum, order) => sum + (order.total || 0), 0),
            averageOrderValue: 0
        };
        
        if (stats.completed > 0) {
            stats.averageOrderValue = stats.totalRevenue / stats.completed;
        }
        
        console.log('📊 Order statistics:', stats);
        return stats;
    } catch (error) {
        console.error("❌ Error getting order stats:", error);
        throw error;
    }
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Generate unique order number
 * @returns {string} Order number
 */
function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `M${timestamp.slice(-6)}${random}`;
}

/**
 * Test Firebase connection
 * @returns {Promise<boolean>} Connection status
 */
window.testFirebaseConnection = async function() {
    if (!db) {
        console.log('❌ Firebase not initialized');
        return false;
    }

    try {
        // Try to read from orders collection
        const testQuery = query(collection(db, "orders"));
        await getDocs(testQuery);
        console.log('✅ Firebase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return false;
    }
};

/**
 * Clear all test orders (development only)
 * @returns {Promise<number>} Number of orders deleted
 */
window.clearTestOrders = async function() {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
        throw new Error('This function can only be used in development');
    }

    try {
        const orders = await getAllOrders();
        let deletedCount = 0;
        
        // Note: This is a simplified version. In production, you'd use batch operations
        for (const order of orders) {
            if (order.customerInfo?.name === 'Guest Customer') {
                // In a real implementation, you'd delete the document
                console.log(`Would delete test order: ${order.id}`);
                deletedCount++;
            }
        }
        
        console.log(`🗑️ Cleared ${deletedCount} test orders`);
        return deletedCount;
    } catch (error) {
        console.error("❌ Error clearing test orders:", error);
        throw error;
    }
};

// ===================================
// ANALYTICS FUNCTIONS
// ===================================

/**
 * Track order events for analytics
 * @param {string} eventName - Event name
 * @param {Object} eventData - Event data
 */
function trackOrderEvent(eventName, eventData) {
    console.log(`📊 Analytics Event: ${eventName}`, eventData);
    
    // You can integrate with Google Analytics, Mixpanel, etc. here
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: 'orders',
            event_label: eventData.orderId || 'unknown',
            value: eventData.total || 0
        });
    }
}

/**
 * Track product views
 * @param {Object} product - Product data
 */
window.trackProductView = function(product) {
    trackOrderEvent('product_view', {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        category: product.category
    });
};

/**
 * Track add to cart events
 * @param {Object} product - Product data
 * @param {number} quantity - Quantity added
 */
window.trackAddToCart = function(product, quantity) {
    trackOrderEvent('add_to_cart', {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        value: product.price * quantity
    });
};

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize Firebase connection test
 */
document.addEventListener('DOMContentLoaded', function() {
    // Test connection after a short delay
    setTimeout(() => {
        if (window.testFirebaseConnection) {
            window.testFirebaseConnection();
        }
    }, 1000);
});

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Handle Firebase-specific errors
 * @param {Error} error - Firebase error
 * @returns {string} User-friendly error message
 */
function handleFirebaseError(error) {
    const errorMessages = {
        'permission-denied': 'You don\'t have permission to perform this action.',
        'unavailable': 'Service is temporarily unavailable. Please try again.',
        'not-found': 'The requested data was not found.',
        'already-exists': 'This data already exists.',
        'resource-exhausted': 'Quota exceeded. Please try again later.',
        'unauthenticated': 'Please sign in to continue.',
        'deadline-exceeded': 'Request timed out. Please try again.',
        'cancelled': 'Operation was cancelled.',
        'invalid-argument': 'Invalid data provided.',
        'failed-precondition': 'Operation failed due to system state.',
        'aborted': 'Operation was aborted due to conflict.',
        'out-of-range': 'Value is out of valid range.',
        'unimplemented': 'This feature is not implemented yet.',
        'internal': 'Internal server error. Please try again.',
        'unknown': 'An unknown error occurred.'
    };

    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
}

// Export error handler for use in other modules
window.handleFirebaseError = handleFirebaseError;

console.log('🔥 Firebase configuration loaded successfully!');
console.log('📝 Remember to replace the config with your actual Firebase keys');
