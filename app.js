require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// ============================================
// RIVERHUB ELITE 360 — Servidor Unificado
// Version: 2.0.0
// ============================================

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- SECURITY HEADERS ---
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org; " +
        "connect-src 'self' wss: ws: https://*.supabase.co https://api.open-meteo.com https://flood-api.open-meteo.com; " +
        "frame-ancestors 'self'"
    );
    next();
});

// --- REQUEST LOGGING ---
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.url.startsWith('/api') || req.url.endsWith('.html') || req.url === '/') {
            console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});

// --- API ENDPOINTS ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        ais: aisConnected ? 'connected' : 'disconnected'
    });
});

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));

// --- AIS CONFIGURATION ---
const API_KEY = process.env.AIS_API_KEY || 'REDACTED_AIS_KEY_2';
if (!process.env.AIS_API_KEY) {
    console.warn('⚠️  AIS API Key: usando fallback. Configurar AIS_API_KEY en .env para producción.');
}

const HIDROVIA_BOX = [[[-36.0, -63.0], [-18.0, -53.0]]];
let aisConnected = false;
let aisReconnectTimer = null;

// --- AIS STREAM ---
function startAISStream() {
    console.log("📡 Conectando a AISStream...");

    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

    ws.on('open', () => {
        aisConnected = true;
        console.log("✅ Satélite AIS conectado");
        ws.send(JSON.stringify({
            Apikey: API_KEY,
            BoundingBoxes: HIDROVIA_BOX,
            FilterMessageTypes: ["PositionReport"]
        }));
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.MessageType === "PositionReport") {
                const ship = msg.Message.PositionReport;
                if (msg.MetaData && msg.MetaData.ShipName) {
                    ship.ShipName = msg.MetaData.ShipName.trim();
                }
                io.emit('position_update', ship);
            }
        } catch (e) { }
    });

    ws.on('error', (e) => {
        aisConnected = false;
        console.warn("⚠️ Error AIS:", e.message);
    });

    ws.on('close', (code) => {
        aisConnected = false;
        console.log(`❌ AIS desconectado (${code}). Reintentando en 15s...`);
        if (aisReconnectTimer) clearTimeout(aisReconnectTimer);
        aisReconnectTimer = setTimeout(startAISStream, 15000);
    });
}

// --- SOCKET.IO CONNECTIONS ---
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
});

// --- KEEP ALIVE (for Render free tier) ---
setInterval(() => {
    // Prevent Render from sleeping
}, 10000);

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🚀 RIVERHUB ELITE 360 — v2.0.0       ║
║   Puerto: ${PORT}                            ║
║   AIS: Hidrovía Paraguay-Paraná         ║
╚══════════════════════════════════════════╝
    `);
    startAISStream();
});

server.on('error', (e) => {
    console.error("❌ SERVER ERROR:", e.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('💀 UNCAUGHT EXCEPTION:', err.message);
    process.exit(1);
});
