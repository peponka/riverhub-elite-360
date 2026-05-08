const express = require('express');
const AIService = require('../services/aiService');

module.exports = (aiLimiter, authenticateUser) => {
    const router = express.Router();

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

    router.post('/predict-maintenance', aiLimiter, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { companyId } = req.body;
            const predictions = await aiService.predictMaintenance(companyId);
            res.json({ predictions });
        } catch (e) {
            console.error('Predict maintenance error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: e.message, predictions: [] });
        }
    });

    router.post('/optimize-convoy', aiLimiter, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { companyId, destination, selectedVessels } = req.body;
            const suggestion = await aiService.optimizeConvoy(companyId, destination, selectedVessels);
            res.json({ suggestion });
        } catch (e) {
            console.error('Optimize convoy error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: e.message, suggestion: {} });
        }
    });

    router.post('/fuel-anomalies', aiLimiter, async (req, res) => {
        try {
            const aiService = new AIService(req.app.locals.supabase);
            const { companyId } = req.body;
            const anomalies = await aiService.detectFuelAnomalies(companyId);
            res.json({ anomalies });
        } catch (e) {
            console.error('Fuel anomalies error:', e.message);
            res.status(e.message === 'AI not configured' ? 503 : 500).json({ error: e.message, anomalies: [] });
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

    return router;
};
