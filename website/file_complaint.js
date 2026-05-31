const access_token = localStorage.getItem('access_token');
if (!access_token){
  alert('Please login first');
  window.location.replace('login.html');
}

// ==========================================
// 1. PAGE NAVIGATION HANDLERS
// ==========================================
const fileComplaintBtn = document.getElementById("fileComplaintBtn");
if (fileComplaintBtn) {
    fileComplaintBtn.addEventListener("click", function() {
        window.location.href = "file_complaint.html";
    });
}

// ==========================================
// 2. GLOBAL LEAFLET MAP INSTANCE STATES
// ==========================================
let mapInstance = null;
let mapMarker = null;

/**
 * Monitors the chosen radio button mode and toggles UI panels accordingly.
 * Uses a safe timeout delay to prevent the 'display: none' map sizing rendering trap.
 */
function handleLocationModeChange() {
    const selectedMode = document.querySelector('input[name="locationMode"]:checked').value;
    const mapContainer = document.getElementById('mapContainer');
    const gpsBtn = document.getElementById('gpsBtn');
    
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const statusText = document.getElementById('locationStatus');

    if (selectedMode === 'current') {
        // Mode 1: Automated GPS Location
        mapContainer.style.display = 'none';
        
        if (gpsBtn) {
            gpsBtn.disabled = false;
            gpsBtn.style.opacity = "1";
        }
        
        // Flush old entries to prevent mismatched stale data states
        latInput.value = '';
        lonInput.value = '';
        statusText.textContent = "Click the location button to capture your device position.";
        statusText.style.color = "#666";
        
        getAutomaticLocation();
    } else {
        // Mode 2: Interactive Map Selector
        mapContainer.style.display = 'block';
        
        if (gpsBtn) {
            gpsBtn.disabled = true;
            gpsBtn.style.opacity = "0.4"; // Visually indicator showing it is locked
        }
        
        statusText.textContent = "Interactive Map Active. Pin your coordinates below.";
        statusText.style.color = "#6c63ff";

        // 🚀 THE FIX: Give the browser 150 milliseconds to process the CSS visibility change, 
        // then cleanly compute the Leaflet tile canvas container sizes!
        setTimeout(() => {
            initializeInteractiveMap();
        }, 150);
    }
}

/**
 * Sets up the Leaflet Map view frame and attaches the custom crosshair handlers
 */
function initializeInteractiveMap() {
    // If map is already initialized, just refresh its bounding layout sizes and break
    if (mapInstance !== null) {
        setTimeout(() => mapInstance.invalidateSize(), 50);
        return;
    }

    // Default map camera tracking points (Centred on MVGR Campus area region)
    let startLat = 18.0535; 
    let startLon = 83.4345;

    // If an accurate hardware GPS track already exists in the input boxes, pivot the map camera there instead
    if (document.getElementById('latitude').value && document.getElementById('longitude').value) {
        startLat = parseFloat(document.getElementById('latitude').value);
        startLon = parseFloat(document.getElementById('longitude').value);
    }

    // 1. Initialize map on the target canvas ID
    mapInstance = L.map('map').setView([startLat, startLon], 14);

    // 2. Load and build OpenStreetMap's free graphics map layout tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // 3. Form crosshair capture logic callback
    mapInstance.on('click', function(e) {
        const clickedLat = e.latlng.lat;
        const clickedLon = e.latlng.lng;

        // Populate our form input boxes instantly
        document.getElementById('latitude').value = clickedLat.toFixed(6);
        document.getElementById('longitude').value = clickedLon.toFixed(6);

        // Update or move the red marker pin onto the clicked point
        if (mapMarker === null) {
            mapMarker = L.marker([clickedLat, clickedLon]).addTo(mapInstance);
        } else {
            mapMarker.setLatLng([clickedLat, clickedLon]);
        }
        
        document.getElementById('locationStatus').textContent = "Map coordinates pinned successfully!";
        document.getElementById('locationStatus').style.color = "#00a152";
    });
    
    // Safety check forcing render sizing pass calculation fixes
    setTimeout(() => mapInstance.invalidateSize(), 100);
}

/**
 * Standard Automated GPS coordinate fetch engine using the HTML5 hardware sensor API
 */
function getAutomaticLocation() {
    const statusText = document.getElementById('locationStatus');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');

    if (!navigator.geolocation) {
        statusText.textContent = "Geolocation is not supported by your browser.";
        statusText.style.color = "#e53935";
        return;
    }

    statusText.textContent = "Acquiring precision device coordinates...";
    statusText.style.color = "#ff9800";

    navigator.geolocation.getCurrentPosition(
        function (position) {
            latInput.value = position.coords.latitude.toFixed(6);
            lonInput.value = position.coords.longitude.toFixed(6);
            statusText.textContent = "Current location locked successfully!";
            statusText.style.color = "#00a152";
        },
        function (error) {
            statusText.textContent = "Could not track current position automatically. Please mark on map instead.";
            statusText.style.color = "#e53935";
            console.warn("Geolocation warning code:", error.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// ==========================================
// 3. INITIALIZATION LIFECYCLE
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    getAutomaticLocation();
});
async function fileComplaint(e) {
    e.preventDefault();

    // 1. Construct FormData (handles both text and files)
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('latitude', document.getElementById('latitude').value);
    formData.append('longitude', document.getElementById('longitude').value);
    formData.append('isAnonymous', document.getElementById('isAnonymous').value);

    // 2. Attach the binary file
    const fileInput = document.getElementById('evidence');
    if (fileInput.files.length > 0) {
        formData.append('evidence', fileInput.files[0]);
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/user/complaint`, {
            method: 'POST',
            headers: {
                // IMPORTANT: Do not set Content-Type header when using FormData!
                // The browser sets it automatically with a boundary.
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'ngrok-skip-browser-warning': 'true'
            },
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            alert("Complaint submitted successfully!");
            window.location.href = "user_dashboard.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Submission failed", err);
    }
}

// Bind to your form
document.getElementById("complaintForm").addEventListener("submit", fileComplaint);

async function fileComplaint(e) {
    e.preventDefault();

    const formData = new FormData();

    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('latitude', document.getElementById('latitude').value);
    formData.append('longitude', document.getElementById('longitude').value);
    formData.append('isAnonymous', document.getElementById('isAnonymous').value);

    const fileInput = document.getElementById('evidence');

    if (fileInput.files.length > 0) {
        formData.append('evidence', fileInput.files[0]);
    }

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/api/user/complaint`,
            {
                method: 'POST',
                headers: {
                    'Authorization':
                        'Bearer ' + localStorage.getItem('access_token'),
                    'ngrok-skip-browser-warning': 'true'
                },
                body: formData
            }
        );

        const result = await response.json();

        if (response.ok) {

            // Save locally for Staff Dashboard
            const complaintData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                latitude: document.getElementById('latitude').value,
                longitude: document.getElementById('longitude').value,
                anonymous: document.getElementById('isAnonymous').value,
                status: "Pending"
            };

            let complaints =
                JSON.parse(localStorage.getItem("complaints")) || [];

            complaints.push(complaintData);

            localStorage.setItem(
                "complaints",
                JSON.stringify(complaints)
            );

            alert("Complaint submitted successfully!");

            window.location.href = "user_dashboard.html";

        } else {

            alert("Error: " + result.message);

        }

    } catch (err) {

        console.error("Submission failed", err);

        alert("Failed to submit complaint.");

    }
}

document
    .getElementById("complaintForm")
    .addEventListener("submit", fileComplaint);