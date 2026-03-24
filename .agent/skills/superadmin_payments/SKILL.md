---
name: SuperAdmin, Admin Cliente & Pasarela de Pago
description: Diseño completo del sistema de roles (SuperAdmin/Admin), panel de backoffice, admin para clientes, y pasarela de pago integrada para RiverHub Elite 360. Creado 15 Marzo 2026.
---

# RiverHub Elite 360 — SuperAdmin, Admin & Pasarela de Pago

## 📍 Contexto Previo (15 Marzo 2026)

### Lo que YA existe:
- **Supabase Auth** con login/registro funcional (email + password)
- **Tabla `profiles`** con campos: `id`, `email`, `full_name`, `role`, `company_id`, `avatar_url`
- **Tabla `companies`** para multi-tenant isolation (`company_id` en todas las tablas)
- **Botón "BACKOFFICE MASTER"** en sidebar (sin funcionalidad real)
- **Módulo Billing** con 4 planes renderizados (SOLIST $150, SQUAD $450, EXPANSIÓN $1200, ADMIRAL $1800) — sin pasarela real
- **RLS (Row Level Security)** parcialmente configurado en Supabase
- **App Móvil Flutter** con login funcional y FCM push notifications
- **n8n** con 13 endpoints API + Gemini IA + Firebase FCM

### Lo que FALTA construir:
1. 🔴 **SuperAdmin Panel** (Backoffice Master)
2. 🔴 **Admin Panel por Cliente** (empresa individual)
3. 🔴 **Pasarela de Pago real** (dLocal Go / Stripe / MercadoPago)

---

## 🏗️ ARQUITECTURA DE ROLES

### Jerarquía de 4 niveles:

```
┌─────────────────────────────────────────────┐
│  SUPERADMIN (riverhub@internal)              │
│  Ve TODAS las empresas, métricas, planes    │
│  Puede activar/desactivar/crear empresas    │
├─────────────────────────────────────────────┤
│  ADMIN (cliente empresa)                     │
│  Ve SOLO su empresa, gestiona usuarios      │
│  Puede cambiar plan, ver facturación        │
├─────────────────────────────────────────────┤
│  OPERATOR (usuario operativo)                │
│  Usa módulos asignados (mapa, viajes, etc)  │
│  NO puede cambiar configuraciones           │
├─────────────────────────────────────────────┤
│  VIEWER (cliente final / tracking)           │
│  Solo ve tracking de su carga               │
│  Acceso limitado vía link compartido        │
└─────────────────────────────────────────────┘
```

### Tabla SQL necesaria (actualizar `profiles`):

```sql
-- Agregar columnas a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'operator' 
  CHECK (role IN ('superadmin', 'admin', 'operator', 'viewer'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('solist', 'squad', 'expansion', 'admiral')),
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  max_vessels INT DEFAULT 1,
  max_users INT DEFAULT 1,
  price_usd DECIMAL(10,2),
  billing_cycle TEXT DEFAULT 'monthly',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  payment_gateway TEXT, -- 'dlocal', 'stripe', 'mercadopago'
  gateway_customer_id TEXT, -- ID del cliente en la pasarela
  gateway_subscription_id TEXT, -- ID de suscripción recurrente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Pagos/Transacciones
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  gateway TEXT NOT NULL,
  gateway_payment_id TEXT, -- ID del pago en la pasarela
  gateway_response JSONB, -- Respuesta completa para auditoría
  invoice_number TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);
```

---

## 🔴 MÓDULO 1: SUPERADMIN PANEL (Backoffice Master)

### Acceso:
- Solo usuarios con `role = 'superadmin'` en la tabla `profiles`
- El botón `BACKOFFICE MASTER` del sidebar ya existe (id: `nav-backoffice`)
- Si el usuario NO es superadmin, el botón se oculta

### Diseño Visual (Dark Elite Theme):

```
┌──────────────────────────────────────────────────────────┐
│  RIVERHUB BACKOFFICE                    [🔔] [👤 Admin]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ╔══════════╗  ╔══════════╗  ╔══════════╗  ╔══════════╗ │
│  ║ EMPRESAS ║  ║ INGRESOS ║  ║ USUARIOS ║  ║ ALERTAS  ║ │
│  ║    12    ║  ║  $14.4k  ║  ║    47    ║  ║    03    ║ │
│  ║  activas ║  ║  /mes    ║  ║  totales ║  ║  pagos   ║ │
│  ╚══════════╝  ╚══════════╝  ╚══════════╝  ╚══════════╝ │
│                                                          │
│  ┌─ EMPRESAS REGISTRADAS ──────────────────────────────┐ │
│  │                                                      │ │
│  │  [🟢] NAVIERA PARANÁ S.A.        EXPANSIÓN  $1200  │ │
│  │       5 usuarios · 8 embarcaciones · Activo         │ │
│  │       [Ver] [Editar] [Suspender]                    │ │
│  │                                                      │ │
│  │  [🟢] TRANSPORTE FLUVIAL CHACO   SQUAD     $450    │ │
│  │       2 usuarios · 3 embarcaciones · Activo         │ │
│  │       [Ver] [Editar] [Suspender]                    │ │
│  │                                                      │ │
│  │  [🔴] BARCAZAS DEL SUR           SOLIST    $150    │ │
│  │       1 usuario  · 1 embarcación  · PAGO VENCIDO   │ │
│  │       [Ver] [Editar] [Reactivar]                    │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ INGRESOS MENSUALES ────────────────────────────────┐ │
│  │  [Gráfico de barras - ingresos últimos 12 meses]    │ │
│  │  Chart.js con desglose por plan                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ ACTIVIDAD RECIENTE ────────────────────────────────┐ │
│  │  14:30 - NAVIERA PARANÁ: Nuevo usuario registrado   │ │
│  │  13:15 - BARCAZAS DEL SUR: Pago rechazado          │ │
│  │  12:00 - TRANSPORTE CHACO: Upgrade a SQUAD         │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Funcionalidades del SuperAdmin:
1. **Dashboard Global** — KPIs de todas las empresas
2. **CRUD Empresas** — Crear, editar, suspender, eliminar
3. **Gestión de Planes** — Cambiar plan manualmente, extender trial
4. **Ver Pagos** — Historial de transacciones de todas las empresas
5. **Usuarios Globales** — Ver todos los usuarios, resetear passwords
6. **Logs de Auditoría** — Quién hizo qué y cuándo
7. **Métricas de Uso** — Qué módulos se usan más, embarcaciones activas
8. **Notificaciones Push** — Enviar push broadcast a todas las empresas

### Archivos a crear:
- `public/js/modules/backoffice.js` — Lógica principal
- `public/css/backoffice.css` — Estilos específicos (o agregar a global.css)
- Vista HTML dentro de `app.html` (id: `view-backoffice`)

### Seguridad:
```javascript
// En auth.js - verificar al cargar
const checkSuperAdmin = () => {
  const user = AuthModule.getCurrentUser();
  if (!user || user.role !== 'superadmin') {
    document.getElementById('nav-backoffice').style.display = 'none';
    return false;
  }
  return true;
};

// RLS en Supabase (policies)
CREATE POLICY "SuperAdmin ve todo" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );
```

---

## 🔵 MÓDULO 2: ADMIN PANEL (Cliente/Empresa)

### Acceso:
- Usuarios con `role = 'admin'` ven un módulo especial "Mi Empresa"
- Botón en sidebar: "⚙️ Configuración" o "Mi Consola" (ya existe `nav-admin-console`)

### Diseño Visual:

```
┌──────────────────────────────────────────────────────────┐
│  MI EMPRESA                          NAVIERA PARANÁ S.A. │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Plan Actual: EXPANSIÓN]  [Próximo cobro: 15 Abr]      │
│                                                          │
│  ┌─ MIS USUARIOS ─────────────────────────────────────┐  │
│  │  Carlos Martínez    ADMIN    ✅ Activo    [Editar]  │  │
│  │  Juan López         OPERATOR ✅ Activo    [Editar]  │  │
│  │  María Sánchez      OPERATOR ✅ Activo    [Editar]  │  │
│  │                                                     │  │
│  │  Usuarios: 3/5 permitidos    [+ INVITAR USUARIO]    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ MIS EMBARCACIONES ─────────────────────────────────┐  │
│  │  TB PARAGUAY 01     REMOLCADOR    ✅ Operativo      │  │
│  │  R/M HERCULES       REMOLCADOR    ✅ Operativo      │  │
│  │  B/G SOJA KING      BARCAZA       🔧 Mantenimiento  │  │
│  │                                                     │  │
│  │  Embarcaciones: 3/10 permitidas                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ FACTURACIÓN ───────────────────────────────────────┐  │
│  │  Mar 2026   $1,200   ✅ Pagado    [Ver Factura]     │  │
│  │  Feb 2026   $1,200   ✅ Pagado    [Ver Factura]     │  │
│  │  Ene 2026   $1,200   ✅ Pagado    [Ver Factura]     │  │
│  │                                                     │  │
│  │  [CAMBIAR PLAN]  [ACTUALIZAR MÉTODO DE PAGO]        │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Funcionalidades del Admin:
1. **Ver/Editar perfil de empresa** — Logo, nombre, dirección
2. **Gestionar usuarios** — Invitar, cambiar rol, desactivar
3. **Ver embarcaciones** — Cuántas tiene vs cuántas permite el plan
4. **Facturación** — Ver historial de pagos, descargar facturas PDF
5. **Cambiar plan** — Upgrade/downgrade con pasarela de pago
6. **Método de pago** — Actualizar tarjeta/método
7. **Notificaciones** — Configurar qué alertas recibir

---

## 💳 MÓDULO 3: PASARELA DE PAGO

### Opciones Evaluadas para LATAM (Paraguay/Argentina):

| Pasarela | Pros | Contras | Comisión |
|----------|------|---------|----------|
| **dLocal Go** | Especializado LATAM, acepta monedas locales (PYG, ARS), tarjetas locales | Documentación menos accesible | ~3.5% + USD 0.30 |
| **Stripe** | La mejor documentación, fácil integración, Stripe Elements UI | No opera directo en Paraguay, solo cards internacionales | 2.9% + USD 0.30 |
| **MercadoPago** | Popular en ARG/PY, soporta transferencias bancarias, QR | UI de checkout menos profesional | 3.49% + comisión |

### Recomendación: **Stripe** (primero) + **dLocal** (después para locales)

Stripe es el MÁS fácil de integrar y el que mejor queda visualmente. Se puede agregar dLocal después como segunda opción para pagos locales.

### Flujo de Pago:

```
USUARIO                     RIVERHUB                    STRIPE
  │                            │                           │
  │  1. Elige Plan             │                           │
  │  ──────────────────────>   │                           │
  │                            │  2. Crea Checkout Session │
  │                            │  ──────────────────────>  │
  │                            │                           │
  │                            │  3. Retorna URL de pago   │
  │                            │  <──────────────────────  │
  │  4. Redirige a Stripe     │                           │
  │  <──────────────────────   │                           │
  │                            │                           │
  │  5. Paga en formulario    │                           │
  │  seguro de Stripe          │                           │
  │  ──────────────────────────────────────────────────>   │
  │                            │                           │
  │                            │  6. Webhook: pago OK     │
  │                            │  <──────────────────────  │
  │                            │                           │
  │                            │  7. Activa suscripción   │
  │                            │  (UPDATE subscriptions)   │
  │                            │                           │
  │  8. Redirect a /success    │                           │
  │  <──────────────────────   │                           │
```

### Integración Técnica (Stripe):

#### Backend (Node.js / Express) — `api/payments.js`:
```javascript
const stripe = require('stripe')('sk_live_...');

// Crear sesión de checkout
app.post('/api/create-checkout', async (req, res) => {
  const { planId, companyId, email } = req.body;
  
  const plans = {
    solist:    { price: 'price_XXXX', name: 'SOLIST' },
    squad:     { price: 'price_XXXX', name: 'SQUAD' },
    expansion: { price: 'price_XXXX', name: 'PACK EXPANSIÓN' },
    admiral:   { price: 'price_XXXX', name: 'ADMIRAL' }
  };
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    line_items: [{
      price: plans[planId].price,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: 'https://app.riverhub.com/billing?status=success',
    cancel_url: 'https://app.riverhub.com/billing?status=cancel',
    metadata: { company_id: companyId, plan_id: planId }
  });
  
  res.json({ url: session.url });
});

// Webhook para confirmar pagos
app.post('/api/stripe-webhook', async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body, req.headers['stripe-signature'], 'whsec_...'
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Activar suscripción en Supabase
    await supabase.from('subscriptions').upsert({
      company_id: session.metadata.company_id,
      plan_id: session.metadata.plan_id,
      status: 'active',
      gateway: 'stripe',
      gateway_customer_id: session.customer,
      gateway_subscription_id: session.subscription
    });
  }
  
  if (event.type === 'invoice.payment_succeeded') {
    // Registrar pago exitoso
    await supabase.from('payments').insert({
      company_id: '...',
      amount: event.data.object.amount_paid / 100,
      status: 'completed',
      gateway: 'stripe',
      gateway_payment_id: event.data.object.id
    });
  }
  
  if (event.type === 'invoice.payment_failed') {
    // Marcar suscripción como past_due
    // Enviar push notification al admin
  }
  
  res.json({ received: true });
});
```

#### Frontend — Actualizar `billing.js`:
```javascript
const selectPlan = async (planId) => {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CONECTANDO...';
  btn.disabled = true;
  
  try {
    const user = AuthModule.getCurrentUser();
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        companyId: user.company_id,
        email: user.email
      })
    });
    
    const { url } = await res.json();
    window.location.href = url; // Redirige a Stripe Checkout
    
  } catch (err) {
    RiverToast.error('Error al conectar con la pasarela de pago.', 'Pago');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};
```

---

## 📁 ARCHIVOS EXISTENTES RELEVANTES

| Archivo | Contenido | Estado |
|---------|-----------|--------|
| `public/js/modules/auth.js` | Login/logout, roles | ✅ Funcional |
| `public/js/modules/billing.js` | Planes de pricing renderizados | 🔧 Falta pasarela real |
| `public/js/modules/admin-dashboard.js` | Panel admin básico | 🔧 Falta funcionalidad |  
| `public/app.html` | Sidebar con `nav-backoffice` y `nav-billing` | ✅ Botones existen |
| `public/css/global.css` | Estilos globales Elite | ✅ Base lista |
| `public/css/theme.css` | Design tokens (cyan, fonts, etc) | ✅ Coherencia marca |
| `app.js` | Server Express principal | ✅ Base para API endpoints |
| `public/js/services/toast.js` | Notificaciones toast | ✅ Intercepta alerts |

---

## 🎯 ORDEN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Base de Datos (30 min)
1. Ejecutar SQL para crear tablas `subscriptions` y `payments`
2. Actualizar tabla `profiles` con columna `role`
3. Configurar RLS policies para superadmin

### Fase 2: SuperAdmin Panel (2-3 horas)
1. Crear `backoffice.js` con dashboard global
2. CRUD de empresas (listar, crear, suspender)
3. Vista de usuarios globales
4. Gráfico de ingresos mensuales (Chart.js)

### Fase 3: Admin Cliente (1-2 horas)
1. Panel "Mi Empresa" con gestión de usuarios
2. Vista de facturación e historial de pagos
3. Botón "Cambiar Plan" conectado a Billing

### Fase 4: Pasarela de Pago (2-3 horas)
1. Crear cuenta Stripe / dLocal
2. Configurar productos y precios en el dashboard de Stripe
3. Crear endpoints API (`/api/create-checkout`, `/api/stripe-webhook`)
4. Conectar `billing.js` con la API real
5. Testear flujo completo en modo sandbox

### Fase 5: Testing y Deploy
1. Test con tarjetas de prueba de Stripe
2. Verificar webhooks
3. Deploy a producción

---

## 🔐 SEGURIDAD CRÍTICA

1. **NUNCA** exponer la Secret Key de Stripe en el frontend
2. **SIEMPRE** validar webhooks con la firma de Stripe
3. **RLS** en Supabase: cada empresa solo ve sus datos
4. **SuperAdmin** verificado server-side, no solo con CSS `display:none`
5. **Rate limiting** en endpoints de pago (evitar spam)
6. **Logs** de auditoría para cada cambio de plan/pago
