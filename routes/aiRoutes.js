const express = require('express');
const AIService = require('../services/aiService');
const cache = require('../services/cache');

module.exports = (aiLimiter, authenticateUser) => {
    const router = express.Router();

    // Helper: obtener company_id del perfil autenticado
    async function getCompanyId(sb, userId) {
        const { data } = await sb.from('user_profiles').select('company_id').eq('user_id', userId).single();
        return data?.company_id || null;
    }

    // Helper: guardar insight de IA (acumula el moat de datos)
    async function saveInsight(sb, company_id, type, input, result, vessel_id = null) {
        try {
            await sb.from('ai_insights').insert({ company_id, type, input, result, vessel_id });
        } catch (e) {
            console.warn('[ai_insights save]', e.message); // no-op si tabla no existe aún
        }
    }

    // Instantiate service per request to ensure fresh supabase client from locals if needed,
    // or just instantiate it inside the handlers.

    router.post('/chat', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { message, context } = req.body;
            if (!message) return res.status(400).json({ error: 'Missing message' });

            const result = await aiService.chat(message, context);
            res.json(result);
        } catch (e) {
            console.error('Chat AI error:', e.message);
            if (e.message === 'AI not configured') {
                return res.status(503).json({ error: e.message, response: 'IA no disponible. Configura GEMINI_API_KEY en .env' });
            }
            res.status(500).json({ response: 'Error de conexión con el servicio de IA. Verificá tu internet.' });
        }
    });

    router.post('/predict-maintenance', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { companyId } = req.body;
            const predictions = await aiService.predictMaintenance(companyId);
            res.json({ predictions });
        } catch (e) {
            console.error('Predict maintenance error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error interno del servidor', predictions: [] });
        }
    });

    router.post('/optimize-convoy', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { companyId, destination, selectedVessels } = req.body;
            const suggestion = await aiService.optimizeConvoy(companyId, destination, selectedVessels);
            res.json({ suggestion });
        } catch (e) {
            console.error('Optimize convoy error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error interno del servidor', suggestion: {} });
        }
    });

    router.post('/fuel-anomalies', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { companyId } = req.body;
            const anomalies = await aiService.detectFuelAnomalies(companyId);
            res.json({ anomalies });
        } catch (e) {
            console.error('Fuel anomalies error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error interno del servidor', anomalies: [] });
        }
    });

    router.post('/invoice', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { invoiceText, voyageId } = req.body;
            if (!invoiceText) return res.status(400).json({ error: 'Missing invoiceText' });

            const result = await aiService.analyzeInvoice(invoiceText, voyageId);
            res.json(result);
        } catch (e) {
            console.error('Invoice AI error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error procesando factura' });
        }
    });

    // ─── POST /api/ai/eta ────────────────────────────────────────
    // Predicción de ETA combinando AIS + hidrología + Gemini
    router.post('/eta', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const sb = req.app.locals.supabase;
            const aiService = new AIService(sb);
            const companyId = await getCompanyId(sb, req.user.id);
            if (!companyId) return res.status(403).json({ error: 'Empresa no encontrada' });

            const { vessel_id, destination, convoy_id } = req.body;
            if (!vessel_id || !destination) {
                return res.status(400).json({ error: 'vessel_id y destination son requeridos' });
            }

            // Última posición AIS del barco
            const { data: posData } = await sb
                .from('ais_positions')
                .select('lat, lon, speed, course, timestamp')
                .eq('vessel_id', vessel_id)
                .eq('company_id', companyId)
                .order('timestamp', { ascending: false })
                .limit(1);

            const position = posData?.[0] || null;

            // Info del barco
            const { data: vessel } = await sb
                .from('vessels')
                .select('name, type, draft')
                .eq('id', vessel_id)
                .eq('company_id', companyId)
                .single();

            const cacheKey = `eta:${vessel_id}:${destination}`;
            const cached = cache.get(cacheKey);
            if (cached) return res.json({ ...cached, cached: true });

            const prompt = `Eres un experto en navegación fluvial de la Hidrovía Paraguay-Paraná.
Embarcación: ${vessel?.name || 'desconocida'} (${vessel?.type || 'tipo desconocido'})
Destino: ${destination}
${position ? `Posición actual: lat ${position.lat}, lon ${position.lon} | Velocidad: ${position.speed} nudos | Rumbo: ${position.course}°` : 'Posición AIS no disponible'}
${vessel?.draft ? `Calado: ${vessel.draft}m` : ''}
Calculá el ETA estimado en horas y factores que podrían afectar el viaje (nivel del río, clima, tráfico). Responde en español, de forma concisa.`;

            const result = await aiService.chat(prompt, '');
            const eta = { vessel_id, destination, position, estimate: result?.response || result, generatedAt: new Date().toISOString() };

            cache.set(cacheKey, eta, 1800); // 30 min cache
            await saveInsight(sb, companyId, 'eta', { vessel_id, destination }, eta, vessel_id);

            res.json(eta);
        } catch (e) {
            console.error('[AI/eta]', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error interno del servidor', estimate: null });
        }
    });

    // ─── POST /api/ai/fuel-optimize ─────────────────────────────
    // Optimización de consumo de combustible por tramo
    router.post('/fuel-optimize', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const sb = req.app.locals.supabase;
            const aiService = new AIService(sb);
            const companyId = await getCompanyId(sb, req.user.id);
            if (!companyId) return res.status(403).json({ error: 'Empresa no encontrada' });

            const { vessel_id, route, cargo_weight } = req.body;
            if (!vessel_id) return res.status(400).json({ error: 'vessel_id es requerido' });

            // Historial de consumos
            const { data: fuelLogs } = await sb
                .from('fuel_logs')
                .select('fuel_consumed, distance_km, speed_avg, cargo_weight, created_at')
                .eq('vessel_id', vessel_id)
                .order('created_at', { ascending: false })
                .limit(10);

            const { data: vessel } = await sb
                .from('vessels')
                .select('name, type, engine_power')
                .eq('id', vessel_id)
                .eq('company_id', companyId)
                .single();

            const historial = fuelLogs?.length
                ? fuelLogs.map(l => `  - ${l.distance_km}km: ${l.fuel_consumed}L (vel ${l.speed_avg} km/h, carga ${l.cargo_weight}t)`).join('\n')
                : '  Sin datos históricos disponibles';

            const prompt = `Eres un experto en optimización de combustible para flotas fluviales.
Embarcación: ${vessel?.name || vessel_id} (${vessel?.type || ''}, ${vessel?.engine_power || '?'} HP)
${route ? `Ruta planificada: ${route}` : ''}
${cargo_weight ? `Carga actual: ${cargo_weight} toneladas` : ''}
Historial reciente de consumos:
${historial}
Dá recomendaciones específicas para reducir el consumo de combustible en esta operación. Incluí velocidad óptima, distribución de carga y cualquier factor relevante. Responde en español.`;

            const result = await aiService.chat(prompt, '');
            const optimization = { vessel_id, route, cargo_weight, recommendations: result?.response || result, generatedAt: new Date().toISOString() };

            await saveInsight(sb, companyId, 'fuel-optimize', { vessel_id, route, cargo_weight }, optimization, vessel_id);

            res.json(optimization);
        } catch (e) {
            console.error('[AI/fuel-optimize]', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error interno del servidor', recommendations: null });
        }
    });

    // ─── POST /api/ai/draft-alerts ──────────────────────────────
    // Alertas predictivas de bajante/calado del río
    router.post('/draft-alerts', aiLimiter, authenticateUser, async (req, res) => {
        try {
            const sb = req.app.locals.supabase;
            const aiService = new AIService(sb);
            const firebaseAdmin = req.app.locals.firebaseAdmin;
            const companyId = await getCompanyId(sb, req.user.id);
            if (!companyId) return res.status(403).json({ error: 'Empresa no encontrada' });

            const { route_segments, vessel_draft } = req.body;
            if (!vessel_draft) return res.status(400).json({ error: 'vessel_draft es requerido (en metros)' });

            const segments = route_segments || ['Asunción-Confluencia', 'Confluencia-Rosario'];

            const prompt = `Eres un experto hidrólogo de la Hidrovía Paraguay-Paraná.
Calado de la embarcación: ${vessel_draft} metros
Tramos de ruta: ${segments.join(', ')}
Basándote en patrones históricos y condiciones actuales típicas de la Hidrovía:
1. Identificá qué tramos presentan mayor riesgo de calado insuficiente
2. Indicá el nivel mínimo recomendable para navegar con seguridad
3. Sugerí alternativas o precauciones
Responde en español de forma concisa y operativa.`;

            const result = await aiService.chat(prompt, '');
            const alerts = {
                vessel_draft,
                route_segments: segments,
                analysis: result?.response || result,
                riskLevel: 'medium',
                generatedAt: new Date().toISOString()
            };

            // Push FCM si hay riesgo
            if (firebaseAdmin && alerts.analysis) {
                try {
                    const { data: tokens } = await sb
                        .from('user_profiles')
                        .select('fcm_token')
                        .eq('company_id', companyId)
                        .not('fcm_token', 'is', null);

                    const validTokens = (tokens || []).map(t => t.fcm_token).filter(Boolean);
                    if (validTokens.length > 0) {
                        await firebaseAdmin.messaging().sendEachForMulticast({
                            tokens: validTokens,
                            notification: { title: '⚠️ Alerta de Calado', body: 'Revisá las condiciones hidrológicas en tu ruta.' },
                            data: { type: 'draft_alert', companyId }
                        });
                    }
                } catch (fcmErr) {
                    console.warn('[AI/draft-alerts FCM]', fcmErr.message);
                }
            }

            await saveInsight(sb, companyId, 'draft-alert', { route_segments: segments, vessel_draft }, alerts);

            res.json(alerts);
        } catch (e) {
            console.error('[AI/draft-alerts]', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: 'Error interno del servidor', alerts: null });
        }
    });

    return router;
};
