const FIREBASE_URL = "https://water-quality-a6586-default-rtdb.firebaseio.com";

// Helper: round values
function roundVal(val) {
    return Math.round(parseFloat(val) * 100) / 100;
}

// Load latest data
function loadLatestData() {
    fetch(`${FIREBASE_URL}/latestWaterQuality.json`)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("latestData");
            if (!data) {
                container.innerHTML = "<p class='no-data'>No latest data found.</p>";
                return;
            }
            container.innerHTML = `
                <div class="card">
                    <i class="fas fa-vial icon"></i>
                    <h2>pH Level</h2>
                    <p>${roundVal(data.phLevel)}</p>
                </div>
                <div class="card">
                    <i class="fas fa-temperature-high icon"></i>
                    <h2>Temperature</h2>
                    <p>${roundVal(data.temperature)} °C</p>
                </div>
                <div class="card">
                    <i class="fas fa-water icon"></i>
                    <h2>Turbidity</h2>
                    <p>${roundVal(data.turbidity)}</p>
                </div>
                <div class="card">
                    <i class="fas fa-tint icon"></i>
                    <h2>Water Level</h2>
                    <p>${roundVal(data.waterLevel)}%</p>
                </div>
            `;
        })
        .catch(err => console.error(err));
}

// Load history data
function loadHistoryData() {
    fetch(`${FIREBASE_URL}/historyWaterQuality.json`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#historyTable tbody");
            tbody.innerHTML = "";
            if (!data) {
                tbody.innerHTML = "<tr><td colspan='5'>No history data found.</td></tr>";
                return;
            }
            Object.values(data).reverse().forEach(entry => {
                const row = `
                    <tr>
                        <td>${entry.dateTime || new Date(entry.timestamp).toLocaleString()}</td>
                        <td>${roundVal(entry.phLevel)}</td>
                        <td>${roundVal(entry.temperature)}</td>
                        <td>${roundVal(entry.turbidity)}</td>
                        <td>${roundVal(entry.waterLevel)}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        })
        .catch(err => console.error(err));
}

// Download history as Excel
function downloadHistoryExcel() {
    fetch(`${FIREBASE_URL}/historyWaterQuality.json`)
        .then(res => res.json())
        .then(data => {
            if (!data) {
                alert("No data to download.");
                return;
            }
            const rows = [["Date & Time", "pH", "Temperature (°C)", "Turbidity", "Water Level (%)"]];
            Object.values(data).forEach(entry => {
                rows.push([
                    entry.dateTime || new Date(entry.timestamp).toLocaleString(),
                    roundVal(entry.phLevel),
                    roundVal(entry.temperature),
                    roundVal(entry.turbidity),
                    roundVal(entry.waterLevel)
                ]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "History");
            XLSX.writeFile(workbook, "WaterQualityHistory.xlsx");
        })
        .catch(err => console.error(err));
}

document.getElementById("saveLimits").addEventListener("click", () => {
    const limitsData = {
        phLow: parseFloat(document.getElementById("phLow").value),
        phHigh: parseFloat(document.getElementById("phHigh").value),
        tdsLow: parseFloat(document.getElementById("tdsLow").value),
        tdsHigh: parseFloat(document.getElementById("tdsHigh").value),
    };

    fetch("https://water-quality-a6586-default-rtdb.firebaseio.com/limitsPath.json", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(limitsData)
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to update limits");
        return response.json();
    })
    .then(data => {
        console.log("Limits updated:", data);
        alert("Limits saved successfully!");
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Error saving limits");
    });
});


// Auto-refresh every 5 seconds
setInterval(loadLatestData, 5000);
setInterval(loadHistoryData, 5000);

// Initial load
loadLatestData();
loadHistoryData();
