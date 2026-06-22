// routes/whatsappRoutes.js
// Notificaciones WhatsApp via Twilio para FluviaFleet
// Alertas: calado, compliance, mantenimiento, contratos

const express = require('express');
const router = express.Router();

const TWILIO_SID  = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const FROM_WA     = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // sandbox por defecto

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

// Enviar mensaje via Twilio API (sin SDK — solo fetch nativo de Node 18+)
async function sendWhatsApp(to, body) {
  if (!TWILIO_SID || !TWILIO_AUTH) {
    console.warn('⚠️ Twilio no configurado — mensaje no enviado:', body);
    return { ok: false, reason: 'Twilio not configured' };
  }

  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const encoded = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: FROM_WA, To: toWa, Body: body }).toString(),
  });

  const data = await res.json();
  return { ok: res.ok, sid: data.sid, error: data.message };
}

// ── POST /api/whatsapp/send ─────────────────────────────────────────────────
// Envío manual desde el panel (admin)
router.post('/send', async (req, res) => {
  const { to, message, company_id } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to y message son requeridos' });

  try {
    const result = await sendWhatsApp(to, message);

    // Guardar en historial
    const db = getAdmin();
    if (db && company_id) {
      await db.from('whatsapp_log').insert({
        company_id,
        to_number: to,
        message,
        status: result.ok ? 'sent' : 'failed',
        twilio_sid: result.sid || null,
        error_message: result.error || null,
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/whatsapp/alert ────────────────────────────────────────────────
// Alerta automática (llamado desde otros módulos o n8n)
router.post('/alert', async (req, res) => {
  const { type, company_id, payload } = req.body;
  if (!type || !company_id) return res.status(400).json({ error: 'type y company_id requeridos' });

  const db = getAdmin();
  if (!db) return res.status(503).json({ error: 'DB no disponible' });

  // Obtener contactos configurados para este tipo de alerta
  const { data: contacts } = await db
    .from('whatsapp_contacts')
    .select('phone, alert_types')
    .eq('company_id', company_id)
    .eq('active', true);

  if (!contacts?.length) return res.json({ ok: true, sent: 0, note: 'No contacts configured' });

  const messages = {
    draft_alert:
      `⚠️ *Alerta de Calado — FluviaFleet*\n\nEstación: ${payload?.station || '—'}\nNivel actual: ${payload?.level || '—'}m\nEmbarcación en riesgo: ${payload?.vessel || '—'}\n\nVerificá la situación antes de zarpar.`,
    compliance_expiry:
      `🚨 *Documento por Vencer — FluviaFleet*\n\n📄 ${payload?.document_type || 'Certificado'}\n🚢 Embarcación: ${payload?.vessel || '—'}\n🏛️ Autoridad: ${payload?.authority || '—'}\n📅 Vence: ${payload?.expiry_date || '—'} (${payload?.days_left || '—'} días)\n\nRenovar antes de operar en aguas reguladas.`,
    maintenance_overdue:
      `🔧 *Mantenimiento Vencido — FluviaFleet*\n\n🚢 ${payload?.vessel || '—'}\n⚙️ ${payload?.task || '—'}\n📅 Venció: ${payload?.overdue_date || '—'}\n\nProgramar intervención urgente.`,
    new_contract:
      `📄 *Nuevo Contrato — FluviaFleet*\n\n🤝 Cliente: ${payload?.client || '—'}\n🗺️ Ruta: ${payload?.route || '—'}\n📦 Producto: ${payload?.product || '—'}\n💰 Tarifa: ${payload?.rate || '—'}\n\nRevisá los detalles en el panel.`,
    custom:
      payload?.text || '📣 Notificación de FluviaFleet',
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
      twilio_sid: result.sid || null,
      error_message: result.error || null,
    });
  }

  res.json({ ok: true, sent, total: contacts.length });
});

// ── POST /api/whatsapp/daily-check ─────────────────────────────────────────
// Revisión diaria: compliance vencimientos + mantenimiento
// Llamar desde pg_cron o un cron externo
router.post('/daily-check', async (req, res) => {
  const db = getAdmin();
  if (!db) return res.status(503).json({ error: 'DB no disponible' });

  const { data: companies } = await db.from('companies').select('id');
  if (!companies?.length) return res.json({ ok: true, processed: 0 });

  let alerts = 0;

  for (const company of companies) {
    const cid = company.id;

    // Compliance: documentos que vencen en 30 días o ya vencieron
    const { data: docs } = await db
      .from('compliance_documents')
      .select('vessel_name, document_type, authority, expiry_date')
      .eq('company_id', cid)
      .in('status', ['expiring', 'expired']);

    for (const doc of docs || []) {
      const daysLeft = Math.ceil((new Date(doc.expiry_date) - Date.now()) / 864e5);
      if (daysLeft > 30) continue;

      await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/whatsapp/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'compliance_expiry',
          company_id: cid,
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
  if (!db) return res.status(503).json({ error: 'DB no disponible' });

  const { data, error } = await db
    .from('whatsapp_log')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/whatsapp/contacts ──────────────────────────────────────────────
router.get('/contacts', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id requerido' });

  const db = getAdmin();
  const { data, error } = await db
    .from('whatsapp_contacts')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false });

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
    .select()
    .single();

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
