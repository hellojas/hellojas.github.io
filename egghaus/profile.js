// ===================================
// EGGHAUS SOCIAL - PROFILE PAGE
// ===================================

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

// ===================================
// MOCK ORDER HISTORY DATA
// ===================================

// Generate realistic order history for demonstration
function generateMockOrderHistory(userName) {
    const mockOrders = [
        // Season 1 Orders
        {
            id: 'EH240115001',
            date: new Date('2024-01-15T14:30:00'),
            season: 1,
            items: [
                { productId: 1, name: 'Iced Matcha Latte', quantity: 2, price: 8.50, caffeine: 70 },
                { productId: 5, name: 'Burnt Basque Cheesecake', quantity: 1, price: 8.00, caffeine: 0 }
            ],
            total: 25.00,
            status: 'completed'
        },
        {
            id: 'EH240220002',
            date: new Date('2024-02-20T09:15:00'),
            season: 1,
            items: [
                { productId: 4, name: 'Iced Coffee', quantity: 1, price: 6.50, caffeine: 120 },
                { productId: 6, name: 'Ube Cheesecake', quantity: 1, price: 8.50, caffeine: 0 }
            ],
            total: 15.00,
            status: 'completed'
        },
        {
            id: 'EH240305003',
            date: new Date('2024-03-05T16:45:00'),
            season: 1,
            items: [
                { productId: 14, name: 'Matcha Tiramisu', quantity: 1, price: 9.25, caffeine: 45 }
            ],
            total: 9.25,
            status: 'completed'
        },
        
        // Season 2 Orders
        {
            id: 'EH240420004',
            date: new Date('2024-04-20T11:30:00'),
            season: 2,
            items: [
                { productId: 2, name: 'Iced Yuzu Matcha', quantity: 1, price: 9.00, caffeine: 65 },
                { productId: 7, name: 'Chocolate Ganache Tart', quantity: 1, price: 7.50, caffeine: 15 }
            ],
            total: 16.50,
            status: 'completed'
        },
        {
            id: 'EH240515005',
            date: new Date('2024-05-15T13:20:00'),
            season: 2,
            items: [
                { productId: 8, name: 'Strawberry Matcha Parfait', quantity: 2, price: 9.50, caffeine: 35 },
                { productId: 9, name: 'Bagels', quantity: 1, price: 5.50, caffeine: 0 }
            ],
            total: 24.50,
            status: 'completed'
        },
        {
            id: 'EH240618006',
            date: new Date('2024-06-18T15:10:00'),
            season: 2,
            items: [
                { productId: 1, name: 'Iced Matcha Latte', quantity: 1, price: 8.50, caffeine: 70 },
                { productId: 15, name: 'Sparkling Yuzu Lemonade', quantity: 1, price: 6.75, caffeine: 0 }
            ],
            total: 15.25,
            status: 'completed'
        },
        
        // Season 3 Orders (Recent)
        {
            id: 'EH240710007',
            date: new Date('2024-07-10T10:45:00'),
            season: 3,
            items: [
                { productId: 10, name: 'Cold Brew Matcha Float', quantity: 1, price: 10.00, caffeine: 85 },
                { productId: 12, name: 'Milk Bread French Toast', quantity: 1, price: 12.00, caffeine: 20 }
            ],
            total: 22.00,
            status: 'completed'
        },
        {
            id: 'EH240803008',
            date: new Date('2024-08-03T14:20:00'),
            season: 3,
            items: [
                { productId: 11, name: 'Miso Caramel Latte', quantity: 2, price: 8.75, caffeine: 150 }
            ],
            total: 17.50,
            status: 'completed'
        },
        {
            id: 'EH241205009',
            date: new Date('2024-12-05T12:30:00'),
            season: 3,
            items: [
                { productId: 13, name: 'Seasonal Fruit Tart', quantity: 1, price: 9.00, caffeine: 0 },
                { productId: 6, name: 'Ube Cheesecake', quantity: 1, price: 8.50, caffeine: 0 },
                { productId: 4, name: 'Iced Coffee', quantity: 1, price: 6.50, caffeine: 120 }
            ],
            total: 24.00,
            status: 'completed'
        }
    ];
    
    return mockOrders;
}

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize profile page
 */
function initializeProfile() {
    console.log('👤 Initializing profile page...');
    
    // Get user info from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get('user') || localStorage.getItem('currentUserName') || 'Guest';
    
    currentUser = userName;
    
    // Load user's order history
    loadOrderHistory();
    
    // Set up profile display
    setupProfileDisplay();
    
    // Initialize charts
    initializeCharts();
    
    console.log(`✅ Profile initialized for: ${currentUser}`);
}

/**
 * Load order history (real + mock data for demo)
 */
function loadOrderHistory() {
    // Load real orders from localStorage
    const historyKey = `orderHistory_${currentUser}`;
    const realOrders = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Convert date strings back to Date objects
    realOrders.forEach(order => {
        order.date = new Date(order.date);
    });
    
    // Generate mock data for demonstration (you can remove this in production)
    const mockOrders = generateMockOrderHistory(currentUser);
    
    // Combine real and mock orders, prioritize real orders
    orderHistory = [...realOrders, ...mockOrders];
    
    console.log(`📊 Loaded ${realOrders.length} real orders and ${mockOrders.length} demo orders for ${currentUser}`);
    
    // Display order history
    displayOrderHistory();
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
    }
    
    // Update profile stats
    updateProfileStats();
}

/**
 * Update profile statistics
 */
function updateProfileStats() {
    const totalOrders = orderHistory.length;
    const totalSpent = orderHistory.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate favorite season
    const seasonCounts = {};
    orderHistory.forEach(order => {
        seasonCounts[order.season] = (seasonCounts[order.season] || 0) + 1;
    });
    
    const favoriteSeason = Object.keys(seasonCounts).reduce((a, b) => 
        seasonCounts[a] > seasonCounts[b] ? a : b, '1'
    );
    
    // Update UI
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(0)}`;
    document.getElementById('favoriteSeason').textContent = `S${favoriteSeason}`;
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
    
    orderDiv.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">${order.id}</div>
                <div class="order-date">${dateStr} at ${timeStr}</div>
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
    
    // Calculate category data
    const categoryData = {};
    orderHistory.forEach(order => {
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const category = product.category === 'coffee' ? 'beverages' : product.category;
                categoryData[category] = (categoryData[category] || 0) + item.quantity;
            }
        });
    });
    
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
    
    // Calculate hourly data
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
    
    // Calculate monthly caffeine data
    const monthlyData = {};
    let totalCaffeine = 0;
    let totalOrders = 0;
    
    orderHistory.forEach(order => {
        const monthKey = `${order.date.getFullYear()}-${order.date.getMonth() + 1}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        
        order.items.forEach(item => {
            const caffeine = item.caffeine * item.quantity;
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
    const sortedOrders = [...orderHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
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
 * Show empty charts when no data
 */
function showEmptyCharts() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.innerHTML = '<div class="chart-loading">No data available yet</div>';
    });
}

// ===================================
// NAVIGATION & ACTIONS
// ===================================

/**
 * Go back to menu
 */
function goBackToMenu() {
    window.location.href = 'order.html';
}

/**
 * Export order history
 */
function exportOrderHistory() {
    const exportData = {
        user: currentUser,
        exportDate: new Date().toISOString(),
        orderHistory: orderHistory,
        statistics: {
            totalOrders: orderHistory.length,
            totalSpent: orderHistory.reduce((sum, order) => sum + order.total, 0),
            avgOrderValue: orderHistory.length > 0 ? orderHistory.reduce((sum, order) => sum + order.total, 0) / orderHistory.length : 0,
            totalCaffeine: orderHistory.reduce((sum, order) => 
                sum + order.items.reduce((itemSum, item) => itemSum + (item.caffeine * item.quantity), 0), 0
            )
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `egghaus-${currentUser.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('📤 Order history exported');
}

/**
 * Clear order history
 */
function clearOrderHistory() {
    if (confirm('Are you sure you want to clear your order history? This cannot be undone.')) {
        // Clear both localStorage and current session
        const historyKey = `orderHistory_${currentUser}`;
        localStorage.removeItem(historyKey);
        orderHistory = [];
        
        // Refresh displays
        displayOrderHistory();
        updateProfileStats();
        
        // Destroy existing charts
        Object.values(charts).forEach(chart => chart.destroy());
        charts = {};
        
        // Show empty charts
        showEmptyCharts();
        
        console.log('🗑️ Order history cleared from localStorage and session');
    }
}

// ===================================
// GLOBAL FUNCTION EXPOSURE
// ===================================

window.filterOrdersBySeason = filterOrdersBySeason;
window.goBackToMenu = goBackToMenu;
window.exportOrderHistory = exportOrderHistory;
window.clearOrderHistory = clearOrderHistory;

// ===================================
// INITIALIZATION ON LOAD
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Profile page loaded');
    initializeProfile();
});

console.log('👤 Profile script loaded successfully!');
