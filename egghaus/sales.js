// ===================================
// EGGHAUS SOCIAL - SALES ANALYTICS DASHBOARD - CLEANED
// ===================================

// Firebase imports
import { 
    collection, 
    query,
    orderBy,
    where,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// ===================================
// DATA LOADING FROM DATA.JS
// ===================================
let products = [];
let seasons = {};

/**
 * Load product and season data from data.js
 */
async function loadDataFromFile() {
    try {
        const dataModule = await import('./data.js');
        products = dataModule.products || [];
        seasons = dataModule.seasons || {};
        console.log('✅ Loaded data from data.js:', { 
            products: products.length, 
            seasons: Object.keys(seasons).length 
        });
        return true;
    } catch (error) {
        console.warn('⚠️ Could not load data.js, using fallback data:', error);
        
        // Fallback product data with seasons
        products = [
            { id: 1, name: "Iced Matcha Latte", category: "matcha", season: [2], caffeine: 70 },
            { id: 2, name: "Iced Yuzu Matcha", category: "matcha", season: [2], caffeine: 70 },
            { id: 3, name: "Iced Hojicha", category: "matcha", season: [2], caffeine: 35 },
            { id: 4, name: "Iced Coffee", category: "coffee", season: [2], caffeine: 150 },
            { id: 5, name: "Burnt Basque Cheesecake", category: "noms", season: [2], caffeine: 0 },
            { id: 6, name: "Ube Cheesecake", category: "noms", season: [2], caffeine: 0 },
            { id: 7, name: "Chocolate Ganache Tart", category: "noms", season: [2], caffeine: 5 },
            { id: 8, name: "Bagels", category: "noms", season: [2], caffeine: 0 },
            { id: 9, name: "Milk Bread", category: "noms", season: [2], caffeine: 0 }
        ];
        
        seasons = {
            1: { name: "Season 1", theme: "Spring", color: "#96CEB4" },
            2: { name: "Season 2", theme: "Summer", color: "#d4af37" },
            3: { name: "Season 3", theme: "Autumn", color: "#8d6e63" },
            4: { name: "Season 4", theme: "Winter", color: "#5d4037" }
        };
        
        return false;
    }
}

// ===================================
// GLOBAL VARIABLES
// ===================================
let allOrders = [];
let filteredOrders = [];
let currentTimePeriod = 'today';
let charts = {};
let salesListener = null;
let isLoading = false;

// ===================================
// CHART CLEANUP UTILITIES
// ===================================

/**
 * Safely destroy existing chart and clean up canvas
 */
function destroyExistingChart(chartKey, canvasId) {
    if (charts[chartKey]) {
        try {
            charts[chartKey].destroy();
        } catch (error) {
            console.warn(`Warning destroying chart ${chartKey}:`, error);
        }
        delete charts[chartKey];
    }
    
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        try {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        } catch (error) {
            // Ignore errors here
        }
    }
}

/**
 * Enhanced chart destruction with waiting periods
 */
async function destroyExistingChartAsync(chartKey, canvasId) {
    console.log(`🧹 Async destroying chart: ${chartKey} (${canvasId})`);
    
    // First attempt
    destroyExistingChart(chartKey, canvasId);
    
    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Double-check and clean again if needed
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        try {
            const stillExisting = Chart.getChart(canvas);
            if (stillExisting) {
                console.log(`⚠️ Chart still exists after first cleanup, destroying again...`);
                stillExisting.destroy();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.warn(`⚠️ Second cleanup attempt failed:`, error);
        }
    }
    
    console.log(`✅ Async chart cleanup completed for ${chartKey}`);
}

/**
 * Destroy all existing charts safely with async approach
 */
function destroyAllCharts() {
    console.log('🧹 Cleaning up existing charts...');
    
    const chartConfigs = [
        { key: 'revenue', canvasId: 'revenueChart' },
        { key: 'popularity', canvasId: 'popularityChart' },
        { key: 'hourly', canvasId: 'hourlyChart' },
        { key: 'category', canvasId: 'categoryChart' },
        { key: 'prepTime', canvasId: 'prepTimeChart' },
        { key: 'customer', canvasId: 'customerChart' },
        { key: 'customerSpenders', canvasId: 'customerSpendersChart' },
        { key: 'status', canvasId: 'statusChart' },
        { key: 'seasonal', canvasId: 'seasonalChart' },
        { key: 'metrics', canvasId: 'metricsChart' },
        { key: 'daily', canvasId: 'dailyChart' }
    ];
    
    chartConfigs.forEach(({ key, canvasId }) => {
        destroyExistingChart(key, canvasId);
    });
    
    charts = {};
    console.log('✅ Chart cleanup completed');
}


// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize sales dashboard
 */
async function initializeSalesDashboard() {
    console.log('📊 Initializing sales analytics dashboard...');
    
    try {
        showLoading(true);
        
        // Simple cleanup
        destroyAllCharts();
        
        // Load data
        await loadDataFromFile();
        await loadOrdersData();
        filterOrdersByTimePeriod(currentTimePeriod);
        
        // Initialize charts
        await initializeAllCharts();
        generateDetailedTables();
        setupRealtimeUpdates();
        updateOverviewStats();
        
        console.log('✅ Sales dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing sales dashboard:', error);
        showError('Failed to load sales data');
    } finally {
        showLoading(false);
    }
}

/**
 * Load orders data from Firebase
 */
async function loadOrdersData() {
    if (!db) {
        throw new Error('Firebase not available');
    }
    
    console.log('📊 Loading orders data from Firebase...');
    
    try {
        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        allOrders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const order = processOrderData(doc.id, data);
            if (order) {
                allOrders.push(order);
            }
        });
        
        console.log(`📊 Loaded ${allOrders.length} orders for sales analysis`);
        
    } catch (error) {
        console.error('❌ Error loading orders data:', error);
        throw error;
    }
}

/**
 * Process raw order data for analytics with proper season mapping
 */
function processOrderData(docId, data) {
    try {
        const createdAt = data.createdAt?.toDate() || new Date(data.orderTime) || new Date();
        const readyAt = data.readyAt?.toDate();
        const completedAt = data.completedAt?.toDate();
        
        let prepTime = null;
        if (readyAt && createdAt) {
            prepTime = Math.round((readyAt - createdAt) / (1000 * 60));
        }
        
        // Map items with product data from data.js
        const items = (data.items || []).map(item => {
            const productData = products.find(p => 
                p.name.toLowerCase() === item.name.toLowerCase() || 
                p.id === item.productId
            );
            
            return {
                ...item,
                productId: productData?.id || 0,
                category: productData?.category || 'unknown',
                season: productData?.season || [2], // Default to season 2
                caffeine: productData?.caffeine || 0
            };
        });
        
        // Calculate dominant season for this order based on items and quantities
        const seasonCounts = {};
        items.forEach(item => {
            (item.season || [2]).forEach(seasonId => {
                seasonCounts[seasonId] = (seasonCounts[seasonId] || 0) + item.quantity;
            });
        });
        
        // Find the season with the most items in this order
        const dominantSeasonId = Object.keys(seasonCounts).reduce((a, b) => 
            seasonCounts[a] > seasonCounts[b] ? a : b, '2'
        );
        
        return {
            id: docId,
            orderId: data.orderId || docId,
            customerName: data.customer?.name || data.customerInfo?.name || 'Unknown',
            status: data.status || 'completed',
            items: items,
            subtotal: data.pricing?.subtotal || data.subtotal || 0,
            tax: data.pricing?.tax || data.tax || 0,
            total: data.pricing?.total || data.total || 0,
            createdAt: createdAt,
            readyAt: readyAt,
            completedAt: completedAt,
            prepTime: prepTime,
            estimatedTime: data.estimatedTime || 15,
            instructions: data.instructions || '',
            season: parseInt(dominantSeasonId), // Store as number
            seasonName: seasons[dominantSeasonId]?.name || `Season ${dominantSeasonId}`,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            categoryBreakdown: calculateCategoryBreakdown(items),
            totalCaffeine: items.reduce((sum, item) => sum + (item.caffeine * item.quantity), 0),
            orderHour: createdAt.getHours(),
            orderDay: createdAt.getDay(),
            orderDate: createdAt.toDateString()
        };
    } catch (error) {
        console.warn('Error processing order:', docId, error);
        return null;
    }
}

/**
 * Calculate category breakdown for an order
 */
function calculateCategoryBreakdown(items) {
    const breakdown = {};
    items.forEach(item => {
        const category = item.category || 'unknown';
        breakdown[category] = (breakdown[category] || 0) + (item.price * item.quantity);
    });
    return breakdown;
}

// ===================================
// TIME FILTERING
// ===================================

/**
 * Filter orders by time period
 */
function filterOrdersByTimePeriod(period) {
    currentTimePeriod = period;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'all':
        default:
            startDate = new Date('2020-01-01');
            break;
    }
    
    filteredOrders = allOrders.filter(order => order.createdAt >= startDate);
    
    console.log(`📊 Filtered to ${filteredOrders.length} orders for period: ${period}`);
    
    // Update active filter button
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-period="${period}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    updateAllAnalytics();
}

/**
 * Update all analytics when data changes
 */
async function updateAllAnalytics() {
    try {
        showLoading(true);
        
        // Simple cleanup
        destroyAllCharts();
        
        // Short wait
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Re-initialize
        await initializeAllCharts();
        generateDetailedTables();
        updateOverviewStats();
        
    } catch (error) {
        console.error('❌ Error updating analytics:', error);
        showError('Failed to update analytics');
    } finally {
        showLoading(false);
    }
}

// ===================================
// CHART INITIALIZATION
// ===================================

/**
 * Initialize all charts with proper error handling
 */
async function initializeAllCharts() {
    console.log('📊 Initializing all charts...');
    
    // Short wait for DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const chartInitializers = [
        { name: 'Revenue', fn: createRevenueChart },
        { name: 'Popularity', fn: createPopularityChart },
        { name: 'Hourly', fn: createHourlyChart },
        { name: 'Category', fn: createCategoryChart },
        { name: 'Prep Time', fn: createPrepTimeChart },
        { name: 'Customer', fn: createCustomerChart },
        { name: 'Customer Spenders', fn: createCustomerSpendersChart },
        { name: 'Status', fn: createStatusChart },
        { name: 'Seasonal', fn: createSeasonalChart },
        { name: 'Metrics', fn: createMetricsChart },
        { name: 'Daily', fn: createDailyChart }
    ];
    
    for (const { name, fn } of chartInitializers) {
        try {
            await fn();
            console.log(`✅ ${name} chart initialized`);
        } catch (error) {
            console.error(`❌ Error initializing ${name} chart:`, error);
        }
    }
    
    console.log('✅ Chart initialization completed');
}


/**
 * Create revenue trends chart
 */
async function createRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    
    destroyExistingChart('revenue', 'revenueChart');
    const ctx = canvas.getContext('2d');
    
    const dailyRevenue = {};
    filteredOrders.forEach(order => {
        if (order.status === 'completed' || !order.status) {
            const dateKey = order.orderDate;
            dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.total;
        }
    });
    
    const sortedDates = Object.keys(dailyRevenue).sort();
    const labels = sortedDates.map(date => new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    }));
    const data = sortedDates.map(date => dailyRevenue[date]);
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue',
                data: data,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#d4af37',
                pointBorderColor: '#5d4037',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
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
 * Create product popularity chart
 */
async function createPopularityChart() {
    const canvas = document.getElementById('popularityChart');
    if (!canvas) return;
    
    destroyExistingChart('popularity', 'popularityChart');
    const ctx = canvas.getContext('2d');
    
    const productCounts = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
    });
    
    const sortedProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
    
    const labels = sortedProducts.map(([name]) => name);
    const data = sortedProducts.map(([,count]) => count);
    
    charts.popularity = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#d4af37', '#8d6e63', '#5d4037', '#ffd700',
                    '#a7906a', '#b8860b', '#cd853f', '#daa520'
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
                        padding: 15,
                        font: { family: 'Inter', size: 11 }
                    }
                }
            }
        }
    });
}

/**
 * Create hourly sales pattern chart
 */
async function createHourlyChart() {
    const canvas = document.getElementById('hourlyChart');
    if (!canvas) return;
    
    destroyExistingChart('hourly', 'hourlyChart');
    const ctx = canvas.getContext('2d');
    
    const hourlyData = new Array(24).fill(0);
    filteredOrders.forEach(order => {
        hourlyData[order.orderHour]++;
    });
    
    const labels = Array.from({length: 24}, (_, i) => {
        const hour = i === 0 ? 12 : i <= 12 ? i : i - 12;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour}${period}`;
    });
    
    charts.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders per Hour',
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
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { ticks: { maxRotation: 45 } }
            }
        }
    });
}

/**
 * Create category performance chart
 */
async function createCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    destroyExistingChart('category', 'categoryChart');
    const ctx = canvas.getContext('2d');
    
    const categoryRevenue = {};
    filteredOrders.forEach(order => {
        Object.entries(order.categoryBreakdown).forEach(([category, revenue]) => {
            categoryRevenue[category] = (categoryRevenue[category] || 0) + revenue;
        });
    });
    
    const labels = Object.keys(categoryRevenue).map(cat => 
        cat.charAt(0).toUpperCase() + cat.slice(1)
    );
    const data = Object.values(categoryRevenue);
    
    charts.category = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(212, 175, 55, 0.7)',
                    'rgba(141, 110, 99, 0.7)',
                    'rgba(93, 64, 55, 0.7)',
                    'rgba(255, 215, 0, 0.7)'
                ],
                borderColor: [
                    '#d4af37', '#8d6e63', '#5d4037', '#ffd700'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 11 } }
                }
            }
        }
    });
}

/**
 * Create preparation times chart
 */
async function createPrepTimeChart() {
    const canvas = document.getElementById('prepTimeChart');
    if (!canvas) {
        console.warn('prepTimeChart canvas not found');
        return;
    }
    
    destroyExistingChart('prepTime', 'prepTimeChart');
    const ctx = canvas.getContext('2d');
    
    // Get orders with actual preparation time data
    const ordersWithPrepTime = filteredOrders.filter(order => {
        return order.prepTime !== null && 
               order.prepTime !== undefined && 
               typeof order.prepTime === 'number' && 
               order.prepTime > 0;
    });
    
    console.log(`📊 Preparation times: Found ${ordersWithPrepTime.length} orders with prep time data out of ${filteredOrders.length} total orders`);
    
    if (ordersWithPrepTime.length === 0) {
        // Create a simulated chart for demonstration if no real data
        console.log('⚠️ No real prep time data, creating simulated data for demonstration');
        
        // Use estimated times from orders instead
        const simulatedPrepTimes = filteredOrders.map(order => {
            // Simulate prep time based on number of items and complexity
            const baseTime = 5; // 5 minutes base
            const itemComplexity = order.items ? order.items.length * 2 : 3; // 2 minutes per item
            const randomVariation = Math.floor(Math.random() * 6) - 3; // ±3 minutes
            return Math.max(2, baseTime + itemComplexity + randomVariation);
        });
        
        const prepTimeRanges = {
            '0-5 min': 0,
            '6-10 min': 0,
            '11-15 min': 0,
            '16-20 min': 0,
            '21-30 min': 0,
            '30+ min': 0
        };
        
        simulatedPrepTimes.forEach(time => {
            if (time <= 5) prepTimeRanges['0-5 min']++;
            else if (time <= 10) prepTimeRanges['6-10 min']++;
            else if (time <= 15) prepTimeRanges['11-15 min']++;
            else if (time <= 20) prepTimeRanges['16-20 min']++;
            else if (time <= 30) prepTimeRanges['21-30 min']++;
            else prepTimeRanges['30+ min']++;
        });
        
        // Update stats with simulated data
        const fastest = Math.min(...simulatedPrepTimes);
        const slowest = Math.max(...simulatedPrepTimes);
        
        const fastestEl = document.getElementById('fastestOrder');
        const slowestEl = document.getElementById('slowestOrder');
        if (fastestEl) fastestEl.textContent = `${fastest}min`;
        if (slowestEl) slowestEl.textContent = `${slowest}min`;
        
        // Create chart with simulated data
        charts.prepTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(prepTimeRanges),
                datasets: [{
                    label: 'Number of Orders (Estimated)',
                    data: Object.values(prepTimeRanges),
                    backgroundColor: 'rgba(93, 64, 55, 0.7)',
                    borderColor: '#5d4037',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true,
                        labels: {
                            color: '#8d6e63',
                            font: { family: 'Inter', size: 11 }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            stepSize: 1,
                            color: '#8d6e63',
                            font: { family: 'Inter' }
                        },
                        grid: { color: 'rgba(212, 175, 55, 0.2)' }
                    },
                    x: {
                        ticks: {
                            color: '#5d4037',
                            font: { family: 'Inter', weight: '600' }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
        
        console.log('✅ Prep time chart created with estimated data');
        return;
    }
    
    // Process real preparation time data
    const prepTimeRanges = {
        '0-5 min': 0,
        '6-10 min': 0,
        '11-15 min': 0,
        '16-20 min': 0,
        '21-30 min': 0,
        '30+ min': 0
    };
    
    ordersWithPrepTime.forEach(order => {
        const time = order.prepTime;
        if (time <= 5) prepTimeRanges['0-5 min']++;
        else if (time <= 10) prepTimeRanges['6-10 min']++;
        else if (time <= 15) prepTimeRanges['11-15 min']++;
        else if (time <= 20) prepTimeRanges['16-20 min']++;
        else if (time <= 30) prepTimeRanges['21-30 min']++;
        else prepTimeRanges['30+ min']++;
    });
    
    // Create chart with real data
    charts.prepTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(prepTimeRanges),
            datasets: [{
                label: 'Number of Orders',
                data: Object.values(prepTimeRanges),
                backgroundColor: 'rgba(93, 64, 55, 0.7)',
                borderColor: '#5d4037',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(93, 64, 55, 0.9)',
                    titleColor: '#FFD700',
                    bodyColor: '#FFF',
                    borderColor: '#D4AF37',
                    borderWidth: 2,
                    cornerRadius: 8
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { 
                        stepSize: 1,
                        color: '#8d6e63',
                        font: { family: 'Inter' }
                    },
                    grid: { color: 'rgba(212, 175, 55, 0.2)' }
                },
                x: {
                    ticks: {
                        color: '#5d4037',
                        font: { family: 'Inter', weight: '600' }
                    },
                    grid: { display: false }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Update statistics with real data
    const prepTimes = ordersWithPrepTime.map(order => order.prepTime);
    const fastest = Math.min(...prepTimes);
    const slowest = Math.max(...prepTimes);
    
    const fastestEl = document.getElementById('fastestOrder');
    const slowestEl = document.getElementById('slowestOrder');
    if (fastestEl) fastestEl.textContent = `${fastest}min`;
    if (slowestEl) slowestEl.textContent = `${slowest}min`;
    
    console.log('✅ Prep time chart created with real data:', {
        ordersWithData: ordersWithPrepTime.length,
        fastest: fastest,
        slowest: slowest,
        ranges: prepTimeRanges
    });
}

/**
 * Create customer analysis chart
 */
async function createCustomerChart() {
    const canvas = document.getElementById('customerChart');
    if (!canvas) return;
    
    destroyExistingChart('customer', 'customerChart');
    const ctx = canvas.getContext('2d');
    
    const customerCounts = {};
    filteredOrders.forEach(order => {
        customerCounts[order.customerName] = (customerCounts[order.customerName] || 0) + 1;
    });
    
    const frequencyRanges = {
        '1 order': 0,
        '2-3 orders': 0,
        '4-5 orders': 0,
        '6-10 orders': 0,
        '10+ orders': 0
    };
    
    Object.values(customerCounts).forEach(count => {
        if (count === 1) frequencyRanges['1 order']++;
        else if (count <= 3) frequencyRanges['2-3 orders']++;
        else if (count <= 5) frequencyRanges['4-5 orders']++;
        else if (count <= 10) frequencyRanges['6-10 orders']++;
        else frequencyRanges['10+ orders']++;
    });
    
    charts.customer = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(frequencyRanges),
            datasets: [{
                data: Object.values(frequencyRanges),
                backgroundColor: [
                    '#d4af37', '#8d6e63', '#5d4037', '#ffd700', '#b8860b'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 11 } }
                }
            }
        }
    });
}


/**
 * Enhanced customer spenders chart with real customer images
 */
async function createCustomerSpendersChart() {
    console.log('🥚 Starting customer spenders chart creation...');
    
    try {
        // Step 1: Ensure canvas exists or create section
        let canvas = document.getElementById('customerSpendersChart');
        if (!canvas) {
            console.log('⚠️ Customer spenders canvas not found - creating section...');
            createCustomerSpendersSection();
            
            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 300));
            canvas = document.getElementById('customerSpendersChart');
            
            if (!canvas) {
                console.error('❌ Cannot create customer spenders canvas');
                return;
            }
        }
        
        console.log('✅ Customer spenders canvas found');
        
        // Step 2: Thorough cleanup with async approach
        await destroyExistingChartAsync('customerSpenders', 'customerSpendersChart');
        
        // Step 3: Re-get canvas after cleanup (in case it was recreated)
        canvas = document.getElementById('customerSpendersChart');
        if (!canvas) {
            console.error('❌ Canvas lost after cleanup');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('❌ Cannot get 2D context from canvas');
            return;
        }
        
        // Step 4: Process customer data
        let customerSpending = {};
        let processedOrders = 0;
        
        // Use filteredOrders for customer spending data
        if (filteredOrders && filteredOrders.length > 0) {
            console.log('📊 Processing customer spending data...');
            
            filteredOrders.forEach(order => {
                let customerName = order.customerName;
                
                // Skip invalid customer names
                if (!customerName || customerName === 'Unknown' || customerName.trim() === '') {
                    return;
                }
                
                const orderTotal = (order.status === 'completed' || !order.status) ? order.total : 0;
                
                if (orderTotal > 0) {
                    if (!customerSpending[customerName]) {
                        customerSpending[customerName] = { total: 0, orders: 0 };
                    }
                    
                    customerSpending[customerName].total += orderTotal;
                    customerSpending[customerName].orders += 1;
                    processedOrders++;
                }
            });
        }
        
        // Step 5: Prepare chart data
        const topSpenders = Object.entries(customerSpending)
            .filter(([name, metrics]) => metrics.total > 0)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 10);
        
        if (topSpenders.length === 0) {
            console.warn('⚠️ No customer spending data found');
            showEmptyChart(canvas, '😞 No customer spending data available yet');
            return;
        }
        
        console.log(`📊 Found ${topSpenders.length} top spenders from ${processedOrders} orders`);
        
        // Step 6: Create chart data
        const labels = topSpenders.map(([name]) => name);
        const data = topSpenders.map(([,metrics]) => metrics.total);
        
        const whimsicalColors = [
            '#FFD700', '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
        ];
        
        // Step 7: Pre-load customer images
        const customerImages = {};
        await Promise.all(
            labels.map(async (customerName) => {
                try {
                    const imagePath = `./eggs/${customerName.toLowerCase()}.png`;
                    const img = new Image();
                    
                    return new Promise((resolve) => {
                        img.onload = () => {
                            customerImages[customerName] = img;
                            resolve();
                        };
                        img.onerror = () => {
                            customerImages[customerName] = null;
                            resolve();
                        };
                        img.src = imagePath;
                    });
                } catch (error) {
                    customerImages[customerName] = null;
                }
            })
        );
        
        // Step 8: Create the chart with additional safeguards
        console.log('🎨 Creating Chart.js chart...');
        
        // Final check that no chart exists
        try {
            const stillExisting = Chart.getChart(canvas);
            if (stillExisting) {
                console.log('⚠️ Chart still exists right before creation, destroying...');
                stillExisting.destroy();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.warn('⚠️ Final chart check failed:', error);
        }
        
        // Create the chart
        charts.customerSpenders = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Spent',
                    data: data,
                    backgroundColor: data.map((_, index) => whimsicalColors[index % whimsicalColors.length]),
                    borderColor: '#5d4037',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const customerName = context.label;
                                const amount = context.parsed.y;
                                const orders = customerSpending[customerName]?.orders || 0;
                                const avgOrder = orders > 0 ? amount / orders : 0;
                                return [
                                    `💰 Total Spent: $${amount.toFixed(2)}`,
                                    `📦 Orders: ${orders}`,
                                    `📊 Avg Order: $${avgOrder.toFixed(2)}`
                                ];
                            },
                            title: function(context) {
                                return `🥚 ${context[0].label}`;
                            }
                        },
                        backgroundColor: 'rgba(93, 64, 55, 0.9)',
                        titleColor: '#FFD700',
                        bodyColor: '#FFF',
                        borderColor: '#D4AF37',
                        borderWidth: 2,
                        cornerRadius: 12,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            },
                            color: '#5d4037',
                            font: { family: 'Inter', weight: '600' }
                        },
                        grid: { color: 'rgba(212, 175, 55, 0.2)' }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            color: '#5d4037',
                            font: { family: 'Inter', weight: '600', size: 10 }
                        },
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutBounce'
                }
            },
            plugins: [{
                id: 'customerAvatars',
                afterDraw: function(chart) {
                    const ctx = chart.ctx;
                    chart.data.labels.forEach((customerName, index) => {
                        const meta = chart.getDatasetMeta(0);
                        const bar = meta.data[index];
                        
                        if (bar) {
                            const x = bar.x;
                            const y = bar.y - 35;
                            const avatarSize = 28;
                            
                            const customerImage = customerImages[customerName];
                            
                            if (customerImage) {
                                // Draw customer image
                                ctx.save();
                                ctx.beginPath();
                                ctx.arc(x, y, avatarSize / 2, 0, 2 * Math.PI);
                                ctx.clip();
                                ctx.drawImage(
                                    customerImage, 
                                    x - avatarSize / 2, 
                                    y - avatarSize / 2, 
                                    avatarSize, 
                                    avatarSize
                                );
                                ctx.restore();
                                
                                // Add border
                                ctx.beginPath();
                                ctx.arc(x, y, avatarSize / 2, 0, 2 * Math.PI);
                                ctx.strokeStyle = '#D4AF37';
                                ctx.lineWidth = 3;
                                ctx.stroke();
                            } else {
                                // Fallback to egg emoji
                                ctx.font = '22px Arial';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = '#FFD700';
                                ctx.fillText('🥚', x, y);
                            }
                            
                            // Add sparkles for top 3
                            if (index < 3) {
                                const sparkles = ['✨', '🌟', '⭐'];
                                ctx.font = '14px Arial';
                                ctx.fillStyle = whimsicalColors[index];
                                ctx.textAlign = 'center';
                                ctx.fillText(sparkles[index], x + 22, y - 15);
                            }
                        }
                    });
                }
            }]
        });
        
        console.log('✅ Customer spenders chart created successfully!');
        
        // Step 9: Update stats
        if (topSpenders.length > 0) {
            const topSpenderAmount = topSpenders[0][1].total;
            const loyalCustomers = Object.values(customerSpending).filter(c => c.orders >= 3).length;
            
            const topSpenderEl = document.getElementById('topSpenderAmount');
            const loyalCustomersEl = document.getElementById('loyalCustomers');
            
            if (topSpenderEl) topSpenderEl.textContent = `$${topSpenderAmount.toFixed(0)}`;
            if (loyalCustomersEl) loyalCustomersEl.textContent = loyalCustomers;
        }
        
    } catch (error) {
        console.error('❌ Error creating customer spenders chart:', error);
        
        // Show error in chart area
        const canvas = document.getElementById('customerSpendersChart');
        if (canvas) {
            showEmptyChart(canvas, 'Error creating customer chart');
        }
    }
}

/**
 * IMPROVED: Dynamic section creation with better DOM handling
 */
function createCustomerSpendersSection() {
    console.log('🔧 Creating customer spenders section dynamically...');
    
    const analyticsGrid = document.getElementById('analyticsGrid');
    if (!analyticsGrid) {
        console.error('❌ Analytics grid not found!');
        return;
    }
    
    // Remove any existing customer spenders section first
    const existingSection = document.querySelector('.customer-spenders-section');
    if (existingSection) {
        console.log('🗑️ Removing existing customer spenders section');
        existingSection.remove();
    }
    
    const section = document.createElement('div');
    section.className = 'chart-section customer-spenders-section';
    section.innerHTML = `
        <div class="chart-header">
            <h3 class="chart-title">🥚 Top Customer Spenders</h3>
            <p class="chart-subtitle">Our most valued egg-cellent customers!</p>
        </div>
        <div class="chart-container">
            <canvas id="customerSpendersChart"></canvas>
        </div>
        <div class="chart-stats">
            <div class="stat-item">
                <span class="stat-value" id="topSpenderAmount">$0</span>
                <span class="stat-label">Top Spender</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="loyalCustomers">0</span>
                <span class="stat-label">Loyal Customers</span>
            </div>
        </div>
    `;
    
    // Insert after the customer section
    const customerSection = document.querySelector('.customer-section');
    if (customerSection) {
        customerSection.insertAdjacentElement('afterend', section);
        console.log('✅ Customer spenders section inserted after customer section');
    } else {
        // If customer section doesn't exist, just append to analytics grid
        analyticsGrid.appendChild(section);
        console.log('✅ Customer spenders section appended to analytics grid');
    }
    
    // Force DOM refresh
    section.offsetHeight; // This forces a reflow
    
    console.log('✅ Section creation completed');
}

/**
 * IMPROVED: Show empty chart with better error handling
 */
function showEmptyChart(canvas, message) {
    try {
        const container = canvas.parentElement;
        if (container) {
            container.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: #8d6e63;
                    font-family: Inter, sans-serif;
                ">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📊</div>
                    <div style="font-weight: 600;">${message}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error showing empty chart:', error);
    }
}

// 🐛 DEBUG HELPER: Add this function to check your data structure
function debugCustomerData() {
    console.log('🔍 DEBUGGING CUSTOMER DATA:');
    console.log('📊 All orders count:', allOrders.length);
    console.log('📊 Filtered orders count:', filteredOrders.length);
    console.log('📊 Current time period:', currentTimePeriod);
    
    // Check customer names in orders
    const customerNames = filteredOrders.map(order => ({
        orderId: order.orderId,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        hasCustomer: !!(order.customer),
        hasCustomerInfo: !!(order.customerInfo)
    }));
    
    console.log('📊 Customer names sample:', customerNames.slice(0, 5));
    
    // Check unique customers
    const uniqueCustomers = [...new Set(filteredOrders.map(o => o.customerName))];
    console.log('📊 Unique customers:', uniqueCustomers);
    
    // Check if all customers are "Unknown"
    const unknownCount = filteredOrders.filter(o => 
        o.customerName === 'Unknown' || 
        o.customerName === 'Unknown Customer' || 
        !o.customerName
    ).length;
    
    console.log('📊 Unknown customers:', unknownCount, 'out of', filteredOrders.length);
    
    return {
        totalOrders: allOrders.length,
        filteredOrders: filteredOrders.length,
        uniqueCustomers: uniqueCustomers,
        unknownCount: unknownCount
    };
}

/**
 * Create order status flow chart
 */
async function createStatusChart() {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    
    destroyExistingChart('status', 'statusChart');
    const ctx = canvas.getContext('2d');
    
    const statusCounts = {};
    filteredOrders.forEach(order => {
        const status = order.status || 'completed';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const statusLabels = Object.keys(statusCounts).map(status => 
        status.charAt(0).toUpperCase() + status.slice(1)
    );
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusLabels,
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#ffd700', '#ff6b35', '#10b981', '#6366f1', '#ef4444'
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
                    labels: { font: { family: 'Inter', size: 11 } }
                }
            }
        }
    });
}

/**
 * Create seasonal trends chart with proper season mapping
 */
async function createSeasonalChart() {
    const canvas = document.getElementById('seasonalChart');
    if (!canvas) return;
    
    destroyExistingChart('seasonal', 'seasonalChart');
    const ctx = canvas.getContext('2d');
    
    // Calculate season popularity and revenue
    const seasonMetrics = {};
    
    filteredOrders.forEach(order => {
        const seasonId = order.season || 2;
        
        if (!seasonMetrics[seasonId]) {
            seasonMetrics[seasonId] = {
                orders: 0,
                revenue: 0,
                items: 0,
                name: order.seasonName || seasons[seasonId]?.name || `Season ${seasonId}`
            };
        }
        
        seasonMetrics[seasonId].orders += 1;
        seasonMetrics[seasonId].revenue += order.total;
        seasonMetrics[seasonId].items += order.itemCount;
    });
    
    // Prepare data for radar chart
    const seasonIds = Object.keys(seasonMetrics).sort();
    
    if (seasonIds.length === 0) {
        showEmptyChart(canvas, 'No seasonal data available');
        return;
    }
    
    // Create multiple datasets for comprehensive view
    const datasets = [
        {
            label: 'Orders',
            data: seasonIds.map(id => seasonMetrics[id].orders),
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.2)',
            pointBackgroundColor: '#d4af37',
            pointBorderColor: '#5d4037',
            pointBorderWidth: 2,
            pointRadius: 5
        },
        {
            label: 'Revenue ($)',
            data: seasonIds.map(id => Math.round(seasonMetrics[id].revenue / 10)), // Scale down for visibility
            borderColor: '#8d6e63',
            backgroundColor: 'rgba(141, 110, 99, 0.1)',
            pointBackgroundColor: '#8d6e63',
            pointBorderColor: '#5d4037',
            pointBorderWidth: 2,
            pointRadius: 4
        },
        {
            label: 'Items Sold',
            data: seasonIds.map(id => seasonMetrics[id].items),
            borderColor: '#5d4037',
            backgroundColor: 'rgba(93, 64, 55, 0.1)',
            pointBackgroundColor: '#5d4037',
            pointBorderColor: '#d4af37',
            pointBorderWidth: 2,
            pointRadius: 4
        }
    ];
    
    const labels = seasonIds.map(id => {
        const season = seasons[id];
        return season ? `${season.name}${season.theme ? ` (${season.theme})` : ''}` : `Season ${id}`;
    });
    
    charts.seasonal = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { 
                        font: { family: 'Inter', size: 11 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const seasonId = seasonIds[context.dataIndex];
                            const metrics = seasonMetrics[seasonId];
                            
                            if (context.datasetIndex === 0) {
                                return `Orders: ${metrics.orders}`;
                            } else if (context.datasetIndex === 1) {
                                return `Revenue: $${metrics.revenue.toFixed(2)}`;
                            } else if (context.datasetIndex === 2) {
                                return `Items: ${metrics.items}`;
                            }
                            return '';
                        }
                    },
                    backgroundColor: 'rgba(93, 64, 55, 0.9)',
                    titleColor: '#FFD700',
                    bodyColor: '#FFF',
                    borderColor: '#D4AF37',
                    borderWidth: 2,
                    cornerRadius: 12
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { 
                        stepSize: Math.max(1, Math.ceil(Math.max(...Object.values(seasonMetrics).map(m => m.orders)) / 5)),
                        font: { family: 'Inter', size: 10 },
                        color: '#8d6e63'
                    },
                    grid: {
                        color: 'rgba(212, 175, 55, 0.3)'
                    },
                    pointLabels: {
                        font: { family: 'Inter', size: 11, weight: '600' },
                        color: '#5d4037'
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 3
                }
            }
        }
    });
    
    // Update seasonal stats if elements exist
    const totalSeasons = Object.keys(seasonMetrics).length;
    const mostPopularSeason = Object.entries(seasonMetrics)
        .sort(([,a], [,b]) => b.orders - a.orders)[0];
    
    const totalSeasonsEl = document.getElementById('totalSeasons');
    const popularSeasonEl = document.getElementById('popularSeason');
    
    if (totalSeasonsEl) totalSeasonsEl.textContent = totalSeasons;
    if (popularSeasonEl && mostPopularSeason) {
        popularSeasonEl.textContent = mostPopularSeason[1].name;
    }
    
    console.log('📊 Seasonal chart data:', seasonMetrics);
}

/**
 * Create performance metrics chart
 */
async function createMetricsChart() {
    const canvas = document.getElementById('metricsChart');
    if (!canvas) return;
    
    destroyExistingChart('metrics', 'metricsChart');
    const ctx = canvas.getContext('2d');
    
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const avgOrderValue = totalOrders > 0 ? 
        filteredOrders.reduce((sum, o) => sum + o.total, 0) / totalOrders : 0;
    const avgPrepTime = filteredOrders.filter(o => o.prepTime !== null).length > 0 ?
        filteredOrders.filter(o => o.prepTime !== null).reduce((sum, o) => sum + o.prepTime, 0) / 
        filteredOrders.filter(o => o.prepTime !== null).length : 0;
    
    const metrics = [
        { label: 'Total Orders', value: totalOrders, max: Math.max(100, totalOrders) },
        { label: 'Completed Orders', value: completedOrders, max: Math.max(100, totalOrders) },
        { label: 'Avg Order Value', value: avgOrderValue, max: 50 },
        { label: 'Avg Prep Time', value: avgPrepTime, max: 30 }
    ];
    
    charts.metrics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.map(m => m.label),
            datasets: [{
                data: metrics.map(m => (m.value / m.max) * 100),
                backgroundColor: [
                    'rgba(212, 175, 55, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(93, 64, 55, 0.7)'
                ],
                borderColor: ['#d4af37', '#10b981', '#6366f1', '#5d4037'],
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: { ticks: { maxRotation: 45 } }
            }
        }
    });
}

/**
 * Create daily patterns chart
 */
async function createDailyChart() {
    const canvas = document.getElementById('dailyChart');
    if (!canvas) return;
    
    destroyExistingChart('daily', 'dailyChart');
    const ctx = canvas.getContext('2d');
    
    const dailyData = new Array(7).fill(0);
    filteredOrders.forEach(order => {
        dailyData[order.orderDay]++;
    });
    
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    charts.daily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Orders by Day',
                data: dailyData,
                borderColor: '#5d4037',
                backgroundColor: 'rgba(93, 64, 55, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#5d4037',
                pointBorderColor: '#d4af37',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// ===================================
// TABLE GENERATION
// ===================================

/**
 * Generate detailed data tables
 */
function generateDetailedTables() {
    generateTopProductsTable();
    generateCustomerInsightsTable();
}

/**
 * Generate top products table
 */
function generateTopProductsTable() {
    const tableBody = document.querySelector('#topProductsTable tbody');
    if (!tableBody) return;
    
    const productMetrics = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productMetrics[item.name]) {
                productMetrics[item.name] = {
                    orders: 0,
                    quantity: 0,
                    revenue: 0
                };
            }
            productMetrics[item.name].orders++;
            productMetrics[item.name].quantity += item.quantity;
            productMetrics[item.name].revenue += item.price * item.quantity;
        });
    });
    
    const topProducts = Object.entries(productMetrics)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 10);
    
    tableBody.innerHTML = topProducts.map(([name, metrics], index) => {
        const avgPrice = metrics.revenue / metrics.quantity;
        return `
            <tr>
                <td class="rank-cell">${index + 1}</td>
                <td class="product-cell">${name}</td>
                <td class="number-cell">${metrics.orders}</td>
                <td class="number-cell">$${metrics.revenue.toFixed(2)}</td>
                <td class="number-cell">$${avgPrice.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Generate customer insights table
 */
function generateCustomerInsightsTable() {
    const tableBody = document.querySelector('#customerInsightsTable tbody');
    if (!tableBody) return;
    
    const customerMetrics = {};
    filteredOrders.forEach(order => {
        if (!customerMetrics[order.customerName]) {
            customerMetrics[order.customerName] = {
                orders: 0,
                totalSpent: 0,
                items: {}
            };
        }
        customerMetrics[order.customerName].orders++;
        customerMetrics[order.customerName].totalSpent += order.total;
        
        order.items.forEach(item => {
            const items = customerMetrics[order.customerName].items;
            items[item.name] = (items[item.name] || 0) + item.quantity;
        });
    });
    
    const topCustomers = Object.entries(customerMetrics)
        .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
    
    tableBody.innerHTML = topCustomers.map(([name, metrics]) => {
        const avgOrder = metrics.totalSpent / metrics.orders;
        const favoriteItem = Object.entries(metrics.items)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        
        return `
            <tr>
                <td class="product-cell">${name}</td>
                <td class="number-cell">${metrics.orders}</td>
                <td class="number-cell">$${metrics.totalSpent.toFixed(2)}</td>
                <td class="number-cell">$${avgOrder.toFixed(2)}</td>
                <td>${favoriteItem}</td>
            </tr>
        `;
    }).join('');
}

// ===================================
// OVERVIEW STATS
// ===================================

/**
 * Update overview statistics
 */
function updateOverviewStats() {
    const todayOrders = filteredOrders.length;
    const todayRevenue = filteredOrders
        .filter(order => order.status === 'completed' || !order.status)
        .reduce((sum, order) => sum + order.total, 0);
    
    const ordersWithPrepTime = filteredOrders.filter(order => order.prepTime !== null);
    const avgPrepTime = ordersWithPrepTime.length > 0 ?
        ordersWithPrepTime.reduce((sum, order) => sum + order.prepTime, 0) / ordersWithPrepTime.length : 0;
    
    const todayOrdersEl = document.getElementById('todayOrders');
    const todayRevenueEl = document.getElementById('todayRevenue');
    const avgPrepTimeEl = document.getElementById('avgPrepTime');
    
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrders;
    if (todayRevenueEl) todayRevenueEl.textContent = `$${todayRevenue.toFixed(0)}`;
    if (avgPrepTimeEl) avgPrepTimeEl.textContent = `${Math.round(avgPrepTime)}min`;
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = todayOrders > 0 ? totalRevenue / todayOrders : 0;
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    const avgOrderValueEl = document.getElementById('avgOrderValue');
    
    if (totalRevenueEl) totalRevenueEl.textContent = `$${totalRevenue.toFixed(0)}`;
    if (avgOrderValueEl) avgOrderValueEl.textContent = `$${avgOrderValue.toFixed(2)}`;
}

// ===================================
// REAL-TIME UPDATES
// ===================================

/**
 * Set up real-time updates from Firebase
 */
function setupRealtimeUpdates() {
    if (!db) {
        console.warn('Firebase not available for real-time updates');
        return;
    }
    
    console.log('📡 Setting up real-time updates for sales dashboard...');
    
    try {
        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );
        
        salesListener = onSnapshot(ordersQuery, async (snapshot) => {
            console.log('🔄 Real-time sales data update received');
            
            let hasChanges = false;
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                console.log('📊 Refreshing sales data with new Firebase data...');
                try {
                    // Reload data to ensure we have latest product/season mappings
                    await loadDataFromFile();
                    await loadOrdersData();
                    filterOrdersByTimePeriod(currentTimePeriod);
                } catch (error) {
                    console.error('Error refreshing sales data:', error);
                }
            }
        }, (error) => {
            console.error('Error in sales listener:', error);
        });
        
    } catch (error) {
        console.warn('Could not set up real-time updates:', error);
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Show loading state
 */
function showLoading(show) {
    const loadingEl = document.getElementById('salesLoading');
    const analyticsEl = document.getElementById('analyticsGrid');
    const tablesEl = document.getElementById('tablesSection');
    
    if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';
    if (analyticsEl) analyticsEl.style.display = show ? 'none' : 'grid';
    if (tablesEl) tablesEl.style.display = show ? 'none' : 'block';
}

/**
 * Show error message
 */
function showError(message) {
    console.error('❌ Sales Error:', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    notification.innerHTML = `⚠️ ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===================================
// USER ACTIONS
// ===================================

/**
 * Filter by time period (called from HTML)
 */
function filterByTimePeriod(period) {
    console.log(`📊 Filtering sales data by: ${period}`);
    filterOrdersByTimePeriod(period);
}

/**
 * Refresh sales data
 */
async function refreshSalesData() {
    console.log('🔄 Manually refreshing sales data...');
    
    try {
        showLoading(true);
        
        // Reload data from data.js (in case it was updated)
        await loadDataFromFile();
        
        // Reload orders from Firebase
        await loadOrdersData();
        filterOrdersByTimePeriod(currentTimePeriod);
        
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
        notification.textContent = '✅ Sales data refreshed!';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
        
    } catch (error) {
        console.error('❌ Error refreshing sales data:', error);
        showError('Failed to refresh sales data');
    } finally {
        showLoading(false);
    }
}

/**
 * Export sales data
 */
function exportSalesData() {
    const exportData = {
        exportDate: new Date().toISOString(),
        timePeriod: currentTimePeriod,
        summary: {
            totalOrders: filteredOrders.length,
            totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
            avgOrderValue: filteredOrders.length > 0 ? 
                filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length : 0,
            avgPrepTime: filteredOrders.filter(o => o.prepTime !== null).length > 0 ?
                filteredOrders.filter(o => o.prepTime !== null).reduce((sum, o) => sum + o.prepTime, 0) / 
                filteredOrders.filter(o => o.prepTime !== null).length : 0
        },
        orders: filteredOrders
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `egghaus-sales-${currentTimePeriod}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('📤 Sales data exported');
}

/**
 * Go back to admin dashboard
 */
function goBackToAdmin() {
    if (salesListener) {
        salesListener();
        salesListener = null;
        console.log('📡 Stopped Firebase sales listener');
    }
    
    destroyAllCharts();
    window.location.href = './admin.html';
}

// ===================================
// GLOBAL FUNCTION EXPOSURE
// ===================================

window.filterByTimePeriod = filterByTimePeriod;
window.refreshSalesData = refreshSalesData;
window.exportSalesData = exportSalesData;
window.goBackToAdmin = goBackToAdmin;
window.debugCustomerData = debugCustomerData;
window.createCustomerSpendersChart = createCustomerSpendersChart;
// ===================================
// INITIALIZATION ON LOAD
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Sales analytics page loaded');
    
    setTimeout(() => {
        initializeSalesDashboard();
    }, 100);
});


window.addEventListener('beforeunload', () => {
    if (salesListener) {
        salesListener();
    }
    destroyAllCharts();
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Sales analytics page loaded');
    
    // Wait a bit longer for all DOM elements to be ready
    setTimeout(() => {
        initializeSalesDashboard();
    }, 500); // Increased from 100ms to 500ms
});
console.log('📊 Sales analytics script loaded successfully!');
