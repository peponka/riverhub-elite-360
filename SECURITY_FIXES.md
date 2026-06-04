# SECURITY_FIXES.md — FluviaFleet Security Remediation

**Date:** 2026-06-04  
**Risk Score Before:** 100/100 (CRITICAL)  
**Risk Score After:** ~15/100 (LOW — pending manual actions)

---

## FASE 0 — Acciones Manuales (REQUIERE TU ACCIÓN)

> ⚠️ CAUTION: Estas tareas NO se pueden automatizar. Debés hacerlas vos manualmente.

### 1. ROTAR/REGENERAR estas claves AHORA

| Clave | Dónde rotarla | Estado |
|-------|---------------|--------|
| AISStream.io API Key | aisstream.io/dashboard → Regenerar | ⬜ Pendiente |
| n8n API Key `riverhub_n8n_2026` | Panel n8n → Settings → API Keys | ⬜ Pendiente |
| n8n API Key `FluviaFleet_n8n_2026` | Panel n8n → Settings → API Keys | ⬜ Pendiente |
| Firebase Service Account | Google Cloud Console → IAM → Service Accounts → Keys → Regenerar | ⬜ Pendiente |
| Supabase Anon Key | Supabase Dashboard → Settings → API | ⬜ Pendiente |
| Contraseña superadmin `fluvia2026super` | Supabase Auth → Users → pedro@fluviafleet.com → Reset Password | ⬜ Pendiente |

### 2. Purgar historial de Git

```bash
# Instalar BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Clonar repo fresh
git clone --mirror https://github.com/peponka/riverhub-elite-360.git
cd riverhub-elite-360.git

# Eliminar archivos sensibles del historial
java -jar bfg.jar --delete-files firebase-service-account.json
java -jar bfg.jar --delete-files AUDITORIA_RIVERHUB_2026.md
java -jar bfg.jar --delete-files RESCATE_FINAL.json

# Limpiar y push forzado
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 3. Configurar variables en Render

Ir a dashboard.render.com → tu servicio → Environment:

```
NODE_ENV=production
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # El JSON completo en una línea
STRIPE_WEBHOOK_SECRET=whsec_...
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com
```

### 4. Ejecutar SQL patch en Supabase

Ir a Supabase Dashboard → SQL Editor → ejecutar:
```sql
REVOKE EXECUTE ON FUNCTION get_all_fcm_tokens() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_fcm_tokens() TO service_role;
```

---

## Tabla de Fixes Aplicados

### FASE 1 — CRÍTICO (P0)

| # | Vulnerabilidad | Archivo | Fix |
|---|---------------|---------|-----|
| 1.1 | Credenciales superadmin hardcodeadas en HTML | `public/superadmin-fluvia.html` | Eliminadas SA_EMAIL/SA_PASS. Login via POST /api/auth/superadmin-login |
| 1.2 | API keys n8n en JS cliente | `docs/workflows/*.json` | Eliminadas keys. Runtime usa process.env.N8N_API_KEY |
| 1.3 | Rutas IA sin autenticación | `routes/aiRoutes.js` | Añadido authenticateUser a 3 rutas |
| 1.4 | Firebase service account en filesystem | `app.js` | Cambiado a JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) |

### FASE 2 — ALTO (P1)

| # | Vulnerabilidad | Archivo | Fix |
|---|---------------|---------|-----|
| 2.1 | FCM tokens expuestos via SQL | `sql/PATCH_FCM_RESTRICT.sql` | REVOKE anon/authenticated, GRANT service_role |
| 2.2 | Socket.io sin auth | `app.js` | io.use() JWT middleware. join_company usa perfil verificado |
| 2.3 | Auth bypass en modo dev | `app.js` | Eliminado return next(). Sin Supabase = 503 |
| 2.4 | CSP con unsafe-eval | `app.js` | Eliminado unsafe-eval de scriptSrc |
| 2.5 | Trust proxy faltante | `app.js` | Añadido app.set('trust proxy', 1) |
| 2.6 | Stripe webhook sin verificación | `routes/paymentRoutes.js` | POST /webhook con constructEvent |
| 2.7 | XSS via innerHTML de IA | `admin-copiloto-*.html` | DOMPurify.sanitize() en todos los innerHTML |
| 2.8 | Error messages leaking | `app.js` (7 catch blocks) | Reemplazados e.message con mensajes genéricos |
| 2.11 | Referencia rota supabaseServer | `app.js` | Cambiado a req.app.locals.supabase |

### FASE 3 — MEDIO (P2)

| # | Vulnerabilidad | Archivo | Fix |
|---|---------------|---------|-----|
| 3.1 | IDOR fallback en companyId | `app.js` | Eliminado || companyId fallback |
| 3.2 | SSRF via n8n localhost URL | `routes/n8n-automations.js` | Movido a process.env.N8N_WEBHOOK_URL |
| 3.3 | Broadcast sin rol | `app.js` | Verificación admin/superadmin |
| 3.4 | /notifications/test público | `app.js` | Añadido authenticateUser |
| 3.5 | Catch vacíos en AIS | `app.js` | console.warn con error message |
| 3.6 | Helmet COEP/CORP | `app.js` | policy: 'cross-origin' |

### FASE 4 — HIGIENE (P3)

| # | Cambio | Archivo |
|---|--------|---------|
| 4.1 | .gitignore ampliado | `.gitignore` |
| 4.2 | Backup eliminado | `public/fluvia-en-backup.js` borrado |
| 4.3 | API key en comentario | `routes/n8n-automations.js` placeholder |
| 4.4 | CI pipeline | `.github/workflows/ci.yml` |
| 4.5 | Dependabot | `.github/dependabot.yml` |

---

## Variables de Entorno Nuevas

| Variable | Descripción |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | JSON del service account (una línea) |
| `STRIPE_WEBHOOK_SECRET` | Secreto para verificar webhooks Stripe |
| `N8N_WEBHOOK_URL` | URL base de instancia n8n |
| `NODE_ENV` | Debe ser `production` en Render |

---

## Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `routes/authRoutes.js` | POST /api/auth/superadmin-login |
| `sql/PATCH_FCM_RESTRICT.sql` | Restricción de FCM tokens |
| `.github/workflows/ci.yml` | CI con security checks |
| `.github/dependabot.yml` | Actualizaciones automáticas |
