// ===================================
// FIREBASE IMPORTS - FIXED FOR BROWSER
// ===================================
import { 
    collection, 
    addDoc, 
    query,
    where,
    getDocs,
    doc,
    onSnapshot,
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// ===================================
// DATA IMPORTS
// ===================================
import { 
    products, 
    seasons, 
    guestList,
    appConfig,
    getProductsBySeason, 
    getSeasonInfo,
    isOnGuestList,
    getGuestList,
    getProductsByCategory,
    searchProductsInSeason
} from './data.js';

// ===================================
// GLOBAL VARIABLES
// ===================================
let cart = {};
let currentProduct = {};
let currentQuantity = 1;
let currentUserName = '';
let userProfileImage = '';
let currentSeason = appConfig.defaultSeason; // Use default from config
let currentProducts = []; // Currently displayed products

// ===================================
// ADMIN FUNCTIONS (using imported data functions)
// ===================================

// Admin function to check guest list (for debugging)
window.checkGuestList = function() {
    const list = getGuestList();
    console.log('🎫 Current Guest List:', list);
    console.log('📊 Total VIP guests:', list.length);
    return list;
};


// Admin function to view app configuration
window.getAppConfig = function() {
    console.log('⚙️ App Configuration:', appConfig);
    return appConfig;
};

// ===================================
// SEASON MANAGEMENT FUNCTIONS
// ===================================

/**
 * Change current season and update products display
 * @param {string|number} seasonId - Season ID
 */
function changeSeason(seasonId) {
    const newSeason = parseInt(seasonId);
    console.log(`🎭 Changing to season ${newSeason}`);
    
    currentSeason = newSeason;
    
    // Update products for current season
    currentProducts = getProductsBySeason(currentSeason);
    console.log(`📦 Loaded ${currentProducts.length} products for season ${currentSeason}`);
    
    // Clear any active category filters and show all products for this season
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.category-item').classList.add('active'); // First item (ALL)
    
    // Update display
    displayProducts(currentProducts);
    
    // Show season change feedback
    const seasonInfo = getSeasonInfo(currentSeason);
    if (seasonInfo) {
        showSeasonChangeFeedback(seasonInfo);
    }
}

/**
 * Show visual feedback when season changes
 * @param {Object} seasonInfo - Season information
 */
function showSeasonChangeFeedback(seasonInfo) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d4af37, #ffd700);
        color: #5d4037;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
        animation: slideInDown 0.3s ease-out;
        text-align: center;
        max-width: 90vw;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 1.1rem; margin-bottom: 0.3rem;">
            🎭 ${seasonInfo.name}
        </div>
        <div style="font-size: 0.85rem; opacity: 0.8;">
            ${seasonInfo.subtitle} • ${currentProducts.length} items
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, appConfig.notificationDuration);
}

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
    const baseTime = appConfig.basePreparationTime;
    const timePerItem = appConfig.timePerItem;
    const randomVariation = Math.floor(Math.random() * 4) - 2; // ±2 minutes
    return Math.max(5, baseTime + (itemCount * timePerItem) + randomVariation);
}

// ===================================
// NAME ENTRY MODAL FUNCTIONS
// ===================================

/**
 * Show name entry dialog
 */
function showNameDialog() {
    const modal = getElement('nameModalOverlay');
    const input = getElement('nameModalInput');
    
    if (modal && input) {
        modal.style.display = 'flex';
        
        // Set max length from config
        input.maxLength = appConfig.maxNameLength;
        
        // Focus on input after animation
        setTimeout(() => {
            input.focus();
            input.value = '';
        }, appConfig.modalAnimationTime);
        
        // Add Enter key listener
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                submitNameFromDialog();
            }
        });
        
        // Add input validation
        input.addEventListener('input', function() {
            const submitBtn = document.querySelector('.name-modal-submit');
            if (submitBtn) {
                submitBtn.disabled = !this.value.trim();
            }
        });
        
        // Click outside to close
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeNameDialog();
            }
        });
        
        // Disable submit button initially
        const submitBtn = document.querySelector('.name-modal-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }
}

/**
 * Close name entry dialog
 */
function closeNameDialog() {
    const modal = getElement('nameModalOverlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Submit user name from dialog and proceed to menu
 */
function submitNameFromDialog() {
    const nameInput = getElement('nameModalInput');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
        // Shake the input if empty
        nameInput.style.animation = 'shake 0.5s ease-in-out';
        nameInput.focus();
        setTimeout(() => {
            nameInput.style.animation = '';
        }, 500);
        return;
    }
    
    // 🎫 Early guest list check
    if (!isOnGuestList(name)) {
        // Show early warning but allow them to continue
        const warningMessage = `⚠️ Guest List Notice\n\nHi ${name}! We don't see you on our VIP guest list.\n\nYou can browse the menu, but you'll need to be on the guest list to place an order.\n\nContact the organizers if you believe this is an error.`;
        
        setTimeout(() => alert(warningMessage), 500);
        
        // Add visual indicator but don't block
        nameInput.style.borderColor = '#ffa500';
        nameInput.style.background = '#fff8e1';
        
        console.log(`⚠️ Early guest list warning for: ${name}`);
    } else {
        console.log(`✅ VIP guest confirmed: ${name}`);
        
        // Green indicator for VIP guests
        nameInput.style.borderColor = '#10b981';
        nameInput.style.background = '#f0fff4';
    }
    
    // Store the user's name
    currentUserName = name;
    console.log('👤 User name set:', currentUserName);
    
    // Store in localStorage for persistence
    localStorage.setItem('currentUserName', currentUserName);
    
    // Set up profile image path
    userProfileImage = `${appConfig.profileImagePath}/${name.toLowerCase()}.png`;
    
    // Show loading state on button
    const submitBtn = document.querySelector('.name-modal-submit');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Loading...';
        submitBtn.disabled = true;
        
        // Simulate brief loading
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Close modal and proceed to menu
            closeNameDialog();
            showScreen('menu');
        }, appConfig.loadingSimulationTime);
    } else {
        closeNameDialog();
        showScreen('menu');
    }
}

/**
 * Set up profile display in menu (removed profile name display)
 */
function setupProfile() {
    const profileImage = getElement('profileImage');
    const profileFallback = getElement('profileFallback');
    const profilePic = getElement('profilePic');
    
    if (currentUserName && profileImage && profileFallback && profilePic) {
        // Add loading class
        profilePic.classList.add('loading');
        
        // Try to load user's profile image
        profileImage.onload = function() {
            console.log('✅ Profile image loaded successfully:', userProfileImage);
            profileImage.classList.add('loaded');
            profileFallback.classList.add('hidden');
            profilePic.classList.remove('loading');
        };
        
        profileImage.onerror = function() {
            console.log(`⚠️ Profile image not found in /${appConfig.profileImagePath}/ directory, using fallback:`, userProfileImage);
            profileImage.style.display = 'none';
            profileFallback.style.display = 'flex';
            profilePic.classList.remove('loading');
            
            // Use first letter of name as fallback
            profileFallback.textContent = currentUserName.charAt(0).toUpperCase();
        };
        
        // Set the image source
        profileImage.src = userProfileImage;
        profileImage.alt = `${currentUserName}'s profile picture`;
        
        // Set up profile tooltip
        profilePic.title = `View ${currentUserName}'s Profile`;
    }
}

/**
 * Navigate to profile page with user name parameter
 */
function goToProfile() {
    if (!currentUserName || currentUserName === 'Guest') {
        alert('Please enter your name first to view your profile.');
        return;
    }
    
    // Save current state
    localStorage.setItem('currentUserName', currentUserName);
    
    // Navigate to profile page with user parameter
    const profileUrl = `profile.html?user=${encodeURIComponent(currentUserName)}`;
    console.log(`👤 Navigating to profile: ${profileUrl}`);
    
    // Show brief loading feedback
    const profilePic = getElement('profilePic');
    if (profilePic) {
        const originalTitle = profilePic.title;
        profilePic.title = 'Loading profile...';
        profilePic.style.opacity = '0.7';
        
        setTimeout(() => {
            window.location.href = profileUrl;
        }, 200);
    } else {
        window.location.href = profileUrl;
    }
}

/**
 * Pre-fill customer name in cart
 */
function prefillCustomerInfo() {
    const customerNameInput = getElement('customerName');
    if (customerNameInput && currentUserName) {
        customerNameInput.value = currentUserName;
        // Make it readonly since they already entered it
        customerNameInput.readOnly = true;
        customerNameInput.style.background = '#f0f0f0';
        customerNameInput.style.color = '#666';
    }
}

// ===================================
// SCREEN NAVIGATION
// ===================================

/**
 * Show specific screen and hide others
 * @param {string} screenName - Name of screen to show
 */
function showScreen(screenName) {
    console.log('📱 Navigating to:', screenName);
    
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
            // Ensure we have current season products loaded
            if (currentProducts.length === 0) {
                currentProducts = getProductsBySeason(currentSeason);
            }
            displayProducts();
            setupProfile();
            break;
        case 'cart':
            displayCart();
            prefillCustomerInfo();
            break;
        case 'queue':
            initializeQueue();
            break;
    }
}

/**
 * Initialize name entry screen
 */
function initializeNameEntry() {
    const nameInput = getElement('userNameInput');
    if (nameInput) {
        nameInput.focus();
        nameInput.value = '';
        
        // Add Enter key listener
        nameInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                submitName();
            }
        });
        
        // Add input validation
        nameInput.addEventListener('input', function() {
            const continueBtn = document.querySelector('.continue-btn');
            if (continueBtn) {
                continueBtn.disabled = !this.value.trim();
            }
        });
    }
    
    // Disable continue button initially
    const continueBtn = document.querySelector('.continue-btn');
    if (continueBtn) {
        continueBtn.disabled = true;
    }
}

// ===================================
// PRODUCT DISPLAY FUNCTIONS
// ===================================

/**
 * Display products in the grid
 * @param {Array} filteredProducts - Array of products to display
 */
function displayProducts(filteredProducts = currentProducts) {
    const grid = getElement('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #8d6e63;">
                <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;">🍵</div>
                <p><strong>No items found</strong></p>
                <p>Try a different category or season</p>
            </div>
        `;
        return;
    }
    
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
    
    console.log(`📦 Displayed ${filteredProducts.length} products`);
}

/**
 * Filter products by category within current season
 * @param {string} category - Category to filter by
 */
function filterCategory(category) {
    console.log('🔍 Filtering by category:', category, 'in season', currentSeason);
    
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
    
    // Use utility function to get filtered products
    const filtered = getProductsByCategory(category, currentSeason);
    displayProducts(filtered);
    
    console.log(`📋 Showing ${filtered.length} ${category} items from season ${currentSeason}`);
}

/**
 * Search products by name or description within current season
 * @param {string} query - Search query
 */
const searchProducts = debounce((query) => {
    if (!query.trim()) {
        displayProducts(currentProducts);
        return;
    }
    
    const filtered = searchProductsInSeason(query, currentSeason);
    displayProducts(filtered);
    console.log(`🔍 Search "${query}" found ${filtered.length} results in season ${currentSeason}`);
}, appConfig.searchDebounceTime);

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
                <div class="empty-cart-icon">🛒</div>
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
    return calculateSubtotal() * appConfig.taxRate;
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
    
    // Update tax percentage display dynamically
    const taxPercentage = (appConfig.taxRate * 100).toFixed(1);
    const summaryRows = document.querySelectorAll('.summary-row span');
    summaryRows.forEach(span => {
        if (span.textContent === 'Tax:') {
            span.textContent = `Tax (${taxPercentage}%):`;
        }
    });
}

// ===================================
// FIREBASE FUNCTIONS
// ===================================

/**
 * Save order to Firebase Firestore
 * @param {Object} orderData - Order data object
 * @returns {Promise<string>} - Returns Firebase document ID
 */
async function saveOrderToFirebase(orderData) {
    try {
        // Use the function from firebase-config.js
        if (window.saveOrderToDatabase) {
            return await window.saveOrderToDatabase(orderData);
        } else {
            throw new Error('Firebase functions not available');
        }
    } catch (error) {
        console.error('❌ Error saving order to Firebase:', error);
        throw error;
    }
}

/**
 * Listen to real-time order updates
 * @param {string} orderId - Firebase document ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
function listenToOrderUpdates(orderId, callback) {
    if (window.listenToOrderUpdates) {
        return window.listenToOrderUpdates(orderId, callback);
    } else {
        console.warn('Firebase real-time updates not available');
        return () => {};
    }
}

// ===================================
// CHECKOUT FUNCTIONS
// ===================================

/**
 * Process checkout with Firebase integration
 */
async function checkout() {
    console.log('🛒 Starting checkout process...');
    
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Get customer name (should be pre-filled from name entry)
    const nameInput = document.querySelector('.customer-name-input');
    const customerName = nameInput ? nameInput.value.trim() : currentUserName;
    
    if (!customerName) {
        alert('Please enter your name to continue with the order.');
        if (nameInput) {
            nameInput.focus();
            nameInput.style.borderColor = '#ff4757';
            nameInput.style.background = '#fff5f5';
        }
        return;
    }
    
    // 🎫 GUEST LIST CHECK
    if (!isOnGuestList(customerName)) {
        // Show exclusive error message
        const errorMessage = `🚫 Access Denied\n\nSorry ${customerName}, you're not on the guest list for this exclusive Egghaus Social event.\n\nPlease contact the organizers if you believe this is an error.`;
        
        alert(errorMessage);
        
        // Add visual feedback to name input
        if (nameInput) {
            nameInput.style.borderColor = '#ff4757';
            nameInput.style.background = '#fff5f5';
            nameInput.style.animation = 'shake 0.5s ease-in-out';
            
            setTimeout(() => {
                nameInput.style.animation = '';
            }, 500);
        }
        
        console.log(`🚫 Guest list check failed for: ${customerName}`);
        return; // Stop checkout process
    }
    
    console.log(`✅ Guest list check passed for: ${customerName}`);
    
    // Show loading state
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = '⏳ Processing Order...';
    checkoutBtn.disabled = true;
    
    try {
        // Prepare order data
        const orderId = generateOrderId();
        const estimatedTime = calculateEstimatedTime(Object.keys(cart).length);
        
        const orderData = {
            orderId: orderId,
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
            estimatedTime: estimatedTime,
            orderTime: new Date()
        };
        
        console.log('📋 Order data prepared:', orderData);
        
        // Try to save to Firebase
        let firebaseOrderId = null;
        try {
            firebaseOrderId = await saveOrderToFirebase(orderData);
            console.log('✅ Order saved to Firebase:', firebaseOrderId);
        } catch (firebaseError) {
            console.warn('⚠️ Firebase save failed, continuing with local order:', firebaseError.message);
        }
        
        // Store order data for queue page
        window.currentOrder = {
            ...orderData,
            firebaseOrderId: firebaseOrderId,
            status: 'pending'
        };
        
        // Show success message
        const successMessage = firebaseOrderId 
            ? `🎉 Order #${orderId} submitted successfully!\n\nYour order has been sent to our kitchen and will be ready in about ${estimatedTime} minutes.`
            : `🎉 Order #${orderId} confirmed!\n\nEstimated time: ${estimatedTime} minutes\n\n⚠️ Order saved locally - please check with staff.`;
        
        setTimeout(() => alert(successMessage), 300);
        
        // Clear cart and go to queue
        cart = {};
        showScreen('queue');
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        alert('⚠️ There was an issue processing your order. Please try again or contact staff.');
        
    } finally {
        // Reset button state
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
}

// ===================================
// QUEUE PAGE FUNCTIONS
// ===================================

/**
 * Initialize queue with Firebase real-time updates
 */
function initializeQueue() {
    if (!window.currentOrder) {
        console.warn('No current order found');
        return;
    }
    
    const order = window.currentOrder;
    console.log('🍵 Initializing queue for order:', order.orderId);
    
    // Update order information
    updateQueueOrderInfo(order);
    
    // Display order summary
    displayQueueOrderSummary(order);
    
    // Start countdown timer
    startQueueTimer(order.estimatedTime);
    
    // Start queue position simulation
    startQueuePosition();
    
    // Update initial order status
    updateOrderStatus('confirmed');
    
    // Set up Firebase real-time updates if available
    if (order.firebaseOrderId) {
        console.log('📡 Setting up real-time updates for Firebase order:', order.firebaseOrderId);
        
        window.currentOrderListener = listenToOrderUpdates(order.firebaseOrderId, (updatedOrder) => {
            console.log('🔄 Firebase order update received:', updatedOrder.status);
            
            // Update local order data
            window.currentOrder.status = updatedOrder.status;
            
            // Update UI based on Firebase status
            updateQueueFromFirebaseStatus(updatedOrder);
        });
    } else {
        console.log('📱 Running in offline mode - using local timer');
    }
}

/**
 * Update queue UI from Firebase order data
 * @param {Object} firebaseOrder - Order data from Firebase
 */
function updateQueueFromFirebaseStatus(firebaseOrder) {
    const statusMapping = {
        'pending': { ui: 'confirmed', icon: '✅', text: 'Order Confirmed' },
        'preparing': { ui: 'preparing', icon: '👩‍🍳', text: 'Preparing Your Order' },
        'ready': { ui: 'ready', icon: '🎉', text: 'Order Ready!' },
        'completed': { ui: 'completed', icon: '✅', text: 'Order Complete' }
    };
    
    const statusConfig = statusMapping[firebaseOrder.status];
    if (statusConfig) {
        updateOrderStatus(statusConfig.ui);
        
        // If order is ready, show notification and stop timer
        if (firebaseOrder.status === 'ready') {
            showOrderReady();
        }
    }
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
            
            // Update status at certain intervals (only if not using Firebase)
            if (!window.currentOrder?.firebaseOrderId) {
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
        }
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    window.queueTimer = setInterval(updateTimer, 1000);
}

/**
 * Start queue position based on active orders in Firebase
 */
async function startQueuePosition() {
    const positionElement = getElement('queuePosition');
    if (!positionElement || !db) return;

    try {
        // Firestore only allows up to 10 values in a not-in filter
        const q = query(
            collection(db, 'orders'),
            where('status', 'not-in', ['ready', 'completed', 'cancelled'])
        );

        const snapshot = await getDocs(q);
        let currentPosition = snapshot.size;

        const updatePosition = () => {
            positionElement.textContent = currentPosition;

            if (currentPosition > 0) {
                setTimeout(() => {
                    currentPosition--;
                    updatePosition();
                }, 45000 + Math.random() * 30000);
            }
        };

        updatePosition();
    } catch (error) {
        console.error('❌ Error loading queue position:', error);
        positionElement.textContent = '—';
    }
}

/**
 * Update order status display
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
    // Clear timer
    if (window.queueTimer) {
        clearInterval(window.queueTimer);
    }
    
    const timerElement = getElement('queueTimer');
    if (timerElement) {
        timerElement.textContent = 'Ready!';
        timerElement.style.color = '#10b981';
        timerElement.style.fontWeight = 'bold';
    }
    
    // Update Firebase status if connected
    if (window.currentOrder?.firebaseOrderId && window.updateOrderStatus) {
        window.updateOrderStatus(window.currentOrder.firebaseOrderId, 'ready')
            .catch(error => console.warn('Could not update Firebase status:', error));
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
    
    // Check if button already exists
    if (actionsElement.querySelector('.queue-pickup-btn')) return;
    
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
    // Update Firebase status if connected
    if (window.currentOrder?.firebaseOrderId && window.updateOrderStatus) {
        window.updateOrderStatus(window.currentOrder.firebaseOrderId, 'completed')
            .then(() => console.log('✅ Order marked as completed in Firebase'))
            .catch(error => console.warn('Could not update Firebase status:', error));
    }
    
    alert('Thank you for choosing Egghaus Social! 🍵\n\nEnjoy your order and have a great day!');
    backToMenu();
}

/**
 * Go back to menu from queue
 */
function backToMenu() {
    // Stop Firebase listener
    if (window.currentOrderListener) {
        window.currentOrderListener();
        window.currentOrderListener = null;
        console.log('📡 Stopped Firebase order listener');
    }
    
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
// INITIALIZATION
// ===================================

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('🚀 Initializing Egghaus Social app...');
    console.log(`🎫 Guest list loaded with ${getGuestList().length} VIP members`);

    const urlParams = new URLSearchParams(window.location.search);
    const urlUser = urlParams.get('user');
    const savedUserName = localStorage.getItem('currentUserName'); // Optional: for prefill

    if (urlUser) {
        currentUserName = urlUser.trim();
        localStorage.setItem('currentUserName', currentUserName);
        userProfileImage = `${appConfig.profileImagePath}/${currentUserName.toLowerCase()}.png`;
        console.log(`👤 User from URL: ${currentUserName}`);

        // Guest list check
        if (!isOnGuestList(currentUserName)) {
            console.warn(`⚠️ ${currentUserName} is NOT on the guest list`);
            setTimeout(() => {
                alert(`⚠️ Guest List Notice\n\nHi ${currentUserName}! We don't see you on our VIP guest list.\n\nYou can browse the menu, but you'll need to be on the guest list to place an order.`);
            }, 500);
        } else {
            console.log(`✅ ${currentUserName} is on the guest list`);
        }

        showScreen('menu'); // ✅ Only show menu if ?user= is present
    } else {
        // Optional: prefill input from localStorage if available
        if (savedUserName) {
            const nameInput = document.getElementById('nameModalInput');
            if (nameInput) {
                nameInput.value = savedUserName;
            }
        }
        showScreen('welcome'); // ✅ Force welcome screen
    }

    // Load initial product data and set up app
    currentProducts = getProductsBySeason(currentSeason);
    displayProducts();
    addCartIconToHeader();
    updateCartSummary();
    updateCartCount();
    addEventListeners();

    console.log('🍵 Egghaus Social app initialized successfully!');
}

/**
 * Add cart icon to menu header
 */
function addCartIconToHeader() {
    const menuHeader = document.querySelector('.menu-header');
    if (!menuHeader) return;
    
    const profileSection = menuHeader.querySelector('.profile-section');
    if (!profileSection) return;
    
    const cartIcon = createElement('div', {
        innerHTML: '🛒',
        style: 'font-size: 1.5rem; cursor: pointer; margin-right: 1rem; padding: 0.5rem; border-radius: 50%; background: rgba(212, 175, 55, 0.1); transition: all 0.3s ease;',
        onclick: () => showScreen('cart')
    });
    
    cartIcon.addEventListener('mouseenter', () => {
        cartIcon.style.background = 'rgba(212, 175, 55, 0.2)';
        cartIcon.style.transform = 'scale(1.1)';
    });
    
    cartIcon.addEventListener('mouseleave', () => {
        cartIcon.style.background = 'rgba(212, 175, 55, 0.1)';
        cartIcon.style.transform = 'scale(1)';
    });
    
    // Insert before profile section
    menuHeader.insertBefore(cartIcon, profileSection);
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
    
    // Name input validation
    const nameInput = document.querySelector('.customer-name-input');
    if (nameInput && !nameInput.readOnly) {
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
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardNavigation(event) {
    // Escape key to go back or close modal
    if (event.key === 'Escape') {
        // Check if name modal is open
        const nameModal = getElement('nameModalOverlay');
        if (nameModal && nameModal.style.display === 'flex') {
            closeNameDialog();
            return;
        }
        
        // Handle screen navigation
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
                    // Reset to welcome if user wants to change name
                    if (event.shiftKey) {
                        currentUserName = '';
                        localStorage.removeItem('currentUserName');
                        showNameDialog();
                    } else {
                        showScreen('welcome');
                    }
                    break;
            }
        }
    }
}

function startNewOrder() {
    localStorage.removeItem('currentUserName');
    window.location.href = 'order.html';
}

function toggleFloatingLinks() {
  const onWelcomeScreen = document.getElementById("welcomeScreen")?.classList.contains("screen-active");
  const hostLink = document.getElementById("hostLink");

  hostLink.style.display = onWelcomeScreen ? "inline-block" : "none";
}

window.addEventListener("DOMContentLoaded", toggleFloatingLinks);

// Also call this whenever you switch screens

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
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
    document.body.classList.add('mobile-device');
    
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
// EXPOSE FUNCTIONS TO GLOBAL SCOPE FOR HTML ONCLICK HANDLERS
// ===================================

// Make functions available globally for onclick handlers
window.showScreen = showScreen;
window.showNameDialog = showNameDialog;
window.closeNameDialog = closeNameDialog;
window.submitNameFromDialog = submitNameFromDialog;
window.goToProfile = goToProfile; // NEW: Profile navigation function
window.changeSeason = changeSeason;
window.filterCategory = filterCategory;
window.searchProducts = searchProducts;
window.adjustQuantity = adjustQuantity;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.backToMenu = backToMenu;
window.shareOrder = shareOrder;
window.confirmPickup = confirmPickup;
window.startNewOrder = startNewOrder;

console.log('🍵 Egghaus Social script loaded successfully with profile navigation!');
