import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'FluviaFleet <bienvenida@fluviafleet.com>'
const APP_URL = 'https://fluviafleet.com'

serve(async (req) => {
  try {
    const payload = await req.json()

    // Supabase Auth webhook sends: { type: 'INSERT', record: { email, ... } }
    const user = payload?.record ?? payload
    const email = user?.email
    const name = user?.raw_user_meta_data?.full_name || user?.raw_user_meta_data?.name || email?.split('@')[0] || 'Capitán'

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email found' }), { status: 400 })
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a FluviaFleet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;1,400&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #F8F9FA; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="background:#F8F9FA; padding: 40px 20px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; margin:0 auto;">

    <!-- Logo / Header -->
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="display:inline-flex; align-items:center; gap:10px;">
                <div style="width:44px; height:44px; background:#1A1A2E; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                  <span style="font-size:22px;">⚓</span>
                </div>
                <span style="font-family:'Newsreader', Georgia, serif; font-size:26px; font-weight:400; color:#1A1A2E; letter-spacing:-0.01em;">FluviaFleet</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Card principal -->
    <tr>
      <td style="background:#FFFFFF; border-radius:20px; border:0.5px solid #E2E8F0; overflow:hidden;">

        <!-- Banner azul -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: linear-gradient(135deg, #1A1A2E 0%, #0f172a 100%); padding: 40px 40px 36px;">
              <p style="font-size:11px; font-weight:700; color:#3B82F6; letter-spacing:2px; margin-bottom:12px;">BIENVENIDO A BORDO</p>
              <h1 style="font-family:'Newsreader', Georgia, serif; font-size:36px; font-weight:400; color:#FFFFFF; line-height:1.2; margin-bottom:8px;">
                Hola, <em style="font-style:italic;">${name}</em>
              </h1>
              <p style="font-size:15px; color:#94A3B8; line-height:1.6; margin-top:12px;">
                Tu cuenta en FluviaFleet está lista. Ahora podés gestionar tu flota fluvial desde un solo lugar.
              </p>
            </td>
          </tr>
        </table>

        <!-- Features -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 36px 40px;">

              <p style="font-size:11px; font-weight:700; color:#94A3B8; letter-spacing:1.5px; margin-bottom:20px;">LO QUE PODÉS HACER</p>

              <!-- Feature 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px; height:36px; background:#EFF6FF; border-radius:10px; text-align:center; line-height:36px; font-size:18px;">🗺️</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="font-size:14px; font-weight:600; color:#1A1A2E; margin-bottom:2px;">Mapa en tiempo real</p>
                    <p style="font-size:12px; color:#94A3B8; line-height:1.5;">Seguí cada embarcación de tu flota con posición AIS actualizada.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px; height:36px; background:#F0FDF4; border-radius:10px; text-align:center; line-height:36px; font-size:18px;">📋</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="font-size:14px; font-weight:600; color:#1A1A2E; margin-bottom:2px;">Contratos y viajes</p>
                    <p style="font-size:12px; color:#94A3B8; line-height:1.5;">Gestioná contratos de flete, manifiestos y reportes de cada viaje.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:0;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px; height:36px; background:#FFF7ED; border-radius:10px; text-align:center; line-height:36px; font-size:18px;">⛽</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="font-size:14px; font-weight:600; color:#1A1A2E; margin-bottom:2px;">Combustible y mantenimiento</p>
                    <p style="font-size:12px; color:#94A3B8; line-height:1.5;">Controlá el consumo de combustible y el historial de mantenimiento.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 0 40px;">
              <div style="height:0.5px; background:#E2E8F0;"></div>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 32px 40px; text-align:center;">
              <p style="font-size:14px; color:#94A3B8; margin-bottom:20px;">Tu período de prueba de 14 días ya comenzó.</p>
              <a href="${APP_URL}" style="display:inline-block; background:#1A1A2E; color:#FFFFFF; text-decoration:none; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; padding:14px 32px; border-radius:12px; letter-spacing:0.01em;">
                Ir al dashboard →
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 28px 0; text-align:center;">
        <p style="font-size:11px; color:#CBD5E1; line-height:1.8;">
          FluviaFleet · Gestión de flotas fluviales<br>
          Si no creaste esta cuenta, podés ignorar este mensaje.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: '¡Bienvenido a FluviaFleet! ⚓',
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[send-welcome-email] Resend error:', data)
      return new Response(JSON.stringify({ error: data }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200 })

  } catch (e) {
    console.error('[send-welcome-email]', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
