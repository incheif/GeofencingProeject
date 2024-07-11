let map;
let currentData = []; // To store all location data
let filterNumber = 1; // Default filter number
let filterUnit = 'hours'; // Default filter unit

document.addEventListener('DOMContentLoaded', function () {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Default to the center of India

    // Add MapTiler tile layer
    L.tileLayer('https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=mbDwiByVth6NBS6Gcy1g', {
        zoom: 5,
        attribution: '\u003ca href="https://www.maptiler.com/copyright/" target="_blank">\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank">\u0026copy; OpenStreetMap contributors\u003c/a\u003e'
    }).addTo(map);

    const deviceSelect = document.getElementById('device-select');
    for (let i = 1; i <= 35; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Device ${i}`;
        deviceSelect.appendChild(option);
    }
    setInterval(fetchAndPlotLocations, 15000);
});

function fetchAndPlotLocations() {
    const deviceId = document.getElementById('device-select').value || 1; // Default to Device 1 if no device is selected
    fetch(`/api/locations?device_id=${deviceId}`)
        .then(response => response.json())
        .then(data => {
            currentData = data; // Store all location data
            applyCurrentFilter(); // Apply the current filter
        })
        .catch(error => console.error('Error fetching location data:', error));
}

function plotLocations(data) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    const latlngs = data.map(loc => [loc.latitude, loc.longitude]);

    // Add markers only at the starting and ending locations
    if (latlngs.length > 0) {
        const startMarker = L.marker(latlngs[0], {icon: createCustomIcon('green',0)}).addTo(map);
        startMarker.bindPopup(getPopupContent(data[0],0));
        const colors = createGradientColors('#00FF00', '#0000FF', latlngs.length - 1);
        for (let i = 1; i < latlngs.length - 1; i++) {
            const marker = L.marker(latlngs[i], {icon: createCustomIcon(colors[i],5)}).addTo(map);
            marker.bindPopup(getPopupContent(data[i],5));
        }
        if (latlngs.length > 1) {
            const endMarker = L.marker(latlngs[latlngs.length - 1], {icon: createCustomIcon('blue',1)}).addTo(map);
            endMarker.bindPopup(getPopupContent(data[data.length - 1],1));
        }

        // Create gradient colors

        // Add polyline segments with gradient colors
        for (let i = 0; i < latlngs.length - 1; i++) {
            L.polyline([latlngs[i], latlngs[i + 1]], { color: colors[i] }).addTo(map);
        }

        map.fitBounds(L.polyline(latlngs).getBounds());
    }
}

function createCustomIcon(color,index) {
    if(index == 0 || index == 1){
        return L.divIcon({
            className: 'custom-marker-icon',
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="${color}" /></svg>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    }
    else{
        return L.divIcon({
            className: 'custom-marker-icon',
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="5" fill="${color}" /></svg>`,
            iconSize: [5, 5],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    }
}

function createGradientColors(startColor, endColor, steps) {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    const stepFactor = 1 / steps;
    const interpolatedColorArray = [];

    for (let i = 0; i < steps; i++) {
        interpolatedColorArray.push(interpolateColor(start, end, stepFactor * i));
    }

    return interpolatedColorArray.map(rgbToHex);
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function rgbToHex(rgb) {
    return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)}`;
}

function interpolateColor(start, end, factor) {
    const result = start.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (end[i] - start[i]));
    }
    return result;
}

function getPopupContent(data, index) {
    const time = new Date(data.time).toLocaleString();
    const district = data.district;
    const state = data.state;
    if(index == 0){
        return `<b>Starting Point</b><br><b>Time:</b> ${time}<br>District: ${district}<br>State: ${state}`;
    }
    else if(index == 1){
        return `<b>Current Point</b><br><b>Time:</b> ${time}<br>District: ${district}<br>State: ${state}`;
    }
    else{
        return `<b>Time:</b> ${time}<br>District: ${district}<br>State: ${state}`;
    }
}

function applyTimeFilter() {
    filterNumber = parseInt(document.getElementById('time-number').value);
    filterUnit = document.getElementById('time-unit').value;
    applyCurrentFilter();
}

function applyCurrentFilter() {
    const fromDate = new Date();
    switch (filterUnit) {
        case 'hours':
            fromDate.setHours(fromDate.getHours() - filterNumber);
            break;
        case 'days':
            fromDate.setDate(fromDate.getDate() - filterNumber);
            break;
        case 'weeks':
            fromDate.setDate(fromDate.getDate() - (filterNumber * 7));
            break;
        case 'months':
            fromDate.setMonth(fromDate.getMonth() - filterNumber);
            break;
        default:
            break;
    }

    const filteredData = currentData.filter(item => new Date(item.time) >= fromDate);
    plotLocations(filteredData);
}

function showLastLocation() {
    if (currentData.length > 0) {
        const lastLocation = currentData[currentData.length - 1];
        const latlng = [lastLocation.latitude, lastLocation.longitude];

        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        const marker = L.marker(latlng).addTo(map);
        marker.bindPopup(getPopupContent(lastLocation)).openPopup();
        map.setView(latlng, 15);
    } else {
        alert('No location data available.');
    }
}

document.getElementById('device-select').addEventListener('change', fetchAndPlotLocations);