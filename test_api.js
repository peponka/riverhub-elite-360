const https = require('https');
const fs = require('fs');

const API_KEY = "90858d9e-d175-43f6-b845-98dc20a2e3fa";
// AREA: Parana River area (approx)
// Lat: -27.30, Lon: -58.70 (Corrientes/Resistencia)
// Radius: 50km
const url = `https://api.datalastic.com/api/v0/vessel_inradius?api-key=${API_KEY}&lat=-27.30&lon=-58.70&radius=50&days=3`;

function log(msg) {
    fs.appendFileSync('api_datalastic_test.log', msg + '\n');
}

try { fs.unlinkSync('api_datalastic_test.log'); } catch (e) { }

log("🛰️ Testing Datalastic API (InRadius Check)...");
log("URL: " + url);

https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        log("------------------------------------------------");
        log("Status Code: " + res.statusCode);
        try {
            const json = JSON.parse(data);
            if (json.data && json.data.length > 0) {
                log(`✅ SUCCESS! Found ${json.data.length} ships in radius.`);
                json.data.slice(0, 5).forEach(v => {
                    log(`   🚢 ${v.name} (${v.type}) -> ${v.lat}, ${v.lon}`);
                });
            } else {
                log("⚠️ Response valid but 0 ships found in radius.");
                log("Meta: " + JSON.stringify(json.meta));
            }
        } catch (e) { log("❌ Error: " + data); }
    });
});
