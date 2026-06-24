// ============================================
// FluviaFleet — Admin Routes (Superadmin)
// Gestión completa de la plataforma
// ============================================

const express = require('express');
const router = express.Router();

function getAdmin(app) {
  return app.locals.supabaseAdmin || app.locals.supabase;
}

// ── Middleware: solo superadmin ──────────────────────────────────────────────
async function requireSuperAdmin(req, res, next) {
  try {
    const db = getAdmin(req.app);
    if (!db) return res.status(503).json({ error: 'DB no disponible' });
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', req.user.id)
      .single();
    if (!profile || profile.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso denegado — se requiere rol superadmin' });
    }
    req.adminProfile = profile;
    next();
  } catch (e) {
    console.error('[Admin Auth]', e.message);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}

// ── Middleware: admin de empresa (admin o superadmin) ────────────────────────
async function requireAdmin(req, res, next) {
  try {
    const db = getAdmin(req.app);
    if (!db) return res.status(503).json({ error: 'DB no disponible' });
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', req.user.id)
      .single();
    if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
      return res.status(403).json({ error: 'Acceso denegado — se requiere rol admin' });
    }
    req.adminProfile = profile;
    next();
  } catch (e) {
    console.error('[Admin Auth]', e.message);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}

// ── Helper: registrar audit log ──────────────────────────────────────────────
async function logAudit(db, { actor_id, action, entity_type, entity_id, details, company_id }) {
  try {
    await db.from('admin_audit_log').insert([{
      actor_id,
      action,
      entity_type,
      entity_id: entity_id?.toString() || null,
      details: details || null,
      company_id: company_id || null,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.warn('[Audit Log]', e.message);
  }
}

// ============================================================
// STATS — KPIs de plataforma (superadmin)
// GET /api/admin/stats
// ============================================================
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const [users, companies, vessels, leads] = await Promise.allSettled([
      db.from('user_profiles').select('*', { count: 'exact', head: true }),
      db.from('companies').select('*', { count: 'exact', head: true }),
      db.from('vessels').select('*', { count: 'exact', head: true }),
      db.from('leads').select('*', { count: 'exact', head: true }),
    ]);

    const activeUsersRes = await db
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .catch(() => ({ count: 0 }));

    const roleBreakdownRes = await db
      .from('user_profiles')
      .select('role')
      .catch(() => ({ data: [] }));

    const roleCount = {};
    (roleBreakdownRes.data || []).forEach(r => {
      roleCount[r.role] = (roleCount[r.role] || 0) + 1;
    });

    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newUsersRes = await db
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last30d)
      .catch(() => ({ count: 0 }));

    res.json({
      total_users: users.value?.count ?? 0,
      active_users: activeUsersRes.count ?? 0,
      new_users_30d: newUsersRes.count ?? 0,
      total_companies: companies.value?.count ?? 0,
      total_vessels: vessels.value?.count ?? 0,
      total_leads: leads.value?.count ?? 0,
      roles: roleCount,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[Admin Stats]', e.message);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ============================================================
// USERS — Gestión de usuarios
// ============================================================

// GET /api/admin/users  — lista todos los usuarios
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { role, company_id, is_active, search, limit = 100, offset = 0 } = req.query;

    let query = db
      .from('user_profiles')
      .select('user_id, full_name, role, company_id, is_active, last_login, created_at, permissions')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (role) query = query.eq('role', role);
    if (company_id) query = query.eq('company_id', company_id);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ users: data || [], total: count, limit: Number(limit), offset: Number(offset) });
  } catch (e) {
    console.error('[Admin Users List]', e.message);
    res.status(500).json({ error: 'Error listando usuarios' });
  }
});

// GET /api/admin/users/:id  — detalle de un usuario
router.get('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { data, error } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

// PUT /api/admin/users/:id/role  — cambiar rol
router.put('/users/:id/role', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { role } = req.body;
    const validRoles = ['superadmin', 'admin', 'operator', 'viewer', 'client', 'pending'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rol inválido. Opciones: ${validRoles.join(', ')}` });
    }
    const { error } = await db
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', req.params.id);
    if (error) throw error;

    await logAudit(db, {
      actor_id: req.user.id,
      action: 'change_role',
      entity_type: 'user',
      entity_id: req.params.id,
      details: { new_role: role },
    });

    res.json({ success: true, user_id: req.params.id, new_role: role });
  } catch (e) {
    console.error('[Admin Change Role]', e.message);
    res.status(500).json({ error: 'Error cambiando rol' });
  }
});

// PUT /api/admin/users/:id/status  — activar/desactivar
router.put('/users/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active debe ser true o false' });
    }
    const { error } = await db
      .from('user_profiles')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('user_id', req.params.id);
    if (error) throw error;

    await logAudit(db, {
      actor_id: req.user.id,
      action: is_active ? 'activate_user' : 'deactivate_user',
      entity_type: 'user',
      entity_id: req.params.id,
    });

    res.json({ success: true, user_id: req.params.id, is_active });
  } catch (e) {
    console.error('[Admin User Status]', e.message);
    res.status(500).json({ error: 'Error actualizando estado de usuario' });
  }
});

// PUT /api/admin/users/:id  — editar datos del usuario
router.put('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const allowed = ['full_name', 'company_id', 'permissions'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();

    const { error } = await db
      .from('user_profiles')
      .update(updates)
      .eq('user_id', req.params.id);
    if (error) throw error;

    await logAudit(db, {
      actor_id: req.user.id,
      action: 'update_user',
      entity_type: 'user',
      entity_id: req.params.id,
      details: updates,
    });

    res.json({ success: true });
  } catch (e) {
    console.error('[Admin Update User]', e.message);
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

// ============================================================
// COMPANIES — Gestión de empresas
// ============================================================

// GET /api/admin/companies  — lista todas las empresas con stats
router.get('/companies', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { data: companies, error } = await db
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all((companies || []).map(async (c) => {
      const [usersRes, vesselsRes] = await Promise.allSettled([
        db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('company_id', c.id),
        db.from('vessels').select('*', { count: 'exact', head: true }).eq('company_id', c.id),
      ]);
      return {
        ...c,
        user_count: usersRes.value?.count ?? 0,
        vessel_count: vesselsRes.value?.count ?? 0,
      };
    }));

    res.json({ companies: enriched, total: enriched.length });
  } catch (e) {
    console.error('[Admin Companies]', e.message);
    res.status(500).json({ error: 'Error listando empresas' });
  }
});

// GET /api/admin/companies/:id  — detalle de empresa
router.get('/companies/:id', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { data, error } = await db
      .from('companies')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Empresa no encontrada' });

    const [users, vessels] = await Promise.allSettled([
      db.from('user_profiles').select('user_id, full_name, role, is_active, last_login').eq('company_id', req.params.id),
      db.from('vessels').select('id, name, type, status').eq('company_id', req.params.id),
    ]);

    res.json({
      ...data,
      users: users.value?.data || [],
      vessels: vessels.value?.data || [],
    });
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo empresa' });
  }
});

// PUT /api/admin/companies/:id/settings  — actualizar configuración de empresa
router.put('/companies/:id/settings', requireAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const isSuperAdmin = req.adminProfile.role === 'superadmin';
    const isOwnCompany = req.adminProfile.company_id === req.params.id;
    if (!isSuperAdmin && !isOwnCompany) {
      return res.status(403).json({ error: 'Solo podés editar tu propia empresa' });
    }

    const allowed = ['name', 'plan', 'settings', 'contact_email', 'country', 'is_active'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();

    const { error } = await db.from('companies').update(updates).eq('id', req.params.id);
    if (error) throw error;

    await logAudit(db, {
      actor_id: req.user.id,
      action: 'update_company_settings',
      entity_type: 'company',
      entity_id: req.params.id,
      details: updates,
      company_id: req.params.id,
    });

    res.json({ success: true });
  } catch (e) {
    console.error('[Admin Company Settings]', e.message);
    res.status(500).json({ error: 'Error actualizando empresa' });
  }
});

// ============================================================
// AUDIT LOG — Historial de acciones admin
// ============================================================

// GET /api/admin/audit  — historial de acciones
router.get('/audit', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { company_id, actor_id, action, entity_type, limit = 100, offset = 0 } = req.query;

    let query = db
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (company_id) query = query.eq('company_id', company_id);
    if (actor_id) query = query.eq('actor_id', actor_id);
    if (action) query = query.eq('action', action);
    if (entity_type) query = query.eq('entity_type', entity_type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ logs: data || [], limit: Number(limit), offset: Number(offset) });
  } catch (e) {
    console.error('[Admin Audit]', e.message);
    res.status(500).json({ error: 'Error obteniendo audit log' });
  }
});

// POST /api/admin/audit  — registrar acción manual
router.post('/audit', requireAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { action, entity_type, entity_id, details } = req.body;
    if (!action) return res.status(400).json({ error: 'action es requerido' });
    await logAudit(db, {
      actor_id: req.user.id,
      action,
      entity_type,
      entity_id,
      details,
      company_id: req.adminProfile.company_id,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error registrando audit log' });
  }
});

// ============================================================
// COMPLIANCE — Vista global de cumplimiento
// ============================================================

// GET /api/admin/compliance  — resumen de compliance de todas las empresas
router.get('/compliance', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { data, error } = await db
      .from('compliance_items')
      .select('*, companies(name)')
      .order('expires_at', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const summary = {
      total: data?.length || 0,
      expired: data?.filter(i => i.expires_at && new Date(i.expires_at) < now).length || 0,
      expiring_soon: data?.filter(i => i.expires_at && new Date(i.expires_at) >= now && new Date(i.expires_at) <= soon).length || 0,
      ok: data?.filter(i => !i.expires_at || new Date(i.expires_at) > soon).length || 0,
      items: data || [],
    };

    res.json(summary);
  } catch (e) {
    console.error('[Admin Compliance]', e.message);
    res.status(500).json({ error: 'Error obteniendo compliance' });
  }
});

// GET /api/admin/compliance/company/:id  — compliance de una empresa
router.get('/compliance/company/:id', requireAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const isSuperAdmin = req.adminProfile.role === 'superadmin';
    const isOwnCompany = req.adminProfile.company_id === req.params.id;
    if (!isSuperAdmin && !isOwnCompany) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { data, error } = await db
      .from('compliance_items')
      .select('*')
      .eq('company_id', req.params.id)
      .order('expires_at', { ascending: true });

    if (error) throw error;
    res.json({ items: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo compliance' });
  }
});

// ============================================================
// NOTIFICATIONS — Broadcast a usuarios
// ============================================================

// POST /api/admin/notifications/broadcast
router.post('/notifications/broadcast', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const { title, message, target_role, target_company_id } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'title y message son requeridos' });
    }

    let query = db.from('user_profiles').select('user_id, full_name').eq('is_active', true);
    if (target_role) query = query.eq('role', target_role);
    if (target_company_id) query = query.eq('company_id', target_company_id);

    const { data: targets, error } = await query;
    if (error) throw error;

    const notifications = (targets || []).map(u => ({
      user_id: u.user_id,
      title,
      message,
      type: 'admin_broadcast',
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    if (notifications.length > 0) {
      await db.from('notifications').insert(notifications);
    }

    await logAudit(db, {
      actor_id: req.user.id,
      action: 'broadcast_notification',
      entity_type: 'notification',
      details: { title, target_role, target_company_id, recipients: notifications.length },
    });

    res.json({ success: true, recipients: notifications.length });
  } catch (e) {
    console.error('[Admin Broadcast]', e.message);
    res.status(500).json({ error: 'Error enviando broadcast' });
  }
});

// ============================================================
// PLATFORM HEALTH
// ============================================================

// GET /api/admin/health  — estado de los servicios
router.get('/health', requireSuperAdmin, async (req, res) => {
  try {
    const db = getAdmin(req.app);
    const checks = await Promise.allSettled([
      db.from('user_profiles').select('user_id', { count: 'exact', head: true }),
      fetch(`https://graph.facebook.com/v20.0/me?access_token=${process.env.META_ACCESS_TOKEN}`)
        .then(r => r.ok ? 'ok' : 'error').catch(() => 'unreachable'),
    ]);

    res.json({
      supabase: checks[0].status === 'fulfilled' ? 'ok' : 'error',
      whatsapp: checks[1].value || 'error',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
      meta_token: process.env.META_ACCESS_TOKEN ? 'configured' : 'missing',
      uptime_seconds: Math.floor(process.uptime()),
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: 'Error verificando salud de servicios' });
  }
});

module.exports = { router, requireAdmin, requireSuperAdmin };
