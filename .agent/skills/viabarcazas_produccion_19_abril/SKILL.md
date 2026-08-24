---
name: "RiverHub ViaBarcazas — Producción Completa (19 Abril 2026)"
description: "Estado completo del ecosistema RiverHub Elite 360: diseño ViaBarcazas, arquitectura, credenciales, endpoints, features activas, y plan mañana. Documento maestro inquebrantable."
---

# 🚢 RIVERHUB ELITE 360 — ESTADO COMPLETO (19 Abril 2026)

## 🔑 CREDENCIALES Y URLS (NO PERDER)

### Producción (Render)
- **URL**: `https://riverhub-elite-360.onrender.com/viabarcazas.html`
- **Repo**: `github.com/peponka/riverhub-elite-360` (branch `main`)
- **Auto-deploy**: Sí — cada push a main deploea automáticamente

### Supabase
- **URL**: `https://nfybnnpdrvyxucgpqmmo.supabase.co`
- **Anon Key**: `REDACTED_SUPABASE_ANON_KEY`
- **Login Admin**: `pepeq68@gmail.com` (rol: superadmin)

### APIs
- **AIS WebSocket**: `wss://stream.aisstream.io/v0/stream` (key: `REDACTED_AIS_KEY_1`)
- **n8n API Key**: Configurada exclusivamente como variable `N8N_API_KEY` en el entorno.
- **Gemini API Key**: En `.env` como `GEMINI_API_KEY`

### Render Environment Variables
```
PORT=3000 (Render asigna dinámicamente)
SUPABASE_URL=https://nfybnnpdrvyxucgpqmmo.supabase.co
SUPABASE_ANON_KEY=REDACTED_SUPABASE_ANON_KEY
AIS_API_KEY=REDACTED_AIS_KEY_1
N8N_API_KEY=<configurar-en-el-entorno>
GEMINI_API_KEY=(configurar)
```

---

## 🎨 DISEÑO VIABARCAZAS — SISTEMA COMPLETO

### Filosofía
Editorial minimalista inspirado en publicaciones de diseño de alta gama. Nada de colores eléctricos, glassmorphism pesado ni gradientes innecesarios.

### Tipografía
- **Títulos**: `Newsreader` (serif editorial, itálica para énfasis)
- **Cuerpo/UI**: `Inter` (sans-serif, weights 400/500/600/700)
- **Google Fonts CDN**: Ambas desde `fonts.googleapis.com`

### Paleta de Colores (CSS Variables)
```css
:root {
    --bg-primary: #FAFAFA;           /* Fondo principal */
    --bg-secondary: #FFFFFF;         /* Cards, sidebar */
    --text-primary: #1A1A2E;         /* Texto principal (casi negro) */
    --text-secondary: #8E8E93;       /* Texto secundario */
    --separator: #E5E5EA;            /* Bordes 0.5px */
    --accent: #3B82F6;               /* Azul acento (links, activo) */
    --success: #2EA043;              /* Verde (en viaje, ok) */
    --warning: #F59E0B;              /* Amarillo (mantenimiento) */
    --error: #DC2626;                /* Rojo (alertas) */
    --surface-low: #F2F2F7;          /* Fondos secundarios */
}
```

### Reglas de Diseño
1. **Bordes**: Siempre `0.5px solid var(--separator)` — NUNCA bordes gruesos
2. **Border-radius**: `12px` para cards, `10px` para inputs, `20px` para pills
3. **Sombras**: NINGUNA — el diseño ViaBarcazas usa bordes en vez de sombras
4. **Fondos**: Blancos puros, sin gradientes
5. **Sidebar**: Fondo blanco, ancho `180px`, header sticky, scroll thin (3px)
6. **Iconos**: Font Awesome 6.5.1 (CDN), estilo outline, NO emojis como iconos
7. **Espaciado**: Generoso, `padding: 32px` en vistas
8. **Labels/Subtítulos**: `letter-spacing: 1.5px`, `font-size: 10px`, uppercase, Inter weight 700

### Estructura HTML (viabarcazas.html)
```
<body>
  <div id="login-screen"> ... </div>
  <div id="app-shell">
    <aside class="sidebar"> (header + nav-items + logout) </aside>
    <main class="main-content">
      <div class="view" id="view-dashboard"> ... </div>
      <div class="view" id="view-mapa"> ... </div>
      <div class="view" id="view-fleet"> ... </div>
      ... (1 view por módulo)
    </main>
  </div>
  <div id="modal-overlay"> ... </div>
</body>
```

### SPA Router (viabarcazas.js)
```javascript
const loaders = {
    dashboard: loadDashboard,
    fleet: loadFleet,
    mapa: function(){ if(!map) initMap(); else map.invalidateSize(); },
    admin: loadAdmin,
    viajes: loadViajes,
    bitacora: loadBitacora,
    tripulacion: loadCrew,
    combustible: loadFuel,
    mantenimiento: loadMaint,
    panol: loadPanol,
    comunicaciones: loadComms,
    hidrologia: loadHidrologia,
    reportes: loadReportes
};
```

---

## 📂 ARCHIVOS CLAVE

### Web (ViaBarcazas SPA)
| Archivo | Propósito |
|---------|-----------|
| `public/viabarcazas.html` | SPA principal (~285 líneas) |
| `public/viabarcazas.css` | Estilos ViaBarcazas (~160 líneas) |
| `public/viabarcazas.js` | Lógica completa (~536 líneas) |
| `public/index.html` | Redirect a viabarcazas.html |

### Server
| Archivo | Propósito |
|---------|-----------|
| `app.js` | Express server unificado (AIS, CSP, APIs, static) |
| `routes/n8n-automations.js` | 14 endpoints n8n (auth con API key) |
| `render.yaml` | Config de deploy Render |
| `.env` | Variables de entorno locales |

### Flutter (App Móvil)
| Archivo | Propósito |
|---------|-----------|
| `riverhub_mobile/riverhub_mobile_v2/` | Proyecto Flutter |
| `lib/screens/map_screen.dart` | Mapa con AIS + GPS tracker |
| `lib/services/gps_tracker_service.dart` | **NUEVO** - Envía GPS a Supabase cada 15s |
| `lib/theme/app_colors.dart` | Colores ViaBarcazas para Flutter |

---

## ✅ FEATURES ACTIVAS EN PRODUCCIÓN

### Web (viabarcazas.html)
1. **Login/Logout** con Supabase Auth
2. **Dashboard** con KPIs dinámicos + clima real (Open-Meteo) + conteo AIS
3. **Mapa AIS en vivo** — endpoint público `/api/ais-positions` (sin auth)
4. **Gestión de Flota** — CRUD completo con modales ViaBarcazas
5. **Gestión de Viajes** — solicitudes con cargo/puertos
6. **Bitácora Digital** — log de eventos operativos
7. **Tripulación & Safety** — gestión de crew
8. **Combustible** — registro de bunker con litros/tipo
9. **Mantenimiento** — órdenes con prioridad
10. **Pañol (Inventario)** — stock con alertas de mínimo
11. **Comunicaciones** — mensajería interna
12. **Copiloto IA** — Chat con Gemini 2.5 Flash, lee datos reales de Supabase
13. **Pronóstico Hidrovía** — Flood API con gráfico Chart.js 14 días
14. **Reportes & Analytics** — 3 gráficos (flota doughnut, combustible barras, actividad línea)
15. **Panel Admin** — SuperAdmin: CRUD empresas + CRUD usuarios + KPIs

### Endpoints Públicos (sin auth)
- `GET /api/health` — Estado del server
- `GET /api/ais-positions` — Posiciones AIS en vivo (para el mapa frontend)
- `GET /` — Redirect a `/viabarcazas.html`

### Endpoints n8n (requieren `x-api-key`)
- `GET /api/n8n/fleet-status`
- `GET /api/n8n/fuel-alerts`
- `GET /api/n8n/maintenance-due`
- `GET /api/n8n/daily-summary`
- `POST /api/n8n/log-positions`
- `GET /api/n8n/ais-live`
- `GET /api/n8n/hydrology`
- `GET /api/n8n/crew-certifications`
- `POST /api/n8n/send-alert` (+ FCM Push)
- `GET /api/n8n/voyage-status`
- `POST /api/n8n/webhook`
- `GET /api/n8n/anomalies`
- `GET /api/n8n/ai-analysis` (Gemini)
- `GET /api/n8n/delayed-voyages`
- `POST /api/n8n/ai-analyze` (Gemini para Copiloto)

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### 1. Login no funciona
**Causa**: Error de syntax en viabarcazas.js rompe TODO el archivo
**Fix**: Siempre correr `node -c public/viabarcazas.js` antes de pushear

### 2. Mapa sin barcos AIS
**Causa**: Supabase RLS bloquea `ais_traffic` desde frontend anon
**Fix**: Usar `/api/ais-positions` (público, lee memoria del server)

### 3. Sidebar sin scroll
**CSS**: `.sidebar-nav { overflow-y: auto; scrollbar-width: thin; }`

### 4. CSP bloquea scripts/fonts
**Fix**: Asegurar que `app.js` CSP incluya:
- `script-src`: cdn.jsdelivr.net, cdnjs.cloudflare.com, unpkg.com
- `connect-src`: *.supabase.co, api.open-meteo.com, flood-api.open-meteo.com

### 5. Chart.js no carga
**Fix**: CDN debe estar en el `<head>` ANTES de supabase:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

---

## 📱 FLUTTER GPS TRACKER (NUEVO)

### Dependencia
```yaml
geolocator: ^13.0.3
```

### Permisos Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### Flujo
1. Usuario abre Mapa en Vivo → toca botón 📡
2. Selecciona embarcación de la lista (desde Supabase `vessels`)
3. GPS se activa → envía `current_lat`, `current_lng`, `heading`, `speed` cada 15s
4. El barco aparece en el mapa web en tiempo real

### Archivos
- `lib/services/gps_tracker_service.dart` — Servicio singleton
- `lib/screens/map_screen.dart` — UI con botón start/stop + pill de estado

---

## 🗄️ TABLAS SUPABASE

| Tabla | Propósito |
|-------|-----------|
| `vessels` | Flota propia (con current_lat/lng para GPS) |
| `voyages` | Viajes/manifiestos |
| `logs` | Bitácora digital |
| `crew_members` | Tripulación |
| `fuel_logs` | Registros de combustible |
| `maintenance_tasks` | Órdenes de mantenimiento |
| `inventory_items` | Pañol/inventario |
| `comms` | Comunicaciones internas |
| `companies` | Multi-tenancy: empresas |
| `user_profiles` | Perfiles con rol y company_id |
| `ais_traffic` | Posiciones AIS guardadas |
| `ais_position_log` | Historial AIS |

---

## 📋 PLAN MAÑANA (20 Abril 2026)

### Prioridad 1 — Pulido Visual (1h)
- [ ] Zoom del mapa centrado en Hidrovía al iniciar (no Sudamérica entera)
- [ ] Verificar que TODOS los módulos del sidebar funcionen en Render
- [ ] Probar Copiloto IA en Render (necesita GEMINI_API_KEY en Render env vars)
- [ ] Probar Hidrología y Reportes en Render

### Prioridad 2 — Flutter APK (1.5h)
- [ ] Compilar APK release con GPS tracker
- [ ] Probar GPS en celular físico contra Supabase
- [ ] Verificar que el barco aparezca en el mapa web

### Prioridad 3 — Demo End-to-End (1h)
- [ ] Crear empresa demo en Admin
- [ ] Crear usuario operador para esa empresa
- [ ] Loguearse con ese usuario → ver solo sus datos (RLS multi-tenant)
- [ ] Activar GPS desde la app → ver barco en mapa web

### Prioridad 4 — Mejoras UX (si sobra tiempo)
- [ ] Menú hamburguesa para mobile/responsive
- [ ] Notificaciones en tiempo real (Socket.IO → badge en campana)
- [ ] Exportar reportes a PDF
- [ ] Dark mode toggle

### Prioridad 5 — N8N Cloud
- [ ] Migrar n8n a VPS o Railway
- [ ] Configurar workflows de alerta automática
- [ ] Conectar webhook de nuevas empresas

---

## 🏗️ ÚLTIMO COMMIT
```
57aa075 - CRITICAL: fix syntax error breaking login + all JS
054061f - AIS: API-first strategy for map markers
27595c0 - Public AIS endpoint + fix map markers
1b5f9ff - GPS Tracker Flutter + index.html redirect to viabarcazas
de9fe01 - Copiloto IA + Hidrologia + Reportes Charts + Dashboard dinamico
0c239a5 - AIS live + Multi-tenancy + Admin Panel + Pricing + Sidebar scroll
```
