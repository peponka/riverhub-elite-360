# 🚀 GUÍA DE IMPLEMENTACIÓN - SUPABASE

## PASO 1: Acceder a Supabase

1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto: **pfucnnzgxacwvwnwqpql**
3. Ir a **SQL Editor** (icono de base de datos en el menú lateral)

---

## PASO 2: Ejecutar el Schema

1. Click en **"New Query"**
2. Abrir el archivo: `SUPABASE_SCHEMA_COMPLETO.sql`
3. Copiar TODO el contenido
4. Pegarlo en el editor SQL de Supabase
5. Click en **"RUN"** (o presionar Ctrl+Enter)
6. ✅ Deberías ver: **"Success. No rows returned"**

---

## PASO 3: Verificar Tablas Creadas

En el menú lateral de Supabase:
1. Click en **"Table Editor"**
2. Deberías ver todas estas tablas:
   - ✅ vessels
   - ✅ crew_members
   - ✅ clients
   - ✅ voyages
   - ✅ convoys
   - ✅ fuel_logs
   - ✅ maintenance_tasks
   - ✅ spare_parts
   - ✅ logbook_entries
   - ✅ communications
   - ✅ quotations

---

## PASO 4: Verificar Datos de Ejemplo

1. En **Table Editor**, click en **"vessels"**
2. Deberías ver 4 embarcaciones:
   - TB PARAGUAY 01
   - R/M HERCULES
   - B/M TITAN
   - R/M CENTAURO

Si no están, ejecutar manualmente:
```sql
INSERT INTO vessels (id, name, type, mmsi, status, fuel_capacity) VALUES
('11111111-1111-1111-1111-111111111111', 'TB PARAGUAY 01', 'tugboat', '735090000', 'active', 50000),
('22222222-2222-2222-2222-222222222222', 'R/M HERCULES', 'pusher', '735090001', 'active', 45000),
('33333333-3333-3333-3333-333333333333', 'B/M TITAN', 'barge', '735090002', 'active', 0),
('44444444-4444-4444-4444-444444444444', 'R/M CENTAURO', 'pusher', '735090003', 'active', 45000)
ON CONFLICT (id) DO NOTHING;
```

---

## PASO 5: Configurar Políticas RLS (Seguridad)

### ✅ Ya están configuradas con políticas permisivas

Las políticas actuales permiten TODO a usuarios autenticados.

**IMPORTANTE PARA PRODUCCIÓN:** 
Deberías ajustar las políticas según roles. Ejemplo:

```sql
-- Solo para referencia futura
-- Política más restrictiva (ejemplo):
DROP POLICY IF EXISTS "Allow all for authenticated users" ON vessels;

CREATE POLICY "Users can view all vessels" ON vessels
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify vessels" ON vessels
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );
```

**Por ahora:** Las políticas permisivas están bien para desarrollo/testing.

---

## PASO 6: Probar Conexión desde la App

1. Abrir la app web: `http://localhost:3000`
2. Ir a cualquier módulo que use Supabase:
   - Dashboard
   - Mapa
   - Tripulación
   - Viajes
3. Intentar crear/editar datos
4. ✅ Debería funcionar sin errores

**Si hay errores de permisos:**
- Ir a Supabase → Authentication → Policies
- Verificar que RLS esté habilitado pero con políticas permisivas

---

## PASO 7: Verificar Vistas

Las vistas ayudan con reportes. Para probarlas:

```sql
-- Ver flota activa
SELECT * FROM active_fleet;

-- Ver resumen de combustible
SELECT * FROM fuel_summary;

-- Ver mantenimiento pendiente
SELECT * FROM pending_maintenance;
```

---

## PASO 8: Backup Automático (Recomendado)

1. En Supabase Dashboard → **Settings** → **Database**
2. Habilitar **"Point-in-time Recovery"** (PITR)
3. Configurar retención: **7 días mínimo**

---

## PASO 9: Monitoreo

1. En **Database** → **Query Performance**
2. Monitorear queries lentas
3. Los índices ya están creados para optimizar

---

## 🔧 TROUBLESHOOTING

### Error: "relation already exists"
**Solución:** Algunas tablas ya existen. Ejecutar solo las secciones faltantes.

### Error: "permission denied"
**Solución:** 
1. Ir a Table Editor
2. Click derecho en la tabla → **Edit Table**
3. En **RLS** → verificar que las políticas estén activas

### Error: "function uuid_generate_v4() does not exist"
**Solución:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 📊 PRÓXIMOS PASOS

1. ✅ Schema creado
2. ✅ Datos de prueba insertados
3. 🔄 Probar desde la app
4. 🔄 Ajustar políticas RLS según necesidad
5. 🔄 Configurar backup automático

---

## 🎯 CREDENCIALES ACTUALES

```javascript
// Ya configuradas en tu app (public/js/config.js)
SUPABASE_URL: 'https://pfucnnzgxacwvwnwqpql.supabase.co'
SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**LISTO PARA USAR** ✅
