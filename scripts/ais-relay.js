// Secure local AIS relay for demos when a cloud host's shared IP is throttled.
require('dotenv').config();

const WebSocket = require('ws');

const apiKey = process.env.AIS_API_KEY;
const relayToken = process.env.AIS_RELAY_TOKEN;
const relayUrl = process.env.AIS_RELAY_URL || 'https://viabarcazas.com/api/internal/ais-ingest';
const boundingBoxes = [[[-36.0, -63.0], [-18.0, -53.0]]];

if (!apiKey || !relayToken) {
    console.error('Set AIS_API_KEY and AIS_RELAY_TOKEN before starting the AIS relay.');
    process.exit(1);
}

let reconnectAttempts = 0;
let reconnectTimer = null;
const pending = new Map();

function queuePosition(msg) {
    if (msg.MessageType !== 'PositionReport') return;
    const ship = msg.Message?.PositionReport;
    const mmsi = String(ship?.UserID || '');
    if (!/^\d{9}$/.test(mmsi)) return;

    pending.set(mmsi, {
        mmsi,
        name: String(msg.MetaData?.ShipName || 'Unknown').trim(),
        lat: ship.Latitude,
        lon: ship.Longitude,
        speed: ship.Sog || 0,
        course: ship.Cog || 0,
        heading: ship.TrueHeading || 0
    });
}

async function flush() {
    if (pending.size === 0) return;
    const positions = [...pending.values()];
    pending.clear();
    try {
        const response = await fetch(relayUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${relayToken}`
            },
            body: JSON.stringify({ positions })
        });
        if (!response.ok) throw new Error(`relay returned ${response.status}`);
    } catch (error) {
        // Preserve a bounded batch so a temporary outage does not erase data.
        for (const position of positions.slice(-250)) pending.set(position.mmsi, position);
        console.warn(`Relay delivery failed: ${error.message}`);
    }
}

function scheduleReconnect(reason) {
    if (reconnectTimer) return;
    const delay = Math.min(15_000 * (2 ** reconnectAttempts), 300_000);
    reconnectAttempts += 1;
    console.warn(`AIS disconnected (${reason}). Retrying in ${Math.round(delay / 1000)}s.`);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, delay);
}

function connect() {
    console.log('Connecting to AISStream from the local relay...');
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream', { perMessageDeflate: true });
    ws.on('open', () => {
        reconnectAttempts = 0;
        ws.send(JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: boundingBoxes,
            FilterMessageTypes: ['PositionReport']
        }));
    });
    ws.on('message', data => {
        try { queuePosition(JSON.parse(data.toString())); } catch (_) { /* Ignore malformed provider payloads. */ }
    });
    ws.on('error', error => console.warn(`AIS relay error: ${error.message}`));
    ws.on('close', code => scheduleReconnect(code));
}

setInterval(flush, 5_000);
process.on('SIGINT', async () => {
    await flush();
    process.exit(0);
});

connect();
