// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Target location coordinates
const targetLocation = {
    lat: 40.7420,
    lng: -74.0059
};
const allowedRadius = 100; // meters

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

async function updateFirebase(isAtLocation, location, distance) {
    try {
        // Only log status info, not coordinates
        console.log('Updating DB...', { isAtLocation, distance: Math.round(distance) });
        const statusRef = ref(database, 'locationStatus');
        await set(statusRef, {
            atLocation: isAtLocation,
            latitude: location.lat,
            longitude: location.lng,
            distance: Math.round(distance),
            lastUpdated: serverTimestamp(),
            timestamp: Date.now()
        });
        
        document.getElementById('firebase-status').innerHTML = 
            `<span style="color: #2ecc71;">✓ Firebase updated</span>`;
        console.log('DB update successful');
        return true;
    } catch (error) {
        console.error('DB update failed:', error);
        document.getElementById('firebase-status').innerHTML = 
            `<span style="color: #e74c3c;">✗ Firebase error: ${error.message}</span>`;
        return false;
    }
}

function showResult(isWithinRange, distance, currentLocation) {
    // Only log status info, not coordinates
    console.log('Showing result:', { isWithinRange, distance: Math.round(distance) });
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = isWithinRange ? 'AT LOCATION' : 'NOT AT LOCATION';
    answerEl.className = `answer ${isWithinRange ? 'yes' : 'no'}`;
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        ${isWithinRange ? 'You are at the target location' : 'You are away from target location'} - Updating Firebase...
    `;
    
    const distanceText = distance < 1000 ? 
        `${Math.round(distance)} meters` : 
        `${(distance/1000).toFixed(1)} kilometers`;
    
    detailsEl.innerHTML = `
        Distance from target: ${distanceText}<br>
        Your coordinates: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}<br>
        Last checked: ${new Date().toLocaleTimeString()}
    `;
    
    // Update Firebase with status
    updateFirebase(isWithinRange, currentLocation, distance);
}

function showError(message) {
    console.error('Location error:', message);
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = 'ERROR';
    answerEl.className = 'answer error';
    subtitleEl.textContent = 'Unable to determine location';
    detailsEl.innerHTML = `<div class="error">${message}</div>`;
    document.getElementById('firebase-status').innerHTML = 
        `<span style="color: #f39c12;">⚠ Cannot update Firebase - location unknown</span>`;
}

function checkLocation() {
    console.log('Checking location...');
    
    if (!navigator.geolocation) {
        showError('Your browser does not support location services');
        return;
    }
    
    console.log('Geolocation supported, requesting position...');
    
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('Location obtained successfully');
            
            const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            const distance = calculateDistance(
                currentLocation.lat, currentLocation.lng,
                targetLocation.lat, targetLocation.lng
            );
            
            const isWithinRange = distance <= allowedRadius;
            showResult(isWithinRange, distance, currentLocation);
        },
        function(error) {
            console.error('Geolocation error:', error);
            
            let errorMessage;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Please enable location access and refresh this page";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information is unavailable";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Location request timed out";
                    break;
                default:
                    errorMessage = "An unknown error occurred";
                    break;
            }
            showError(errorMessage);
        },
        options
    );
}

// Initialize Firebase status
document.getElementById('firebase-status').textContent = 'Firebase initialized';

// Check location when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, starting location check...');
    checkLocation();
});

// Re-check and update Firebase every 30 seconds
setInterval(checkLocation, 30000);

console.log('log.js setup complete');
