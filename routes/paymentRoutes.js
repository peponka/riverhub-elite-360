const express = require('express');

module.exports = (authenticateUser, stripe, stripeStr) => {
    const router = express.Router();

    router.post('/create-checkout', authenticateUser, async (req, res) => {
        try {
            const { planId, companyId, email } = req.body;
            
            const plans = {
                solist:    { price: 15000, name: 'SOLIST (1 Barco)' },
                squad:     { price: 45000, name: 'SQUAD (3 Barcos)' },
                expansion: { price: 120000, name: 'PACK EXPANSIÓN (10 Barcos)' },
                admiral:   { price: 180000, name: 'ADMIRAL (Ilimitado)' }
            };

            if (!plans[planId]) return res.status(400).json({ error: 'Plan no válido' });

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

    return router;
};
