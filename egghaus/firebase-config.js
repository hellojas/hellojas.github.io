// ===================================
// FIREBASE CONFIGURATION - FIXED FOR BROWSER
// ===================================

// Firebase imports using CDN URLs
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
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ===================================
// FIREBASE CONFIG
// ===================================
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
    // app = initializeApp(firebaseConfig);
    // db = getFirestore(app);
    const app = initializeApp(firebaseConfig);
    export const db = getFirestore(app);
    
    // 👇 Add this to expose to console:
    window.db = db;
    console.log('🔥 Firebase initialized successfully');

} catch (error) {
    console.warn('❌ Firebase initialization failed:', error.message);
    console.warn('📱 App will work without database functionality');
}

// ===================================
// ENHANCED ORDER MANAGEMENT FOR QUEUE SYSTEM
// ===================================

/**
 * Save order to Firestore database (Enhanced for queue system)
 * @param {Object} orderData - Order data object
 * @returns {Promise<string>} Order ID
 */
window.saveOrderToDatabase = async function(orderData) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    try {
        // Enhanced order structure for queue system
        const orderWithMetadata = {
            // Order identification
            orderId: orderData.orderId,
            orderNumber: generateOrderNumber(),
            status: "pending", // pending, preparing, ready, completed, cancelled
            
            // Customer information
            customer: {
                name: orderData.customerInfo.name,
                email: orderData.customerInfo.email || null,
                phone: orderData.customerInfo.phone || null
            },
            
            // Order items
            items: orderData.items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
                category: item.category || 'unknown'
            })),
            
            // Pricing
            pricing: {
                subtotal: orderData.subtotal,
                tax: orderData.tax,
                total: orderData.total,
                taxRate: 0.085
            },
            
            // Order details
            instructions: orderData.instructions || '',
            estimatedTime: orderData.estimatedTime || 15,
            orderType: 'pickup',
            
            // Timestamps
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            estimatedReadyTime: new Date(Date.now() + ((orderData.estimatedTime || 15) * 60000)),
            
            // Metadata
            source: 'web_app',
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
 * Listen to real-time order updates
 * @param {string} orderId - Firebase document ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
window.listenToOrderUpdates = function(orderId, callback) {
    if (!db) {
        console.warn('Firebase not available for real-time updates');
        return () => {};
    }

    try {
        const orderRef = doc(db, "orders", orderId);
        
        const unsubscribe = onSnapshot(orderRef, (doc) => {
            if (doc.exists()) {
                const orderData = { id: doc.id, ...doc.data() };
                console.log('📡 Real-time order update:', orderData.status);
                callback(orderData);
            } else {
                console.warn('Order document not found');
            }
        }, (error) => {
            console.error('❌ Error in order listener:', error);
        });
        
        return unsubscribe;
    } catch (error) {
        console.error('❌ Error setting up order listener:', error);
        return () => {};
    }
};

/**
 * Update order status with enhanced tracking
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
        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            lastModified: new Date().toISOString()
        };

        // Add completion timestamp if order is completed
        if (newStatus === 'completed') {
            updateData.completedAt = serverTimestamp();
        }

        // Add ready timestamp if order is ready
        if (newStatus === 'ready') {
            updateData.readyAt = serverTimestamp();
        }

        await updateDoc(orderRef, updateData);
        
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
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date()
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
            orderBy("createdAt", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date()
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
 * Get today's orders for analytics
 * @returns {Promise<Array>} Today's orders
 */
window.getTodaysOrders = async function() {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const q = query(
            collection(db, "orders"),
            where("createdAt", ">=", today),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            });
        });
        
        console.log(`📅 Found ${orders.length} orders today`);
        return orders;
    } catch (error) {
        console.error("❌ Error getting today's orders:", error);
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
        const todaysOrders = await getTodaysOrders();
        
        const stats = {
            today: {
                total: todaysOrders.length,
                pending: todaysOrders.filter(order => order.status === 'pending').length,
                preparing: todaysOrders.filter(order => order.status === 'preparing').length,
                ready: todaysOrders.filter(order => order.status === 'ready').length,
                completed: todaysOrders.filter(order => order.status === 'completed').length,
                cancelled: todaysOrders.filter(order => order.status === 'cancelled').length
            },
            revenue: {
                today: todaysOrders
                    .filter(order => order.status === 'completed')
                    .reduce((sum, order) => sum + (order.pricing?.total || 0), 0),
                averageOrder: 0
            }
        };
        
        if (stats.today.completed > 0) {
            stats.revenue.averageOrder = stats.revenue.today / stats.today.completed;
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
    return `EH${timestamp.slice(-6)}${random}`;
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
        
        // Show helpful error message
        if (error.code === 'permission-denied') {
            console.error('🔒 Fix: Update Firestore Security Rules to allow read/write access');
            console.error('📝 Go to Firebase Console > Firestore Database > Rules');
            console.error('📝 Update rules to: allow read, write: if true;');
        }
        
        return false;
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
            value: eventData.pricing?.total || eventData.total || 0
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

// Export db for use in other modules
export { db };

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

console.log('🔥 Firebase configuration loaded successfully!');
console.log('🛒 Queue system integration ready!');
console.log('📊 Real-time order tracking enabled!');
window.db = db;
