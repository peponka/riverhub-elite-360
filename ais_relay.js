const WebSocket = require('ws');
const fs = require('fs');

process.on('uncaughtException', (err) => {
    fs.writeFileSync('ais_error.log', `Uncaught Exception: ${err.message}\n${err.stack}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    fs.writeFileSync('ais_error.log', `Unhandled Rejection: ${reason}`);
    process.exit(1);
});

// --- TU API KEY ---
const API_KEY = "REDACTED_AIS_KEY_2"; // Pre-filled for convenience

// Puerto para el Mapa
const LOCAL_PORT = 3001;
fs.writeFileSync('ais_debug_start.log', `Iniciando script a las ${new Date().toISOString()}\n`);

// 1. Servidor Local (Para que se conecte el mapa)
const wss = new WebSocket.Server({ port: LOCAL_PORT });

wss.on('listening', () => {
    const msg = `🌍 PUENTE LISTO: Esperando mapa en puerto ${LOCAL_PORT}...\n`;
    console.log(msg);
    fs.appendFileSync('ais_debug_start.log', msg);
});

wss.on('error', (err) => {
    const msg = `❌ Error en Servidor Local: ${err.message}\n`;
    console.error(msg);
    fs.appendFileSync('ais_debug_start.log', msg);
});

// 2. Cliente AIS (Conexión al satélite)
// 2. Cliente AIS (Conexión al satélite)
let remoteSocket;

function connectToSatellite() {
    console.log("📡 Conectando a Satélite...");
    remoteSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

    remoteSocket.on('open', () => {
        console.log("✅ Satélite Conectado");
        const subscription = {
            Apikey: API_KEY,
            BoundingBoxes: [[[-35.0, -62.0], [-19.0, -54.0]]], // Hidrovía (Paraguay/Argentina)
            FilterMessageTypes: ["PositionReport"]
        };
        remoteSocket.send(JSON.stringify(subscription));
    });

    let msgCount = 0;
    remoteSocket.on('message', (data) => {
        msgCount++;
        if (msgCount === 1) {
            fs.appendFileSync('ais_debug_start.log', "✅ PRIMER MENSAJE RECIBIDO (SISTEMA FUNCIONANDO)\n");
            console.log("✅ FLUJO DE DATOS ACTIVO");
        }
        const msgString = data.toString();

        // Reenviar (Broadcast) a todos los mapas conectados
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msgString);
            }
        });
        // Visual feedback (limitado para no llenar log)
        if (msgCount % 50 === 0) process.stdout.write(".");
    });

    remoteSocket.on('error', (err) => {
        console.error("❌ Error AIS:", err.message);
    });

    remoteSocket.on('close', () => {
        console.log("⚠️ Conexión Satélite Cerrada. Reconectando en 5s...");
        setTimeout(connectToSatellite, 5000);
    });
}

connectToSatellite();

// Keep Alive del proceso
setInterval(() => {
    // Solo para mantener el proceso vivo
    const mem = process.memoryUsage();
}, 60000);
