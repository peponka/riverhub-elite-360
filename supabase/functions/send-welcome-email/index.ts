import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'ViaBarcazas <bienvenida@viabarcazas.com>'
// La raiz (viabarcazas.com) es la landing de marketing: no carga auth.js ni
// escucha el evento PASSWORD_RECOVERY. La pantalla que de verdad procesa el
// link y muestra "poner contraseña nueva" vive en /app.html.
const APP_URL = 'https://viabarcazas.com/app.html'
// Clave publica (anon), pensada para ir embebida en clientes. La necesita
// el link de abajo porque pega directo contra /auth/v1/verify, que exige
// apikey igual que el resto de la API de Supabase.
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc'

serve(async (req) => {
  try {
    const payload = await req.json()

    // Auth Hook payload: { user: { email, ... }, email_data: { token, token_hash, redirect_to, email_action_type, site_url } }
    const user = payload?.user ?? payload?.record ?? payload
    const emailData = payload?.email_data

    const email = user?.email
    const name = user?.raw_user_meta_data?.full_name || user?.raw_user_meta_data?.name || email?.split('@')[0] || 'Capitán'
    const actionType = emailData?.email_action_type ?? 'signup'

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email found' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Build confirmation link
    let confirmUrl = APP_URL
    if (emailData?.site_url && emailData?.token_hash) {
      const redirectTarget = emailData.redirect_to || APP_URL
      // site_url que manda el hook YA incluye /auth/v1 (no es el dominio pelado)
      const authBase = emailData.site_url.replace(/\/+$/, '')
      confirmUrl = `${authBase}/verify?token=${encodeURIComponent(emailData.token_hash)}&type=${actionType}&redirect_to=${encodeURIComponent(redirectTarget)}&apikey=${ANON_KEY}`
    } else if (emailData?.redirect_to) {
      confirmUrl = emailData.redirect_to
    }

    // Subject and CTA vary by action type
    const isSignup = actionType === 'signup' || actionType === 'email_change'
    const isRecovery = actionType === 'recovery' || actionType === 'magiclink'

    let subject = '¡Bienvenido a ViaBarcazas! ⚓'
    let ctaText = 'Confirmar mi cuenta →'
    let headingLine = `Hola, <em style="font-style:italic;">${name}</em>`
    let subheading = 'Tu cuenta en ViaBarcazas está lista. Confirmá tu email para comenzar a gestionar tu flota fluvial.'
    let bannerLabel = 'BIENVENIDO A BORDO'

    if (isRecovery) {
      subject = 'Restablecer contraseña — ViaBarcazas'
      ctaText = 'Restablecer contraseña →'
      headingLine = 'Restablecer<br><em style="font-style:italic;">contraseña</em>'
      subheading = 'Recibiste este email porque solicitaste restablecer tu contraseña. Si no fuiste vos, podés ignorarlo.'
      bannerLabel = 'SEGURIDAD DE CUENTA'
    }

    const showFeatures = isSignup

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#F8F9FA; font-family:'Inter',-apple-system,sans-serif; -webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" valign="middle" style="width:44px; height:44px; background:#1A1A2E; border-radius:12px; text-align:center; font-size:22px; line-height:44px;">⚓</td>
                  <td style="padding-left:12px; font-family:Georgia,serif; font-size:26px; font-weight:400; color:#1A1A2E; letter-spacing:-0.01em;">ViaBarcazas</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF; border-radius:20px; border:0.5px solid #E2E8F0; overflow:hidden;">

              <!-- Dark header -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #1A1A2E 0%, #0f172a 100%); padding: 40px 40px 36px;">
                    <p style="margin:0 0 12px; font-size:11px; font-weight:700; color:#3B82F6; letter-spacing:2px;">${bannerLabel}</p>
                    <h1 style="margin:0; font-family:Georgia,serif; font-size:34px; font-weight:400; color:#FFFFFF; line-height:1.2;">${headingLine}</h1>
                    <p style="margin:14px 0 0; font-size:15px; color:#94A3B8; line-height:1.6;">${subheading}</p>
                  </td>
                </tr>
              </table>

              ${showFeatures ? `
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 32px 40px 24px;">
                    <p style="margin:0 0 20px; font-size:11px; font-weight:700; color:#94A3B8; letter-spacing:1.5px;">LO QUE PODÉS HACER</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td width="44" valign="top"><div style="width:36px; height:36px; background:#EFF6FF; border-radius:10px; text-align:center; line-height:36px; font-size:18px;">🗺️</div></td>
                        <td style="padding-left:14px;">
                          <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#1A1A2E;">Mapa en tiempo real</p>
                          <p style="margin:0; font-size:12px; color:#94A3B8; line-height:1.5;">Seguí cada embarcación de tu flota con posición AIS actualizada.</p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td width="44" valign="top"><div style="width:36px; height:36px; background:#F0FDF4; border-radius:10px; text-align:center; line-height:36px; font-size:18px;">📋</div></td>
                        <td style="padding-left:14px;">
                          <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#1A1A2E;">Contratos y viajes</p>
                          <p style="margin:0; font-size:12px; color:#94A3B8; line-height:1.5;">Gestioná contratos de flete, manifiestos y reportes de cada viaje.</p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" valign="top"><div style="width:36px; height:36px; background:#FFF7ED; border-radius:10px; text-align:center; line-height:36px; font-size:18px;">⛽</div></td>
                        <td style="padding-left:14px;">
                          <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#1A1A2E;">Combustible y mantenimiento</p>
                          <p style="margin:0; font-size:12px; color:#94A3B8; line-height:1.5;">Controlá el consumo de combustible y el historial de mantenimiento.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding: 0 40px;"><div style="height:0.5px; background:#E2E8F0;"></div></td></tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 32px 40px; text-align:center;">
                    ${isSignup ? '<p style="margin:0 0 20px; font-size:14px; color:#94A3B8;">Tu período de prueba de 14 días ya comenzó.</p>' : ''}
                    <a href="${confirmUrl}" style="display:inline-block; background:#1A1A2E; color:#FFFFFF; text-decoration:none; font-family:Inter,-apple-system,sans-serif; font-size:14px; font-weight:600; padding:14px 32px; border-radius:12px;">${ctaText}</a>
                    <p style="margin:16px 0 0; font-size:11px; color:#CBD5E1;">Si el botón no funciona, copiá este link:<br><a href="${confirmUrl}" style="color:#3B82F6; word-break:break-all;">${confirmUrl}</a></p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0; text-align:center;">
              <p style="margin:0; font-size:11px; color:#CBD5E1; line-height:1.8;">
                ViaBarcazas · Gestión de flotas fluviales<br>
                Si no creaste esta cuenta, podés ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject,
        html,
      }),
    })

    const data = await resendRes.json()

    if (!resendRes.ok) {
      console.error('[send-welcome-email] Resend error:', data)
      return new Response(JSON.stringify({ error: data }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (e) {
    console.error('[send-welcome-email]', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
