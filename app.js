const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

fs.writeFileSync('app_debug.log', `App starting at ${new Date().toISOString()}\n`);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- CONFIGURACIÓN ---
setInterval(() => {
    // Keep alive
}, 10000);
const API_KEY = "REDACTED_AIS_KEY_2";

// ZONA COMPLETA: Hidrovia Paraguay-Parana (Ampliada)
const HIDROVIA_BOX = [[[-36.0, -63.0], [-18.0, -53.0]]];

// 1. Servir la Web
app.use(express.static(path.join(__dirname, 'public')));

// 2. Conexión Satélite
function startAISStream() {
    console.log("📡 Conectando a AISStream (ZONA: Hidrovia Completa)...");
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

    ws.on('open', () => {
        console.log("✅ Satélite Conectado. Enviando suscripción para API Key: " + API_KEY.substring(0, 5) + "...");
        const sub = {
            Apikey: API_KEY,
            BoundingBoxes: HIDROVIA_BOX,
            FilterMessageTypes: ["PositionReport"]
        };
        ws.send(JSON.stringify(sub));
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.MessageType === "PositionReport") {
                const ship = msg.Message.PositionReport;
                // Add Metadata if available
                if (msg.MetaData && msg.MetaData.ShipName) {
                    ship.ShipName = msg.MetaData.ShipName.trim();
                }
                // Reenviar a la web en tiempo real
                io.emit('position_update', ship);
                // Log traffic to console for debug
                console.log(`📡 AIS RX: ${ship.ShipName || 'Unknown'} (${ship.UserID})`);
            }
        } catch (e) { }
    });

    ws.on('error', (e) => console.log("⚠️ Error AIS (Satelite inestable):", e.message));

    ws.on('close', (code, reason) => {
        console.log(`❌ Satélite Desconectado (Código: ${code}). Reintentando en 10s...`);
        // Retry slower to avoid spamming
        setTimeout(startAISStream, 10000);
    });
}

// startAISStream(); // ✅ ACTIVADO: Modo Real

// --- SIMULATION MODE (DISABLED FOR PRODUCTION) ---
/*
const demoShips = [
    // ... (Simulation Data) ...
];

setInterval(() => {
    // ... (Simulation Logic) ...
}, 2000);
*/

// 3. Iniciar Servidor
// --- SERVER INIT ---
// --- SERVER INIT ---
// --- WEBSOCKET SETUP (SEPARATE PORT TO AVOID SOCKET.IO CONFLICT) ---
// socket.io ya maneja el puerto 3000 para la web.
// Levantamos un WS puro en 8081 para la App Android (Simulación).
// const wss = new WebSocket.Server({ port: 8085 });
console.log("📡 Servidor de Simulación Android (DESACTIVADO TEMPORALMENTE)");

// wss.on('connection', (ws) => {
//     console.log('✅ Cliente Android conectado al stream de simulación (Puerto 8085)');
//
//     // Send welcome/status
//     ws.send(JSON.stringify({
//         type: 'status',
//         message: 'Conectado a Riverhub Simulation (Port 8085)'
//     }));
//
//     // Handle incoming
//     ws.on('message', (message) => {
//         // Echo or process
//     });
// });



// START SERVER
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RIVERHUB PREMIUM SERVER ONLINE en puerto ${PORT}`);
    console.log(`📡 WebSocket listo en el mismo puerto.`);
    fs.appendFileSync('app_debug.log', `Server successfully listening on port ${PORT}\n`);
}).on('error', (e) => {
    console.error("SERVER ERROR:", e);
    fs.appendFileSync('app_crash.log', `Server Error: ${e.message}\n`);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    fs.appendFileSync('app_crash.log', `Uncaught Exception: ${err.message}\n${err.stack}\n`);
    process.exit(1);
});
