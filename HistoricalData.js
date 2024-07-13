let allLocations = [];
let filteredLocations = [];
let map;
let markersLayer = new L.LayerGroup();
let currentPage = 1;
const rowsPerPage = 10; // You can adjust this number as needed

function displayLocations(locations) {
    const table = document.getElementById("locationData");
    table.innerHTML = ""; // Clear existing data

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageLocations = locations.slice(startIndex, endIndex);
    const PageLocations=pageLocations.reverse();
    PageLocations.forEach(function(location) {
        var row = table.insertRow();
        row.insertCell(0).textContent = location.time;
        row.insertCell(1).textContent = location.latitude.toFixed(4);
        row.insertCell(2).textContent = location.longitude.toFixed(4);
        row.insertCell(3).textContent = location.district;
        row.insertCell(4).textContent = location.state;
        row.insertCell(5).textContent = location.status;
    });

    updatePaginationControls(locations.length);
}

function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

function goToNextPage() {
    if (currentPage < Math.ceil(filteredLocations.length / rowsPerPage)) {
        currentPage++;
        displayLocations(filteredLocations);
    }
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayLocations(filteredLocations);
    }
}

// Add event listeners for pagination buttons
document.getElementById('next-page').addEventListener('click', goToNextPage);
document.getElementById('prev-page').addEventListener('click', goToPrevPage);

// Generate device options from 1 to 35 (as per your example)
const deviceSelect = document.getElementById('device-select');
for (let i = 1; i <= 35; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Device ${i}`;
    deviceSelect.appendChild(option);
}

function fetchLocations() {
    var xhr = new XMLHttpRequest();
    var url = `/api/locations?device_id=${deviceSelect.value}`;
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var locations = JSON.parse(xhr.responseText);
            allLocations = locations;
            applyTimeFilter();
        }
    };
    deviceSelect.addEventListener('change', function() {
currentPage = 1; // Reset to first page when changing device
fetchLocations();
});
    xhr.send();
}

function applyTimeFilter() {
const startTime = document.getElementById('start-time').value;
const endTime = document.getElementById('end-time').value;

if (startTime || endTime) {
filteredLocations = allLocations.filter(location => {
    const locationTime = new Date(location.time);
    const isAfterStart = !startTime || locationTime >= new Date(startTime);
    const isBeforeEnd = !endTime || locationTime <= new Date(endTime);
    return isAfterStart && isBeforeEnd;
});
} else {
filteredLocations = allLocations;
}
currentPage = 1; // Reset to first page when applying filter
displayLocations(filteredLocations);
}

function filterLastDay() {
    const now = new Date();
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setFilterTimes(lastDay, now);
}

function filterLastWeek() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setFilterTimes(lastWeek, now);
}

function filterLastMonth() {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFilterTimes(lastMonth, now);
}

function setFilterTimes(startTime, endTime) {
    document.getElementById('start-time').value = startTime.toISOString().slice(0, 16);
    document.getElementById('end-time').value = '' ;
    applyTimeFilter();
}

function filterLocationsByTime(startTime, endTime) {
    filteredLocations = allLocations.filter(location => {
        const locationTime = new Date(location.time);
        return locationTime >= startTime && locationTime <= endTime;
    });
    currentPage = 1; // Reset to first page when applying filter
    displayLocations(filteredLocations);
}


deviceSelect.addEventListener('change', fetchLocations);

function exportTableToCSV() {
    const csv = [["Time", "Latitude", "Longitude", "District", "State"]];

    filteredLocations.forEach(location => {
        csv.push([
            location.time,
            location.latitude.toFixed(4),
            location.longitude.toFixed(4),
            location.district,
            location.state
        ]);
    });

    const csvContent = csv.map(row => row.join(",")).join("\n");
    const csvFile = new Blob([csvContent], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = `device_${deviceSelect.value}_data.csv`;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function exportAllDataToCSV() {
    const wb = XLSX.utils.book_new();
    let fetchCount = 0;

    for (let i = 1; i <= 35; i++) {
        const xhr = new XMLHttpRequest();
        const url = `/api/locations?device_id=${i}`;
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const locations = JSON.parse(xhr.responseText);
                const sheetData = locations.map(location => [
                    location.time,
                    location.latitude,
                    location.longitude,
                    location.district,
                    location.state
                ]);
                sheetData.unshift(["Time", "Latitude", "Longitude", "District", "State"]);
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, `Device ${i}`);

                fetchCount++;
                if (fetchCount === 35) {
                    XLSX.writeFile(wb, 'all_devices_data.xlsx');
                }
            }
        };
        xhr.send();
    }
}
document.addEventListener('DOMContentLoaded', function () {
    fetchLocations();
    setInterval(fetchLocations, 15000); // Refresh data every 15 seconds
});