# Operación segura de ViaBarcazas

## MFA obligatorio

El segundo factor se activa en el proyecto de Supabase, no desde el código de la aplicación. Antes de producción:

1. En Supabase Dashboard, habilitar MFA con TOTP.
2. Exigir MFA para roles `admin` y `superadmin` mediante la política de acceso del proyecto.
3. Probar inicio de sesión, recuperación de cuenta y revocación de una sesión.
4. Registrar la fecha de activación en la bitácora de administración.

## Respaldo diario

El workflow `.github/workflows/supabase-backup.yml` genera cada día un `pg_dump` comprimido y lo conserva 30 días como artefacto privado de GitHub Actions.

Antes de activarlo, crear el secreto de repositorio `SUPABASE_DB_URL` con la cadena de conexión de PostgreSQL de Supabase. Nunca colocar esa cadena en `.env` público ni en el código.

Cada trimestre se debe restaurar un respaldo en una base aislada y comprobar: tablas, políticas RLS, archivos críticos y una consulta de embarcaciones, convoyes y alertas.
