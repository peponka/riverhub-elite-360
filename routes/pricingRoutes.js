const express = require('express');
const { PLANES, COMMERCIAL_TERMS, calculateFleetPricing } = require('../config/pricing');

module.exports = function pricingRoutes() {
    const router = express.Router();
    const catalog = () => ({ plans: PLANES, terms: COMMERCIAL_TERMS });

    router.get('/', (_req, res) => res.json(catalog()));
    router.post('/quote', (req, res) => {
        try {
            res.json({ ...catalog(), quote: calculateFleetPricing(req.body) });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // No se procesa cobro online: ventas valida la propuesta y activa el contrato.
    router.post('/request-proposal', (req, res) => {
        try {
            const quote = calculateFleetPricing(req.body);
            res.status(202).json({ accepted: true, quote, nextStep: 'Un asesor comercial se contactara para formalizar la propuesta.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    return router;
};
