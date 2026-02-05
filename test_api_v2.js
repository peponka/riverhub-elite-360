const https = require('https');
const fs = require('fs');

const API_KEY = "90858d9e-d175-43f6-b845-98dc20a2e3fa";
const MMSI = "566093000";
const url = `https://api.datalastic.com/api/v0/vessel?api-key=${API_KEY}&mmsi=${MMSI}`;

function log(msg) {
    console.log(msg);
    fs.appendFileSync('api_result_v2.log', msg + '\n');
}

// Clear previous log
try { fs.unlinkSync('api_result_v2.log'); } catch (e) { }

log("Fetching Support URL: " + url);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        log("Status Code: " + res.statusCode);
        log("Headers: " + JSON.stringify(res.headers, null, 2));

        try {
            log("Body Full: " + data);
            const json = JSON.parse(data);
            if (json.data && json.data.length > 0) {
                log("SUCCESS: Vessel Found -> " + json.data[0].name);
            } else {
                log("WARNING: Empty Data Array");
            }
        } catch (e) {
            log("Body (Not JSON): " + data);
        }
    });

}).on("error", (err) => {
    log("Error: " + err.message);
});
