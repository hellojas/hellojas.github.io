// Firebase configuration (replace with your config)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Debug logging
console.log('lol.js loading...');

// Firebase configuration (replace with your config)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCJIAxjywQhuKuqWqBa4FgUZuM6RrQ7y-E",
  authDomain: "office-127b0.firebaseapp.com",
  databaseURL: "https://office-127b0-default-rtdb.firebaseio.com/", // ADD THIS LINE
  projectId: "office-127b0",
  storageBucket: "office-127b0.firebasestorage.app",
  messagingSenderId: "554800223425",
  appId: "1:554800223425:web:ecb87d46fee7c3e5a1f040",
  measurementId: "G-8WXVRR5VJD"
};

console.log('Initializing Firebase...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
}

function showStatus(data) {
    console.log('Showing status:', data);
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    if (!data) {
        answerEl.textContent = '?';
        answerEl.className = 'answer error';
        subtitleEl.innerHTML = '<span class="live-indicator"></span>No data available';
        detailsEl.innerHTML = '<div class="error">No status updates found</div>';
        return;
    }
    
    const isAtLocation = data.atLocation;
    
    // Show "No, :)" when NOT at location, "Yes, :(" when AT location
    answerEl.textContent = isAtLocation ? 'Yes, :(' : 'No, :)';
    answerEl.className = `answer ${isAtLocation ? 'yes' : 'no'}`;
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        ${isAtLocation ? 'User is at the location' : 'User is not at the location'}
    `;
    
    const distanceText = data.distance ? 
        (data.distance < 1000 ? `${data.distance}m` : `${(data.distance/1000).toFixed(1)}km`) : 
        'Unknown';
    
    const lastUpdated = formatTimestamp(data.timestamp);
    
    detailsEl.innerHTML = `
        Distance from target: ${distanceText}<br>
        Last location: ${data.latitude ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}` : 'Unknown'}<br>
        Last updated: ${lastUpdated}
    `;
}

function showError(message) {
    console.error('Firebase error:', message);
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = '?';
    answerEl.className = 'answer error';
    subtitleEl.innerHTML = '<span class="live-indicator"></span>Connection error';
    detailsEl.innerHTML = `<div class="error">${message}</div>`;
}

function startListening() {
    console.log('Starting Firebase listener...');
    
    const statusRef = ref(database, 'locationStatus');
    
    // Listen for real-time updates
    onValue(statusRef, (snapshot) => {
        try {
            const data = snapshot.val();
            console.log('Firebase data received:', data);
            showStatus(data);
        } catch (error) {
            console.error('Error processing Firebase data:', error);
            showError('Error processing status data');
        }
    }, (error) => {
        console.error('Firebase listening error:', error);
        showError(`Firebase connection error: ${error.message}`);
    });
}

// Start listening when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, starting Firebase listener...');
    try {
        startListening();
    } catch (error) {
        console.error('Failed to initialize Firebase listener:', error);
        showError('Failed to connect to Firebase');
    }
});

// Clean up listener when page unloads
window.addEventListener('beforeunload', function() {
    const statusRef = ref(database, 'locationStatus');
    off(statusRef);
});

console.log('lol.js setup complete');
