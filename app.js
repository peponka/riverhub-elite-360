require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const stripeStr = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = require('stripe')(stripeStr);
let createClient;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { console.warn('⚠️ @supabase/supabase-js not found — n8n DB features disabled'); }

let n8nRoutes;
try { n8nRoutes = require('./routes/n8n-automations'); } catch (e) { console.error('❌ n8n routes failed to load:', e.message); }

// ============================================
// RIVERHUB ELITE 360 — Servidor Unificado
// Version: 2.0.0
// ============================================

const app = express();
const cors = require('cors');
app.use(cors());

const server = http.createServer(app);
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'https://riverhub.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
            else callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
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
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com; " +
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://cartodb-basemaps-a.global.ssl.fastly.net https://cartodb-basemaps-b.global.ssl.fastly.net https://cartodb-basemaps-c.global.ssl.fastly.net https://cartodb-basemaps-d.global.ssl.fastly.net https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com https://tile.openstreetmap.org; " +
        "connect-src 'self' wss: ws: https://*.supabase.co https://api.open-meteo.com https://flood-api.open-meteo.com https://unpkg.com https://cdn.jsdelivr.net; " +
        "frame-ancestors 'self'"
    );
    next();
});

// --- ROOT REDIRECT TO LANDING ---
app.get('/', (req, res) => res.redirect('/landing.html'));

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
app.use(express.json()); // Parse JSON bodies for AI chat

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        ais: aisConnected ? 'connected' : 'disconnected',
        ai: process.env.GEMINI_API_KEY ? 'gemini_ready' : 'no_key'
    });
});

// --- PUBLIC AIS POSITIONS (for frontend map) ---
app.get('/api/ais-positions', (req, res) => {
    const aisPositions = req.app.locals.aisPositions || {};
    const vessels = Object.values(aisPositions);
    res.json({
        total: vessels.length,
        connected: aisConnected,
        vessels: vessels.map(v => ({
            mmsi: v.mmsi, name: v.name,
            lat: v.lat, lon: v.lon,
            speed: v.speed, course: v.course,
            heading: v.heading
        }))
    });
});

// --- GEMINI AI CHAT ---
app.post('/api/ai/chat', async (req, res) => {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
        return res.status(503).json({ error: 'AI not configured', response: 'IA no disponible. Configura GEMINI_API_KEY en .env' });
    }

    const { message, context } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Missing message' });
    }

    const systemPrompt = `Eres NexoBot, el asistente de inteligencia artificial de RiverHub Elite 360, un sistema de gestión fluvial para la Hidrovía Paraguay-Paraná.

Tu rol:
- Experto en logística fluvial, navegación de barcos empujadores y barcazas
- Conoces sobre hidrología del Río Paraná y Paraguay
- Manejas temas de tripulación, combustible, mantenimiento naval
- Respondes en español rioplatense profesional
- Eres conciso pero completo (máx 150 palabras)
- Usas emojis marítimos cuando es apropiado (🚢⚓📡🌊)
- Si te preguntan datos específicos que no tenés, decí que necesitás consultar la base de datos

Contexto del sistema: ${context || 'Usuario operador de flota'}`;

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemPrompt },
                        { text: message }
                    ]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            res.json({ response: data.candidates[0].content.parts[0].text });
        } else {
            console.error('Gemini response error:', JSON.stringify(data).substring(0, 200));
            res.json({ response: 'No pude procesar tu consulta. Intentá reformular la pregunta.' });
        }
    } catch (e) {
        console.error('Gemini API error:', e.message);
        res.status(500).json({ response: 'Error de conexión con el servicio de IA. Verificá tu internet.' });
    }
});

// --- STRIPE PAYMENT GATEWAY ---
app.post('/api/create-checkout', async (req, res) => {
    try {
        const { planId, companyId, email } = req.body;
        
        // Precios base (Demo Sandbox)
        const plans = {
            solist:    { price: 15000, name: 'SOLIST (1 Barco)' }, // Centavos USD
            squad:     { price: 45000, name: 'SQUAD (3 Barcos)' },
            expansion: { price: 120000, name: 'PACK EXPANSIÓN (10 Barcos)' },
            admiral:   { price: 180000, name: 'ADMIRAL (Ilimitado)' }
        };

        if (!plans[planId]) return res.status(400).json({ error: 'Plan no válido' });

        // Si no hay API Key real configurada, devolver un bypass simulado
        if (stripeStr === 'sk_test_mock') {
            console.log("Mock Stripe Checkout triggered");
            return res.json({ url: req.headers.origin + '/app.html?payment=success_mock' });
        }

        const session = await stripe.checkout.sessions.create({
            customer_email: email,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: plans[planId].name },
                    unit_amount: plans[planId].price,
                    recurring: { interval: 'month' }
                },
                quantity: 1
            }],
            mode: 'subscription',
            success_url: req.headers.origin + '/app.html?payment=success',
            cancel_url: req.headers.origin + '/app.html?payment=cancel',
            metadata: { companyId, planId }
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error("Stripe Checkout Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));

// --- n8n AUTOMATION API ---
if (n8nRoutes) {
    app.use('/api/n8n', n8nRoutes);
    console.log('✅ n8n Automation API mounted at /api/n8n');
}

// --- SUPABASE SERVER-SIDE CLIENT ---
if (createClient && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    app.locals.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('✅ Supabase server-side client initialized');
} else {
    console.warn('⚠️ SUPABASE_URL/KEY not set — n8n DB endpoints will return demo data');
}

// --- SHARED STATE FOR n8n ---
app.locals.aisPositions = {};  // Live AIS positions indexed by MMSI
app.locals.aisConnected = false;
app.locals.io = io;

// --- AIS CONFIGURATION ---
const API_KEY = process.env.AIS_API_KEY || '';
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
        app.locals.aisConnected = true;
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

                // Store position for n8n API access
                const mmsi = ship.UserID || ship.mmsi;
                if (mmsi) {
                    app.locals.aisPositions[mmsi] = {
                        mmsi,
                        name: ship.ShipName || 'Unknown',
                        lat: ship.Latitude,
                        lon: ship.Longitude,
                        speed: ship.Sog || 0,
                        course: ship.Cog || 0,
                        heading: ship.TrueHeading || 0,
                        timestamp: new Date().toISOString()
                    };

                    // Sincronización directa y silenciosa a Supabase para la App Móvil
                    if (app.locals.supabase) {
                        app.locals.supabase.from('vessels')
                            .update({
                                current_lat: ship.Latitude,
                                current_lng: ship.Longitude,
                                last_position_update: new Date().toISOString()
                            })
                            .eq('mmsi', mmsi.toString())
                            .then() // Ignoramos silenciosamente si no afecta filas
                            .catch(() => {}); // Evitamos bloqueos en el main thread
                    }
                }
            }
        } catch (e) { }
    });

    ws.on('error', (e) => {
        aisConnected = false;
        app.locals.aisConnected = false;
        console.warn("⚠️ Error AIS:", e.message);
    });

    ws.on('close', (code) => {
        aisConnected = false;
        app.locals.aisConnected = false;
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
    require('fs').writeFileSync('crash.log', "SERVER ERROR: " + e.message + "\n" + (e.stack || ''));
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('💀 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
    // Don't exit — keep server running for n8n and other clients
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ UNHANDLED PROMISE REJECTION:', reason);
    // Don't exit — keep server running
});
