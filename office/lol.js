// Firebase configuration (replace with your config)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Your Firebase config object (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyCJIAxjywQhuKuqWqBa4FgUZuM6RrQ7y-E",
  authDomain: "office-127b0.firebaseapp.com",
  projectId: "office-127b0",
  storageBucket: "office-127b0.firebasestorage.app",
  messagingSenderId: "554800223425",
  appId: "1:554800223425:web:ecb87d46fee7c3e5a1f040",
  measurementId: "G-8WXVRR5VJD"
};


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
    
    const isAtOffice = data.atOffice;
    
    // Show "No, :)" when NOT at office, "Yes, :(" when AT office
    answerEl.textContent = isAtOffice ? 'Yes, :(' : 'No, :)';
    answerEl.className = `answer ${isAtOffice ? 'yes' : 'no'}`;
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        ${isAtOffice ? 'Jas is at the office' : 'Jas is not at the office'}
    `;
    
    const distanceText = data.distance ? 
        (data.distance < 1000 ? `${data.distance}m` : `${(data.distance/1000).toFixed(1)}km`) : 
        'Unknown';
    
    const lastUpdated = formatTimestamp(data.timestamp);
    
    detailsEl.innerHTML = `
        Distance from office: ${distanceText}<br>
        Last location: ${data.latitude ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}` : 'Unknown'}<br>
        Last updated: ${lastUpdated}
    `;
}

function showError(message) {
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = '?';
    answerEl.className = 'answer error';
    subtitleEl.innerHTML = '<span class="live-indicator"></span>Connection error';
    detailsEl.innerHTML = `<div class="error">${message}</div>`;
}

function startListening() {
    const statusRef = ref(database, 'jasOfficeStatus');
    
    // Listen for real-time updates
    onValue(statusRef, (snapshot) => {
        try {
            const data = snapshot.val();
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
    try {
        startListening();
    } catch (error) {
        console.error('Failed to initialize Firebase listener:', error);
        showError('Failed to connect to Firebase');
    }
});

// Clean up listener when page unloads
window.addEventListener('beforeunload', function() {
    const statusRef = ref(database, 'jasOfficeStatus');
    off(statusRef);
});
