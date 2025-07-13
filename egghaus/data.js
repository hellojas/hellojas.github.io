// ===================================
// EGGHAUS SOCIAL - DATA CONFIGURATION
// ===================================

/**
 * Product catalog with enhanced analytics data
 */
export const products = [
    // MATCHA DRINKS
    {
        id: 1,
        name: "Iced Matcha Latte",
        price: 8.50,
        category: "matcha",
        image: "🍵",
        rating: 4.8,
        description: "Creamy iced matcha latte with premium ceremonial grade matcha and your choice of milk. Perfectly balanced and refreshing. Sourced from Agoshima, Japan",
        season: [2, 3], // Spring, Summer
        caffeine: 70, // mg
        popularity: 95
    },
    {
        id: 2,
        name: "Iced Yuzu Matcha",
        price: 9.00,
        category: "matcha",
        image: "🍋",
        rating: 4.7,
        description: "Unique fusion of earthy matcha and bright yuzu citrus served over ice. A refreshing twist on traditional matcha.",
        season: [2, 3], // Spring, Summer
        caffeine: 60,
        popularity: 78
    },
    {
        id: 3,
        name: "Iced Hojicha",
        price: 7.50,
        category: "matcha",
        image: "🍂",
        rating: 4.6,
        description: "Smooth roasted green tea with a nutty, caramel-like flavor served cold. Less caffeine, more comfort.",
        season: [1, 4], // Winter, Fall
        caffeine: 35,
        popularity: 65
    },
    {
        id: 4,
        name: "Hot Matcha Latte",
        price: 8.00,
        category: "matcha",
        image: "🫖",
        rating: 4.9,
        description: "Traditional hot matcha latte, perfect for cooler days. Ceremonial grade matcha with steamed milk.",
        season: [1, 4], // Winter, Fall
        caffeine: 70,
        popularity: 82
    },

    // COFFEE
    {
        id: 5,
        name: "Iced Coffee",
        price: 6.50,
        category: "coffee",
        image: "☕",
        rating: 4.5,
        description: "Classic japanese drip iced coffee, smooth and bold. Perfect for coffee lovers seeking a refreshing caffeine kick. Today's selection is a honey aponte columbian coffee from St. Kilda. Tasting notes: grapefruit, guava, white peach.",
        season: [2, 3], // Spring, Summer
        caffeine: 120,
        popularity: 88
    },
    {
        id: 6,
        name: "Hot Coffee",
        price: 6.00,
        category: "coffee",
        image: "☕",
        rating: 4.6,
        description: "Artisanal hot coffee, carefully brewed to perfection. Single origin beans with notes of chocolate and caramel.",
        season: [1, 4], // Winter, Fall
        caffeine: 140,
        popularity: 92
    },

    // DESSERTS & FOOD
    {
        id: 7,
        name: "Burnt Basque Cheesecake",
        price: 8.00,
        category: "noms",
        image: "🍰",
        rating: 4.9,
        description: "Rich, creamy cheesecake with a signature burnt top. Our most popular dessert with a perfectly caramelized exterior.",
        season: [1, 2, 3, 4], // All seasons
        caffeine: 0,
        popularity: 98
    },
    {
        id: 8,
        name: "Ube Cheesecake",
        price: 8.50,
        category: "noms",
        image: "💜",
        rating: 4.8,
        description: "Vibrant purple yam cheesecake with a smooth, velvety texture. A Filipino-inspired treat that's Instagram-worthy and delicious.",
        season: [2, 3], // Spring, Summer
        caffeine: 0,
        popularity: 85
    },
    {
        id: 9,
        name: "Chocolate Ganache Tart",
        price: 7.50,
        category: "noms",
        image: "🍫",
        rating: 4.7,
        description: "Decadent chocolate tart with silky smooth ganache filling. Rich, indulgent, and perfect for chocolate lovers.",
        season: [1, 4], // Winter, Fall
        caffeine: 15, // Small amount from chocolate
        popularity: 79
    },
    {
        id: 10,
        name: "Bagels",
        price: 5.50,
        category: "noms",
        image: "🥯",
        rating: 4.4,
        description: "Freshly baked artisanal bagels. Choose from various flavors and enjoy with your favorite toppings.",
        season: [1, 2, 3, 4], // All seasons
        caffeine: 0,
        popularity: 70
    },
    {
        id: 11,
        name: "Milk Bread",
        price: 2.00,
        category: "noms",
        image: "🍞",
        rating: 4.5,
        description: "Fluffy bites of heaven.",
        season: [1, 2, 3, 4], // All seasons
        caffeine: 0,
        popularity: 75
    },

    // SEASONAL SPECIALS
    {
        id: 12,
        name: "Pumpkin Spice Matcha",
        price: 9.50,
        category: "matcha",
        image: "🎃",
        rating: 4.6,
        description: "Fall-inspired matcha latte with pumpkin spice blend. Cozy autumn flavors meet ceremonial matcha.",
        season: [4], // Fall only
        caffeine: 65,
        popularity: 72
    },
    {
        id: 13,
        name: "Strawberry Matcha",
        price: 9.00,
        category: "matcha",
        image: "🍓",
        rating: 4.7,
        description: "Fresh strawberry and matcha combination. Sweet, refreshing, and perfect for spring.",
        season: [2], // Spring only
        caffeine: 60,
        popularity: 81
    }
];

/**
 * Season definitions for analytics
 */
export const seasons = {
    1: {
        name: "Winter",
        months: [12, 1, 2],
        emoji: "❄️",
        description: "Cozy season for hot drinks and comfort food"
    },
    2: {
        name: "Spring", 
        months: [3, 4, 5],
        emoji: "🌸",
        description: "Fresh and floral season with lighter flavors"
    },
    3: {
        name: "Summer",
        months: [6, 7, 8], 
        emoji: "☀️",
        description: "Refreshing iced drinks and cooling treats"
    },
    4: {
        name: "Fall",
        months: [9, 10, 11],
        emoji: "🍂", 
        description: "Warm spices and autumn-inspired flavors"
    }
};

/**
 * Application configuration
 */
export const appConfig = {
    businessHours: {
        open: 7,  // 7 AM
        close: 19 // 7 PM
    },
    taxRate: 0.085, // 8.5%
    currency: 'USD',
    currencySymbol: '$',
    businessName: 'Egghaus Social',
    analytics: {
        retentionDays: 365,
        topCustomersCount: 10,
        topProductsCount: 10,
        realtimeUpdateInterval: 30000 // 30 seconds
    },
    customerImages: {
        basePath: './egg/',
        fallbackEmoji: '🥚',
        supportedFormats: ['png', 'jpg', 'jpeg']
    },
    features: {
        realTimeUpdates: true,
        customerAvatars: true,
        seasonalAnalytics: true,
        prepTimeTracking: true
    }
};

/**
 * Customer avatar mapping (for the whimsical chart)
 * Maps customer names to their egg avatar files
 */
export const customerAvatars = {
    // Example mappings - these would be actual customer names
    "marco": "marco.png",
    "jenni": "jenni.png", 
    "jas": "jas.png",
    "martin": "martin.png",
    "eric": "eric.png",
    "rachel": "rachel.png",
};

/**
 * Analytics color palettes for charts
 */
export const chartColors = {
    primary: ['#d4af37', '#ffd700', '#b8860b', '#daa520'],
    secondary: ['#8d6e63', '#5d4037', '#3e2723'],
    whimsical: [
        '#FFD700', '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
    ],
    seasonal: {
        1: '#4A90E2', // Winter blue
        2: '#F5A623', // Spring yellow
        3: '#7ED321', // Summer green  
        4: '#D0021B'  // Fall red
    },
    status: {
        pending: '#ffd700',
        preparing: '#ff6b35', 
        ready: '#10b981',
        completed: '#6366f1',
        cancelled: '#ef4444'
    }
};

/**
 * Helper function to get current season
 */
export function getCurrentSeason() {
    const month = new Date().getMonth() + 1; // getMonth() returns 0-11
    
    for (const [seasonId, season] of Object.entries(seasons)) {
        if (season.months.includes(month)) {
            return parseInt(seasonId);
        }
    }
    return 2; // Default to spring
}

/**
 * Helper function to format customer name for image path
 */
export function formatCustomerImagePath(customerName) {
    return customerName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Helper function to get seasonal products
 */
export function getSeasonalProducts(seasonId = null) {
    const currentSeason = seasonId || getCurrentSeason();
    return products.filter(product => 
        product.season.includes(currentSeason)
    );
}

/**
 * Helper function to calculate product metrics
 */
export function getProductMetrics() {
    return products.map(product => ({
        ...product,
        expectedOrders: Math.round(product.popularity / 10), // Rough estimate
        seasonalBoost: product.season.includes(getCurrentSeason()) ? 1.2 : 1.0
    }));
}


/**
 * Get products filtered by season
 * @param {number} seasonId - Season ID to filter by
 * @returns {Array} Products available in the specified season
 */
export function getProductsBySeason(seasonId) {
    if (!seasonId) return products;
    
    return products.filter(product => 
        product.season && product.season.includes(seasonId)
    );
}

/**
 * Get season information by ID
 * @param {number} seasonId - Season ID
 * @returns {Object|null} Season information object
 */
export function getSeasonInfo(seasonId) {
    const season = seasons[seasonId];
    if (!season) return null;
    
    return {
        id: seasonId,
        name: season.name,
        subtitle: season.description || `${season.emoji} ${season.name} Collection`,
        emoji: season.emoji,
        months: season.months,
        description: season.description
    };
}

/**
 * Check if a name is on the guest list
 * @param {string} name - Name to check
 * @returns {boolean} True if on guest list
 */
export function isOnGuestList(name) {
    if (!name || typeof name !== 'string') return false;
    
    const normalizedName = name.trim();
    return guestList.some(guestName => 
        guestName.toLowerCase() === normalizedName.toLowerCase()
    );
}

/**
 * Get the complete guest list
 * @returns {Array} Array of guest names
 */
export function getGuestList() {
    return [...guestList]; // Return a copy to prevent mutation
}

/**
 * Get products by category within a specific season
 * @param {string} category - Category to filter by ('all', 'matcha', 'coffee', 'noms')
 * @param {number} seasonId - Season ID to filter by
 * @returns {Array} Filtered products
 */
export function getProductsByCategory(category, seasonId = null) {
    let filteredProducts = seasonId ? getProductsBySeason(seasonId) : products;
    
    if (category === 'all' || !category) {
        return filteredProducts;
    }
    
    return filteredProducts.filter(product => product.category === category);
}

/**
 * Search products by name or description within a season
 * @param {string} query - Search query
 * @param {number} seasonId - Season ID to search within
 * @returns {Array} Matching products
 */
export function searchProductsInSeason(query, seasonId = null) {
    if (!query || !query.trim()) {
        return seasonId ? getProductsBySeason(seasonId) : products;
    }
    
    const searchTerm = query.toLowerCase().trim();
    let searchableProducts = seasonId ? getProductsBySeason(seasonId) : products;
    
    return searchableProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
}

/**
 * Add a guest to the guest list (admin function)
 * @param {string} name - Name to add
 * @returns {boolean} Success status
 */
export function addToGuestList(name) {
    if (!name || typeof name !== 'string') return false;
    
    const normalizedName = name.trim();
    if (isOnGuestList(normalizedName)) {
        console.log(`${normalizedName} is already on the guest list`);
        return false;
    }
    
    guestList.push(normalizedName);
    console.log(`✅ Added ${normalizedName} to guest list`);
    return true;
}

/**
 * Remove a guest from the guest list (admin function)
 * @param {string} name - Name to remove
 * @returns {boolean} Success status
 */
export function removeFromGuestList(name) {
    if (!name || typeof name !== 'string') return false;
    
    const normalizedName = name.trim();
    const index = guestList.findIndex(guestName => 
        guestName.toLowerCase() === normalizedName.toLowerCase()
    );
    
    if (index === -1) {
        console.log(`${normalizedName} is not on the guest list`);
        return false;
    }
    
    guestList.splice(index, 1);
    console.log(`❌ Removed ${normalizedName} from guest list`);
    return true;
}

console.log('📊 Data configuration loaded successfully!');
console.log(`🏪 ${appConfig.businessName} - ${products.length} products available`);
console.log(`🗓️ Current season: ${seasons[getCurrentSeason()].name} ${seasons[getCurrentSeason()].emoji}`);
