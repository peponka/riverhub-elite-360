// ============================================
// FluviaFleet — Auth Routes
// Superadmin login via Supabase Auth + role check
// ============================================

const express = require('express');
const router = express.Router();

// POST /api/auth/superadmin-login
router.post('/superadmin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }
        
        const sb = req.app.locals.supabase;
        if (!sb) return res.status(503).json({ error: 'Auth service unavailable' });
        
        // Authenticate via Supabase Auth
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // Verify superadmin role in user_profiles
        const { data: profile } = await sb.from('user_profiles').select('role').eq('user_id', data.user.id).single();
        if (!profile || profile.role !== 'superadmin') {
            return res.status(403).json({ error: 'Acceso denegado — se requiere rol superadmin' });
        }
        
        res.json({ 
            success: true, 
            token: data.session.access_token,
            user: { id: data.user.id, email: data.user.email, role: 'superadmin' }
        });
    } catch (e) {
        console.error('[Superadmin Login]', e.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
