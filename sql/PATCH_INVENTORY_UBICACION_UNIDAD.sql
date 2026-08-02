-- ============================================================================
-- FIX: el Pañol no podía guardar ítems y mostraba todo el stock en 0
-- ============================================================================
-- `panol_screen.dart` leía y escribía columnas que no existen en
-- `inventory_items`:
--
--   lee  i['quantity']  / i['min_stock']  -> las reales son
--        stock_current   / stock_min_alert
--        => los 11 ítems reales se listaban con stock 0 y alerta 5,
--           o sea un depósito que parece vacío.
--
--   escribe quantity, min_stock, location, unit
--        => el INSERT fallaba entero con
--           "42703: column quantity of relation inventory_items does not exist".
--           Agregar un ítem desde la app no funcionaba.
--
-- `location` y `unit` no existían en la tabla, pero el formulario de la app SÍ
-- los pide al usuario. Se agregan como columnas en vez de descartar en silencio
-- lo que la persona escribe.
-- ============================================================================

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS unit     TEXT DEFAULT 'uds';

-- Los ítems que ya existían quedan con unidad por defecto.
UPDATE public.inventory_items SET unit = 'uds' WHERE unit IS NULL;

-- `sku` es NOT NULL y no tenía default, pero el formulario de la app no lo
-- pide: aun con las columnas correctas, el alta seguía fallando con
-- "23502: null value in column sku". Se le da un default autogenerado para
-- no tener que agregar un campo más a la UI.
ALTER TABLE public.inventory_items
  ALTER COLUMN sku SET DEFAULT ('SKU-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 8)));

NOTIFY pgrst, 'reload schema';
