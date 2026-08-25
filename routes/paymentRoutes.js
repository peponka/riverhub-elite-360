// Compatibilidad con instalaciones antiguas: no hay integracion Stripe activa.
const express = require('express');

module.exports = () => {
    const router = express.Router();
    router.all('*', (_req, res) => res.status(410).json({
        error: 'Los pagos online fueron retirados. Contactá a ventas para una propuesta por flota.',
        proposalUrl: '/pricing.html#contacto'
    }));
    return router;
};
