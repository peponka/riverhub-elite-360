require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const stripeStr = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = require('stripe')(stripeStr);
let createClient;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { console.warn('⚠️ @supabase/supabase-js not found — n8n DB features disabled'); }

// --- RATE LIMITERS ---
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }
});
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10, // 10 AI requests per minute per IP (protect Gemini quota)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Límite de consultas IA alcanzado. Espera un momento.' }
});

let n8nRoutes;
try { n8nRoutes = require('./routes/n8n-automations'); } catch (e) { console.error('❌ n8n routes failed to load:', e.message); }

// ============================================
// FLUVIAFLEET — Servidor Unificado
// Version: 2.0.0
// ============================================

const app = express();
const cors = require('cors');

const server = http.createServer(app);
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'https://fluviafleet.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4001',
    'http://127.0.0.1:4001'
];

// SECURITY: Restrict CORS to known origins only (no open wildcard)
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
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
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');
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
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies with size limit

// --- AUTH MIDDLEWARE (Supabase JWT validation) ---
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Token de autenticación requerido' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // Verify token with Supabase
        const sb = req.app.locals.supabase;
        if (!sb) {
            // If no Supabase configured, allow in dev mode only
            if (process.env.NODE_ENV === 'production') {
                return res.status(503).json({ error: 'Auth service unavailable' });
            }
            return next();
        }
        const { data: { user }, error } = await sb.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token', message: 'Sesión expirada o token inválido' });
        }
        req.user = user;
        next();
    } catch (e) {
        console.error('Auth middleware error:', e.message);
        return res.status(401).json({ error: 'Auth failed' });
    }
};

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

// --- AIS POSITIONS (rate limited, public — AIS data is non-sensitive) ---
app.get('/api/ais-positions', apiLimiter, (req, res) => {
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

// --- GEMINI AI CHAT (authenticated + rate limited) ---
app.post('/api/ai/chat', aiLimiter, authenticateUser, async (req, res) => {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
        return res.status(503).json({ error: 'AI not configured', response: 'IA no disponible. Configura GEMINI_API_KEY en .env' });
    }

    const { message, context } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Missing message' });
    }

    const systemPrompt = `Eres el Copiloto IA de FluviaFleet, un sistema de gestión inteligente de flotas fluviales para la Hidrovía Paraguay-Paraná.

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

// --- IA PREDICTIVA: MANTENIMIENTO ---
app.post('/api/ai/predict-maintenance', aiLimiter, authenticateUser, async (req, res) => {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'AI not configured' });

    try {
        const { companyId } = req.body;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

        // Fetch real data from Supabase
        const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
        const [vesselsRes, maintRes, fuelRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/vessels?company_id=eq.${companyId}&select=id,name,type,status,draft,current_draft,max_draft,engine_power`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/maintenance_tasks?company_id=eq.${companyId}&select=*&order=created_at.desc&limit=50`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/fuel_logs?company_id=eq.${companyId}&select=*&order=created_at.desc&limit=50`, { headers })
        ]);

        const vessels = await vesselsRes.json();
        const maintenance = await maintRes.json();
        const fuel = await fuelRes.json();

        const prompt = `Eres un ingeniero naval experto en mantenimiento predictivo de flotas fluviales en la Hidrovía Paraguay-Paraná.

DATOS DE LA FLOTA:
${JSON.stringify(vessels, null, 1)}

HISTORIAL DE MANTENIMIENTO (últimas 50 tareas):
${JSON.stringify(maintenance, null, 1)}

REGISTROS DE COMBUSTIBLE (últimos 50):
${JSON.stringify(fuel, null, 1)}

TAREA: Analiza estos datos y genera predicciones de mantenimiento para cada embarcación activa. Para cada una:
1. Componente en riesgo
2. Probabilidad de falla (%) en los próximos 30 días
3. Días estimados hasta mantenimiento necesario
4. Acción recomendada
5. Severidad: critical/high/medium/low

Responde SOLO en JSON válido, formato:
[{"vessel":"nombre","component":"componente","probability":85,"days_until":12,"action":"descripción corta","severity":"high"}]

Si no hay suficientes datos para una embarcación, estimá basándote en el tipo de embarcación y estado actual. Genera al menos 1 predicción por embarcación activa.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        res.json({ predictions });
    } catch (e) {
        console.error('Predict maintenance error:', e.message);
        res.status(500).json({ error: e.message, predictions: [] });
    }
});

// --- IA: OPTIMIZADOR DE CONVOY ---
app.post('/api/ai/optimize-convoy', aiLimiter, authenticateUser, async (req, res) => {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'AI not configured' });

    try {
        const { companyId, destination, selectedVessels } = req.body;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

        const vesselsRes = await fetch(`${supabaseUrl}/rest/v1/vessels?company_id=eq.${companyId}&select=*`, { headers });
        const vessels = await vesselsRes.json();

        const prompt = `Eres un despachante naval experto de la Hidrovía Paraguay-Paraná con 20 años de experiencia en formación de convoyes.

FLOTA DISPONIBLE:
${JSON.stringify(vessels, null, 1)}

${selectedVessels ? `EMBARCACIONES SELECCIONADAS POR EL USUARIO: ${selectedVessels}` : 'El usuario no seleccionó embarcaciones aún.'}
${destination ? `DESTINO: ${destination}` : 'Sin destino definido aún.'}

CONTEXTO HIDROLÓGICO ACTUAL:
- Río Paraguay en Asunción: nivel estimado 2.4m (medio-bajo)
- Tramo Pilcomayo-Confluencia: calado máximo recomendado 2.8m
- Tramo Confluencia-Rosario: calado máximo 3.2m
- Condiciones: sin alertas meteorológicas activas

TAREA: Sugiere la formación ÓPTIMA del convoy considerando:
1. Nivel actual del río y restricciones de calado por tramo
2. Tipo y calado de cada embarcación
3. Remolcador(es) necesarios (proa/popa)
4. Riesgo de varada en tramos críticos
5. Consumo estimado de combustible

Responde en JSON:
{"formation":{"proa":"nombre remolcador","barcazas_f1":["nombre1","nombre2"],"barcazas_f2":["nombre3","nombre4"],"popa":"nombre o null"},"config":"2+1 o 4+1 etc","risk_score":25,"risk_level":"bajo/medio/alto","warnings":["advertencia1"],"fuel_estimate_liters":12000,"recommendation":"texto explicativo de 2-3 oraciones"}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        res.json({ suggestion });
    } catch (e) {
        console.error('Optimize convoy error:', e.message);
        res.status(500).json({ error: e.message, suggestion: {} });
    }
});

// --- IA: DETECCIÓN DE ANOMALÍAS DE CONSUMO ---
app.post('/api/ai/fuel-anomalies', aiLimiter, authenticateUser, async (req, res) => {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'AI not configured' });

    try {
        const { companyId } = req.body;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

        const [fuelRes, vesselsRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/fuel_logs?company_id=eq.${companyId}&select=*&order=created_at.desc&limit=100`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/vessels?company_id=eq.${companyId}&select=id,name,type,engine_power`, { headers })
        ]);

        const fuelLogs = await fuelRes.json();
        const vessels = await vesselsRes.json();

        const prompt = `Eres un auditor de consumo de combustible especializado en flotas fluviales de la Hidrovía Paraguay-Paraná.

EMBARCACIONES:
${JSON.stringify(vessels, null, 1)}

REGISTROS DE COMBUSTIBLE (últimos 30 días):
${JSON.stringify(fuelLogs, null, 1)}

TAREA: Analiza los patrones de consumo y detecta ANOMALÍAS. Busca:
1. Consumo inusualmente alto para el tipo de embarcación
2. Diferencias significativas entre cargas del mismo barco
3. Posibles indicadores de: motor en mal estado, sobrecarga, fuga, o robo
4. Tendencias preocupantes

Para cada anomalía encontrada, responde en JSON:
[{"vessel":"nombre","type":"overconsumption/spike/trend/theft_risk","severity":"critical/high/medium/low","description":"descripción corta en español","deviation_pct":15,"recommendation":"acción recomendada"}]

Si todo parece normal, devolvé un array con al menos 1 item tipo "normal" con severity "low" y descripción positiva. Siempre generá al menos 2 items de análisis.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const anomalies = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        res.json({ anomalies });
    } catch (e) {
        console.error('Fuel anomalies error:', e.message);
        res.status(500).json({ error: e.message, anomalies: [] });
    }
});

// --- STRIPE PAYMENT GATEWAY (authenticated) ---
app.post('/api/create-checkout', authenticateUser, async (req, res) => {
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

        // SECURITY: Block mock payments in production
        if (stripeStr === 'sk_test_mock') {
            if (process.env.NODE_ENV === 'production') {
                return res.status(503).json({ error: 'Pasarela de pago no configurada. Contactar soporte.' });
            }
            console.warn('⚠️ Mock Stripe Checkout triggered (dev only)');
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

// --- INVOICE INTELLIGENCE (Gemini AI, authenticated + rate limited) ---
app.post('/api/ai/invoice', aiLimiter, authenticateUser, async (req, res) => {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
        return res.status(503).json({ error: 'AI not configured' });
    }

    const { invoiceText, voyageId } = req.body;
    if (!invoiceText) {
        return res.status(400).json({ error: 'Missing invoiceText' });
    }

    // Fetch voyage data for validation if voyageId provided
    let voyageContext = '';
    if (voyageId && app.locals.supabase) {
        try {
            const { data: voyage } = await app.locals.supabase
                .from('voyages')
                .select('*')
                .eq('id', voyageId)
                .single();
            if (voyage) {
                voyageContext = `\nDatos del viaje registrado:\n- Origen: ${voyage.origin || 'N/A'}\n- Destino: ${voyage.destination || 'N/A'}\n- Carga: ${voyage.cargo_tons || 'N/A'} toneladas\n- Combustible registrado: ${voyage.fuel_consumed || 'N/A'} litros\n- Distancia: ${voyage.distance_km || 'N/A'} km\n- Fecha: ${voyage.departure_date || 'N/A'} a ${voyage.arrival_date || 'N/A'}`;
            }
        } catch (e) { /* silently continue without voyage data */ }
    }

    const systemPrompt = `Eres el motor de Invoice Intelligence de FluviaFleet. Tu trabajo es analizar facturas de flete fluvial y extraer datos estructurados.

INSTRUCCIONES:
1. Extrae TODOS los datos de la factura en formato JSON estructurado
2. Si hay datos de viaje de referencia, COMPARA y detecta discrepancias
3. Clasifica cada discrepancia como: CRITICA (>10%), ADVERTENCIA (5-10%), o INFO (<5%)
4. Calcula totales y verifica sumas

RESPONDE SIEMPRE en este formato JSON exacto:
{
  "invoice": {
    "number": "número de factura",
    "date": "fecha",
    "supplier": "proveedor/empresa",
    "total": 0,
    "currency": "USD/ARS",
    "items": [
      {"description": "desc", "quantity": 0, "unit": "ton/km/lt", "unitPrice": 0, "subtotal": 0}
    ]
  },
  "validation": {
    "mathCorrect": true,
    "discrepancies": [
      {"field": "campo", "invoiceValue": "x", "systemValue": "y", "difference": "z", "severity": "CRITICA/ADVERTENCIA/INFO", "note": "explicación"}
    ]
  },
  "summary": {
    "status": "APROBADA/REVISAR/RECHAZAR",
    "confidence": 95,
    "notes": "observaciones generales"
  }
}
${voyageContext}`;

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }, { text: `FACTURA A ANALIZAR:\n${invoiceText}` }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 4000 }
            })
        });

        const data = await response.json();
        console.log('[Invoice AI] HTTP:', response.status, JSON.stringify(data).substring(0, 300));
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Try to parse JSON from AI response
        let parsed = null;
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch (e) { /* will return raw text */ }

        res.json({ result: parsed, raw: aiText, apiError: data.error?.message || null });
    } catch (e) {
        console.error('Invoice AI error:', e.message);
        res.status(500).json({ error: 'Error procesando factura' });
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

// --- EXPRESS GLOBAL ERROR HANDLER ---
// Must be AFTER all routes to catch unhandled errors
app.use((err, req, res, next) => {
    console.error('[Express Error]', req.method, req.path, err.message);
    // Never leak stack traces in production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        error: isProd ? 'Error interno del servidor' : err.message,
        ...(isProd ? {} : { stack: err.stack })
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
║   🚀 FLUVIAFLEET — v2.0.0              ║
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
