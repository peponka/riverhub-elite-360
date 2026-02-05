const WebSocket = require('ws');

const API_KEY = "REDACTED_AIS_KEY_2";
const SOCKET_URL = "wss://stream.aisstream.io/v0/stream";
const SUBSCRIPTION_BOX = [[[-35.0, -62.0], [-19.0, -54.0]]]; // Hidrovia

console.log("TEST: Connecting to AISStream (Hidrovia)...");

const socket = new WebSocket(SOCKET_URL);

socket.on('open', () => {
    console.log("✅ Socket Open. Sending subscription...");

    const sub = {
        Apikey: API_KEY,
        BoundingBoxes: SUBSCRIPTION_BOX,
        FilterMessageTypes: ["PositionReport"]
    };
    socket.send(JSON.stringify(sub));
});

socket.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        if (msg.MessageType === "PositionReport") {
            const ship = msg.MetaData.ShipName;
            console.log(`✅ SUCCESS: Received ship '${ship}'`);
            process.exit(0);
        }
    } catch (error) {
        console.log("Parsing error", error);
    }
});

socket.on('error', (err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});

socket.on('close', (code, reason) => {
    console.log(`❌ Closed. Code: ${code} (Check API Key?)`);
});
