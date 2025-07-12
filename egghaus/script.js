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
function showScreen(screenName) {
    const screens = ['welcome', 'menu', 'productDetail', 'cart'];
    
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
 * Process checkout
 */
function checkout() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const orderData = prepareOrderData();
    
    // Try to save to database if Firebase is available
    if (window.saveOrderToDatabase) {
        saveOrderToDatabase(orderData)
            .then(orderId => {
                if (orderId) {
                    showOrderConfirmation(orderData, orderId);
                } else {
                    showBasicOrderConfirmation(orderData);
                }
            })
            .catch(error => {
                console.error('Error saving order:', error);
                showBasicOrderConfirmation(orderData);
            });
    } else {
        showBasicOrderConfirmation(orderData);
    }
}

/**
 * Prepare order data object
 * @returns {Object}
 */
function prepareOrderData() {
    const instructionsInput = document.querySelector('.instructions-input');
    
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
            name: "Guest Customer",
            phone: "",
            email: ""
        },
        instructions: instructionsInput ? instructionsInput.value || "" : "",
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
