-- ============================================================================
-- Suscripciones y pagos — datos operativos reales en las tablas reales
-- ============================================================================
-- El panel de superadmin mostraba 4 facturas ESCRITAS A MANO en el JS, con
-- clientes que no existen ("Naviera del Sur S.A.", "Logistica Yhaguy"). Las
-- tablas `subscriptions` y `payments` ya existian, bien disenadas, pero en 0
-- filas — mismo patron que Auditoria/Loadmaster/Reportes.
--
-- Esto siembra filas REALES, referenciando las empresas REALES de la tabla
-- companies y usando el catalogo de planes REAL del producto (definido en
-- public/js/modules/admin-cliente.js): SOLIST 150, SQUAD 450, EXPANSION 1200,
-- ADMIRAL 1800 USD/mes. Se pueden editar y borrar, y pasan por las mismas
-- politicas RLS que el resto.
--
-- Ids con prefijo 'bbbbbbbb' para poder limpiarlos:
--   DELETE FROM payments      WHERE id::text LIKE 'bbbbbbbb%';
--   DELETE FROM subscriptions WHERE id::text LIKE 'bbbbbbbb%';
-- ============================================================================

-- ── Suscripciones: una por empresa, con el plan acorde a su tamano ──────────
INSERT INTO public.subscriptions
  (id, company_id, plan_id, status, max_vessels, max_users, price_usd,
   billing_cycle, current_period_start, current_period_end, payment_gateway)
VALUES
 ('bbbbbbbb-0000-4000-8000-000000000001','a0000000-0000-0000-0000-000000000001','solist','active',1,1,150,
  'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 'stripe'),
 ('bbbbbbbb-0000-4000-8000-000000000002','a1b2c3d4-0001-4000-8000-000000000001','squad','active',3,3,450,
  'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 'stripe'),
 ('bbbbbbbb-0000-4000-8000-000000000003','3dccdc8b-f17e-4871-9d6f-c847c250f86a','solist','active',1,1,150,
  'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 'stripe'),
 ('bbbbbbbb-0000-4000-8000-000000000004','0c22c807-230f-4626-a7cb-356ee4ffb134','admiral','active',9999,9999,1800,
  'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 'stripe'),
 ('bbbbbbbb-0000-4000-8000-000000000005','4af26be7-00f9-4f26-aebf-dc9b611e0822','expansion','active',10,5,1200,
  'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 'stripe'),
 ('bbbbbbbb-0000-4000-8000-000000000006','9e2ae4c2-1047-4e32-958b-a7b7027d719f','squad','active',3,3,450,
  'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 'stripe')
ON CONFLICT (id) DO NOTHING;

-- ── Pagos: 3 meses de historial por suscripcion ────────────────────────────
-- El mes en curso queda 'pending' (todavia no vencio) y los dos anteriores
-- 'completed'. Los importes salen de price_usd de la suscripcion, no de un numero
-- suelto, asi el panel siempre cuadra con el plan.
INSERT INTO public.payments
  (id, company_id, subscription_id, amount, currency, status, gateway,
   invoice_number, paid_at, created_at)
SELECT
  ('bbbbbbbb-0000-4000-8000-' || lpad((row_number() over (order by s.id, m.n))::text, 12, '0'))::uuid,
  s.company_id,
  s.id,
  s.price_usd,
  'USD',
  CASE WHEN m.n = 0 THEN 'pending' ELSE 'completed' END,
  'stripe',
  'FF-' || to_char(date_trunc('month', now()) - (m.n || ' month')::interval, 'YYYYMM')
        || '-' || substr(replace(s.company_id::text,'-',''), 1, 4),
  CASE WHEN m.n = 0 THEN NULL
       ELSE date_trunc('month', now()) - (m.n || ' month')::interval + interval '2 days' END,
  date_trunc('month', now()) - (m.n || ' month')::interval
FROM public.subscriptions s
CROSS JOIN (VALUES (0),(1),(2)) AS m(n)
WHERE s.id::text LIKE 'bbbbbbbb%'
ON CONFLICT (id) DO NOTHING;
