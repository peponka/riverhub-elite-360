const WebSocket = require('ws');

// --- CONFIGURACIÓN ---
const API_KEY = "de63bdf1b364c8320a7b2b66f7841ac797573dca"; // Provided by User
const LOCAL_PORT = 3000;

// 1. Servidor Local (Para el Mapa)
const wss = new WebSocket.Server({ port: LOCAL_PORT });
console.log(`🌍 Relay Local esperando conexiones en ws://localhost:${LOCAL_PORT}`);

// 2. Cliente AIS (Satélite)
const aisSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

aisSocket.on('open', () => {
    console.log("📡 Conectado a AISStream.io");
    const sub = {
        Apikey: API_KEY,
        BoundingBoxes: [[[-35.0, -62.0], [-19.0, -54.0]]], // Hidrovía
        FilterMessageTypes: ["PositionReport"]
    };
    aisSocket.send(JSON.stringify(sub));
});

aisSocket.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        if (msg.MessageType === "PositionReport" || msg.Message && msg.Message.PositionReport) {
            // Reenviar a todos los clientes (browsers)
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data.toString());
                }
            });
            process.stdout.write("."); // Visual heartbeat
        }
    } catch (e) {
        // Ignorar
    }
});

aisSocket.on('error', (err) => console.error("Error AIS:", err));
aisSocket.on('close', () => console.log("⚠️ Conexión AIS Cerrada. Reinicia el script para reconectar."));
