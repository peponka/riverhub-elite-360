const WebSocket = require('ws');

// --- TU API KEY ---
// Reemplaza esto con tu clave real de aisstream.io
const API_KEY = "c1422c1d2db86c1ac54a1c9b23c0e90782b82b22";

const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

socket.on('open', () => {
    console.log("📡 Conectando al satélite AIS (Zona Hidrovía)...");

    const subscriptionMessage = {
        Apikey: API_KEY,
        // Coordenadas: [[Lat Sur, Lon Oeste], [Lat Norte, Lon Este]]
        // Cubre desde Buenos Aires hasta Asunción/Corumbá
        BoundingBoxes: [
            [[-35.0, -62.0], [-19.0, -54.0]]
        ],
        // Filtramos solo reportes de posición para no saturar la consola
        FilterMessageTypes: ["PositionReport"]
        // Nota: FiltersShipMMSI lo dejamos comentado para ver TODOS los barcos primero
        // FiltersShipMMSI: ["368207620", "367719770"] 
    };

    socket.send(JSON.stringify(subscriptionMessage));
});

socket.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        if (message.MessageType === "PositionReport") {
            const ship = message.Message.PositionReport;
            console.log(`🚢 [${ship.UserID}] Lat: ${ship.Latitude} | Lon: ${ship.Longitude} | Vel: ${ship.Sog}kn`);
        }
    } catch (error) {
        console.error("Error procesando mensaje:", error);
    }
});

socket.on('error', (err) => console.error("❌ Error WebSocket:", err));
socket.on('close', () => console.log("🔌 Desconectado"));
