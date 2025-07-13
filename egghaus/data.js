// ===================================
// EGGHAUS SOCIAL - PRODUCTS DATA
// ===================================

export const products = [
    // SEASON 1 & 2 CLASSICS
    {
        id: 1,
        name: "Iced Matcha Latte",
        price: 8.50,
        category: "matcha",
        image: "🍵",
        rating: 4.8,
        description: "Creamy iced matcha latte with premium ceremonial grade matcha and your choice of milk. Perfectly balanced and refreshing. Sourced from Agoshima, Japan",
        season: [1, 2] // Available in seasons 1 and 2
    },
    {
        id: 2,
        name: "Iced Yuzu Matcha",
        price: 9.00,
        category: "matcha",
        image: "🍋",
        rating: 4.7,
        description: "Unique fusion of earthy matcha and bright yuzu citrus served over ice. A refreshing twist on traditional matcha.",
        season: [1, 2, 3] // Available in all seasons
    },
    {
        id: 3,
        name: "Iced Hojicha",
        price: 7.50,
        category: "matcha",
        image: "🍂",
        rating: 4.6,
        description: "Smooth roasted green tea with a nutty, caramel-like flavor served cold. Less caffeine, more comfort.",
        season: [1, 2] // Classic offering
    },
    {
        id: 4,
        name: "Iced Coffee",
        price: 6.50,
        category: "coffee",
        image: "☕",
        rating: 4.5,
        description: "Classic japanese drip iced coffee, smooth and bold. Perfect for coffee lovers seeking a refreshing caffeine kick. Today's selection is a honey aponte columbian coffee from St. Kilda. Tasting notes: grapefruit, guava, white peach.",
        season: [1, 2, 3] // Coffee is eternal
    },
    
    // SEASON 1 ORIGINALS
    {
        id: 5,
        name: "Burnt Basque Cheesecake",
        price: 8.00,
        category: "noms",
        image: "🍰",
        rating: 4.9,
        description: "Rich, creamy cheesecake with a signature burnt top. Our most popular dessert with a perfectly caramelized exterior.",
        season: [1] // Season 1 exclusive
    },
    {
        id: 6,
        name: "Ube Cheesecake",
        price: 8.50,
        category: "noms",
        image: "💜",
        rating: 4.8,
        description: "Vibrant purple yam cheesecake with a smooth, velvety texture. A Filipino-inspired treat that's Instagram-worthy and delicious.",
        season: [1, 3] // Season 1 and 3
    },
    
    // SEASON 2 SPECIALS
    {
        id: 7,
        name: "Chocolate Ganache Tart",
        price: 7.50,
        category: "noms",
        image: "🍫",
        rating: 4.7,
        description: "Decadent chocolate tart with silky smooth ganache filling. Rich, indulgent, and perfect for chocolate lovers.",
        season: [2] // Season 2 exclusive
    },
    {
        id: 8,
        name: "Strawberry Matcha Parfait",
        price: 9.50,
        category: "noms",
        image: "🍓",
        rating: 4.6,
        description: "Layers of matcha mousse, fresh strawberries, and house-made granola. A perfect balance of sweet and earthy flavors.",
        season: [2, 3] // Season 2 and 3
    },
    {
        id: 9,
        name: "Bagels",
        price: 5.50,
        category: "noms",
        image: "🥯",
        rating: 4.4,
        description: "Freshly baked artisanal bagels. Choose from various flavors and enjoy with your favorite toppings.",
        season: [2, 3] // Available from season 2 onwards
    },
    
    // SEASON 3 INNOVATIONS
    {
        id: 10,
        name: "Cold Brew Matcha Float",
        price: 10.00,
        category: "matcha",
        image: "🧊",
        rating: 4.9,
        description: "Innovative cold brew matcha with vanilla ice cream float. A unique twist that's both refreshing and indulgent.",
        season: [3] // Season 3 exclusive
    },
    {
        id: 11,
        name: "Miso Caramel Latte",
        price: 8.75,
        category: "coffee",
        image: "🍯",
        rating: 4.8,
        description: "Bold espresso with house-made miso caramel syrup. Sweet, salty, and umami flavors in perfect harmony.",
        season: [3] // Season 3 exclusive
    },
    {
        id: 12,
        name: "Milk Bread French Toast",
        price: 12.00,
        category: "noms",
        image: "🍞",
        rating: 4.7,
        description: "Fluffy Japanese milk bread transformed into decadent French toast. Served with matcha butter and maple syrup.",
        season: [3] // Season 3 exclusive
    },
    {
        id: 13,
        name: "Seasonal Fruit Tart",
        price: 9.00,
        category: "noms",
        image: "🥧",
        rating: 4.5,
        description: "Beautiful tart featuring the best seasonal fruits on pastry cream. Changes with the seasons for peak freshness.",
        season: [3] // Season 3 exclusive
    },
    
    // CROSS-SEASON FAVORITES
    {
        id: 14,
        name: "Matcha Tiramisu",
        price: 9.25,
        category: "noms",
        image: "🍮",
        rating: 4.8,
        description: "Japanese twist on the Italian classic. Layers of matcha-soaked ladyfingers and mascarpone cream.",
        season: [1, 2, 3] // Popular across all seasons
    },
    {
        id: 15,
        name: "Sparkling Yuzu Lemonade",
        price: 6.75,
        category: "coffee", // Using coffee category for beverages
        image: "✨",
        rating: 4.6,
        description: "Refreshing sparkling water with fresh yuzu juice and a hint of honey. Perfect palate cleanser.",
        season: [2, 3] // Summer refreshment
    }
];

// ===================================
// SEASON INFORMATION
// ===================================

export const seasons = [
    {
        id: 1,
        name: "Season 1",
        subtitle: "Origins",
        description: "Where it all began - classic matcha and signature desserts"
    },
    {
        id: 2,
        name: "Season 2", 
        subtitle: "Evolution",
        description: "Expanded offerings with seasonal favorites and artisan breads"
    },
    {
        id: 3,
        name: "Season 3",
        subtitle: "Innovation", 
        description: "Bold new flavors and creative fusion creations"
    }
];

// ===================================
// GUEST LIST CONFIGURATION
// ===================================

export const guestList = [
    'jas',
    'martin',
    'sam',
    'eric',
    'jenni',
    'rachel',
    'marco',
    'tudi',
    'alaric'
];

// ===================================
// APP CONFIGURATION
// ===================================

export const appConfig = {
    // Default season when app loads
    defaultSeason: 2,
    
    // Profile image directory (relative path for GitHub Pages)
    profileImagePath: './eggs',
    
    // Tax rate for calculations
    taxRate: 0.085,
    
    // Order timing
    basePreparationTime: 8, // Base time in minutes
    timePerItem: 2, // Additional minutes per item
    
    // UI Settings
    maxNameLength: 20,
    searchDebounceTime: 300,
    
    // Animation durations
    modalAnimationTime: 300,
    notificationDuration: 3000,
    loadingSimulationTime: 800
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Get products for a specific season
 * @param {number} seasonId - Season ID (1, 2, or 3)
 * @returns {Array} Filtered products for that season
 */
export function getProductsBySeason(seasonId) {
    return products.filter(product => 
        product.season && product.season.includes(seasonId)
    );
}

/**
 * Get all available seasons for a product
 * @param {number} productId - Product ID
 * @returns {Array} Array of season objects
 */
export function getProductSeasons(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.season) return [];
    
    return seasons.filter(season => 
        product.season.includes(season.id)
    );
}

/**
 * Get season information
 * @param {number} seasonId - Season ID
 * @returns {Object} Season information
 */
export function getSeasonInfo(seasonId) {
    return seasons.find(season => season.id === seasonId);
}

/**
 * Check if user is on guest list
 * @param {string} name - User name to check
 * @returns {boolean} True if user is on guest list
 */
export function isOnGuestList(name) {
    return guestList.includes(name.toLowerCase().trim());
}

/**
 * Add user to guest list (for admin use)
 * @param {string} name - Name to add
 * @returns {boolean} True if added, false if already exists
 */
export function addToGuestList(name) {
    const cleanName = name.toLowerCase().trim();
    if (!guestList.includes(cleanName)) {
        guestList.push(cleanName);
        return true;
    }
    return false;
}

/**
 * Get guest list (for admin use)
 * @returns {Array} Current guest list
 */
export function getGuestList() {
    return [...guestList]; // Return copy to prevent external modification
}

/**
 * Get products by category within a season
 * @param {string} category - Product category
 * @param {number} seasonId - Season ID
 * @returns {Array} Filtered products
 */
export function getProductsByCategory(category, seasonId) {
    const seasonProducts = getProductsBySeason(seasonId);
    if (category === 'all') return seasonProducts;
    return seasonProducts.filter(product => product.category === category);
}

/**
 * Search products within a season
 * @param {string} query - Search query
 * @param {number} seasonId - Season ID
 * @returns {Array} Matching products
 */
export function searchProductsInSeason(query, seasonId) {
    const seasonProducts = getProductsBySeason(seasonId);
    const searchTerm = query.toLowerCase();
    return seasonProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
}

console.log('🥚 Egghaus Social product data loaded successfully!');
console.log(`📊 Total products: ${products.length}`);
console.log(`🎭 Available seasons: ${seasons.length}`);
console.log(`🎫 VIP guests: ${guestList.length}`);
