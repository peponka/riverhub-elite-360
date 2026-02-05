# GUÍA DE CONFIGURACIÓN DE CORREO RIVERHUB (Supabase)

Para que los correos (Reset Password, Invitaciones) lleguen con tu nombre y formato profesional, sigue estos pasos:

## 1. Configurar SMTP Personalizado (Importante para que diga "RiverHub")
Por defecto, Supabase envía correos desde `noreply@mail.supabase.io`. Para cambiarlo:
1. Ve a tu proyecto en **Supabase > Settings > Auth**.
2. Baja a la sección **SMTP Settings**.
3. Activa "Enable Custom SMTP".
4. Ingresa los datos de tu proveedor de correo (Recomendado: **Resend.com**, es gratis para empezar y muy fácil).
   - **Sender Email**: `soporte@riverhub.com` (o el que verifiques).
   - **Sender Name**: `RiverHub Elite`.

## 2. Plantilla de Correo (Reset Password)
En **Supabase > Authentication > Email Templates > Reset Password**, pega este código HTML para que el correo se vea profesional y alineado al diseño Dark/Hacker de la app.

### Subject (Asunto):
`🔐 Recuperación de Acceso - RiverHub Elite OS`

### Body (Cuerpo del Mensaje):
Copia y pega este bloque HTML completo:

```html
<!DOCTYPE html>
<html>
<head>
</head>
<body style="background-color: #0f172a; font-family: 'Courier New', Courier, monospace; color: #e2e8f0; margin: 0; padding: 40px;">

  <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
    
    <!-- HEADER -->
    <div style="background-color: #0f172a; padding: 20px; text-align: center; border-bottom: 2px solid #00e5ff;">
      <h1 style="margin: 0; color: #fff; font-size: 24px;">RIVERHUB <span style="color: #00e5ff;">ELITE</span></h1>
      <p style="margin: 5px 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 2px;">SECURE ACCESS CONTROL</p>
    </div>

    <!-- BODY -->
    <div style="padding: 30px; text-align: center;">
      <h2 style="color: #fff; font-size: 18px; margin-top: 0;">Solicitud de Recuperación</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta corporativa.
      </p>

      <!-- BOTÓN -->
      <div style="margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #00e5ff; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 14px; box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);">
          RESTABLECER ACCESO
        </a>
      </div>

      <p style="color: #64748b; font-size: 12px;">
        Si no solicitaste este cambio, puedes ignorar este mensaje. Tu cuenta permanece segura.
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #0f172a; padding: 15px; text-align: center; font-size: 10px; color: #475569; border-top: 1px solid #334155;">
      <p>RIVERHUB SYSTEMS ® 2026</p>
      <p>Confidential Message via Encrypted Channel</p>
    </div>
    
  </div>

</body>
</html>
```

## 3. ¿Qué pasa cuando el usuario hace clic?
1. El usuario llegará a tu app.
2. La app detectará el evento `PASSWORD_RECOVERY` automáticamente.
3. Se abrirá la ventana emergente ("SEGURIDAD") pidiendo la nueva contraseña.
4. Al guardarla, el usuario entrará al sistema automáticamente.
