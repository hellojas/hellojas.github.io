// ===================================
// EGGHAUS SOCIAL - SALES ANALYTICS DASHBOARD
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

// Data imports
import { products, seasons, appConfig } from './data.js';

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
// INITIALIZATION
// ===================================

/**
 * Initialize sales dashboard
 */
async function initializeSalesDashboard() {
    console.log('📊 Initializing sales analytics dashboard...');
    
    try {
        showLoading(true);
        
        // Load orders from Firebase
        await loadOrdersData();
        
        // Filter orders for default time period
        filterOrdersByTimePeriod(currentTimePeriod);
        
        // Initialize all charts
        await initializeAllCharts();
        
        // Generate tables
        generateDetailedTables();
        
        // Set up real-time updates
        setupRealtimeUpdates();
        
        // Update overview stats
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
 * Process raw order data for analytics
 */
function processOrderData(docId, data) {
    try {
        const createdAt = data.createdAt?.toDate() || new Date(data.orderTime) || new Date();
        const readyAt = data.readyAt?.toDate();
        const completedAt = data.completedAt?.toDate();
        
        // Calculate preparation time if we have timestamps
        let prepTime = null;
        if (readyAt && createdAt) {
            prepTime = Math.round((readyAt - createdAt) / (1000 * 60)); // minutes
        }
        
        // Process items with product data
        const items = (data.items || []).map(item => {
            const productData = products.find(p => p.name === item.name);
            return {
                ...item,
                productId: productData?.id || 0,
                category: productData?.category || 'unknown',
                season: productData?.season || [],
                caffeine: productData?.caffeine || 0
            };
        });
        
        // Determine dominant season
        const seasonCounts = {};
        items.forEach(item => {
            (item.season || []).forEach(s => {
                seasonCounts[s] = (seasonCounts[s] || 0) + item.quantity;
            });
        });
        const dominantSeason = Object.keys(seasonCounts).reduce((a, b) => 
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
            season: parseInt(dominantSeason),
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
            startDate = new Date('2020-01-01'); // Far in the past
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
    
    // Update all analytics
    updateAllAnalytics();
}

/**
 * Update all analytics when data changes
 */
async function updateAllAnalytics() {
    try {
        showLoading(true);
        
        // Destroy existing charts
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        charts = {};
        
        // Recreate all charts
        await initializeAllCharts();
        
        // Update tables
        generateDetailedTables();
        
        // Update overview stats
        updateOverviewStats();
        
    } catch (error) {
        console.error('❌ Error updating analytics:', error);
    } finally {
        showLoading(false);
    }
}

// ===================================
// CHART INITIALIZATION
// ===================================

/**
 * Initialize all charts
 */
async function initializeAllCharts() {
    console.log('📊 Initializing all charts...');
    
    try {
        await Promise.all([
            createRevenueChart(),
            createPopularityChart(),
            createHourlyChart(),
            createCategoryChart(),
            createPrepTimeChart(),
            createCustomerChart(),
            createStatusChart(),
            createSeasonalChart(),
            createMetricsChart(),
            createDailyChart()
        ]);
        
        console.log('✅ All charts initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing charts:', error);
        throw error;
    }
}

/**
 * Create revenue trends chart
 */
async function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Group orders by date and calculate daily revenue
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
            plugins: {
                legend: { display: false }
            },
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
    const ctx = document.getElementById('popularityChart');
    if (!ctx) return;
    
    // Calculate product popularity
    const productCounts = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
    });
    
    // Get top 8 products
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
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;
    
    // Calculate hourly order counts
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
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Calculate category revenue
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
    const ctx = document.getElementById('prepTimeChart');
    if (!ctx) return;
    
    // Get orders with prep times
    const ordersWithPrepTime = filteredOrders.filter(order => order.prepTime !== null);
    
    if (ordersWithPrepTime.length === 0) {
        showEmptyChart(ctx, 'No preparation time data available');
        return;
    }
    
    // Group by prep time ranges
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
                borderRadius: 4
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
    
    // Update prep time stats
    const prepTimes = ordersWithPrepTime.map(order => order.prepTime);
    const fastest = Math.min(...prepTimes);
    const slowest = Math.max(...prepTimes);
    
    document.getElementById('fastestOrder').textContent = `${fastest}min`;
    document.getElementById('slowestOrder').textContent = `${slowest}min`;
}

/**
 * Create customer analysis chart
 */
async function createCustomerChart() {
    const ctx = document.getElementById('customerChart');
    if (!ctx) return;
    
    // Calculate customer order frequency
    const customerCounts = {};
    filteredOrders.forEach(order => {
        customerCounts[order.customerName] = (customerCounts[order.customerName] || 0) + 1;
    });
    
    // Group by frequency ranges
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
 * Create order status flow chart
 */
async function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // Calculate status distribution
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
 * Create seasonal trends chart
 */
async function createSeasonalChart() {
    const ctx = document.getElementById('seasonalChart');
    if (!ctx) return;
    
    // Calculate season popularity
    const seasonCounts = {};
    filteredOrders.forEach(order => {
        seasonCounts[order.season] = (seasonCounts[order.season] || 0) + 1;
    });
    
    const labels = Object.keys(seasonCounts).map(s => `Season ${s}`);
    const data = Object.values(seasonCounts);
    
    charts.seasonal = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: data,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                pointBackgroundColor: '#d4af37',
                pointBorderColor: '#5d4037',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

/**
 * Create performance metrics chart
 */
async function createMetricsChart() {
    const ctx = document.getElementById('metricsChart');
    if (!ctx) return;
    
    // Calculate various metrics
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
                data: metrics.map(m => (m.value / m.max) * 100), // Normalize to percentage
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
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    
    // Calculate daily order counts
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
    
    // Calculate product metrics
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
    
    // Sort by revenue and take top 10
    const topProducts = Object.entries(productMetrics)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 10);
    
    // Generate table rows
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
    
    // Calculate customer metrics
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
        
        // Track favorite items
        order.items.forEach(item => {
            const items = customerMetrics[order.customerName].items;
            items[item.name] = (items[item.name] || 0) + item.quantity;
        });
    });
    
    // Sort by total spent and take top customers
    const topCustomers = Object.entries(customerMetrics)
        .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
    
    // Generate table rows
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
    
    // Update DOM elements
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('todayRevenue').textContent = `$${todayRevenue.toFixed(0)}`;
    document.getElementById('avgPrepTime').textContent = `${Math.round(avgPrepTime)}min`;
    
    // Update additional stats in charts
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
        
        salesListener = onSnapshot(ordersQuery, (snapshot) => {
            console.log('🔄 Real-time sales data update received');
            
            // Check if there are actual changes
            let hasChanges = false;
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                console.log('📊 Refreshing sales data...');
                loadOrdersData().then(() => {
                    filterOrdersByTimePeriod(currentTimePeriod);
                });
            }
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
    
    // Create error notification
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

/**
 * Show empty chart when no data
 */
function showEmptyChart(ctx, message) {
    const container = ctx.parentElement;
    container.innerHTML = `<div class="chart-loading">${message}</div>`;
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
        await loadOrdersData();
        filterOrdersByTimePeriod(currentTimePeriod);
        
        // Show success notification
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
        orders: filteredOrders,
        analytics: {
            productPopularity: calculateProductPopularity(),
            categoryBreakdown: calculateCategoryBreakdown(filteredOrders.flatMap(o => o.items)),
            hourlyPatterns: calculateHourlyPatterns(),
            customerMetrics: calculateCustomerMetrics()
        }
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
 * Calculate product popularity for export
 */
function calculateProductPopularity() {
    const popularity = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            popularity[item.name] = (popularity[item.name] || 0) + item.quantity;
        });
    });
    return popularity;
}

/**
 * Calculate hourly patterns for export
 */
function calculateHourlyPatterns() {
    const hourlyData = new Array(24).fill(0);
    filteredOrders.forEach(order => {
        hourlyData[order.orderHour]++;
    });
    return hourlyData;
}

/**
 * Calculate customer metrics for export
 */
function calculateCustomerMetrics() {
    const metrics = {};
    filteredOrders.forEach(order => {
        if (!metrics[order.customerName]) {
            metrics[order.customerName] = {
                orders: 0,
                totalSpent: 0,
                avgOrderValue: 0
            };
        }
        metrics[order.customerName].orders++;
        metrics[order.customerName].totalSpent += order.total;
        metrics[order.customerName].avgOrderValue = 
            metrics[order.customerName].totalSpent / metrics[order.customerName].orders;
    });
    return metrics;
}

/**
 * Go back to admin dashboard
 */
function goBackToAdmin() {
    // Stop real-time listener
    if (salesListener) {
        salesListener();
        salesListener = null;
        console.log('📡 Stopped Firebase sales listener');
    }
    
    // Navigate back to admin
    window.location.href = './admin.html';
}

// ===================================
// GLOBAL FUNCTION EXPOSURE
// ===================================

window.filterByTimePeriod = filterByTimePeriod;
window.refreshSalesData = refreshSalesData;
window.exportSalesData = exportSalesData;
window.goBackToAdmin = goBackToAdmin;

// ===================================
// INITIALIZATION ON LOAD
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Sales analytics page loaded');
    initializeSalesDashboard();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (salesListener) {
        salesListener();
    }
});

console.log('📊 Sales analytics script loaded successfully!');
