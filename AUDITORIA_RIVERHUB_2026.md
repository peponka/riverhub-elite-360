# 🕵️‍♂️ REPORTE DE AUDITORÍA TÉCNICA — RiverHub Elite 360

**Fecha:** 2026-04-16  
**Auditor:** Claude Principal Engineer (claude-sonnet-4-6)  
**Severidad Máxima Detectada:** 🔴 CRÍTICO  
**Repositorio:** `C:\Users\pepeq\OneDrive\Desktop\RIverhub`

---

## 🎯 CALIFICACIÓN TÉCNICA GLOBAL

| Pilar | Nota |
|---|---|
| Seguridad | 2/10 |
| Arquitectura Flutter | 5.5/10 |
| Rendimiento & UX Web | 4/10 |
| Resiliencia & Conectividad | 5/10 |
| Madurez de Despliegue | 4/10 |
| **GLOBAL** | **4.1 / 10** |

---

## ⚖️ VEREDICTO DE DESPLIEGUE

```
╔══════════════════════════════════════════════════════════════════════╗
║  ❌  NO APTO PARA PRODUCCIÓN INDUSTRIAL ESCALABLE                   ║
║      (en su estado actual)                                           ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  BLOQUEANTES CRÍTICOS:                                               ║
║  • Credenciales de producción expuestas en repositorio git           ║
║  • CSP destruida (unsafe-eval + wildcard)                            ║
║  • RBAC en Flutter no aplica restricciones reales                    ║
║  • .env committeado con todos los secretos del sistema               ║
║                                                                      ║
║  EVALUACIÓN:                                                         ║
║  La plataforma tiene una base funcional sólida (navegación,          ║
║  integración Supabase, AIS tracking, FCM push). El problema no       ║
║  es la funcionalidad — es que todas las puertas de seguridad         ║
║  están abiertas. Un actor malicioso con el repositorio tiene         ║
║  acceso directo a la base de datos, puede impersonar cualquier       ║
║  usuario y ejecutar automatizaciones n8n sin restricción.            ║
║                                                                      ║
║  TIEMPO ESTIMADO PARA APTO PRODUCCIÓN: 3-5 días de trabajo          ║
║  (Quick Wins 1-8 son suficientes para desbloqueo mínimo viable)      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 📊 ESTADÍSTICAS GLOBALES DEL REPO

| Tipo de Archivo | Cantidad |
|---|---|
| Archivos Dart (Flutter) | 39 |
| Archivos JavaScript | 723 |
| Archivos CSS | 47 |
| Archivos HTML | 97 |
| Archivos JSON | 341 |
| Archivos Markdown | 392 |
| Archivos SQL | 1 |
| **Total (excluyendo node_modules y .git)** | **~3.837** |

---

## 🗂️ ESTRUCTURA DE DIRECTORIOS

```
RIverhub/
├── .agent/                       ← Skills y workflows de Claude Code
├── .env                          ← ⚠️ CREDENCIALES DE PRODUCCIÓN EXPUESTAS
├── .env.example
├── .gitignore
├── app.js                        ← Servidor principal Express (328 líneas, 12K)
├── ais_relay.js                  ← Relay WebSocket para AIS
├── relay.js                      ← Relay WebSocket general
├── disparo_final.js              ← Dispatcher de notificaciones
├── push_now.js                   ← Push directo
├── serve.js                      ← Servidor estático
├── start-n8n.js                  ← Launcher de n8n
├── catch.js                      ← Handler de errores (118 bytes)
├── ecosystem.config.js           ← PM2 config (VACÍO)
├── firebase-service-account.json ← ⚠️ Credenciales Firebase committeadas
├── config.json
├── package.json / package-lock.json
│
├── routes/
│   └── n8n-automations.js        ← Mega-archivo de automatizaciones (36K)
│
├── public/
│   ├── app.html
│   ├── index.html
│   ├── landing.html
│   ├── landing-new.html
│   ├── crew-form.html
│   ├── mobile_preview.html
│   ├── modal_asset.html
│   ├── new_combustible.html
│   ├── styleguide.html
│   ├── css/  (47 archivos CSS)
│   ├── js/   (48 archivos JS)
│   └── img/  (4 imágenes)
│
├── riverhub_mobile/
│   └── riverhub_mobile_v2/
│       ├── lib/
│       │   ├── main.dart
│       │   ├── screens/  (32 pantallas)
│       │   ├── widgets/app_drawer.dart
│       │   ├── services/
│       │   └── theme/
│       ├── pubspec.yaml
│       └── test/widget_test.dart
│
├── aquafleet/                    ← App React v1 (Vite + TypeScript)
├── aquafleet2/                   ← App Ionic/Capacitor
├── barcazas/                     ← Dashboards MongoDB Stitch (legacy)
│
├── sql/
│   ├── 001_superadmin_tables.sql
│   ├── SUPABASE_FINAL.sql        (33K — schema completo)
│   ├── SUPABASE_N8N.sql
│   ├── SUPABASE_TRIGGER_FIX.sql
│   └── PATCH_FCM_RLS.sql
│
├── logs/
│   ├── adb_logs.txt              (13.2 MB — logs Android debug)
│   ├── app_err.log
│   ├── flutter_error.log
│   └── flutter_log.txt
│
├── Riverhub_Definitivo.apk       (54.2 MB — APK en repo)
├── RiverHub_Elite_360_NUEVO.apk  (57.9 MB — APK en repo)
├── plan_negocio.txt
├── aquafleet.zip
│
└── test_*.js (13 archivos)       ← ⚠️ Todos con credenciales hardcoded
```

---

## 🔴 PILAR 1 — SEGURIDAD Y VULNERABILIDADES (ESTADO: EMERGENCIA)

### 🚨 CRÍTICO-1 — Credenciales de producción expuestas en git

**Impacto:** Cualquier persona con acceso al repositorio posee las llaves del reino completo.

| Secreto | Valor / Fragmento | Archivos afectados |
|---|---|---|
| AIS API Key | `9f1e2bbcd2c009ff50c206c1bf469280b448da20` | `.env`, 12+ test files |
| Supabase URL | `https://nfybnnpdrvyxucgpqmmo.supabase.co` | `.env`, `main.dart`, `supabase.js`, `config.js`, `crew-form.html`, 8+ test files |
| Supabase Anon Key (JWT) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc` | Igual que arriba |
| Gemini API Key | `REDACTED_GEMINI_KEY` | `.env`, `app.js`, `n8n-automations.js`, `SKILL.md` |
| n8n API Key | `riverhub_n8n_2026` | `.env`, 8+ JS files, `map_screen.dart`, 4 JSON de workflows |

> **El `.env` está committeado en git. Todos los tokens viven en el historial de git para siempre,  
> aunque se borren del directorio.** Hay que hacer `git filter-branch` + rotación completa.

**Acción inmediata — ejecutar HOY:**

```bash
# 1. Revocar credenciales en sus plataformas (Supabase, Google Cloud, AISStream, n8n)

# 2. Purgar historial de git
git filter-branch --force --tree-filter 'rm -f .env' HEAD

# 3. Agregar al .gitignore DEFINITIVAMENTE
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
echo "test_*.js" >> .gitignore
echo "firebase-service-account.json" >> .gitignore
```

---

### 🚨 CRÍTICO-2 — Content Security Policy destruida

**Archivo:** `public/app.html:7`

```html
<!-- ❌ LO QUE EXISTE — abre todas las puertas a XSS -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">

<!-- ✅ REEMPLAZO MÍNIMO VIABLE -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               connect-src 'self' https://nfybnnpdrvyxucgpqmmo.supabase.co wss://realtime.supabase.io https://aisstream.io;
               img-src 'self' data: blob: https:;
               font-src 'self' https://fonts.gstatic.com;">
```

`unsafe-eval` + `*` como `default-src` equivale a desactivar toda protección XSS del navegador.

---

### 🔴 ALTO-1 — RBAC en Flutter App Drawer es decorativo

**Archivo:** `riverhub_mobile/riverhub_mobile_v2/lib/widgets/app_drawer.dart:87`

```dart
// ❌ ROL HARDCODED - siempre muestra "Capitán" sin importar el usuario
Text('Elite 360 • Capitán', ...)

// ❌ PANTALLA DE ADMIN ACCESIBLE A TODOS (~línea 295)
ListTile(
  title: Text('Admin Panel'),
  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AdminScreen())),
)
// No hay ningún if (userRole == 'superadmin') guardando esto
```

```dart
// ✅ SOLUCIÓN — Envolver con check de rol
final userRole = context.read<AuthProvider>().userRole;

if (userRole == 'superadmin' || userRole == 'admin_cliente') ...[
  ListTile(
    title: Text('Admin Panel'),
    onTap: () => Navigator.push(...),
  ),
],
```

---

### 🔴 ALTO-2 — CORS abierto a cualquier origen

**Archivo:** `app.js:26-30`

```javascript
// ❌ ACTUAL
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ✅ CORRECCIÓN
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'https://riverhub.vercel.app',
    'https://tudominio.com'
];
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
            else callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});
```

---

### 🔴 ALTO-3 — n8n API Key débil con fallback hardcoded

**Archivo:** `routes/n8n-automations.js:34`

```javascript
// ❌ ACTUAL — key hardcoded como fallback
const N8N_API_KEY = process.env.N8N_API_KEY || 'riverhub_n8n_2026';

// ✅ CORRECCIÓN — fallar si no está definida
const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) throw new Error('N8N_API_KEY environment variable is required');
```

---

### 🔴 ALTO-4 — Backoffice sin validación de rol

**Archivo:** `public/js/modules/backoffice.js`

- El módulo SuperAdmin se inicializa sin verificar que el usuario sea SuperAdmin
- Cualquier usuario autenticado que cargue el módulo puede usarlo
- Falta un guard: `if (currentUser.role !== 'superadmin') return;`

---

## 🟠 PILAR 2 — ARQUITECTURA FLUTTER (ESTADO: FRÁGIL)

### Memory Leak Confirmado — Stream sin cancelar

**Archivo:** `lib/screens/map_screen.dart:64-80`

```dart
// ❌ ACTUAL — StreamSubscription perdida en el vacío
void _subscribeToFleetRealtime() {
    Supabase.instance.client
        .from('vessels')
        .stream(primaryKey: ['id'])
        .listen((data) {          // ← StreamSubscription no se guarda
            if (mounted) setState(() => _fleetAssets = data);
        });
}
// No existe dispose() en este State

// ✅ CORRECCIÓN
StreamSubscription? _vesselSubscription;

void _subscribeToFleetRealtime() {
    _vesselSubscription = Supabase.instance.client
        .from('vessels')
        .stream(primaryKey: ['id'])
        .listen((data) {
            if (mounted) setState(() => _fleetAssets = data);
        });
}

@override
void dispose() {
    _vesselSubscription?.cancel();
    super.dispose();
}
```

---

### 30+ debugPrint en producción

Se detectaron **30+ instancias** en pantallas de producción, incluyendo:

```dart
debugPrint('FCM Token: $token');          // lib/screens/dashboard_screen.dart:48
debugPrint('Error inserting order: $e');  // lib/screens/commercial_screen.dart:179
print('AIS response: ${response.body}');  // lib/screens/map_screen.dart:76
```

> En `flutter build apk --release` los `debugPrint` se eliminan, pero los `print()` **NO**.

```bash
# Verificar antes de cada build de release:
grep -r "print(" lib/ --include="*.dart" | grep -v "debugPrint\|_test.dart"
```

---

### Pantallas sin dispose() — Potencial memory leak

| Archivo | Problema |
|---|---|
| `monitoring_screen.dart` | Sin `dispose()`, carga datos en `initState` |
| `fleet_manager_screen.dart` | Sin `dispose()`, carga lista de embarcaciones |
| `map_screen.dart` | Sin `dispose()`, stream Supabase activo |

---

### URL de emulador hardcoded — falla en dispositivo físico

**Archivo:** `lib/screens/map_screen.dart:43`

```dart
// ❌ 10.0.2.2 = IP mágica del emulador Android → NO funciona en dispositivo físico
Uri.parse('http://10.0.2.2:4001/api/n8n/ais-live')

// ✅ Usar variable de entorno de compilación
const String _apiBase = String.fromEnvironment(
    'API_BASE_URL', 
    defaultValue: 'https://riverhub-api.onrender.com'
);
Uri.parse('$_apiBase/api/n8n/ais-live')
```

---

### Rol hardcoded en app_drawer.dart

**Archivo:** `lib/widgets/app_drawer.dart:87`

```dart
// ❌ Siempre muestra "Capitán"
Text('Elite 360 • Capitán', ...)

// ✅ Leer del perfil del usuario en Supabase
Text('${userProfile.role} • ${userProfile.rank}', ...)
```

---

## 🟡 PILAR 3 — RENDIMIENTO & UX WEB (ESTADO: BLOAT CRÍTICO)

### CSS: 1.153 usos de `!important`

| Archivo | Instancias `!important` |
|---|---|
| `flutter-override.css` | **296** |
| `global.css` | **256** |
| `modules/auditoria.css` | **98** |
| `mobile-overrides.css` | **89** |
| `modules/agent-chat.css` | **63** |
| Otros 42 archivos | ~451 |
| **TOTAL** | **~1.153** |

Cuando todo es `!important`, nada lo es. Resultado: CSS de 2MB+ imposible de mantener.

**Plan de rescate CSS (mediano plazo):**
1. Adoptar CSS Custom Properties (variables) — `material-tokens.css` ya existe, usarlo
2. Eliminar archivos `_backup` y `_new`: `global_backup.css`, `landing_backup.css`, etc.
3. PostCSS + PurgeCSS para eliminar clases no utilizadas
4. Consolidar 47 archivos CSS → ≤ 8 archivos
5. Meta: 80KB de CSS en lugar de los ~2MB actuales

---

### Archivos CSS duplicados/backup detectados

- `global.css` + `global_backup.css`
- `landing.css` + `landing-new.css`
- `comunicaciones.css` + `comunicaciones-official.css`
- Múltiples versiones de `admin*.css`

**Acción:** Borrar todos los `*_backup.css` y `*_new.css` que no estén en uso.

---

## 🟡 PILAR 4 — RESILIENCIA & CONECTIVIDAD

### Fetch sin timeout ni retry — botón congelado

**Archivo:** `public/js/modules/billing.js:334`

```javascript
// ❌ ACTUAL — Sin timeout, falla silenciosa
try {
    await fetch('/api/n8n/webhook', {
        method: 'POST',
        headers: { 'x-api-key': 'riverhub_n8n_2026' }, // ← key expuesta
        body: JSON.stringify({...})
    });
} catch (err) {
    console.warn("Fallo n8n:", err); // El usuario nunca se entera
}

// ✅ CON TIMEOUT + RETRY + FEEDBACK
async function sendWebhookWithRetry(url, payload, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            if (attempt === maxRetries) {
                RiverToast.show('Error al enviar notificación. Reintenta.', 'error');
                throw err;
            }
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // backoff
        }
    }
}
```

---

### Promise.all sin validar errores individuales

**Archivo:** `routes/n8n-automations.js:129`

```javascript
// ❌ Si una query falla, todo falla silenciosamente
const [compRes, userRes] = await Promise.all([
    window.sb.from('clients').select('*'),
    window.sb.from('profiles').select('*')
]);
if (compRes.data) realCompanies = compRes.data;

// ✅ Validar error de cada query
const [compRes, userRes] = await Promise.all([...]);
if (compRes.error) console.error('clients query failed:', compRes.error);
if (userRes.error) console.error('profiles query failed:', userRes.error);
```

---

### Resumen de problemas de conectividad

| Problema | Archivo | Impacto |
|---|---|---|
| Fetch sin timeout en billing | `billing.js:334` | Botón "PROCESANDO..." congelado forever |
| `Promise.all` sin validar errores | `backoffice.js:129` | Falla silenciosa si una query falla |
| AIS polling cada 5s sin debounce | `map_screen.dart:36` | Acumulación de requests si server es lento |
| Estado de botón no se resetea en error | `billing.js:305` | UX destruida en cortes de red |

---

## 🟢 PILAR 5 — PLAN DE ACCIÓN PRIORIZADO

### ⚡ QUICK WINS — Esta semana

| # | Acción | Esfuerzo | Impacto |
|---|---|---|---|
| 1 | **ROTAR TODAS LAS CREDENCIALES** (Supabase, Gemini, AIS, n8n) | 2h | 🔴 Crítico |
| 2 | Agregar `.env` + `firebase-service-account.json` al `.gitignore` + purgar historial git | 1h | 🔴 Crítico |
| 3 | Borrar todos los `test_*.js` del repositorio | 30min | 🔴 Crítico |
| 4 | Agregar guard de roles en `app_drawer.dart` | 2h | 🔴 Crítico |
| 5 | Cancelar `StreamSubscription` en `map_screen.dart` + agregar `dispose()` | 30min | 🟠 Alto |
| 6 | Reemplazar `print()` por `debugPrint()` en todo Flutter | 1h | 🟡 Medio |
| 7 | Reemplazar URL `10.0.2.2` por variable de entorno | 30min | 🟡 Medio |
| 8 | Borrar archivos `*_backup.css` y APKs binarias del repo | 15min | 🟡 Medio |

### 🏗️ MEDIANO PLAZO — Próximos 2-3 sprints

| # | Acción | Esfuerzo |
|---|---|---|
| 9 | Migrar secretos a variables de entorno en Render/Vercel | 4h |
| 10 | Corregir CSP en `app.html` | 3h |
| 11 | Implementar CORS restrictivo en `app.js` | 2h |
| 12 | Agregar `dispose()` a todos los StatefulWidgets que lo requieran | 4h |
| 13 | Implementar retry + timeout en todos los fetch críticos | 6h |
| 14 | CSS: Migrar de `!important` flood a CSS Custom Properties | 2 sprints |
| 15 | Auditar dependencias Flutter (Firebase `^2.24.2` tiene 2+ años) | 4h |
| 16 | Implementar rate limiting en endpoints n8n | 3h |
| 17 | Borrar archivos legacy: `barcazas/`, `aquafleet/`, `aquafleet2/` si no están en uso | 1h |

---

## 📱 INVENTARIO FLUTTER — 32 PANTALLAS

| Pantalla | Archivo | Líneas |
|---|---|---|
| Convoys | `convoys_screen.dart` | 728 |
| Incidentes | `incidentes_screen.dart` | 592 |
| Trips | `trips_screen.dart` | 477 |
| Draft | `draft_screen.dart` | 471 |
| Bitácora | `bitacora_screen.dart` | 438 |
| Commercial | `commercial_screen.dart` | 434 |
| Combustible | `fuel_screen.dart` | 432 |
| Mantenimiento | `mantenimiento_screen.dart` | 428 |
| Login | `login_screen.dart` | 407 |
| Dashboard | `dashboard_screen.dart` | 378 |
| Mapa AIS | `map_screen.dart` | 375 |
| Cotizador | `quote_screen.dart` | 374 |
| Reportes | `reportes_screen.dart` | 372 |
| Pañol | `panol_screen.dart` | 370 |
| Tracking | `tracking_screen.dart` | 367 |
| Monitoring | `monitoring_screen.dart` | 362 |
| Auditoría | `auditoria_screen.dart` | 350 |
| NexoBot (IA) | `nexobot_screen.dart` | 323 |
| Hidrología | `hidrologia_screen.dart` | 317 |
| Loadmaster | `loadmaster_screen.dart` | 316 |
| Comunicaciones | `comunicaciones_screen.dart` | 296 |
| Fleet Manager | `fleet_manager_screen.dart` | 295 |
| Tripulación | `tripulacion_screen.dart` | 270 |
| Admin | `admin_screen.dart` | 251 |
| Billing | `billing_screen.dart` | 247 |
| Registro | `register_screen.dart` | 243 |
| Perfil | `profile_screen.dart` | 239 |
| Integraciones | `integraciones_screen.dart` | 235 |
| Reporte Diario | `daily_report_screen.dart` | 227 |
| Documentos | `docs_screen.dart` | 211 |
| Notificaciones | `notifications_screen.dart` | 193 |
| Riesgo Financiero | `financial_risk_screen.dart` | 160 |
| **TOTAL** | **32 screens** | **~11.178 líneas** |

---

## 🎨 INVENTARIO CSS — 47 ARCHIVOS (~19.857 líneas)

### Archivos Core
| Archivo | Líneas |
|---|---|
| `global.css` | 2.155 |
| `landing-new.css` | 1.429 |
| `flutter-override.css` | 665 |
| `mejoras-ui.css` | 552 |
| `maritime-elite.css` | 356 |
| `material-tokens.css` | 314 |
| `theme.css` | 301 |
| `login.css` | 181 |
| `mobile-overrides.css` | 167 |
| `landing.css` | 83 |
| `toast.css` | 31 |

### Módulos CSS (36 archivos)
| Archivo | Líneas |
|---|---|
| `backoffice.css` | 1.233 |
| `admin-dashboard.css` | 677 |
| `convoys.css` | 660 |
| `comunicaciones.css` | 601 |
| `dashboard.css` | 562 |
| `combustible.css` | 531 |
| `calado.css` | 502 |
| `auditoria.css` | 491 |
| `admin.css` | 463 |
| `bitacora.css` | 454 |
| `mantenimiento.css` | 411 |
| `agent-chat.css` | 408 |
| `viajes.css` | 396 |
| `incidentes.css` | 381 |
| `integraciones.css` | 378 |
| `mapa.css` | 374 |
| `tripulacion.css` | 372 |
| `cotizador.css` | 372 |
| `panol.css` | 367 |
| `tracking.css` | 356 |
| `financial_risk.css` | 355 |
| `hidrologia.css` | 321 |
| `fleet_manager.css` | 292 |
| `loadmaster.css` | 282 |
| `login.css` | 280 |
| `monitoring.css` | 276 |
| `share.css` | 270 |
| `daily_report.css` | 259 |
| `reportes.css` | 256 |
| `docs.css` | 247 |
| `commercial.css` | 233 |
| `notifications.css` | 226 |
| `admin-cliente.css` | 137 |
| `billing.css` | 130 |
| `comunicaciones-official.css` | 42 |
| `popups.css` | 28 |

---

## ⚙️ INVENTARIO JAVASCRIPT — 48 ARCHIVOS (excluyendo node_modules)

### Backend
| Archivo | Descripción |
|---|---|
| `app.js` | Servidor principal Express + Socket.io |
| `routes/n8n-automations.js` | Automatizaciones n8n (36K) |
| `ais_relay.js` | Relay WebSocket AIS |
| `relay.js` | Relay WebSocket general |
| `disparo_final.js` | Dispatcher de alertas |
| `push_now.js` | Push FCM directo |
| `serve.js` | Servidor estático |

### Servicios Frontend
| Archivo | Descripción |
|---|---|
| `services/supabase.js` | Cliente Supabase (⚠️ keys expuestas) |
| `services/aisstream.js` | Integración AIS Stream |
| `services/toast.js` | Sistema RiverToast |
| `services/weather.js` | Clima e hidrología |
| `services/pdf_generator.js` | Generación de PDFs |
| `services/shipfinder.js` | Búsqueda de embarcaciones |

### Módulos Frontend (40 archivos)
`admin.js`, `admin-cliente.js`, `admin-dashboard.js`, `agent-chat.js`, `auditoria.js`, `auth.js`, `backoffice.js`, `billing.js`, `bitacora.js`, `calado.js`, `combustible.js`, `commercial.js`, `comunicaciones.js`, `convoys.js`, `cotizador.js`, `daily_report.js`, `dashboard.js`, `docs.js`, `financial_risk.js`, `fleet_manager.js`, `hidrologia.js`, `incidentes.js`, `integraciones.js`, `loadmaster.js`, `mantenimiento.js`, `mapa.js`, `monitoring.js`, `notifications.js`, `panol.js`, `reportes.js`, `share.js`, `tracking.js`, `tripulacion.js`, `viajes.js`

### Test Files (⚠️ todos con credenciales hardcoded)
`test_api_alert.js`, `test_companies.js`, `test_db.js`, `test_db_token.js`, `test_fcm.js`, `test_fcm_rpc.js`, `test_insert.js`, `test_push.js`, `test_push_direct.js`, `test_push_now.js`, `test_rpc.js`, `test_schema.js`, `test_signup.js`

---

## ⚠️ ARCHIVOS PROBLEMÁTICOS DESTACADOS

| Archivo | Problema |
|---|---|
| `.env` | ⛔ Committeado con todos los secretos de producción |
| `firebase-service-account.json` | ⛔ Credenciales Firebase de servicio en repo |
| `public/app.html` | ⛔ CSP `unsafe-eval` + wildcard |
| `public/js/services/supabase.js` | ⛔ Supabase keys hardcoded |
| `riverhub_mobile/.../main.dart` | ⛔ Supabase keys hardcoded en APK |
| `riverhub_mobile/.../map_screen.dart` | ⛔ n8n key hardcoded + URL emulador |
| `widgets/app_drawer.dart` | ⛔ Sin RBAC real — admin accesible a todos |
| `Riverhub_Definitivo.apk` (54MB) | ⚠️ APK binaria en repositorio git |
| `RiverHub_Elite_360_NUEVO.apk` (57MB) | ⚠️ APK binaria en repositorio git |
| `adb_logs.txt` (13MB) | ⚠️ Log enorme con datos de debug |
| `aquafleet.zip` (460KB) | ⚠️ Archivo comprimido en repo |
| 13× `test_*.js` | ⛔ Credenciales vivas hardcoded |

---

## 📦 DEPENDENCIAS FLUTTER (pubspec.yaml)

| Paquete | Versión | Estado |
|---|---|---|
| `supabase_flutter` | ^2.12.0 | ✅ Reciente |
| `firebase_core` | ^2.24.2 | ⚠️ Jan 2024 — desactualizado |
| `firebase_messaging` | ^14.7.10 | ⚠️ Jan 2024 — desactualizado |
| `flutter_local_notifications` | ^17.2.4 | ✅ |
| `flutter_map` | ^8.2.2 | ✅ |
| `image_picker` | ^1.2.1 | ⚠️ Posibles problemas permisos Android 13+ |
| `google_fonts` | ^6.2.1 | ✅ |
| `fl_chart` | ^0.69.0 | ✅ |

---

## 🏗️ STACK TECNOLÓGICO IDENTIFICADO

```
MOBILE          →  Flutter (Dart) — 32 pantallas, ~11K líneas
WEB FRONTEND    →  Vanilla HTML/CSS/JS — 40 módulos, 47 CSS files
WEB LEGACY      →  React/TypeScript (Aquafleet), Ionic (Aquafleet2)
BACKEND         →  Node.js + Express + Socket.io
AUTOMATIZACIÓN  →  n8n + Webhooks + PM2
BASE DE DATOS   →  Supabase (PostgreSQL + Auth + Storage + Realtime)
NOTIFICACIONES  →  Firebase FCM + flutter_local_notifications
IA              →  Google Gemini API
AIS TRACKING    →  AISStream.io + relay WebSocket propio
PAGOS           →  Stripe (referenciado en código)
DESPLIEGUE      →  Render (API) + Vercel (Frontend)
```

---

## 🚨 CREDENCIALES A ROTAR — ACCIÓN INMEDIATA

> **Rotar estas credenciales AHORA. Ya han sido expuestas en git.**

1. **AIS Stream API Key:** `9f1e2bbcd2c009ff50c206c1bf469280b448da20` → https://aisstream.io
2. **Supabase Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Supabase Dashboard > Settings > API
3. **Google Gemini API Key:** `REDACTED_GEMINI_KEY` → Google Cloud Console
4. **n8n API Key:** `riverhub_n8n_2026` → Cambiar en todos los workflows n8n

---

*Informe generado por Claude Code (claude-sonnet-4-6) el 2026-04-16*  
*RiverHub Elite 360 — Auditoría Técnica Completa*
