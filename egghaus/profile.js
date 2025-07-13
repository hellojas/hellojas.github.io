// ===================================
// EGGHAUS SOCIAL - PROFILE PAGE (FIREBASE INTEGRATION)
// ===================================

// Firebase imports
import { 
    collection, 
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// Data imports
import { 
    products, 
    seasons, 
    appConfig,
    getSeasonInfo
} from './data.js';

// ===================================
// GLOBAL VARIABLES
// ===================================
let currentUser = null;
let orderHistory = [];
let currentSeasonFilter = 'all';
let charts = {};
let isLoading = false;

// ===================================
// FIREBASE ORDER FETCHING
// ===================================

/**
 * Fetch orders from Firebase for the current user
 * @param {string} userName - User name to fetch orders for
 * @returns {Promise<Array>} Array of orders
 */
async function fetchOrdersFromFirebase(userName) {
    if (!db) {
        console.warn('Firebase not available, using local data only');
        return getLocalOrderHistory(userName);
    }

    try {
        console.log(`🔍 Fetching orders from Firebase for: ${userName}`);
        
        // Query orders by customer name (check both customer.name and customerInfo.name)
        const queries = [
            query(
                collection(db, 'orders'),
                where('customer.name', '==', userName),
                orderBy('createdAt', 'desc')
            ),
            query(
                collection(db, 'orders'),
                where('customerInfo.name', '==', userName),
                orderBy('createdAt', 'desc')
            )
        ];

        let allOrders = [];
        
        // Execute both queries to catch orders stored with either field structure
        for (const q of queries) {
            try {
                const querySnapshot = await getDocs(q);
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const order = {
                        id: doc.id,
                        orderId: data.orderId || doc.id,
                        date: data.createdAt?.toDate() || new Date(data.orderTime) || new Date(),
                        season: determineSeason(data),
                        items: data.items || [],
                        total: data.pricing?.total || data.total || 0,
                        status: data.status || 'completed',
                        instructions: data.instructions || '',
                        estimatedTime: data.estimatedTime || 15,
                        customerName: data.customer?.name || data.customerInfo?.name || userName
                    };
                    
                    // Avoid duplicates
                    if (!allOrders.find(existing => existing.id === order.id)) {
                        allOrders.push(order);
                    }
                });
            } catch (queryError) {
                console.warn('Query failed, trying alternative:', queryError.message);
            }
        }

        // Sort by date (newest first)
        allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`✅ Found ${allOrders.length} orders in Firebase for ${userName}`);
        return allOrders;
        
    } catch (error) {
        console.error('❌ Error fetching orders from Firebase:', error);
        
        // Fallback to local data
        console.log('📱 Falling back to local order history');
        return getLocalOrderHistory(userName);
    }
}

/**
 * Determine season based on order data and date
 * @param {Object} orderData - Order data from Firebase
 * @returns {number} Season number
 */
function determineSeason(orderData) {
    // If season is stored in the order data, use it
    if (orderData.season) {
        return orderData.season;
    }
    
    // Otherwise, determine based on order date
    const orderDate = orderData.createdAt?.toDate() || new Date(orderData.orderTime) || new Date();
    const year = orderDate.getFullYear();
    const month = orderDate.getMonth() + 1; // 0-indexed
    
    // Season determination logic (adjust these dates based on your actual seasons)
    if (year <= 2023 || (year === 2024 && month <= 3)) {
        return 1; // Season 1
    } else if (year === 2024 && month <= 9) {
        return 2; // Season 2
    } else {
        return 3; // Season 3 (current)
    }
}

/**
 * Get order history from localStorage as fallback
 * @param {string} userName - User name
 * @returns {Array} Local order history
 */
function getLocalOrderHistory(userName) {
    const historyKey = `orderHistory_${userName}`;
    const localOrders = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Convert date strings back to Date objects
    localOrders.forEach(order => {
        order.date = new Date(order.date);
    });
    
    console.log(`📱 Found ${localOrders.length} orders in localStorage for ${userName}`);
    return localOrders;
}

/**
 * Save order to localStorage (for future reference)
 * @param {string} userName - User name
 * @param {Array} orders - Orders to save
 */
function saveOrdersToLocal(userName, orders) {
    try {
        const historyKey = `orderHistory_${userName}`;
        localStorage.setItem(historyKey, JSON.stringify(orders));
        console.log(`💾 Saved ${orders.length} orders to localStorage for ${userName}`);
    } catch (error) {
        console.warn('Failed to save orders to localStorage:', error);
    }
}

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize profile page
 */
async function initializeProfile() {
    console.log('👤 Initializing profile page...');
    
    // Show loading state
    showLoadingState(true);
    
    // Get user info from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get('user') || localStorage.getItem('currentUserName') || 'Guest';
    
    currentUser = userName;
    
    // Set up profile display
    setupProfileDisplay();
    
    try {
        // Load user's order history from Firebase
        await loadOrderHistory();
        
        // Initialize charts if we have data
        if (orderHistory.length > 0) {
            initializeCharts();
        } else {
            showEmptyState();
        }
        
        console.log(`✅ Profile initialized for: ${currentUser}`);
        
    } catch (error) {
        console.error('❌ Error initializing profile:', error);
        showErrorState('Failed to load profile data');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Load order history from Firebase
 */
async function loadOrderHistory() {
    if (isLoading) return;
    
    isLoading = true;
    console.log(`📊 Loading order history for: ${currentUser}`);
    
    try {
        // Fetch orders from Firebase
        const orders = await fetchOrdersFromFirebase(currentUser);
        
        // Process orders to add missing data
        orderHistory = orders.map(order => {
            // Ensure items have caffeine data
            const processedItems = order.items.map(item => {
                const productData = products.find(p => p.name === item.name);
                return {
                    ...item,
                    productId: productData?.id || item.productId || 0,
                    caffeine: productData?.caffeine || estimateCaffeine(item.name) || 0
                };
            });
            
            return {
                ...order,
                items: processedItems
            };
        });
        
        // Save to localStorage as backup
        if (orderHistory.length > 0) {
            saveOrdersToLocal(currentUser, orderHistory);
        }
        
        // Display order history
        displayOrderHistory();
        
        // Update profile stats
        updateProfileStats();
        
        console.log(`📊 Loaded ${orderHistory.length} total orders for ${currentUser}`);
        
    } catch (error) {
        console.error('❌ Error loading order history:', error);
        
        // Try loading from localStorage as final fallback
        orderHistory = getLocalOrderHistory(currentUser);
        if (orderHistory.length > 0) {
            displayOrderHistory();
            updateProfileStats();
            console.log(`📱 Using ${orderHistory.length} local orders as fallback`);
        }
    } finally {
        isLoading = false;
    }
}

/**
 * Estimate caffeine content based on item name
 * @param {string} itemName - Name of the item
 * @returns {number} Estimated caffeine in mg
 */
function estimateCaffeine(itemName) {
    const lowerName = itemName.toLowerCase();
    
    if (lowerName.includes('coffee')) return 120;
    if (lowerName.includes('matcha')) return 70;
    if (lowerName.includes('hojicha')) return 30;
    if (lowerName.includes('chocolate')) return 15;
    
    return 0; // Default for food items
}

/**
 * Set up profile display
 */
function setupProfileDisplay() {
    const profileName = document.getElementById('profilePageName');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileAvatarImage = document.getElementById('profileAvatarImage');
    const profileAvatarFallback = document.getElementById('profileAvatarFallback');
    
    if (profileName) {
        profileName.textContent = currentUser;
    }
    
    // Set up profile image
    if (currentUser && currentUser !== 'Guest') {
        const imagePath = `${appConfig.profileImagePath}/${currentUser.toLowerCase()}.png`;
        
        profileAvatarImage.onload = function() {
            profileAvatarImage.style.display = 'block';
            profileAvatarFallback.style.display = 'none';
        };
        
        profileAvatarImage.onerror = function() {
            profileAvatarImage.style.display = 'none';
            profileAvatarFallback.style.display = 'flex';
            profileAvatarFallback.textContent = currentUser.charAt(0).toUpperCase();
        };
        
        profileAvatarImage.src = imagePath;
    } else {
        if (profileAvatarFallback) {
            profileAvatarFallback.textContent = currentUser.charAt(0).toUpperCase();
        }
    }
}

/**
 * Update profile statistics
 */
function updateProfileStats() {
    const totalOrders = orderHistory.length;
    const totalSpent = orderHistory
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total, 0);
    
    // Calculate favorite season
    const seasonCounts = {};
    orderHistory.forEach(order => {
        seasonCounts[order.season] = (seasonCounts[order.season] || 0) + 1;
    });
    
    const favoriteSeason = Object.keys(seasonCounts).reduce((a, b) => 
        seasonCounts[a] > seasonCounts[b] ? a : b, '2'
    );
    
    // Update UI
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalSpentEl = document.getElementById('totalSpent');
    const favoriteSeasonEl = document.getElementById('favoriteSeason');
    
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalSpentEl) totalSpentEl.textContent = `$${totalSpent.toFixed(0)}`;
    if (favoriteSeasonEl) favoriteSeasonEl.textContent = `S${favoriteSeason}`;
}

// ===================================
// ORDER HISTORY DISPLAY
// ===================================

/**
 * Display order history
 */
function displayOrderHistory() {
    const timeline = document.getElementById('ordersTimeline');
    const emptyState = document.getElementById('emptyOrders');
    
    if (!timeline) return;
    
    // Filter orders by current season filter
    let filteredOrders = orderHistory;
    if (currentSeasonFilter !== 'all') {
        filteredOrders = orderHistory.filter(order => order.season === parseInt(currentSeasonFilter));
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredOrders.length === 0) {
        timeline.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    timeline.style.display = 'flex';
    emptyState.style.display = 'none';
    timeline.innerHTML = '';
    
    filteredOrders.forEach(order => {
        const orderElement = createOrderElement(order);
        timeline.appendChild(orderElement);
    });
    
    console.log(`📋 Displayed ${filteredOrders.length} orders for season filter: ${currentSeasonFilter}`);
}

/**
 * Create order element for timeline
 */
function createOrderElement(order) {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    
    // Format date
    const dateStr = order.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    const timeStr = order.date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get season info
    const seasonInfo = getSeasonInfo(order.season);
    
    // Create items HTML
    const itemsHTML = order.items.map(item => `
        <div class="order-item-line">
            <div>
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">(${item.quantity}x)</span>
            </div>
            <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    // Status badge
    const statusBadge = order.status ? `
        <span class="order-status-badge status-${order.status}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
    ` : '';
    
    orderDiv.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">${order.orderId}</div>
                <div class="order-date">${dateStr} at ${timeStr}</div>
                ${statusBadge}
            </div>
            <div class="order-season">${seasonInfo ? seasonInfo.name : `Season ${order.season}`}</div>
        </div>
        <div class="order-items">
            ${itemsHTML}
        </div>
        <div class="order-total">
            Total: $${order.total.toFixed(2)}
        </div>
    `;
    
    return orderDiv;
}

// ===================================
// FILTERING
// ===================================

/**
 * Filter orders by season
 */
function filterOrdersBySeason(season) {
    currentSeasonFilter = season;
    
    // Update active tab
    document.querySelectorAll('.season-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-season="${season}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update display
    displayOrderHistory();
    
    console.log(`🎭 Filtered orders by season: ${season}`);
}

// ===================================
// CHARTS AND ANALYTICS
// ===================================

/**
 * Initialize all charts
 */
function initializeCharts() {
    if (orderHistory.length === 0) {
        showEmptyCharts();
        return;
    }
    
    console.log('📊 Initializing charts with Firebase data...');
    
    createCategoryChart();
    createTimeChart();
    createCaffeineChart();
    createSpendingChart();
}

/**
 * Create category breakdown chart
 */
function createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Calculate category data from real orders
    const categoryData = {};
    orderHistory.forEach(order => {
        order.items.forEach(item => {
            const product = products.find(p => p.name === item.name);
            let category = 'other';
            
            if (product) {
                category = product.category;
            } else {
                // Guess category from item name
                const itemName = item.name.toLowerCase();
                if (itemName.includes('coffee')) category = 'coffee';
                else if (itemName.includes('matcha') || itemName.includes('hojicha')) category = 'matcha';
                else if (itemName.includes('cake') || itemName.includes('tart') || itemName.includes('bread') || itemName.includes('bagel')) category = 'noms';
            }
            
            categoryData[category] = (categoryData[category] || 0) + item.quantity;
        });
    });
    
    if (Object.keys(categoryData).length === 0) {
        showEmptyChart(ctx, 'No category data available');
        return;
    }
    
    const labels = Object.keys(categoryData).map(cat => 
        cat.charAt(0).toUpperCase() + cat.slice(1)
    );
    const data = Object.values(categoryData);
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#d4af37',
                    '#8d6e63',
                    '#5d4037',
                    '#ffd700',
                    '#a7906a'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create ordering time patterns chart
 */
function createTimeChart() {
    const ctx = document.getElementById('timeChart');
    if (!ctx) return;
    
    // Calculate hourly data from real orders
    const hourlyData = new Array(24).fill(0);
    orderHistory.forEach(order => {
        const hour = order.date.getHours();
        hourlyData[hour]++;
    });
    
    const labels = Array.from({length: 24}, (_, i) => {
        const hour = i === 0 ? 12 : i <= 12 ? i : i - 12;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour}${period}`;
    });
    
    charts.time = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: hourlyData,
                backgroundColor: 'rgba(212, 175, 55, 0.7)',
                borderColor: '#d4af37',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45
                    }
                }
            }
        }
    });
}

/**
 * Create caffeine consumption chart
 */
function createCaffeineChart() {
    const ctx = document.getElementById('caffeineChart');
    if (!ctx) return;
    
    // Calculate monthly caffeine data from real orders
    const monthlyData = {};
    let totalCaffeine = 0;
    let totalOrders = 0;
    
    orderHistory.forEach(order => {
        const monthKey = `${order.date.getFullYear()}-${String(order.date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        
        order.items.forEach(item => {
            const caffeine = (item.caffeine || 0) * item.quantity;
            monthlyData[monthKey] += caffeine;
            totalCaffeine += caffeine;
        });
        totalOrders++;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    const data = sortedMonths.map(month => monthlyData[month]);
    
    if (labels.length === 0 || data.every(d => d === 0)) {
        showEmptyChart(ctx, 'No caffeine data available');
        
        // Still update stats with zeros
        document.getElementById('avgCaffeine').textContent = '0mg';
        document.getElementById('totalCaffeine').textContent = '0mg';
        return;
    }
    
    charts.caffeine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Caffeine (mg)',
                data: data,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#d4af37',
                pointBorderColor: '#5d4037',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Update caffeine stats
    const avgCaffeine = totalOrders > 0 ? totalCaffeine / totalOrders : 0;
    document.getElementById('avgCaffeine').textContent = `${Math.round(avgCaffeine)}mg`;
    document.getElementById('totalCaffeine').textContent = `${totalCaffeine}mg`;
}

/**
 * Create spending trends chart
 */
function createSpendingChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    
    // Sort orders by date and create cumulative spending
    const sortedOrders = [...orderHistory]
        .filter(order => order.status === 'completed' || !order.status) // Include completed orders
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sortedOrders.length === 0) {
        showEmptyChart(ctx, 'No spending data available');
        return;
    }
    
    let cumulativeSpending = 0;
    const spendingData = sortedOrders.map(order => {
        cumulativeSpending += order.total;
        return {
            x: order.date,
            y: cumulativeSpending
        };
    });
    
    charts.spending = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Total Spent ($)',
                data: spendingData,
                borderColor: '#5d4037',
                backgroundColor: 'rgba(93, 64, 55, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#5d4037',
                pointBorderColor: '#d4af37',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Show empty chart when no data
 */
function showEmptyChart(ctx, message) {
    const container = ctx.parentElement;
    container.innerHTML = `<div class="chart-loading">${message}</div>`;
}

/**
 * Show empty charts when no data
 */
function showEmptyCharts() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.innerHTML = '<div class="chart-loading">No data available yet</div>';
    });
    
    // Update caffeine stats to zero
    const avgCaffeineEl = document.getElementById('avgCaffeine');
    const totalCaffeineEl = document.getElementById('totalCaffeine');
    if (avgCaffeineEl) avgCaffeineEl.textContent = '0mg';
    if (totalCaffeineEl) totalCaffeineEl.textContent = '0mg';
}

// ===================================
// UI STATES
// ===================================

/**
 * Show loading state
 */
function showLoadingState(show) {
    const loadingElements = document.querySelectorAll('.chart-container, #ordersTimeline');
    
    loadingElements.forEach(element => {
        if (show) {
            element.innerHTML = '<div class="chart-loading">Loading your data...</div>';
        }
    });
    
    // Show spinner in profile stats
    if (show) {
        const statsElements = ['totalOrders', 'totalSpent', 'favoriteSeason'];
        statsElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '...';
        });
    }
}

/**
 * Show empty state when no orders
 */
function showEmptyState() {
    console.log('📭 Showing empty state - no orders found');
    
    showEmptyCharts();
    
    const timeline = document.getElementById('ordersTimeline');
    const emptyState = document.getElementById('emptyOrders');
    
    if (timeline) timeline.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
}

/**
 * Show error state
 */
function showErrorState(message) {
    console.error('❌ Showing error state:', message);
    
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(container => {
        container.innerHTML = `<div class="chart-loading">Error: ${message}</div>`;
    });
}

// ===================================
// NAVIGATION & ACTIONS
// ===================================

/**
 * Go back to menu
 */
function goBackToMenu() {
    // Pass the current user back to the main app
    if (currentUser && currentUser !== 'Guest') {
        localStorage.setItem('currentUserName', currentUser);
        window.location.href = `order.html?user=${encodeURIComponent(currentUser)}`;
    } else {
        window.location.href = 'order.html';
    }
}

/**
 * Export order history from Firebase
 */
function exportOrderHistory() {
    if (orderHistory.length === 0) {
        alert('No order history to export!');
        return;
    }
    
    const exportData = {
        user: currentUser,
        exportDate: new Date().toISOString(),
        source: 'firebase',
        orderHistory: orderHistory,
        statistics: {
            totalOrders: orderHistory.length,
            completedOrders: orderHistory.filter(o => o.status === 'completed').length,
            totalSpent: orderHistory
                .filter(order => order.status === 'completed' || !order.status)
                .reduce((sum, order) => sum + order.total, 0),
            avgOrderValue: orderHistory.length > 0 ? 
                orderHistory.reduce((sum, order) => sum + order.total, 0) / orderHistory.length : 0,
            totalCaffeine: orderHistory.reduce((sum, order) => 
                sum + order.items.reduce((itemSum, item) => 
                    itemSum + ((item.caffeine || 0) * item.quantity), 0), 0),
            favoriteCategory: calculateFavoriteCategory(),
            ordersByStatus: calculateOrdersByStatus(),
            seasonBreakdown: calculateSeasonBreakdown()
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `egghaus-${currentUser.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('📤 Firebase order history exported');
}

/**
 * Calculate favorite category for export
 */
function calculateFavoriteCategory() {
    const categoryCount = {};
    orderHistory.forEach(order => {
        order.items.forEach(item => {
            const product = products.find(p => p.name === item.name);
            const category = product?.category || 'other';
            categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
        });
    });
    
    return Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, 'none'
    );
}

/**
 * Calculate orders by status for export
 */
function calculateOrdersByStatus() {
    const statusCount = {};
    orderHistory.forEach(order => {
        const status = order.status || 'completed';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return statusCount;
}

/**
 * Calculate season breakdown for export
 */
function calculateSeasonBreakdown() {
    const seasonCount = {};
    orderHistory.forEach(order => {
        seasonCount[order.season] = (seasonCount[order.season] || 0) + 1;
    });
    return seasonCount;
}

/**
 * Clear order history (Firebase + localStorage)
 */
function clearOrderHistory() {
    const confirmMessage = `Are you sure you want to clear all order history for ${currentUser}?\n\nThis will:\n- Clear local storage data\n- Reset all charts and statistics\n\nNote: Firebase orders will remain in the database but won't be shown here.\n\nThis cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        // Clear localStorage
        const historyKey = `orderHistory_${currentUser}`;
        localStorage.removeItem(historyKey);
        
        // Clear current session
        orderHistory = [];
        
        // Refresh displays
        displayOrderHistory();
        updateProfileStats();
        
        // Destroy existing charts
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        charts = {};
        
        // Show empty state
        showEmptyState();
        
        console.log('🗑️ Order history cleared from localStorage and session');
        alert('Order history has been cleared from this device.');
    }
}

/**
 * Refresh data from Firebase
 */
async function refreshFromFirebase() {
    console.log('🔄 Refreshing data from Firebase...');
    
    showLoadingState(true);
    
    try {
        await loadOrderHistory();
        
        // Destroy and recreate charts
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        charts = {};
        
        if (orderHistory.length > 0) {
            initializeCharts();
        } else {
            showEmptyState();
        }
        
        // Show success message
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
        `;
        notification.textContent = '✅ Data refreshed from Firebase!';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
        
    } catch (error) {
        console.error('❌ Error refreshing from Firebase:', error);
        alert('Failed to refresh data from Firebase. Please try again.');
    } finally {
        showLoadingState(false);
    }
}

// ===================================
// GLOBAL FUNCTION EXPOSURE
// ===================================

window.filterOrdersBySeason = filterOrdersBySeason;
window.goBackToMenu = goBackToMenu;
window.exportOrderHistory = exportOrderHistory;
window.clearOrderHistory = clearOrderHistory;
window.refreshFromFirebase = refreshFromFirebase;

// ===================================
// INITIALIZATION ON LOAD
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Profile page loaded');
    initializeProfile();
});

// ===================================
// REAL-TIME UPDATES (OPTIONAL)
// ===================================

/**
 * Set up real-time Firebase listener for new orders
 */
function setupRealtimeUpdates() {
    if (!db || !currentUser) return;
    
    console.log('📡 Setting up real-time updates for profile...');
    
    try {
        const q = query(
            collection(db, 'orders'),
            where('customer.name', '==', currentUser)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('🔄 Real-time update received');
            
            // Only refresh if there are actual changes
            if (!snapshot.empty) {
                loadOrderHistory().then(() => {
                    if (orderHistory.length > 0) {
                        // Update charts without full reload
                        Object.values(charts).forEach(chart => {
                            if (chart && typeof chart.destroy === 'function') {
                                chart.destroy();
                            }
                        });
                        charts = {};
                        initializeCharts();
                    }
                });
            }
        });
        
        // Store unsubscribe function for cleanup
        window.profileRealtimeUnsubscribe = unsubscribe;
        
    } catch (error) {
        console.warn('Could not set up real-time updates:', error);
    }
}

// Clean up real-time listener on page unload
window.addEventListener('beforeunload', () => {
    if (window.profileRealtimeUnsubscribe) {
        window.profileRealtimeUnsubscribe();
    }
});

console.log('👤 Profile script loaded successfully with Firebase integration!');
