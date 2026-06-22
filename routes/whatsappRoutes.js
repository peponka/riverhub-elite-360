// routes/whatsappRoutes.js
// Notificaciones WhatsApp via Meta WhatsApp Cloud API
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages

const express = require('express');
const router = express.Router();

let createClient;
try { createClient = require('@supabase/supabase-js').createClient; } catch {}

function getAdmin() {
  if (!createClient) return null;
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Obtener company_id del usuario a partir de su JWT (service key bypass RLS)
async function companyFromToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userId = payload.sub;
    if (!userId) return null;
    const db = getAdmin();
    if (!db) return null;
    const { data } = await db.from('user_profiles').select('company_id').eq('user_id', userId).single();
    return data?.company_id || null;
  } catch { return null; }
}

// GET /api/whatsapp/my-company — el frontend llama esto para obtener su company_id
router.get('/my-company', async (req, res) => {
  const company_id = await companyFromToken(req.headers.authorization);
  if (!company_id) return res.status(401).json({ error: 'No se pudo resolver company_id' });
  res.json({ company_id });
});

// Enviar mensaje via Meta WhatsApp Cloud API
async function sendWhatsApp(phone, message) {
  const phoneId = process.env.META_PHONE_NUMBER_ID;
  const token   = process.env.META_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return { ok: false, reason: 'META_PHONE_NUMBER_ID o META_ACCESS_TOKEN no configurados' };
  }

  // Meta espera el número sin '+', en formato E.164: 595981234567
  const to = phone.replace(/^\+/, '');

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await res.json();
    if (data.error) return { ok: false, reason: data.error.message };
    return { ok: true, message_id: data.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── POST /api/whatsapp/send ─────────────────────────────────────────────────
router.post('/send', async (req, res) => {
  const { to, message, company_id } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to y message son requeridos' });

  try {
    const result = await sendWhatsApp(to, message);

    const db = getAdmin();
    if (db && company_id) {
      await db.from('whatsapp_log').insert({
        company_id,
        to_number: to,
        message,
        status: result.ok ? 'sent' : 'failed',
        error_message: result.ok ? null : result.reason,
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/whatsapp/alert ────────────────────────────────────────────────
router.post('/alert', async (req, res) => {
  const { type, company_id, payload } = req.body;
  if (!type || !company_id) return res.status(400).json({ error: 'type y company_id requeridos' });

  const db = getAdmin();
  if (!db) return res.status(503).json({ error: 'DB no disponible' });

  const { data: contacts } = await db
    .from('whatsapp_contacts')
    .select('phone, alert_types')
    .eq('company_id', company_id)
    .eq('active', true);

  if (!contacts?.length) return res.json({ ok: true, sent: 0, note: 'No hay contactos configurados' });

  const messages = {
    draft_alert:
      `⚠️ *Alerta de Calado — FluviaFleet*\n\nEstación: ${payload?.station || '—'}\nNivel actual: ${payload?.level || '—'}m\nEmbarcación en riesgo: ${payload?.vessel || '—'}\n\nVerificá la situación antes de zarpar.`,
    compliance_expiry:
      `🚨 *Documento por Vencer — FluviaFleet*\n\n📄 ${payload?.document_type || 'Certificado'}\n🚢 ${payload?.vessel || '—'}\n🏛️ ${payload?.authority || '—'}\n📅 Vence: ${payload?.expiry_date || '—'} (${payload?.days_left || '—'} días)\n\nRenovar antes de operar en aguas reguladas.`,
    maintenance_overdue:
      `🔧 *Mantenimiento Vencido — FluviaFleet*\n\n🚢 ${payload?.vessel || '—'}\n⚙️ ${payload?.task || '—'}\n📅 Venció: ${payload?.overdue_date || '—'}\n\nProgramar intervención urgente.`,
    new_contract:
      `📄 *Nuevo Contrato — FluviaFleet*\n\n🤝 ${payload?.client || '—'}\n🗺️ ${payload?.route || '—'}\n📦 ${payload?.product || '—'}\n💰 ${payload?.rate || '—'}\n\nRevisá los detalles en el panel.`,
    custom: payload?.text || '📣 Notificación de FluviaFleet',
  };

  const body = messages[type] || messages.custom;
  let sent = 0;

  for (const contact of contacts) {
    const types = contact.alert_types || [];
    if (type !== 'custom' && types.length && !types.includes(type)) continue;

    const result = await sendWhatsApp(contact.phone, body);
    if (result.ok) sent++;

    await db.from('whatsapp_log').insert({
      company_id,
      to_number: contact.phone,
      message: body,
      alert_type: type,
      status: result.ok ? 'sent' : 'failed',
      error_message: result.ok ? null : result.reason,
    });
  }

  res.json({ ok: true, sent, total: contacts.length });
});

// ── POST /api/whatsapp/daily-check ─────────────────────────────────────────
router.post('/daily-check', async (req, res) => {
  const db = getAdmin();
  if (!db) return res.status(503).json({ error: 'DB no disponible' });

  const { data: companies } = await db.from('companies').select('id');
  if (!companies?.length) return res.json({ ok: true, processed: 0 });

  let alerts = 0;
  const base = process.env.BACKEND_URL || 'http://localhost:3000';

  for (const company of companies) {
    const { data: docs } = await db
      .from('compliance_documents')
      .select('vessel_name, document_type, authority, expiry_date')
      .eq('company_id', company.id)
      .in('status', ['expiring', 'expired']);

    for (const doc of docs || []) {
      const daysLeft = Math.ceil((new Date(doc.expiry_date) - Date.now()) / 864e5);
      if (daysLeft > 30) continue;
      await fetch(`${base}/api/whatsapp/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'compliance_expiry',
          company_id: company.id,
          payload: {
            vessel: doc.vessel_name,
            document_type: doc.document_type,
            authority: doc.authority,
            expiry_date: new Date(doc.expiry_date).toLocaleDateString('es'),
            days_left: daysLeft < 0 ? 'VENCIDO' : daysLeft,
          },
        }),
      });
      alerts++;
    }
  }

  res.json({ ok: true, alerts });
});

// ── GET /api/whatsapp/log ───────────────────────────────────────────────────
router.get('/log', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id requerido' });
  const db = getAdmin();
  const { data, error } = await db
    .from('whatsapp_log').select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/whatsapp/contacts ──────────────────────────────────────────────
router.get('/contacts', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id requerido' });
  const db = getAdmin();
  const { data, error } = await db
    .from('whatsapp_contacts').select('*')
    .eq('company_id', company_id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST /api/whatsapp/contacts ─────────────────────────────────────────────
router.post('/contacts', async (req, res) => {
  const { company_id, name, phone, role, alert_types } = req.body;
  if (!company_id || !phone) return res.status(400).json({ error: 'company_id y phone requeridos' });
  const db = getAdmin();
  const { data, error } = await db
    .from('whatsapp_contacts')
    .insert({ company_id, name, phone, role, alert_types: alert_types || [], active: true })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── DELETE /api/whatsapp/contacts/:id ──────────────────────────────────────
router.delete('/contacts/:id', async (req, res) => {
  const db = getAdmin();
  const { error } = await db.from('whatsapp_contacts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
