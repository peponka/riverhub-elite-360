const https = require('https');
const fs = require('fs');

const API_KEY = "90858d9e-d175-43f6-b845-98dc20a2e3fa";
const MMSI = "566093000";
const url = `https://api.datalastic.com/api/v0/vessel?api-key=${API_KEY}&mmsi=${MMSI}`;

console.log("Starting Request...");

https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const result = `Status: ${res.statusCode}\nHeaders: ${JSON.stringify(res.headers)}\nBody: ${data}`;
        console.log(result);
        fs.writeFileSync('api_result_v3.txt', result);
    });
}).on("error", (err) => {
    fs.writeFileSync('api_result_v3.txt', "Global Error: " + err.message);
});
