---
name: RiverHub n8n Automation Integration
description: Guía completa de la integración de n8n con RiverHub Elite 360. Incluye 13 endpoints API, PM2 setup, 6 workflows configurados, tablas SQL, y troubleshooting.
---

# RiverHub n8n Automation — Guía Completa

## Estado Actual (10 Marzo 2026)

### ✅ Todo lo que está hecho:
1. **n8n v2.11.2** instalado globalmente (`npm install -g n8n`)
2. **PM2** instalado y configurado para gestionar RiverHub + n8n
3. **13 endpoints API** creados en `routes/n8n-automations.js`
4. **6 workflows** creados y publicados en n8n
5. **Servidor actualizado** en `app.js` con Supabase server-side y almacenamiento AIS en memoria
6. **Tablas SQL** creadas en Supabase (`ais_position_log` y `system_alerts`)
7. **API Key AIS** actualizada: `REDACTED_AIS_KEY_3`
8. **84+ posiciones AIS** guardadas exitosamente en Supabase
9. **Bug del popup "Alta de Unidad Naval"** arreglado en `dashboard.js`
10. **Bug endpoint crew-certifications** arreglado (manejo graceful de columna faltante)
11. **Configurado PM2 Startup automático** para Windows
12. **Columna de certificación (`certification_expiry`)** agregada en Supabase
13. **Nodos de notificación agregados** a los workflows y aprobados en ejecución real

### ❌ Pendiente para mañana:
- Todo completo y en producción. Nada crítico pendiente de la fase 1.

---

## Archivos Modificados/Creados

### Archivos Nuevos:
- `routes/n8n-automations.js` — 13 endpoints API para n8n (660+ líneas)
- `SUPABASE_N8N.sql` — Tablas para historial AIS y alertas (ya ejecutado en Supabase)
- `ecosystem.config.js` — Config PM2 para gestionar RiverHub + n8n
- `start-n8n.js` — Wrapper script para que PM2 pueda arrancar n8n

### Archivos Modificados:
- `app.js` — Agregado: Supabase server-side, n8n routes, almacenamiento AIS en memoria, error handlers mejorados
- `.env` — Agregado: `N8N_API_KEY=riverhub_n8n_2026`, AIS key actualizada
- `public/js/modules/dashboard.js` — Fix: checkOnboarding() ahora verifica login antes de mostrar popup

---

## PM2 — Gestión de Procesos

### Estado actual:
```
┌─────────┬──────────┬────────┬─────┐
│ name    │ status   │ port   │ mem │
├─────────┼──────────┼────────┼─────┤
│ riverhub│ online   │ 3000   │ 65M │
│ n8n     │ online   │ 5678   │ 357M│
└─────────┴──────────┴────────┴─────┘
```

### Comandos PM2 útiles:
```bash
# Ver estado de ambos servicios
pm2 status

# Reiniciar un servicio
pm2 restart riverhub
pm2 restart n8n

# Ver logs en tiempo real
pm2 logs riverhub
pm2 logs n8n

# Detener todo
pm2 stop all

# Arrancar todo
pm2 start all

# Guardar configuración
pm2 save
```

### Levantar desde cero (si PM2 no tiene procesos guardados):
```bash
# Matar procesos node anteriores
taskkill /F /IM node.exe

# Arrancar RiverHub
pm2 start app.js --name riverhub --cwd "c:\Users\pepeq\OneDrive\Desktop\RIverhub"

# Arrancar n8n
pm2 start start-n8n.js --name n8n --cwd "c:\Users\pepeq\OneDrive\Desktop\RIverhub"

# Guardar
pm2 save
```

### IMPORTANTE - n8n con PM2:
- NO usar `pm2 start n8n -- start` (no funciona en Windows)
- Usar el wrapper `start-n8n.js` que resuelve la ruta global de n8n
- Si n8n se cae, PM2 lo reinicia automáticamente (autorestart: true)

---

## Workflows Configurados en n8n

### Acceso: `http://localhost:5678`
### Credenciales: Las que creaste durante el setup local

| # | Nombre | Trigger | Endpoint | Method |
|---|--------|---------|----------|--------|
| 1 | RiverHub - Reporte Diario | Cada día 7am | `/daily-summary` | GET |
| 2 | RiverHub - Alerta Combustible | Cada 4 horas | `/fuel-alerts?threshold=25` | GET |
| 3 | RiverHub - Log Posiciones AIS | Cada 30 min | `/log-positions` | POST |
| 4 | RiverHub - Detector Anomalías | Cada 1 hora | `/anomalies` | GET |
| 5 | RiverHub - Clima Hidrovía | Cada 6 horas | `/hydrology` | GET |
| 6 | RiverHub - Certificaciones RRHH | Cada 7 días 8am | `/crew-certifications?days=30` | GET |

### Estructura de cada workflow:
```
Schedule Trigger → HTTP Request (con x-api-key header)
```

### IMPORTANTE - URL de los endpoints:
- Usar `http://127.0.0.1:3000/api/n8n/<endpoint>` (NO localhost)
- n8n resuelve `localhost` diferente, usar `127.0.0.1` siempre

---

## Endpoints API Disponibles

**Base URL:** `http://127.0.0.1:3000/api/n8n/`  
**Auth:** Header `x-api-key: riverhub_n8n_2026`

| # | Método | Endpoint | Descripción | Cron Sugerido |
|---|--------|----------|-------------|---------------|
| 1 | GET | `/fleet-status` | Estado completo de la flota | Cada hora |
| 2 | GET | `/fuel-alerts?threshold=25` | Barcos con combustible < 25% | Cada 4h |
| 3 | GET | `/maintenance-due?days=7` | Mantenimientos vencidos/próximos | Diario 7am |
| 4 | GET | `/daily-summary` | Resumen diario de operaciones | Diario 7am L-V |
| 5 | POST | `/log-positions` | Guardar posiciones AIS en historial | Cada 30 min |
| 6 | GET | `/ais-live` | Posiciones AIS en tiempo real | Bajo demanda |
| 7 | GET | `/hydrology` | Clima 5 estaciones Hidrovía | Cada 6h |
| 8 | GET | `/crew-certifications?days=30` | Certificaciones por vencer | Semanal |
| 9 | POST | `/send-alert` | Inyectar alerta al sistema | Cualquier trigger |
| 10 | GET | `/voyage-status` | Viajes activos para tracking | Cada 2h |
| 11 | POST | `/webhook` | Webhook genérico | Cualquier workflow |
| 12 | GET | `/anomalies` | Barcos detenidos, fuera de zona | Cada hora |
| 13 | GET | `/endpoints` | Lista todos los endpoints | Referencia |

---

## Tablas SQL Creadas (SUPABASE_N8N.sql — YA EJECUTADO)

```sql
-- Historial de posiciones AIS
CREATE TABLE ais_position_log (
    id BIGSERIAL PRIMARY KEY,
    mmsi BIGINT NOT NULL,
    ship_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION DEFAULT 0,
    course DOUBLE PRECISION DEFAULT 0,
    heading DOUBLE PRECISION DEFAULT 0,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas del sistema
CREATE TABLE system_alerts (
    id BIGSERIAL PRIMARY KEY,
    type TEXT DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    vessel_name TEXT,
    source TEXT DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### SQL PENDIENTE — Agregar columna de certificación:
```sql
-- Agregar a crew_members para que el endpoint crew-certifications funcione completo
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS certification_expiry TIMESTAMPTZ;
```

---

## Variables de Entorno (.env)

```env
PORT=3000
AIS_API_KEY=REDACTED_AIS_KEY_3
SUPABASE_URL=https://nfybnnpdrvyxucgpqmmo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=REDACTED_GEMINI_KEY
N8N_API_KEY=riverhub_n8n_2026
```

---

## Troubleshooting

### n8n dice "connection refused" al llamar endpoints:
- ✅ Usar `http://127.0.0.1:3000` en vez de `http://localhost:3000`
- ✅ Verificar que RiverHub esté corriendo: `pm2 status` → riverhub debe estar `online`
- ✅ Probar en navegador: `http://localhost:3000/api/health`

### PM2 no arranca n8n:
- ❌ NO usar `pm2 start n8n -- start` (error "No script path")
- ✅ Usar `pm2 start start-n8n.js --name n8n`
- El archivo `start-n8n.js` resuelve la ruta de n8n automáticamente

### Error "certification_expiry does not exist":
- Ya arreglado en el código (manejo graceful)
- Para datos reales: ejecutar el ALTER TABLE en Supabase (ver SQL PENDIENTE arriba)

### Reinstalar n8n si se rompe:
```bash
npm uninstall -g n8n
npm install -g n8n
# Tarda 15-25 minutos, es normal
```

### Verificar health del servidor:
```bash
# Health check
curl http://localhost:3000/api/health
# Esperado: {"status":"ok","ais":"connected","ai":"gemini_ready","version":"2.0.0"}

# Listar endpoints n8n
curl -H "x-api-key: riverhub_n8n_2026" http://localhost:3000/api/n8n/endpoints
```

---

## Notas Técnicas

- `app.js` usa try-catch para importar Supabase y n8n routes — si fallan, el servidor sigue corriendo
- Las posiciones AIS se almacenan en `app.locals.aisPositions` (indexadas por MMSI) para acceso de los endpoints n8n
- `uncaughtException` y `unhandledRejection` ya NO matan el proceso (antes hacían `process.exit(1)`)
- El endpoint `log-positions` inserta en batches de 20, filtra datos inválidos, y nunca crashea
- El endpoint `crew-certifications` maneja gracefully la falta de columna `certification_expiry`
- `checkOnboarding()` en dashboard.js solo muestra el popup de "Alta de Unidad Naval" si:
  1. La pantalla de login NO está visible
  2. El usuario YA está autenticado (AuthModule.getCurrentUser() no es null)
- n8n guarda sus datos en `~/.n8n/` (database.sqlite) — los workflows sobreviven reinicios
- PM2 guarda su config en `~/.pm2/` — con `pm2 save` sobrevive reinicios
