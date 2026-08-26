# ViaBarcazas — Gestión Inteligente de Flotas Fluviales

> Plataforma SaaS para operadores de la Hidrovía Paraguay-Paraná. Web + Mobile + IA.

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- Flutter 3.22+
- Cuenta en [Supabase](https://supabase.com) (PostgreSQL)
- API keys: AISStream, Google Gemini, Firebase (FCM)

### Backend (Web Portal)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Ejecutar SQL en Supabase Dashboard
# sql/SUPABASE_FINAL.sql → crea todas las tablas
# sql/PATCH_FCM_RLS.sql  → configura Row Level Security
# sql/PATCH_LIQUIDOS_TANQUES.sql → crea tablas y políticas para barcazas tanque
# sql/SEED_LIQUIDOS.sql          → carga datos demo editables para la vista Líquidos

# 4. Iniciar servidor
npm start
# → http://localhost:3000
```

### Demo de Barcazas Tanque

La vista `Líquidos` de la web y su página admin ya no usan tarjetas hardcodeadas. Ambas leen `liquid_tanks` y `liquid_operations`, el mismo modelo que consume la app móvil.

Para dejarla operativa en un entorno nuevo:

```bash
# 1. Crear el modelo
# sql/PATCH_LIQUIDOS_TANQUES.sql

# 2. Cargar datos demo opcionales
# sql/SEED_LIQUIDOS.sql
```

Si cargás el seed, vas a ver 6 barcazas tanque y 5 operaciones reales en:

- `public/admin-liquidos-viabarcazas.html`
- `public/admin-liquidos-viabarcazas-en.html`
- `public/viabarcazas.html` / `public/viabarcazas-en.html`

### Respaldo de Supabase

El workflow diario de GitHub Actions genera un archivo restaurable de PostgreSQL y lo conserva 30 días. Antes de ejecutarlo, crear el secreto de repositorio `SUPABASE_DB_URL` en `Settings > Secrets and variables > Actions` con la cadena del **Session pooler** de la base de datos (puerto `5432`; debe comenzar con `postgresql://` o `postgres://`).

La cadena se obtiene desde `Connect` en Supabase. GitHub Actions no puede conectarse a la URL directa IPv6 de Supabase, salvo que el proyecto tenga el complemento IPv4. No usar la URL pública del proyecto ni la clave anónima; esas no permiten realizar un respaldo.

### App Mobile (Flutter)

```bash
cd riverhub_mobile/riverhub_mobile_v2

# 1. Instalar dependencias
flutter pub get

# 2. Build debug
flutter run

# 3. Build release (APK)
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://TU_PROYECTO.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ...
```

## 📂 Estructura del Proyecto

```
Codigo/
├── app.js                    ← Servidor Express (522 líneas)
├── routes/n8n-automations.js ← Automatizaciones webhook
├── public/
│   ├── landing.html          ← Landing page marketing
│   ├── viabarcazas.html      ← SPA principal (app web)
│   ├── viabarcazas.js        ← Lógica de la SPA
│   ├── viabarcazas.css       ← Estilos principales
│   └── js/modules/           ← Módulos JS extraídos
├── riverhub_mobile/riverhub_mobile_v2/
│   └── lib/
│       ├── main.dart         ← Entry point Flutter
│       ├── screens/          ← 34 pantallas
│       ├── services/         ← Supabase + GPS services
│       ├── widgets/          ← AppDrawer + reusables
│       └── theme/            ← Design tokens de ViaBarcazas
└── sql/                      ← Migraciones SQL
```

## 🔧 Variables de Entorno (.env)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `GEMINI_API_KEY` | Google Gemini API key |
| `AIS_API_KEY` | AISStream.io API key |
| `AIS_DIRECT_STREAM` | Set to `false` only when using the optional external AIS relay |
| `AIS_RELAY_TOKEN` | Long random token that authenticates the optional AIS relay |
| `PORT` | Puerto del servidor (default: 3000) |

## 📡 API Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | ❌ | Health check (AIS + AI status) |
| GET | `/api/ais-positions` | ❌ | Posiciones AIS en vivo |
| POST | `/api/internal/ais-ingest` | Relay token | Ingesta privada de posiciones AIS desde el relay |

### Relay AIS local (opcional)

Cuando AISStream limite la IP compartida de un hosting gratuito, se puede usar
una computadora local como relay seguro. Con `AIS_DIRECT_STREAM=false` y
`AIS_RELAY_TOKEN` configurados en Render, ejecutar en Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-ais-relay.ps1
```

El relay pide la clave AISStream y el token por consola, sin guardarlos en
archivos. Debe mantenerse abierto mientras se necesiten posiciones en vivo.
| POST | `/api/ai/chat` | ✅ | Copiloto IA (Gemini) |
| POST | `/api/ai/invoice` | ✅ | Invoice Intelligence |
| GET | `/api/pricing` | ✅ | Catálogo comercial por flota |
| POST | `/api/pricing/quote` | ✅ | Calcula propuesta por barcazas + remolcadores |
| * | `/api/n8n/*` | API Key | Automatizaciones n8n |

## 🛡️ Seguridad

- CORS restrictivo (whitelist de orígenes)
- Security headers: HSTS, CSP, X-Frame-Options, nosniff
- Rate limiting: 30 req/min API, 10 req/min IA
- Auth middleware: Supabase JWT validation
- XSS prevention: `esc()` helper en frontend

## 🏗️ Stack Tecnológico

- **Mobile**: Flutter (Dart) — 34 screens, Cupertino design
- **Web**: HTML/CSS/JS vanilla — Leaflet, Chart.js, Supabase SDK
- **Backend**: Node.js + Express + Socket.IO
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **IA**: Google Gemini 2.0 Flash
- **AIS**: AISStream.io (WebSocket satelital)
- **Push**: Firebase Cloud Messaging (FCM)
- **Contratación**: propuesta comercial directa; no se procesa pago online
- **Deploy**: Render (backend) + Git push auto-deploy

## ✅ Pruebas

```bash
npm run test:pricing
npm run test:e2e:smoke
npm run test:e2e:critical
```
