try {
    const express = require('express');
    const http = require('http');
    const { Server } = require("socket.io");
    const WebSocket = require('ws');
    const cors = require('cors');

    console.log("Modules loaded");

    // 1. Configuración del Servidor Web
    const app = express();
    app.use(cors());
    app.use(express.static('public'));

    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    console.log("Server created, setting up sockets...");

    // --- IMPORTANTE: CAMBIAR ESTO POR LA API KEY REAL ---
    const API_KEY = "REDACTED_AIS_KEY_2";
    const HIDROVIA_BOX = [[[-35.0, -62.0], [-19.0, -54.0]]];

    console.log("🚀 Iniciando Servidor RiverHub...");

    // 2. Conexión al Satélite (AISStream)
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

    socket.on('open', () => {
        console.log("📡 Conectando a AISStream...");
        const sub = {
            Apikey: API_KEY,
            BoundingBoxes: HIDROVIA_BOX,
            FilterMessageTypes: ["PositionReport"]
        };
        socket.send(JSON.stringify(sub));
    });

    socket.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            const ship = msg.Message.PositionReport;
            ship.ShipName = msg.MetaData && msg.MetaData.ShipName ? msg.MetaData.ShipName.trim() : `Vessel ${ship.UserID}`;
            io.emit('position_update', ship);
            // Log traffic to console for debug
            console.log(`📡 AIS RX: ${ship.ShipName} (${ship.UserID})`);
        } catch (e) { }
    });

    socket.on('error', (err) => console.error("❌ Error AIS (Ignorado en Demo):", err.message));

    // --- MODO SIMULACION IA (Smart Traffic) ---
    if (API_KEY.includes("TU_API_KEY")) {
        console.log("\n⚠️ MODO SIMULACIÓN ACTIVADO: Generando tráfico virtual...");
        const sims = [
            { id: 9901, name: "B/M TITAN (Sim)", lat: -25.29, lng: -57.60, d: 0.0005 },
            { id: 9902, name: "R/M HERCULES (Sim)", lat: -25.26, lng: -57.58, d: -0.0005 },
            { id: 9903, name: "B/M CENTAURO (Sim)", lat: -25.32, lng: -57.62, d: 0.0005 }
        ];

        setInterval(() => {
            sims.forEach(s => {
                s.lat += s.d;
                if (s.lat > -25.20 || s.lat < -25.35) s.d *= -1; // Patrullaje

                io.emit('position_update', {
                    UserID: s.id,
                    ShipName: s.name,
                    Latitude: s.lat,
                    Longitude: s.lng,
                    Sog: 6.5,
                    Cog: s.d > 0 ? 0 : 180,
                    isLive: false
                });
            });
        }, 3000);
    }

    // 3. Encender Puerto 3000
    server.listen(3000, () => {
        console.log('\n🌍 PUENTE LISTO: Escuchando en puerto 3000 (PID: ' + process.pid + ')');
    });

} catch (err) {
    console.error("FATAL SERVER ERROR:", err);
}
