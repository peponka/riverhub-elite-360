const WebSocket = require('ws');

// --- TU API KEY ---
const API_KEY = "de63bdf1b364c8320a7b2b66f7841ac797573dca"; // Pre-filled for convenience

// Puerto para el Mapa
const LOCAL_PORT = 3000;

// 1. Servidor Local (Para que se conecte el mapa)
const wss = new WebSocket.Server({ port: LOCAL_PORT });
console.log(`🌍 PUENTE LISTO: Esperando mapa en puerto ${LOCAL_PORT}...`);

// 2. Cliente AIS (Conexión al satélite)
const remoteSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

remoteSocket.on('open', () => {
    console.log("📡 Conectando a Satélite...");
    const subscription = {
        Apikey: API_KEY,
        BoundingBoxes: [[[-35.0, -62.0], [-19.0, -54.0]]], // Hidrovía
        FilterMessageTypes: ["PositionReport"]
    };
    remoteSocket.send(JSON.stringify(subscription));
});

remoteSocket.on('message', (data) => {
    const msgString = data.toString(); // Convertir buffer a texto

    // Reenviar (Broadcast) a todos los mapas conectados
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msgString);
        }
    });
    // Visual feedback
    process.stdout.write(".");
});

remoteSocket.on('error', (err) => console.error("❌ Error AIS:", err.message));
remoteSocket.on('close', () => console.log("⚠️ Conexión Satélite Cerrada."));
