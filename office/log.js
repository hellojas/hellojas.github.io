// Firebase configuration (replace with your config)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Your Firebase config object (replace with your actual config)
const firebaseConfig = {
    // Add your Firebase config here
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const targetLocation = {
    lat: 40.742352,
    lng: -74.006210
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

async function updateFirebase(isAtOffice, location, distance) {
    try {
        const statusRef = ref(database, 'jasOfficeStatus');
        await set(statusRef, {
            atOffice: isAtOffice,
            latitude: location.lat,
            longitude: location.lng,
            distance: Math.round(distance),
            lastUpdated: serverTimestamp(),
            timestamp: Date.now()
        });
        
        document.getElementById('firebase-status').innerHTML = 
            `<span style="color: #2ecc71;">✓ Firebase updated</span>`;
        return true;
    } catch (error) {
        console.error('Firebase update failed:', error);
        document.getElementById('firebase-status').innerHTML = 
            `<span style="color: #e74c3c;">✗ Firebase error: ${error.message}</span>`;
        return false;
    }
}

function showResult(isWithinRange, distance, currentLocation) {
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = isWithinRange ? 'AT OFFICE' : 'NOT AT OFFICE';
    answerEl.className = `answer ${isWithinRange ? 'yes' : 'no'}`;
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        ${isWithinRange ? 'You are at the office' : 'You are away from office'} - Updating Firebase...
    `;
    
    const distanceText = distance < 1000 ? 
        `${Math.round(distance)} meters` : 
        `${(distance/1000).toFixed(1)} kilometers`;
    
    detailsEl.innerHTML = `
        Distance from office: ${distanceText}<br>
        Your coordinates: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}<br>
        Last checked: ${new Date().toLocaleTimeString()}
    `;
    
    // Update Firebase with status
    updateFirebase(isWithinRange, currentLocation, distance);
}

function showError(message) {
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
    if (!navigator.geolocation) {
        showError('Your browser does not support location services');
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
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
window.addEventListener('load', checkLocation);

// Re-check and update Firebase every 30 seconds
setInterval(checkLocation, 30000);
