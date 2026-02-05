const https = require('https');

// Config
const API_KEY = '90858d9e-d175-43f6-b845-98dc20a2e3fa';
const lat = -27.0;
const lon = -58.5;
const radius = 50; // Try smaller radius
const url = `https://api.datalastic.com/api/v0/vessel_inradius?api-key=${API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}`;

console.log(`Testing URL: ${url}`);

https.get(url, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            console.log("Response Body:", data);
            const json = JSON.parse(data);
            if (json.data) {
                console.log(`SUCCESS: Found ${json.data.length} vessels.`);
            } else {
                console.log("FAILURE: No data field.");
            }
        } catch (e) {
            console.error("JSON Parse Error or Raw Body:", data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
