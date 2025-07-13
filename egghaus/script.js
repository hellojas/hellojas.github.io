import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase-config.js';

// ===================================
// GLOBAL VARIABLES
// ===================================

let cart = {};
let currentProduct = {};
let currentQuantity = 1;

// ===================================
// PRODUCT DATA
// ===================================
const products = [
    // DRINKS
    {
        id: 1,
        name: "Iced Matcha Latte",
        price: 8.50,
        category: "matcha",
        image: "🍵",
        rating: 4.8,
        description: "Creamy iced matcha latte with premium ceremonial grade matcha and your choice of milk. Perfectly balanced and refreshing. Sourced from Agoshima, Japan"
    },
    {
        id: 2,
        name: "Iced Yuzu Matcha",
        price: 9.00,
        category: "matcha",
        image: "🍋",
        rating: 4.7,
        description: "Unique fusion of earthy matcha and bright yuzu citrus served over ice. A refreshing twist on traditional matcha."
    },
    {
        id: 3,
        name: "Iced Hojicha",
        price: 7.50,
        category: "matcha",
        image: "🍂",
        rating: 4.6,
        description: "Smooth roasted green tea with a nutty, caramel-like flavor served cold. Less caffeine, more comfort."
    },
    {
        id: 4,
        name: "Iced Coffee",
        price: 6.50,
        category: "coffee",
        image: "☕",
        rating: 4.5,
        description: "Classic japanese drip iced coffee, smooth and bold. Perfect for coffee lovers seeking a refreshing caffeine kick.  Today's selection is a honey aponte columbian coffee from St. Kilda.  Tasting notes: grapefruit, guava, white peach."
    },
    // DESSERTS
    {
        id: 5,
        name: "Burnt Basque Cheesecake",
        price: 8.00,
        category: "noms",
        image: "🍰",
        rating: 4.9,
        description: "Rich, creamy cheesecake with a signature burnt top. Our most popular dessert with a perfectly caramelized exterior."
    },
    {
        id: 6,
        name: "Ube Cheesecake",
        price: 8.50,
        category: "noms",
        image: "💜",
        rating: 4.8,
        description: "Vibrant purple yam cheesecake with a smooth, velvety texture. A Filipino-inspired treat that's Instagram-worthy and delicious."
    },
    {
        id: 7,
        name: "Chocolate Ganache Tart",
        price: 7.50,
        category: "noms",
        image: "🍫",
        rating: 4.7,
        description: "Decadent chocolate tart with silky smooth ganache filling. Rich, indulgent, and perfect for chocolate lovers."
    },
    // FOOD
    {
        id: 8,
        name: "Bagels",
        price: 5.50,
        category: "noms",
        image: "🥯",
        rating: 4.4,
        description: "Freshly baked artisanal bagels. Choose from various flavors and enjoy with your favorite toppings."
    },
    {
        id: 9,
        name: "Milk Bread",
        price: 2.00,
        category: "noms",
        image: "🍞",
        rating: 4.5,
        description: "Fluffy bites of heaven."
    }
];


// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID '${id}' not found`);
    }
    return element;
};

/**
 * Create HTML element with properties
 * @param {string} tag - HTML tag name
 * @param {Object} props - Properties to set
 * @param {string} content - Inner HTML content
 * @returns {HTMLElement}
 */
const createElement = (tag, props = {}, content = '') => {
    const element = document.createElement(tag);
    Object.assign(element, props);
    if (content) element.innerHTML = content;
    return element;
};

/**
 * Format price to currency
 * @param {number} amount - Price amount
 * @returns {string}
 */
const formatPrice = (amount) => `$${amount.toFixed(2)}`;

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

// ===================================
// SCREEN NAVIGATION
// ===================================

/**
 * Show specific screen and hide others
 * @param {string} screenName - Name of screen to show
 */

/**
 * Show specific screen and hide others
 * @param {string} screenName - Name of screen to show
 */
function showScreen(screenName) {
    const screens = ['welcome', 'menu', 'productDetail', 'cart', 'queue'];
    
    screens.forEach(screen => {
        const element = getElement(`${screen}Screen`);
        if (element) {
            element.classList.remove('screen-active');
            element.classList.add('screen-hidden');
        }
    });
    
    const targetScreen = getElement(`${screenName}Screen`);
    if (targetScreen) {
        targetScreen.classList.remove('screen-hidden');
        targetScreen.classList.add('screen-active');
    }
    
    // Initialize screen-specific data
    switch (screenName) {
        case 'menu':
            displayProducts();
            break;
        case 'cart':
            displayCart();
            break;
        case 'queue':
            if (typeof initializeQueue === 'function') {
                initializeQueue();
            }
            break;
    }
}

// ===================================
// PRODUCT DISPLAY FUNCTIONS
// ===================================

/**
 * Display products in the grid
 * @param {Array} filteredProducts - Array of products to display
 */
function displayProducts(filteredProducts = products) {
    const grid = getElement('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const productCard = createElement('div', {
            className: 'product-card',
            onclick: () => showProductDetail(product)
        }, `
            <div class="product-image">${product.image}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description.substring(0, 40)}...</div>
            <div class="product-price">${formatPrice(product.price)}</div>
        `);
        
        grid.appendChild(productCard);
    });
}

/**
 * Filter products by category
 * @param {string} category - Category to filter by
 */
function filterCategory(category) {
    // Update active category indicator
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        const categoryItem = event.target.closest('.category-item');
        if (categoryItem) {
            categoryItem.classList.add('active');
        }
    }
    
    // Filter and display products
    if (category === 'all') {
        displayProducts();
    } else {
        const filtered = products.filter(product => product.category === category);
        displayProducts(filtered);
    }
}

/**
 * Search products by name or description
 * @param {string} query - Search query
 */
const searchProducts = debounce((query) => {
    if (!query.trim()) {
        displayProducts();
        return;
    }
    
    const searchTerm = query.toLowerCase();
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    
    displayProducts(filtered);
}, 300);

// ===================================
// PRODUCT DETAIL FUNCTIONS
// ===================================

/**
 * Show product detail screen
 * @param {Object} product - Product object
 */
function showProductDetail(product) {
    currentProduct = product;
    currentQuantity = 1;
    
    // Update product detail elements
    const updates = {
        detailImage: product.image,
        detailRating: product.rating,
        detailPrice: formatPrice(product.price),
        detailTitle: product.name,
        detailDescription: product.description,
        quantityDisplay: currentQuantity
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const element = getElement(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    showScreen('productDetail');
}

/**
 * Adjust quantity in product detail
 * @param {number} change - Change amount (+1 or -1)
 */
function adjustQuantity(change) {
    currentQuantity = Math.max(1, currentQuantity + change);
    const quantityDisplay = getElement('quantityDisplay');
    if (quantityDisplay) {
        quantityDisplay.textContent = currentQuantity;
    }
}

// ===================================
// CART FUNCTIONS
// ===================================

/**
 * Add current product to cart
 */
function addToCart() {
    if (!currentProduct.id) return;
    
    if (cart[currentProduct.id]) {
        cart[currentProduct.id].quantity += currentQuantity;
    } else {
        cart[currentProduct.id] = {
            ...currentProduct,
            quantity: currentQuantity
        };
    }
    
    // Visual feedback
    showAddToCartFeedback();
    
    // Return to menu after delay
    setTimeout(() => {
        showScreen('menu');
    }, 1000);
}

/**
 * Show visual feedback for add to cart action
 */
function showAddToCartFeedback() {
    if (!event || !event.target) return;
    
    const btn = event.target;
    const originalText = btn.textContent;
    const originalBackground = btn.style.background;
    
    btn.textContent = 'Added! ✓';
    btn.style.background = '#10b981';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = originalBackground;
    }, 1000);
}

/**
 * Display cart items and summary
 */
function displayCart() {
    displayCartItems();
    updateCartSummary();
    updateCartCount();
}

/**
 * Display cart items
 */
function displayCartItems() {
    const cartItems = getElement('cartItems');
    if (!cartItems) return;
    
    if (Object.keys(cart).length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">💖</div>
                <p><strong>Your cart is empty</strong></p>
                <p>Add some delicious matcha items!</p>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = '';
    
    Object.values(cart).forEach(item => {
        const cartItem = createElement('div', {
            className: 'cart-item'
        }, `
            <div class="cart-item-image">${item.image}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="cart-quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span class="cart-quantity-display">${item.quantity}</span>
                <button class="cart-quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `);
        
        cartItems.appendChild(cartItem);
    });
}

/**
 * Update cart item quantity
 * @param {number} productId - Product ID
 * @param {number} change - Change amount
 */
function updateCartQuantity(productId, change) {
    if (!cart[productId]) return;
    
    cart[productId].quantity = Math.max(0, cart[productId].quantity + change);
    
    if (cart[productId].quantity === 0) {
        delete cart[productId];
    }
    
    displayCart();
}

/**
 * Remove item from cart
 * @param {number} productId - Product ID
 */
function removeFromCart(productId) {
    delete cart[productId];
    displayCart();
}

/**
 * Update cart count badge
 */
function updateCartCount() {
    const cartCount = getElement('cartCountBadge');
    if (!cartCount) return;
    
    const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = `${totalItems} items`;
}

// ===================================
// CART CALCULATIONS
// ===================================

/**
 * Calculate cart subtotal
 * @returns {number}
 */
function calculateSubtotal() {
    return Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Calculate tax amount
 * @returns {number}
 */
function calculateTax() {
    return calculateSubtotal() * 0.085;
}

/**
 * Calculate total amount
 * @returns {number}
 */
function calculateTotal() {
    return calculateSubtotal() + calculateTax();
}

/**
 * Update cart summary display
 */
function updateCartSummary() {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();
    
    const updates = {
        subtotal: formatPrice(subtotal),
        tax: formatPrice(tax),
        totalAmount: formatPrice(total)
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const element = getElement(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ===================================
// CHECKOUT FUNCTIONS
// ===================================

/**
 * Process checkout with Firebase
 */
async function checkout() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Get customer name and validate
    const nameInput = document.querySelector('.customer-name-input');
    const customerName = nameInput ? nameInput.value.trim() : '';
    
    if (!customerName) {
        alert('Please enter your name to continue with the order.');
        if (nameInput) {
            nameInput.focus();
            nameInput.style.borderColor = '#ff4757';
            nameInput.style.background = '#fff5f5';
        }
        return;
    }
    
    // Show loading state
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = '⏳ Submitting Order...';
    checkoutBtn.disabled = true;
    
    try {
        // Prepare order data
        const orderId = generateOrderId();
        const orderData = {
            // Basic order info
            orderId: orderId,
            status: 'pending',
            
            // Customer info
            customer: {
                name: customerName
            },
            
            // Items
            items: Object.values(cart).map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            
            // Pricing
            pricing: {
                subtotal: calculateSubtotal(),
                tax: calculateTax(), 
                total: calculateTotal()
            },
            
            // Details
            instructions: document.querySelector('.instructions-input')?.value.trim() || '',
            estimatedTime: calculateEstimatedTime(Object.keys(cart).length),
            
            // Timestamps
            createdAt: serverTimestamp(),
            source: 'web_app'
        };
        
        // 🔥 SAVE TO FIREBASE
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        console.log('✅ Order saved to Firebase:', docRef.id);
        
        // Store for queue page
        window.currentOrder = {
            ...orderData,
            firebaseId: docRef.id,
            orderTime: new Date()
        };
        
        // Success!
        alert(`🎉 Order #${orderId} submitted successfully!\n\nFirebase ID: ${docRef.id.substring(0, 8)}...`);
        
        // Clear cart and go to queue
        cart = {};
        showScreen('queue');
        
    } catch (error) {
        console.error('❌ Firebase error:', error);
        alert('⚠️ Order could not be submitted to the kitchen system. Please try again or contact staff.');
        
    } finally {
        // Reset button
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
}


// ===================================
// FIREBASE ORDER SUBMISSION SYSTEM
// ===================================

// Import Firebase functions (add to your firebase-config.js or main script)
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-config.js';

/**
 * Save order to Firebase Firestore
 * @param {Object} orderData - Order data object
 * @returns {Promise<string>} - Returns Firebase document ID
 */
async function saveOrderToFirebase(orderData) {
    try {
        // Prepare order for Firebase
        const firebaseOrder = {
            // Order identification
            orderId: orderData.orderId,
            status: 'pending', // pending, preparing, ready, completed, cancelled
            
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
            orderType: 'pickup', // pickup, delivery
            
            // Timestamps
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            estimatedReadyTime: new Date(Date.now() + (orderData.estimatedTime * 60000)),
            
            // Metadata
            source: 'web_app',
            version: '1.0'
        };
        
        // Add to Firebase collection
        const docRef = await addDoc(collection(db, 'orders'), firebaseOrder);
        
        console.log('Order saved to Firebase with ID:', docRef.id);
        return docRef.id;
        
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        throw error;
    }
}

/**
 * Update order status in Firebase
 * @param {string} firebaseOrderId - Firebase document ID
 * @param {string} newStatus - New order status
 * @returns {Promise}
 */
async function updateOrderStatus(firebaseOrderId, newStatus) {
    try {
        const orderRef = doc(db, 'orders', firebaseOrderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        
        console.log('Order status updated to:', newStatus);
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

// ===================================
// UPDATED CHECKOUT FUNCTION WITH FIREBASE
// ===================================

/**
 * Process checkout with Firebase integration
 */
async function checkout() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Get customer name and validate
    const nameInput = document.querySelector('.customer-name-input');
    const customerName = nameInput ? nameInput.value.trim() : '';
    
    if (!customerName) {
        alert('Please enter your name to continue with the order.');
        if (nameInput) {
            nameInput.focus();
            nameInput.style.borderColor = '#ff4757';
            nameInput.style.background = '#fff5f5';
        }
        return;
    }
    
    // Show loading state
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = '⏳ Processing Order...';
    checkoutBtn.disabled = true;
    
    try {
        // Prepare order data
        const orderData = {
            items: Object.values(cart).map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity,
                category: item.category || 'unknown'
            })),
            subtotal: calculateSubtotal(),
            tax: calculateTax(),
            total: calculateTotal(),
            customerInfo: {
                name: customerName,
                phone: document.querySelector('.customer-phone-input')?.value.trim() || "",
                email: document.querySelector('.customer-email-input')?.value.trim() || ""
            },
            instructions: document.querySelector('.instructions-input')?.value.trim() || "",
            timestamp: new Date().toISOString()
        };
        
        // Generate order ID
        const orderId = generateOrderId();
        orderData.orderId = orderId;
        orderData.orderTime = new Date();
        
        // Calculate estimated time
        const estimatedTime = calculateEstimatedTime(orderData.items.length);
        orderData.estimatedTime = estimatedTime;
        
        // Save to Firebase
        const firebaseOrderId = await saveOrderToFirebase(orderData);
        
        // Store order data for queue page (include Firebase ID)
        window.currentOrder = {
            ...orderData,
            firebaseOrderId: firebaseOrderId,
            status: 'pending'
        };
        
        // Show success message
        showOrderSubmissionSuccess(orderId, firebaseOrderId);
        
        // Clear cart
        cart = {};
        
        // Navigate to queue page
        showScreen('queue');
        
    } catch (error) {
        console.error('Checkout error:', error);
        
        // Show error message but still proceed to queue (graceful degradation)
        alert('⚠️ Order submitted locally, but may not have reached the kitchen system. Please check with staff.');
        
        // Create order without Firebase
        const orderData = createLocalOrder();
        window.currentOrder = orderData;
        cart = {};
        showScreen('queue');
        
    } finally {
        // Reset button state
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
}

/**
 * Create local order as fallback
 * @returns {Object}
 */
function createLocalOrder() {
    const nameInput = document.querySelector('.customer-name-input');
    const customerName = nameInput ? nameInput.value.trim() : 'Guest';
    
    return {
        items: Object.values(cart).map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        customerInfo: {
            name: customerName,
            phone: "",
            email: ""
        },
        instructions: document.querySelector('.instructions-input')?.value.trim() || "",
        orderId: generateOrderId(),
        orderTime: new Date(),
        estimatedTime: calculateEstimatedTime(Object.keys(cart).length),
        status: 'pending'
    };
}

/**
 * Show order submission success message
 * @param {string} orderId - Local order ID
 * @param {string} firebaseOrderId - Firebase document ID
 */
function showOrderSubmissionSuccess(orderId, firebaseOrderId) {
    const message = `🎉 Order submitted successfully!

Order #: ${orderId}
Database ID: ${firebaseOrderId.substring(0, 8)}...

Your order has been sent to the kitchen!`;
    
    // Create custom success popup (optional)
    setTimeout(() => {
        alert(message);
    }, 500);
}

// ===================================
// FIREBASE ORDER MANAGEMENT FUNCTIONS
// ===================================

/**
 * Get order from Firebase by ID
 * @param {string} firebaseOrderId - Firebase document ID
 * @returns {Promise<Object>}
 */
async function getOrderFromFirebase(firebaseOrderId) {
    try {
        const docRef = doc(db, 'orders', firebaseOrderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Order not found');
        }
    } catch (error) {
        console.error('Error getting order:', error);
        throw error;
    }
}

/**
 * Listen to order status changes (real-time updates)
 * @param {string} firebaseOrderId - Firebase document ID
 * @param {Function} callback - Callback function for status updates
 */
function listenToOrderUpdates(firebaseOrderId, callback) {
    try {
        const orderRef = doc(db, 'orders', firebaseOrderId);
        
        const unsubscribe = onSnapshot(orderRef, (doc) => {
            if (doc.exists()) {
                const orderData = { id: doc.id, ...doc.data() };
                callback(orderData);
            }
        });
        
        // Store unsubscribe function for cleanup
        window.orderListener = unsubscribe;
        
    } catch (error) {
        console.error('Error setting up order listener:', error);
    }
}

/**
 * Stop listening to order updates
 */
function stopOrderListener() {
    if (window.orderListener) {
        window.orderListener();
        window.orderListener = null;
    }
}

// ===================================
// ENHANCED QUEUE PAGE WITH FIREBASE
// ===================================

/**
 * Initialize queue with Firebase real-time updates
 */
function initializeQueue() {
    if (!window.currentOrder) return;
    
    const order = window.currentOrder;
    
    // Update order information
    updateQueueOrderInfo(order);
    
    // Display order summary
    displayQueueOrderSummary(order);
    
    // Start countdown timer
    startQueueTimer(order.estimatedTime);
    
    // Start queue position simulation
    startQueuePosition();
    
    // Update order status
    updateOrderStatus('preparing');
    
    // Listen for real-time Firebase updates (if Firebase ID exists)
    if (order.firebaseOrderId) {
        listenToOrderUpdates(order.firebaseOrderId, (updatedOrder) => {
            console.log('Order status updated from Firebase:', updatedOrder.status);
            
            // Update local order data
            window.currentOrder.status = updatedOrder.status;
            
            // Update UI based on Firebase status
            updateQueueFromFirebase(updatedOrder);
        });
    }
}

/**
 * Update queue UI from Firebase order data
 * @param {Object} firebaseOrder - Order data from Firebase
 */
function updateQueueFromFirebase(firebaseOrder) {
    const statusMapping = {
        'pending': 'confirmed',
        'preparing': 'preparing', 
        'ready': 'ready',
        'completed': 'completed'
    };
    
    const uiStatus = statusMapping[firebaseOrder.status] || firebaseOrder.status;
    updateOrderStatus(uiStatus);
    
    if (firebaseOrder.status === 'ready') {
        showOrderReady();
    }
}

/**
 * Clean up Firebase listeners when leaving queue
 */
function backToMenu() {
    // Stop Firebase listener
    stopOrderListener();
    
    // Clear any running timer
    if (window.queueTimer) {
        clearInterval(window.queueTimer);
        window.queueTimer = null;
    }
    
    // Clear current order
    window.currentOrder = null;
    
    // Navigate to menu
    showScreen('menu');
}

// ===================================
// FIREBASE ADMIN FUNCTIONS (Optional)
// ===================================

/**
 * Get all orders for admin dashboard
 * @returns {Promise<Array>}
 */
async function getAllOrders() {
    try {
        const ordersCollection = collection(db, 'orders');
        const orderSnapshot = await getDocs(ordersCollection);
        
        return orderSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting orders:', error);
        throw error;
    }
}

/**
 * Get orders by status
 * @param {string} status - Order status to filter by
 * @returns {Promise<Array>}
 */
async function getOrdersByStatus(status) {
    try {
        const ordersCollection = collection(db, 'orders');
        const q = query(ordersCollection, where('status', '==', status));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting orders by status:', error);
        throw error;
    }
}
/**
 * Generate a simple order ID
 * @returns {string}
 */
function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `EH${timestamp}${random}`;
}

/**
 * Calculate estimated preparation time
 * @param {number} itemCount - Number of items in order
 * @returns {number} - Estimated time in minutes
 */
function calculateEstimatedTime(itemCount) {
    const baseTime = 8; // Base time in minutes
    const timePerItem = 2; // Additional minutes per item
    const randomVariation = Math.floor(Math.random() * 4) - 2; // ±2 minutes
    return Math.max(5, baseTime + (itemCount * timePerItem) + randomVariation);
}

// ===================================
// ADD VISUAL FEEDBACK FOR NAME INPUT
// ===================================

/**
 * Add event listeners for name input validation
 */
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.querySelector('.customer-name-input');
    if (nameInput) {
        // Reset styling when user starts typing
        nameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#10b981';
                this.style.background = '#f0fff4';
            } else {
                this.style.borderColor = '';
                this.style.background = '';
            }
        });
        
        // Validate on blur
        nameInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#ff4757';
                this.style.background = '#fff5f5';
            }
        });
    }
});


/**
 * Prepare order data object - Updated to collect customer info
 * @returns {Object}
 */
function prepareOrderData() {
    const nameInput = document.querySelector('.customer-name-input');
    const emailInput = document.querySelector('.customer-email-input');
    const phoneInput = document.querySelector('.customer-phone-input');
    const instructionsInput = document.querySelector('.instructions-input');
    
    // Ensure customer name is provided
    const customerName = nameInput ? nameInput.value.trim() : '';
    if (!customerName) {
        alert('Please enter your name to continue with the order.');
        if (nameInput) nameInput.focus();
        throw new Error('Customer name is required');
    }
    
    return {
        items: Object.values(cart).map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        customerInfo: {
            name: customerName,
            phone: phoneInput ? phoneInput.value.trim() : "",
            email: emailInput ? emailInput.value.trim() : ""
        },
        instructions: instructionsInput ? instructionsInput.value.trim() : "",
        timestamp: new Date().toISOString()
    };
}


/**
 * Show order confirmation with order ID
 * @param {Object} orderData - Order data
 * @param {string} orderId - Firebase order ID
 */
function showOrderConfirmation(orderData, orderId) {
    const orderSummary = orderData.items
        .map(item => `${item.quantity}x ${item.name}`)
        .join(', ');

    alert(`🎉 Order confirmed! Order ID: ${orderId}\n\nItems: ${orderSummary}\nTotal: ${formatPrice(orderData.total)}\n\nThank you! Your matcha order will be ready in 10-15 minutes.`);
    
    clearCartAndReturnToMenu();
}

/**
 * Show basic order confirmation without order ID
 * @param {Object} orderData - Order data
 */
function showBasicOrderConfirmation(orderData) {
    const orderSummary = orderData.items
        .map(item => `${item.quantity}x ${item.name}`)
        .join(', ');

    alert(`🎉 Order confirmed!\n\nItems: ${orderSummary}\nTotal: ${formatPrice(orderData.total)}\n\nThank you! Your matcha order will be ready in 10-15 minutes.`);
    
    clearCartAndReturnToMenu();
}

/**
 * Clear cart and return to menu
 */
function clearCartAndReturnToMenu() {
    cart = {};
    showScreen('menu');
}


/**
 * Generate a simple order ID
 * @returns {string}
 */
function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `EH${timestamp}${random}`;
}

/**
 * Calculate estimated preparation time
 * @param {number} itemCount - Number of items in order
 * @returns {number} - Estimated time in minutes
 */
function calculateEstimatedTime(itemCount) {
    const baseTime = 8; // Base time in minutes
    const timePerItem = 2; // Additional minutes per item
    const randomVariation = Math.floor(Math.random() * 4) - 2; // ±2 minutes
    return Math.max(5, baseTime + (itemCount * timePerItem) + randomVariation);
}


// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize the application
 */
function initializeApp() {
    // Add cart icon to menu header
    addCartIconToHeader();
    
    // Initialize products display
    displayProducts();
    
    // Initialize cart display
    updateCartSummary();
    updateCartCount();
    
    // Add event listeners
    addEventListeners();
    
    console.log('🍵 Matcha app initialized successfully!');
}

/**
 * Add cart icon to menu header
 */
function addCartIconToHeader() {
    const menuHeader = document.querySelector('.menu-header');
    if (!menuHeader) return;
    
    const cartIcon = createElement('div', {
        innerHTML: '💖',
        style: 'font-size: 1.5rem; cursor: pointer; margin-left: auto;',
        onclick: () => showScreen('cart')
    });
    
    menuHeader.appendChild(cartIcon);
}

/**
 * Add event listeners
 */
function addEventListeners() {
    // Search input event listener
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchProducts(e.target.value));
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardNavigation(event) {
    // Escape key to go back
    if (event.key === 'Escape') {
        const currentScreen = document.querySelector('.screen-active');
        if (currentScreen) {
            const screenId = currentScreen.id;
            switch (screenId) {
                case 'productDetailScreen':
                case 'cartScreen':
                    showScreen('menu');
                    break;
                case 'menuScreen':
                    showScreen('welcome');
                    break;
            }
        }
    }
}

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // In production, you might want to send this to an error tracking service
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default browser behavior
    event.preventDefault();
});

// ===================================
// APP STARTUP
// ===================================

/**
 * Start the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', initializeApp);

// ===================================
// MOBILE RESPONSIVENESS
// ===================================

/**
 * Handle mobile-specific optimizations
 */
if (window.innerWidth <= 768) {
    // Add mobile-specific optimizations
    document.body.classList.add('mobile-device');
    
    // Prevent zoom on input focus (iOS)
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
}

// ===================================
// PERFORMANCE MONITORING
// ===================================

/**
 * Log performance metrics
 */
window.addEventListener('load', () => {
    if (window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`🚀 App loaded in ${loadTime}ms`);
    }
});


// ===================================
// QUEUE PAGE FUNCTIONS
// ===================================

/**
 * Initialize the queue page
 */
function initializeQueue() {
    if (!window.currentOrder) return;
    
    const order = window.currentOrder;
    
    // Update order information
    updateQueueOrderInfo(order);
    
    // Display order summary
    displayQueueOrderSummary(order);
    
    // Start countdown timer
    startQueueTimer(order.estimatedTime);
    
    // Start queue position simulation
    startQueuePosition();
    
    // Update order status
    updateOrderStatus('preparing');
}

/**
 * Update order information display
 * @param {Object} order - Order data
 */
function updateQueueOrderInfo(order) {
    const elements = {
        queueOrderId: `Order #${order.orderId}`,
        queueCustomerName: order.customerInfo.name,
        queueEstimatedTime: `${order.estimatedTime} min`,
        queueOrderTime: order.orderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    Object.entries(elements).forEach(([id, text]) => {
        const element = getElement(id);
        if (element) element.textContent = text;
    });
}

/**
 * Display order summary in queue page
 * @param {Object} order - Order data
 */
function displayQueueOrderSummary(order) {
    const summaryElement = getElement('queueOrderSummary');
    if (!summaryElement) return;
    
    const itemsList = order.items.map(item => `
        <div class="queue-order-item">
            <span class="queue-item-quantity">${item.quantity}x</span>
            <span class="queue-item-name">${item.name}</span>
            <span class="queue-item-price">${formatPrice(item.total)}</span>
        </div>
    `).join('');
    
    summaryElement.innerHTML = `
        <div class="queue-items-list">
            ${itemsList}
        </div>
        <div class="queue-order-total">
            <strong>Total: ${formatPrice(order.total)}</strong>
        </div>
    `;
}

/**
 * Start countdown timer for queue
 * @param {number} minutes - Initial minutes
 */
function startQueueTimer(minutes) {
    let timeLeft = minutes * 60; // Convert to seconds
    
    const timerElement = getElement('queueTimer');
    if (!timerElement) return;
    
    const updateTimer = () => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        timerElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft > 0) {
            timeLeft--;
            
            // Update status at certain intervals
            const totalTime = minutes * 60;
            const progress = (totalTime - timeLeft) / totalTime;
            
            if (progress > 0.3 && progress < 0.7) {
                updateOrderStatus('preparing');
            } else if (progress > 0.7 && progress < 0.95) {
                updateOrderStatus('almost-ready');
            } else if (timeLeft === 0) {
                updateOrderStatus('ready');
                showOrderReady();
                return;
            }
        }
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    window.queueTimer = setInterval(updateTimer, 1000);
}

/**
 * Start queue position simulation
 */
function startQueuePosition() {
    const positionElement = getElement('queuePosition');
    if (!positionElement) return;
    
    // Start with 2-4 people ahead
    let currentPosition = Math.floor(Math.random() * 3) + 2;
    
    const updatePosition = () => {
        positionElement.textContent = currentPosition;
        
        if (currentPosition > 0) {
            setTimeout(() => {
                currentPosition--;
                updatePosition();
            }, 45000 + Math.random() * 30000); // 45-75 seconds between updates
        }
    };
    
    updatePosition();
}

/**
 * Update order status
 * @param {string} status - New status
 */
function updateOrderStatus(status) {
    const statusElement = getElement('queueStatus');
    if (!statusElement) return;
    
    const statusConfig = {
        'confirmed': {
            text: 'Order Confirmed',
            color: '#d4af37',
            icon: '✅'
        },
        'preparing': {
            text: 'Preparing Your Order',
            color: '#ff6b35',
            icon: '👩‍🍳'
        },
        'almost-ready': {
            text: 'Almost Ready!',
            color: '#ffa500',
            icon: '⏰'
        },
        'ready': {
            text: 'Order Ready!',
            color: '#10b981',
            icon: '🎉'
        }
    };
    
    const config = statusConfig[status];
    if (config) {
        statusElement.textContent = `${config.icon} ${config.text}`;
        statusElement.style.background = config.color;
    }
}

/**
 * Show order ready notification
 */
function showOrderReady() {
    if (window.queueTimer) {
        clearInterval(window.queueTimer);
    }
    
    const timerElement = getElement('queueTimer');
    if (timerElement) {
        timerElement.textContent = 'Ready!';
        timerElement.style.color = '#10b981';
        timerElement.style.fontWeight = 'bold';
    }
    
    // Show notification
    setTimeout(() => {
        alert('🎉 Your order is ready for pickup!\n\nPlease come to the counter to collect your delicious Egghaus Social order!');
    }, 1000);
    
    // Add pickup button
    addPickupButton();
}

/**
 * Add pickup confirmation button
 */
function addPickupButton() {
    const actionsElement = getElement('queueActions');
    if (!actionsElement) return;
    
    const pickupBtn = document.createElement('button');
    pickupBtn.className = 'queue-pickup-btn';
    pickupBtn.textContent = '✅ Confirm Pickup';
    pickupBtn.onclick = confirmPickup;
    
    actionsElement.appendChild(pickupBtn);
}

/**
 * Confirm order pickup
 */
function confirmPickup() {
    alert('Thank you for choosing Egghaus Social! 🍵\n\nEnjoy your order and have a great day!');
    backToMenu();
}

/**
 * Go back to menu from queue
 */
function backToMenu() {
    // Clear any running timer
    if (window.queueTimer) {
        clearInterval(window.queueTimer);
        window.queueTimer = null;
    }
    
    // Clear current order
    window.currentOrder = null;
    
    // Navigate to menu
    showScreen('menu');
}

/**
 * Share order details
 */
function shareOrder() {
    if (!window.currentOrder) return;
    
    const order = window.currentOrder;
    const shareText = `My Egghaus Social order #${order.orderId} is being prepared! 🍵\n\nItems: ${order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}\n\nEstimated time: ${order.estimatedTime} minutes`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Egghaus Social Order',
            text: shareText
        });
    } else {
        // Fallback for browsers without native sharing
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Order details copied to clipboard!');
            });
        } else {
            alert(shareText);
        }
    }
}


// ===================================
// UPDATED KEYBOARD NAVIGATION
// ===================================

/**
 * Handle keyboard navigation - Updated to include queue page
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardNavigation(event) {
    // Escape key to go back
    if (event.key === 'Escape') {
        const currentScreen = document.querySelector('.screen-active');
        if (currentScreen) {
            const screenId = currentScreen.id;
            switch (screenId) {
                case 'productDetailScreen':
                case 'cartScreen':
                    showScreen('menu');
                    break;
                case 'queueScreen':
                    // Don't allow escape from queue - they need to wait or go back via button
                    break;
                case 'menuScreen':
                    showScreen('welcome');
                    break;
            }
        }
    }
}


// ===================================
// FIREBASE ORDER SUBMISSION SYSTEM
// ===================================

// Import Firebase functions (add to your firebase-config.js or main script)
// import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { db } from './firebase-config.js';

/**
 * Save order to Firebase Firestore
 * @param {Object} orderData - Order data object
 * @returns {Promise<string>} - Returns Firebase document ID
 */
async function saveOrderToFirebase(orderData) {
    try {
        // Prepare order for Firebase
        const firebaseOrder = {
            // Order identification
            orderId: orderData.orderId,
            status: 'pending', // pending, preparing, ready, completed, cancelled
            
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
            orderType: 'pickup', // pickup, delivery
            
            // Timestamps
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            estimatedReadyTime: new Date(Date.now() + (orderData.estimatedTime * 60000)),
            
            // Metadata
            source: 'web_app',
            version: '1.0'
        };
        
        // Add to Firebase collection
        const docRef = await addDoc(collection(db, 'orders'), firebaseOrder);
        
        console.log('Order saved to Firebase with ID:', docRef.id);
        return docRef.id;
        
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        throw error;
    }
}

/**
 * Update order status in Firebase
 * @param {string} firebaseOrderId - Firebase document ID
 * @param {string} newStatus - New order status
 * @returns {Promise}
 */
async function updateOrderStatus(firebaseOrderId, newStatus) {
    try {
        const orderRef = doc(db, 'orders', firebaseOrderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        
        console.log('Order status updated to:', newStatus);
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

/**
 * Test function to verify Firebase is working
 */
async function testFirebaseConnection() {
    try {
        const testOrder = {
            test: true,
            message: 'Firebase connection test',
            timestamp: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'test'), testOrder);
        console.log('✅ Firebase test successful! Document ID:', docRef.id);
        alert('🔥 Firebase is connected and working!');
        
    } catch (error) {
        console.error('❌ Firebase test failed:', error);
        alert('⚠️ Firebase connection failed: ' + error.message);
    }
}

