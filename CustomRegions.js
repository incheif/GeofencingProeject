let map;
let circleLayer = new L.LayerGroup();
let polygonLayer = new L.LayerGroup();
let polygonCoordinates = [];
let currentData = [];

document.addEventListener('DOMContentLoaded', function () {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Center of India

    L.tileLayer('https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=mbDwiByVth6NBS6Gcy1g', {
        attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
    }).addTo(map);

    circleLayer.addTo(map);
    polygonLayer.addTo(map);

    fetchAllDevices();
});

function fetchAllDevices() {
    fetch('/api/latest_locations')  // This should be the endpoint that returns all device locations
        .then(response => response.json())
        .then(data => {
            currentData = data; // Store all device data
            plotDevices(currentData); // Plot all devices initially
        })
        .catch(error => console.error('Error fetching device data:', error));
}

function addCoordinateInput() {
    const container = document.createElement('div');
    container.innerHTML = '<input type="text" placeholder="Latitude" class="lat-input"> <input type="text" placeholder="Longitude" class="lng-input">';
    document.getElementById('coordinate-inputs').appendChild(container);
}

function createPolygon() {
    polygonCoordinates = [];
    document.querySelectorAll('#coordinate-inputs div').forEach(inputContainer => {
        const lat = parseFloat(inputContainer.querySelector('.lat-input').value);
        const lng = parseFloat(inputContainer.querySelector('.lng-input').value);
        if (!isNaN(lat) && !isNaN(lng)) {
            polygonCoordinates.push([lat, lng]);
        }
    });

    if (polygonCoordinates.length >= 3) {
        polygonLayer.clearLayers();
        const polygon = L.polygon(polygonCoordinates).addTo(polygonLayer);
        map.fitBounds(polygon.getBounds());
    } else {
        alert('Please enter at least 3 valid coordinates to form a polygon.');
    }
}

function savePolygon() {
    if (polygonCoordinates.length >= 3) {
        const polygonName = prompt('Enter a name for this custom region:');
        if (polygonName) {
            const regions = JSON.parse(localStorage.getItem('customRegions')) || [];
            regions.push({ name: polygonName, coordinates: polygonCoordinates });
            localStorage.setItem('customRegions', JSON.stringify(regions));
            alert('Custom region saved successfully!');
        }
    } else {
        alert('Please create a valid polygon before saving.');
    }
}

function createCircle() {
    const lat = parseFloat(document.getElementById('circle-lat').value);
    const lng = parseFloat(document.getElementById('circle-lng').value);
    const radius = parseFloat(document.getElementById('circle-radius').value)*1000;

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        circleLayer.clearLayers();
        const circle = L.circle([lat, lng], { radius: radius }).addTo(circleLayer);
        map.fitBounds(circle.getBounds());
    } else {
        alert('Please enter valid coordinates and radius.');
    }
}

function saveCircle() {
    const lat = parseFloat(document.getElementById('circle-lat').value);
    const lng = parseFloat(document.getElementById('circle-lng').value);
    const radius = parseFloat(document.getElementById('circle-radius').value)*1000;

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        const circleName = prompt('Enter a name for this custom region:');
        if (circleName) {
            const regions = JSON.parse(localStorage.getItem('customRegions')) || [];
            regions.push({ name: circleName, center: [lat, lng], radius: radius });
            localStorage.setItem('customRegions', JSON.stringify(regions));
            alert('Custom region saved successfully!');
        }
    } else {
        alert('Please create a valid circle before saving.');
    }
}

function plotDevices(devices) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    devices.forEach(device => {
        const marker = L.marker([device.latitude, device.longitude]).addTo(map);
        marker.bindPopup(`<b>Device ID:</b> ${device.device_id}<br>Latitude: ${device.latitude}<br>Longitude: ${device.longitude}<br>District: ${device.district}<br>State: ${device.state}<br>Time: ${device.time}`);
    });
}

document.getElementById('shape-select').addEventListener('change', function () {
    const shape = this.value;
    document.getElementById('polygon-controls').style.display = shape === 'polygon' ? 'block' : 'none';
    document.getElementById('circle-controls').style.display = shape === 'circle' ? 'block' : 'none';
});