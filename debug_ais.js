const WebSocket = require('ws');
const fs = require('fs');

const API_KEY = "03c1181d69bc2b5d5d55f53e6b7b68d25c09ec2a";
const HIDROVIA_BOX = [[[-35.0, -62.0], [-19.0, -54.0]]];
const LOG_FILE = 'debug_result.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Clear log
fs.writeFileSync(LOG_FILE, "--- Test Started ---\n");

log("🛠️ Starting connection test to AISStream.io...");

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

ws.on('open', () => {
    log("✅ WebSocket Open! Sending subscription...");
    const sub = {
        Apikey: API_KEY,
        BoundingBoxes: HIDROVIA_BOX,
        FilterMessageTypes: ["PositionReport"]
    };
    ws.send(JSON.stringify(sub));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    log(`[MSG] Type: ${msg.MessageType}`);
});

ws.on('error', (e) => {
    log(`❌ WebSocket Error: ${e.message}`);
});

ws.on('close', (code, reason) => {
    log(`⚠️ WebSocket Closed. Code: ${code}, Reason: ${reason}`);
});
