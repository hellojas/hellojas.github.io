// Firebase configuration
import { initializeApp as initApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCJIAxjywQhuKuqWqBa4FgUZuM6RrQ7y-E",
  authDomain: "office-127b0.firebaseapp.com",
  databaseURL: "https://office-127b0-default-rtdb.firebaseio.com/",
  projectId: "office-127b0",
  storageBucket: "office-127b0.firebasestorage.app",
  messagingSenderId: "554800223425",
  appId: "1:554800223425:web:ecb87d46fee7c3e5a1f040",
  measurementId: "G-8WXVRR5VJD"
};

// Initialize Firebase
const app = initApp(firebaseConfig);
const database = getDatabase(app);

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function getLocationMessage(isAtLocation, latitude, longitude) {
    if (isAtLocation) {
        return "Jas is present, her soul is not.";
    }
    
    // Check for specific locations when not at office
    const locations = [
        {
            // 75 9th Ave, New York, NY 10011 (Chelsea Market - Music Studio)
            lat: 40.742352,
            lng: -74.006210,
            message: "🎶 Currently in a meeting with Bass, Guitar, and Saxophone."
        },
        {
            lat: 40.716321,
            lng: -73.948107,
            message: "🏠 Today's commute: 12 steps."
        },
        {
            // 221 N 14th St, Brooklyn, NY 11249 (climbing gym)
            lat: 40.7168,
            lng: -73.9542,
            message: "🧗 Jas is upgrading her grip strength instead of her career."
        },
        {
            // 182 Broome St, New York, NY 10002 (climbing gym)
            lat: 40.7181,
            lng: -73.9929,
            message: "🧗 Jas is upgrading her grip strength instead of her career."
        }
    ];
    
    const radiusMeters = 160.9; // 0.1 mile in meters
    
    for (const location of locations) {
        const distance = calculateDistance(latitude, longitude, location.lat, location.lng);
        if (distance <= radiusMeters) {
            return location.message;
        }
    }
    
    // Default message when not at any special location
    return "🦄 Galavanting with a donut";
}

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
    // Only log status info, not coordinates
    console.log('Showing status:', { 
        atLocation: data?.atLocation, 
        distance: data?.distance,
        hasData: !!data 
    });
    
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
    const latitude = data.latitude;
    const longitude = data.longitude;
    
    // Show "No, :)" when NOT at location, "Yes, :(" when AT location
    answerEl.textContent = isAtLocation ? 'Yes, :(' : 'No, :)';
    answerEl.className = `answer ${isAtLocation ? 'yes' : 'no'}`;
    
    // Get custom message based on location
    const locationMessage = getLocationMessage(isAtLocation, latitude, longitude);
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        ${locationMessage}
    `;
    
    const distanceText = data.distance ? 
        (data.distance < 1000 ? `${data.distance}m` : `${(data.distance/1000).toFixed(1)}km`) : 
        'Unknown';
    
    const lastUpdated = formatTimestamp(data.timestamp);
    
    detailsEl.innerHTML = `
        Distance from target: ${distanceText}<br>
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
            // Don't log the full data object with coordinates
            console.log('Firebase data received:', data ? 'Status updated' : 'No data');
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
    
    // Easter egg for curious developers
    console.log('john get out of there 😸');
    
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
