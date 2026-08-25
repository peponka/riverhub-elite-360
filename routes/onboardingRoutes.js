// ============================================
// ViaBarcazas — Onboarding Routes
// POST /api/onboarding/company
// POST /api/onboarding/vessels
// POST /api/onboarding/invite
// GET  /api/onboarding/status
// POST /api/vessels/bulk-import
// ============================================

const express = require('express');

module.exports = function(authenticateUser, supabase, supabaseAdmin) {
    const router = express.Router();
    const sb = supabaseAdmin || supabase;

    // Helper: obtener company_id desde el perfil autenticado
    async function getCompanyId(userId) {
        const { data, error } = await sb
            .from('user_profiles')
            .select('company_id')
            .eq('user_id', userId)
            .single();
        if (error || !data) return null;
        return data.company_id;
    }

    async function getUserProfile(userId) {
        const { data, error } = await sb
            .from('user_profiles')
            .select('company_id, role')
            .eq('user_id', userId)
            .single();
        if (error || !data) return null;
        return data;
    }

    // ─── POST /api/onboarding/company ───────────────────────────
    // Crea la empresa y la asocia al usuario autenticado
    router.post('/company', authenticateUser, async (req, res) => {
        try {
            const { name, tax_id, country = 'PY', phone, website } = req.body;
            if (!name) return res.status(400).json({ error: 'El nombre de la empresa es requerido' });

            const userId = req.user.id;

            // An authenticated user can only create their initial company once.
            const currentProfile = await getUserProfile(userId);
            if (currentProfile?.company_id) {
                return res.status(409).json({ error: 'Ya tenés una empresa asociada' });
            }

            // Crear empresa
            const { data: company, error: compErr } = await sb
                .from('companies')
                .insert({
                    name,
                    tax_id: tax_id || null,
                    country,
                    phone: phone || null,
                    website: website || null,
                    plan: 'trial',
                    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    subscription_status: 'trialing',
                    onboarding_step: 1,
                    onboarding_completed: false
                })
                .select()
                .single();

            if (compErr) {
                console.error('[Onboarding/company]', compErr.message);
                return res.status(500).json({ error: 'Error al crear la empresa' });
            }

            // Actualizar perfil del usuario con el company_id
            await sb.from('user_profiles')
                .upsert({ user_id: userId, company_id: company.id, role: 'admin' }, { onConflict: 'user_id' });

            res.json({ success: true, company });
        } catch (e) {
            console.error('[Onboarding/company]', e.message);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // ─── POST /api/onboarding/vessels ───────────────────────────
    // Agrega embarcaciones a la empresa del usuario autenticado
    router.post('/vessels', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await getUserProfile(userId);
            const companyId = profile?.company_id;
            if (!companyId) return res.status(403).json({ error: 'No tenés una empresa asociada' });
            if (!['admin', 'superadmin'].includes(profile.role)) {
                return res.status(403).json({ error: 'Solo un administrador puede cargar embarcaciones' });
            }

            const { vessels } = req.body;
            if (!vessels || !Array.isArray(vessels) || vessels.length === 0) {
                return res.status(400).json({ error: 'Se requiere al menos una embarcación' });
            }

            const rows = vessels.map(v => ({
                company_id: companyId,
                name: v.name,
                type: v.type || 'barcaza',
                registration: v.registration || null,
                mmsi: v.mmsi || null,
                flag: v.flag || 'PY',
                status: 'active'
            })).filter(v => v.name);

            if (rows.length === 0) return res.status(400).json({ error: 'Cada embarcación requiere un nombre' });

            // El cupo se cuenta por embarcacion, sin diferenciar barcazas de remolcadores.
            const { data: subscription } = await sb.from('subscriptions')
                .select('included_units, max_vessels')
                .eq('company_id', companyId)
                .in('contract_status', ['trial', 'active', 'pending_sales'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (subscription) {
                const { count, error: countError } = await sb.from('vessels')
                    .select('id', { count: 'exact', head: true }).eq('company_id', companyId);
                if (countError) throw countError;
                const capacity = subscription.included_units || subscription.max_vessels;
                if (capacity && (count || 0) + rows.length > capacity) {
                    return res.status(409).json({ error: `El plan permite hasta ${capacity} embarcaciones entre barcazas y remolcadores.` });
                }
            }

            const { data, error } = await sb.from('vessels').insert(rows).select();
            if (error) {
                console.error('[Onboarding/vessels]', error.message);
                return res.status(500).json({ error: 'Error al guardar las embarcaciones' });
            }

            // Avanzar paso de onboarding
            await sb.from('companies')
                .update({ onboarding_step: 2 })
                .eq('id', companyId);

            res.json({ success: true, vessels: data, count: data.length });
        } catch (e) {
            console.error('[Onboarding/vessels]', e.message);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // ─── POST /api/onboarding/invite ────────────────────────────
    // Registra una invitación de equipo
    router.post('/invite', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await getUserProfile(userId);
            const companyId = profile?.company_id;
            if (!companyId) return res.status(403).json({ error: 'No tenés una empresa asociada' });
            if (!['admin', 'superadmin'].includes(profile.role)) {
                return res.status(403).json({ error: 'Solo un administrador puede invitar personas' });
            }

            const { email, role = 'operator' } = req.body;
            if (!email) return res.status(400).json({ error: 'El email es requerido' });

            const validRoles = ['admin', 'operator', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: `Rol inválido. Opciones: ${validRoles.join(', ')}` });
            }

            const { data, error } = await sb.from('invitations').insert({
                company_id: companyId,
                email: email.toLowerCase().trim(),
                role,
                invited_by: userId,
                status: 'pending'
            }).select().single();

            if (error) {
                console.error('[Onboarding/invite]', error.message);
                return res.status(500).json({ error: 'Error al registrar la invitación' });
            }

            // Avanzar paso de onboarding
            await sb.from('companies')
                .update({ onboarding_step: 3, onboarding_completed: true })
                .eq('id', companyId);

            res.json({ success: true, invitation: data });
        } catch (e) {
            console.error('[Onboarding/invite]', e.message);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // ─── GET /api/onboarding/status ─────────────────────────────
    // Retorna el checklist de onboarding + días de trial restantes
    router.get('/status', authenticateUser, async (req, res) => {
        try {
            const userId = req.user.id;
            const companyId = await getCompanyId(userId);
            if (!companyId) {
                return res.json({
                    hasCompany: false,
                    checklist: { company: false, vessels: false, team: false, ais: false },
                    trial: null
                });
            }

            const [companyRes, vesselsRes, invitesRes] = await Promise.all([
                sb.from('companies').select('*').eq('id', companyId).single(),
                sb.from('vessels').select('id').eq('company_id', companyId),
                sb.from('invitations').select('id').eq('company_id', companyId)
            ]);

            const company = companyRes.data;
            const vesselCount = (vesselsRes.data || []).length;
            const inviteCount = (invitesRes.data || []).length;

            let trialDaysLeft = null;
            if (company?.trial_ends_at) {
                const msLeft = new Date(company.trial_ends_at) - Date.now();
                trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
            }

            res.json({
                hasCompany: true,
                company: { id: companyId, name: company?.name, plan: company?.plan, status: company?.subscription_status },
                checklist: {
                    company: true,
                    vessels: vesselCount > 0,
                    team: inviteCount > 0,
                    ais: vesselCount > 0 // simplificado: si hay barcos, AIS puede conectarse
                },
                trial: {
                    active: company?.subscription_status === 'trialing',
                    daysLeft: trialDaysLeft,
                    endsAt: company?.trial_ends_at
                },
                progress: { step: company?.onboarding_step || 0, completed: company?.onboarding_completed || false }
            });
        } catch (e) {
            console.error('[Onboarding/status]', e.message);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    return router;
};
