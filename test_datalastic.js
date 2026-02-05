const https = require('https');

const API_KEY = '90858d9e-d175-43f6-b845-98dc20a2e3fa';
const LAT = -27.0;
const LON = -58.5;
const RADIUS = 300; // Nautical Miles

const url = `https://api.datalastic.com/api/v0/vessel_inradius?api-key=${API_KEY}&lat=${LAT}&lon=${LON}&radius=${RADIUS}`;

console.log(`Fetching: ${url}`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("Response (Not JSON):", data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
