// ============================================
// FluviaFleet — n8n Automation API
// Endpoints para automatización con n8n
// Version: 1.0.0
// ============================================

const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// ============================================
// MIDDLEWARE: API Key Authentication
// n8n debe enviar header: x-api-key: FluviaFleet_n8n_2026
// ============================================

const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado ya
if (!admin.apps.length) {
    try {
        const serviceAccount = require(require('path').join(__dirname, '..', 'firebase-service-account.json'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('🔥 Firebase Admin FCM activado para push notifications.');
    } catch (e) {
        console.warn('⚠️ No se encontró firebase-service-account.json para FCM (Firebase Admin):', e.message);
    }
}

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) throw new Error('N8N_API_KEY environment variable is required');

const authenticateN8N = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    if (apiKey !== N8N_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized', message: 'API key inválida. Enviar header x-api-key' });
    }
    next();
};

router.use(authenticateN8N);

// ============================================
// 1. GET /api/n8n/fleet-status
// Retorna estado completo de la flota
// Uso n8n: Cron cada hora → GET → Email/Slack
// ============================================
router.get('/fleet-status', async (req, res) => {
    try {
        const sb = req.app.locals.supabase;
        if (!sb) return res.json({ vessels: [], source: 'no_db', message: 'Supabase no configurado en servidor' });

        const { data: vessels, error } = await sb
            .from('fleet_assets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with AIS data if available
        const aisData = req.app.locals.aisPositions || {};

        const enriched = (vessels || []).map(v => ({
            ...v,
            ais_live: aisData[v.mmsi] || null,
            last_check: new Date().toISOString()
        }));

        res.json({
            total: enriched.length,
            operativos: enriched.filter(v => v.status === 'OPERATIVO' || v.status === 'EN TRANSITO').length,
            mantenimiento: enriched.filter(v => v.status === 'MANTENIMIENTO').length,
            vessels: enriched,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 2. GET /api/n8n/fuel-alerts
// Devuelve embarcaciones con combustible bajo
// Uso n8n: Cron cada 4h → GET → WhatsApp alert
// ============================================
router.get('/fuel-alerts', async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 25; // Default: < 25%
        const sb = req.app.locals.supabase;

        if (!sb) {
            // Demo data if no DB
            return res.json({
                alerts: [
                    { name: 'R/M CENTAURO', tank_status: 21, status: 'CRITICO', action_required: 'Programar bunkering urgente' },
                    { name: 'R/M ORION STAR', tank_status: 23, status: 'BAJO', action_required: 'Monitorear, bunkering en próxima parada' }
                ],
                threshold,
                timestamp: new Date().toISOString()
            });
        }

        const { data, error } = await sb
            .from('fleet_assets')
            .select('name, type, tank_status, status, flag')
            .lt('tank_status', threshold)
            .order('tank_status', { ascending: true });

        if (error) throw error;

        const alerts = (data || []).map(v => ({
            ...v,
            severity: v.tank_status < 15 ? 'CRITICO' : 'BAJO',
            action_required: v.tank_status < 15
                ? 'Programar bunkering URGENTE'
                : 'Monitorear, bunkering en próxima parada'
        }));

        res.json({
            total_alerts: alerts.length,
            threshold,
            alerts,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 3. GET /api/n8n/maintenance-due
// Mantenimientos vencidos o próximos a vencer
// Uso n8n: Cron diario 7am → GET → Email al jefe
// ============================================
router.get('/maintenance-due', async (req, res) => {
    try {
        const daysAhead = parseInt(req.query.days) || 7;
        const sb = req.app.locals.supabase;

        if (!sb) {
            return res.json({
                overdue: [],
                upcoming: [],
                message: 'Supabase no configurado. Conectar DB para datos reales.',
                timestamp: new Date().toISOString()
            });
        }

        const now = new Date();
        const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

        // Get maintenance logs
        const { data, error } = await sb
            .from('maintenance_logs')
            .select('*')
            .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const overdue = (data || []).filter(m =>
            m.status !== 'completed' && new Date(m.scheduled_date) < now
        );

        const upcoming = (data || []).filter(m =>
            m.status !== 'completed' &&
            new Date(m.scheduled_date) >= now &&
            new Date(m.scheduled_date) <= futureDate
        );

        res.json({
            overdue_count: overdue.length,
            upcoming_count: upcoming.length,
            overdue,
            upcoming,
            check_window_days: daysAhead,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 4. GET /api/n8n/daily-summary
// Resumen diario completo para reportes
// Uso n8n: Cron 7am L-V → GET → PDF → Email
// ============================================
router.get('/daily-summary', async (req, res) => {
    try {
        const sb = req.app.locals.supabase;
        const aisPositions = req.app.locals.aisPositions || {};
        const aisCount = Object.keys(aisPositions).length;

        let fleetData = { total: 0, operativos: 0, mantenimiento: 0 };
        let incidentsToday = 0;
        let tripsActive = 0;

        if (sb) {
            // Fleet
            const { data: fleet } = await sb.from('fleet_assets').select('status');
            if (fleet) {
                fleetData.total = fleet.length;
                fleetData.operativos = fleet.filter(v =>
                    v.status === 'OPERATIVO' || v.status === 'EN TRANSITO'
                ).length;
                fleetData.mantenimiento = fleet.filter(v => v.status === 'MANTENIMIENTO').length;
            }

            // Incidents today
            const today = new Date().toISOString().split('T')[0];
            const { count: incCount } = await sb
                .from('incidents')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today);
            incidentsToday = incCount || 0;

            // Active trips
            const { count: tripCount } = await sb
                .from('trips')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            tripsActive = tripCount || 0;
        }

        res.json({
            report_type: 'daily_summary',
            report_date: new Date().toISOString().split('T')[0],
            generated_at: new Date().toISOString(),
            fleet: fleetData,
            ais_vessels_live: aisCount,
            incidents_today: incidentsToday,
            trips_active: tripsActive,
            system: {
                uptime_hours: Math.round(process.uptime() / 3600 * 10) / 10,
                ais_connected: req.app.locals.aisConnected || false,
                version: '2.0.0'
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 5. POST /api/n8n/log-positions
// Guarda posiciones AIS actuales en Supabase
// Uso n8n: Cron cada 30min → POST → Historial
// ============================================
router.post('/log-positions', async (req, res) => {
    try {
        const aisPositions = req.app.locals.aisPositions || {};
        const vessels = Object.values(aisPositions);

        if (vessels.length === 0) {
            return res.json({ logged: 0, message: 'No hay posiciones AIS activas para loguear' });
        }

        const sb = req.app.locals.supabase;
        if (!sb) {
            return res.json({
                logged: 0,
                available: vessels.length,
                message: 'Supabase no configurado. Posiciones disponibles pero no guardadas.',
                sample: vessels.slice(0, 3)
            });
        }

        // Build position records - filter out invalid data
        const records = vessels
            .filter(v => v.mmsi && v.lat && v.lon && !isNaN(v.lat) && !isNaN(v.lon))
            .map(v => ({
                mmsi: parseInt(v.mmsi) || 0,
                ship_name: String(v.name || 'Unknown').substring(0, 100),
                latitude: parseFloat(v.lat) || 0,
                longitude: parseFloat(v.lon) || 0,
                speed: parseFloat(v.speed) || 0,
                course: parseFloat(v.course) || 0,
                heading: parseFloat(v.heading) || 0,
                logged_at: new Date().toISOString()
            }));

        if (records.length === 0) {
            return res.json({ logged: 0, message: 'Todas las posiciones fueron filtradas (datos inválidos)' });
        }

        // Insert in batches of 20 to avoid timeouts
        let totalLogged = 0;
        const batchSize = 20;
        const errors = [];

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            try {
                const { error } = await sb
                    .from('ais_position_log')
                    .insert(batch);
                if (error) {
                    errors.push(error.message);
                } else {
                    totalLogged += batch.length;
                }
            } catch (batchErr) {
                errors.push(batchErr.message);
            }
        }

        res.json({
            logged: totalLogged,
            total_available: vessels.length,
            filtered: vessels.length - records.length,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString(),
            message: `${totalLogged} posiciones guardadas exitosamente`
        });
    } catch (e) {
        console.error('log-positions error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 6. GET /api/n8n/ais-live
// Retorna todas las posiciones AIS en vivo
// Uso n8n: Consulta bajo demanda
// ============================================
router.get('/ais-live', (req, res) => {
    const aisPositions = req.app.locals.aisPositions || {};
    const vessels = Object.values(aisPositions);

    res.json({
        total: vessels.length,
        vessels: vessels.map(v => ({
            mmsi: v.mmsi,
            name: v.name,
            lat: v.lat,
            lon: v.lon,
            speed: v.speed,
            course: v.course,
            heading: v.heading,
            last_update: v.timestamp
        })),
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 7. GET /api/n8n/hydrology
// Consulta niveles de río actuales
// Uso n8n: Cron cada 6h → GET → Si < umbral → Alerta
// ============================================
router.get('/hydrology', async (req, res) => {
    try {
        // Estaciones de la Hidrovía
        const stations = [
            { name: 'Asunción', lat: -25.28, lon: -57.63 },
            { name: 'Pilar', lat: -26.86, lon: -58.31 },
            { name: 'Corrientes', lat: -27.47, lon: -58.83 },
            { name: 'Rosario', lat: -32.95, lon: -60.65 },
            { name: 'Buenos Aires', lat: -34.60, lon: -58.38 }
        ];

        const results = [];

        for (const station of stations) {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&current=temperature_2m,wind_speed_10m,precipitation&timezone=America/Argentina/Buenos_Aires`;
                const response = await fetch(url);
                const data = await response.json();

                results.push({
                    station: station.name,
                    temperature: data.current?.temperature_2m || null,
                    wind_speed: data.current?.wind_speed_10m || null,
                    precipitation: data.current?.precipitation || null,
                    units: {
                        temperature: '°C',
                        wind: 'km/h',
                        precipitation: 'mm'
                    }
                });
            } catch (e) {
                results.push({ station: station.name, error: e.message });
            }
        }

        // Check for alerts
        const alerts = results.filter(s => s.wind_speed > 40 || s.precipitation > 10);

        res.json({
            stations: results,
            alerts: alerts.length > 0 ? alerts : [],
            alert_count: alerts.length,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 8. GET /api/n8n/crew-certifications
// Certificaciones próximas a vencer
// Uso n8n: Cron semanal → GET → Email a RRHH
// ============================================
router.get('/crew-certifications', async (req, res) => {
    try {
        const daysAhead = parseInt(req.query.days) || 30;
        const sb = req.app.locals.supabase;

        if (!sb) {
            return res.json({ expiring: [], message: 'Supabase no configurado' });
        }

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const now = new Date();

        // Try to query crew_members - handle missing columns gracefully
        let expiring = [];
        try {
            // First try with certification_expiry column
            const { data, error } = await sb
                .from('crew_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Check if certification_expiry column exists in returned data
            if (data && data.length > 0 && data[0].certification_expiry) {
                expiring = data
                    .filter(c => c.certification_expiry && new Date(c.certification_expiry) <= futureDate)
                    .map(c => ({
                        full_name: c.full_name || c.name,
                        role: c.role || c.position,
                        vessel_name: c.vessel_name || c.vessel,
                        phone: c.phone || null,
                        certification_expiry: c.certification_expiry,
                        days_remaining: Math.round((new Date(c.certification_expiry) - now) / (1000 * 60 * 60 * 24)),
                        urgency: (new Date(c.certification_expiry) < now) ? 'VENCIDO' :
                            (new Date(c.certification_expiry) - now < 7 * 24 * 60 * 60 * 1000) ? 'URGENTE' : 'PROXIMO'
                    }));
            } else {
                // Column doesn't exist - return crew summary with note
                const crewCount = data ? data.length : 0;
                return res.json({
                    total_crew: crewCount,
                    total_expiring: 0,
                    check_window_days: daysAhead,
                    expired: [],
                    urgent: [],
                    upcoming: [],
                    note: 'La tabla crew_members no tiene columna certification_expiry. Agregar columna para tracking de certificaciones.',
                    crew_sample: (data || []).slice(0, 5).map(c => ({
                        name: c.full_name || c.name,
                        role: c.role || c.position,
                        vessel: c.vessel_name || c.vessel
                    })),
                    timestamp: new Date().toISOString()
                });
            }
        } catch (queryError) {
            // Table might not exist or other DB error - return helpful info
            return res.json({
                total_expiring: 0,
                check_window_days: daysAhead,
                expired: [],
                urgent: [],
                upcoming: [],
                note: `No se pudo consultar crew_members: ${queryError.message}`,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            total_expiring: expiring.length,
            check_window_days: daysAhead,
            expired: expiring.filter(c => c.urgency === 'VENCIDO'),
            urgent: expiring.filter(c => c.urgency === 'URGENTE'),
            upcoming: expiring.filter(c => c.urgency === 'PROXIMO'),
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 9. POST /api/n8n/send-alert
// Recibe alertas desde n8n y las guarda en DB
// Uso n8n: Cualquier trigger → POST → FluviaFleet
// ============================================
router.post('/send-alert', async (req, res) => {
    try {
        const { type, title, message, severity, vessel_name, data: alertData } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Campos requeridos: title, message' });
        }

        const alert = {
            type: type || 'n8n_automation',
            title,
            message,
            severity: severity || 'info', // info, warning, critical
            vessel_name: vessel_name || null,
            source: 'n8n',
            metadata: alertData || {},
            created_at: new Date().toISOString(),
            read: false
        };

        const sb = req.app.locals.supabase;
        if (sb) {
            const { error } = await sb.from('system_alerts').insert([alert]);
            if (error) console.warn('Alert DB save error:', error.message);
        }

        // Also emit via Socket.IO for real-time display
        const io = req.app.locals.io;
        if (io) {
            io.emit('system_alert', alert);
        }

        // Fire FCM Push Notifications a todos los usuarios
        try {
            if (sb && admin.apps.length) {
                // Call SECURITY DEFINER function to bypass RLS
                const { data: tokens, error: rpcError } = await sb.rpc('get_all_fcm_tokens');
                
                if (!rpcError && tokens && tokens.length > 0) {
                    const message = {
                        notification: {
                            title: `🚨 ${title}`,
                            body: alert.message
                        },
                        tokens: tokens
                    };
                    
                    const fcmResponse = await admin.messaging().sendEachForMulticast(message);
                    console.log(`📲 FCM Broadcast: ${fcmResponse.successCount} enviados, ${fcmResponse.failureCount} fallaron.`);
                } else if (rpcError) {
                    console.warn('⚠️ RLS RPC Error:', rpcError.message);
                }
            }
        } catch (fcmErr) {
            console.error('📲 FCM Error en /send-alert:', fcmErr.message);
        }

        // Store in memory for API access
        if (!req.app.locals.recentAlerts) req.app.locals.recentAlerts = [];
        req.app.locals.recentAlerts.unshift(alert);
        if (req.app.locals.recentAlerts.length > 50) req.app.locals.recentAlerts.pop();

        res.json({ success: true, alert, message: 'Alerta registrada y emitida' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 10. GET /api/n8n/voyage-status
// Estado de viajes activos para tracking
// Uso n8n: Cron cada 2h → GET → Email a clientes
// ============================================
router.get('/voyage-status', async (req, res) => {
    try {
        const sb = req.app.locals.supabase;
        if (!sb) {
            return res.json({ trips: [], message: 'Supabase no configurado' });
        }

        const { data, error } = await sb
            .from('trips')
            .select('*')
            .in('status', ['active', 'loading', 'in_transit'])
            .order('departure_date', { ascending: false });

        if (error) throw error;

        res.json({
            active_trips: (data || []).length,
            trips: data || [],
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 11. POST /api/n8n/webhook
// Webhook genérico para recibir datos de n8n o retransmitir desde la web
// ============================================
router.post('/webhook', async (req, res) => {
    // 1. Si el frontend está enviando un evento hacia n8n (ej: NEW_COMPANY_REGISTRATION)
    if (req.body.event) {
        try {
            console.log(`🚀 Front-End Event detected: ${req.body.event}. Forwarding to n8n local webhook...`);
            // Se envía al webhook de test/producción de n8n. 
            // URL: http://localhost:5678/webhook-test/FluviaFleet-events (para probar) o /webhook/FluviaFleet-events
            const n8nUrl = 'http://localhost:5678/webhook-test/FluviaFleet-events';
            await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req.body)
            });
            console.log(`✅ Evento enviado correctamente a n8n`);
            return res.json({ received: true, forwarded: true, event: req.body.event });
        } catch (err) {
            console.error('⚠️ Error forwardeando evento a n8n local:', err.message);
            // Igual devolvemos 200 para no bloquear el flujo de la app
            return res.json({ received: true, forwarded: false, error: err.message });
        }
    }

    // 2. Si viene un comando DESDE n8n hacia FluviaFleet
    const { action, payload } = req.body;

    console.log(`📨 n8n Webhook received: ${action || 'unknown'}`, JSON.stringify(payload || {}).substring(0, 200));

    // Store webhook event
    if (!req.app.locals.webhookLog) req.app.locals.webhookLog = [];
    req.app.locals.webhookLog.unshift({
        action,
        payload,
        received_at: new Date().toISOString()
    });
    if (req.app.locals.webhookLog.length > 100) req.app.locals.webhookLog.pop();

    // Process specific actions
    switch (action) {
        case 'notify_crew':
            console.log(`📱 Notificación a tripulación: ${payload?.message}`);
            break;
        case 'update_vessel':
            console.log(`🚢 Actualización de embarcación: ${payload?.vessel_name}`);
            break;
        case 'emergency':
            console.log(`🚨 EMERGENCIA: ${payload?.message}`);
            const io = req.app.locals.io;
            if (io) io.emit('emergency', payload);
            break;
        default:
            console.log(`📨 Acción genérica: ${action}`);
    }

    res.json({
        received: true,
        action,
        processed_at: new Date().toISOString()
    });
});

// ============================================
// 12. GET /api/n8n/anomalies
// Detección de anomalías (barcos detenidos, etc)
// Uso n8n: Cron cada hora → GET → Si hay → Alerta
// ============================================
router.get('/anomalies', (req, res) => {
    const aisPositions = req.app.locals.aisPositions || {};
    const vessels = Object.values(aisPositions);
    const anomalies = [];

    vessels.forEach(v => {
        // Barco detenido (velocidad 0 o muy baja)
        if (v.speed !== undefined && v.speed < 0.5) {
            const stoppedMinutes = v.timestamp
                ? Math.round((Date.now() - new Date(v.timestamp).getTime()) / 60000)
                : 0;

            anomalies.push({
                type: 'vessel_stopped',
                severity: stoppedMinutes > 240 ? 'high' : 'medium',
                vessel: v.name,
                mmsi: v.mmsi,
                position: { lat: v.lat, lon: v.lon },
                speed: v.speed,
                stopped_minutes: stoppedMinutes,
                message: `${v.name} detenido por ${stoppedMinutes} min @ ${v.lat?.toFixed(4)}, ${v.lon?.toFixed(4)}`
            });
        }

        // Fuera de zona Hidrovía (lat/lon fuera del bounding box)
        if (v.lat && v.lon) {
            if (v.lat < -38 || v.lat > -16 || v.lon < -65 || v.lon > -50) {
                anomalies.push({
                    type: 'out_of_zone',
                    severity: 'high',
                    vessel: v.name,
                    mmsi: v.mmsi,
                    position: { lat: v.lat, lon: v.lon },
                    message: `${v.name} FUERA de zona Hidrovía`
                });
            }
        }
    });

    res.json({
        total_anomalies: anomalies.length,
        high_severity: anomalies.filter(a => a.severity === 'high').length,
        anomalies,
        vessels_monitored: vessels.length,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 13. GET /api/n8n/ai-analysis
// Usa Gemini para analizar anomalías y estado
// Uso n8n: Cada mañana → GET /anomalies → POST /ai-analysis → Manda Telegram
// ============================================
router.get('/ai-analysis', async (req, res) => {
    try {
        const sb = req.app.locals.supabase;
        const aisData = req.app.locals.aisPositions || {};
        
        // Obtenemos los buques
        let vesselsText = "Sin datos de buques.";
        if (sb) {
            const { data: vessels } = await sb.from('fleet_assets').select('name, status, type, tank_status').limit(15);
            if (vessels && vessels.length) {
                vesselsText = vessels.map(v => `- ${v.name} (${v.type}): ${v.status}, Combustible: ${v.tank_status}%`).join('\n');
            }
        }

        // Armamos el prompt contextual
        const systemPrompt = `Actúa como el Analista de Logística Marítima de FluviaFleet.
Tengo el siguiente reporte rápido de mi flota de remolcadores y barcazas en la hidrovía:
        
--- ESTADO FLUVIAL ---
${vesselsText}
--- ALERTAS Y ANOMALÍAS RECIENTES ---
${JSON.stringify(aisData).substring(0, 300)} (Muestra acortada del AIS Live)

Instrucción: Escribe un resumen ejecutivo de un párrafo, en tono profesional pero ágil, que yo pueda enviar por Telegram a la gerencia. Si ves niveles muy bajos de combustible o anomalías, destacalos en negrita. Mantén la respuesta súper breve (máx 4 oraciones).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        res.json({
            status: 'success',
            executive_summary: response.text,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("AI Analysis Error:", e);
        res.status(500).json({ error: e.message, hint: "Check GEMINI_API_KEY environment variable" });
    }
});

// ============================================
// 14. GET /api/n8n/delayed-voyages
// Detecta viajes retrasados o en riesgo de demora
// Uso n8n: Cron diario 9am → Si hay demora → Telegram al cliente/jefe
// ============================================
router.get('/delayed-voyages', async (req, res) => {
    try {
        const sb = req.app.locals.supabase;
        if (!sb) {
            return res.json({ delayed: [], message: 'Supabase no configurado' });
        }

        const { data: activeTrips, error } = await sb
            .from('trips')
            .select('*')
            .in('status', ['active', 'in_transit']);

        if (error) throw error;

        const now = new Date();
        const delayed = [];
        const atRisk = [];

        (activeTrips || []).forEach(trip => {
            if (trip.estimated_arrival) {
                const eta = new Date(trip.estimated_arrival);
                const diffHours = (eta - now) / (1000 * 60 * 60);

                if (diffHours < 0) {
                    delayed.push({
                        ...trip,
                        hours_late: Math.abs(Math.round(diffHours))
                    });
                } else if (diffHours < 24) {
                    atRisk.push({
                        ...trip,
                        hours_left: Math.round(diffHours)
                    });
                }
            }
        });

        res.json({
            total_delayed: delayed.length,
            total_at_risk: atRisk.length,
            delayed,
            at_risk: atRisk,
            timestamp: now.toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 15. GET /api/n8n/unresolved-incidents
// Incidentes críticos sin resolver por +48h
// Uso n8n: Cron diario → Escalación a Gerencia
// ============================================
router.get('/unresolved-incidents', async (req, res) => {
    try {
        const sb = req.app.locals.supabase;
        if (!sb) return res.json({ incidents: [], message: 'Supabase no configurado' });

        const { data, error } = await sb
            .from('incidents')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const now = new Date();
        const unresolved = (data || []).map(inc => {
            const created = new Date(inc.created_at);
            const hoursOpen = Math.round((now - created) / (1000 * 60 * 60));
            return {
                ...inc,
                hours_open: hoursOpen,
                requires_escalation: hoursOpen > 48 && (inc.severity === 'high' || inc.severity === 'critical')
            };
        }).filter(inc => inc.requires_escalation);

        res.json({
            count: unresolved.length,
            incidents: unresolved,
            timestamp: now.toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// 16. POST /api/n8n/create-maintenance
// Crea una orden preventiva desde n8n (ej. por horas de motor alertadas por sensor)
// ============================================
router.post('/create-maintenance', async (req, res) => {
    try {
        const { vessel_name, task_name, description, urgency } = req.body;
        
        if (!vessel_name || !task_name) {
            return res.status(400).json({ error: 'Faltan campos requeridos (vessel_name, task_name)' });
        }

        const sb = req.app.locals.supabase;
        if (!sb) return res.status(500).json({ error: 'Supabase desconectado' });

        const newTask = {
            vessel_name,
            task_name,
            description: description || 'Generado automáticamente por sistema IA/n8n',
            urgency: urgency || 'Medium',
            status: 'pending',
            scheduled_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        };

        const { error } = await sb.from('maintenance_logs').insert([newTask]);
        if (error) throw error;

        res.json({ success: true, message: 'Orden de mantenimiento creada', task: newTask });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// META: GET /api/n8n/endpoints
// Lista todos los endpoints disponibles
// ============================================
router.get('/endpoints', (req, res) => {
    res.json({
        service: 'FluviaFleet — n8n Automation API',
        version: '1.0.0',
        authentication: 'Header x-api-key: <tu_clave>',
        endpoints: [
            { method: 'GET', path: '/api/n8n/fleet-status', description: 'Estado completo de la flota', cron: 'Cada hora' },
            { method: 'GET', path: '/api/n8n/fuel-alerts', description: 'Alertas de combustible bajo', cron: 'Cada 4 horas', params: '?threshold=25' },
            { method: 'GET', path: '/api/n8n/maintenance-due', description: 'Mantenimientos pendientes/vencidos', cron: 'Diario 7am', params: '?days=7' },
            { method: 'GET', path: '/api/n8n/daily-summary', description: 'Resumen diario de operaciones', cron: 'Diario 7am L-V' },
            { method: 'POST', path: '/api/n8n/log-positions', description: 'Guardar posiciones AIS en historial', cron: 'Cada 30 min' },
            { method: 'GET', path: '/api/n8n/ais-live', description: 'Posiciones AIS en tiempo real', cron: 'Bajo demanda' },
            { method: 'GET', path: '/api/n8n/hydrology', description: 'Niveles de río y clima', cron: 'Cada 6 horas' },
            { method: 'GET', path: '/api/n8n/crew-certifications', description: 'Certificaciones por vencer', cron: 'Semanal', params: '?days=30' },
            { method: 'POST', path: '/api/n8n/send-alert', description: 'Enviar alerta al sistema', body: '{ title, message, severity, vessel_name }' },
            { method: 'GET', path: '/api/n8n/voyage-status', description: 'Viajes activos para tracking', cron: 'Cada 2 horas' },
            { method: 'POST', path: '/api/n8n/webhook', description: 'Webhook genérico', body: '{ action, payload }' },
            { method: 'GET', path: '/api/n8n/anomalies', description: 'Detección de anomalías', cron: 'Cada hora' },
            { method: 'GET', path: '/api/n8n/ai-analysis', description: 'Analista virtual Gemini interpretando flota', cron: 'Diario 8am' },
            { method: 'GET', path: '/api/n8n/delayed-voyages', description: 'Viajes retrasados o ETA en riesgo', cron: 'Diario 9am' },
            { method: 'GET', path: '/api/n8n/unresolved-incidents', description: 'Incidentes cr\u00edticos abiertos >48h', cron: 'Diario 10am' },
            { method: 'POST', path: '/api/n8n/create-maintenance', description: 'Autogenerar orden de matenimiento', body: '{ vessel_name, task_name, description }' },
            { method: 'GET', path: '/api/n8n/endpoints', description: 'Este listado de endpoints' }
        ]
    });
});

module.exports = router;
