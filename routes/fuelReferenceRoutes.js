// ============================================================================
// Precio de referencia de gasoil — dato público real, no inventado
// ============================================================================
// Fuente: Secretaría de Energía de Argentina, dataset "Precios en Surtidor"
// (Resolución 314/2016), datos.energia.gob.ar. Es un CSV nacional de ~9MB con
// TODAS las estaciones del país desde 2017: se descarga en el servidor (nunca
// desde el celular), se filtra a Santa Fe (la provincia de Rosario/San Lorenzo,
// los puertos de la hidrovía) y producto Gas Oil Grado 2, y se cachea 6hs
// (misma cadencia con la que la fuente actualiza).
//
// El mes más reciente puede tener pocas cargas todavía (recién empieza el
// mes): se toma el último mes con al menos 10 muestras para no promediar
// sobre 1 o 2 estaciones nada más.
// ============================================================================
const express = require('express');
const router = express.Router();
const { parse } = require('csv-parse/sync');

const CSV_URL = 'http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MIN_MUESTRAS = 10;

let _cache = { at: 0, data: null };

async function computeReference() {
  const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`CSV respondio ${res.status}`);
  const text = await res.text();
  const rows = parse(text, { columns: true, skip_empty_lines: true, bom: true });

  const byMonth = new Map();
  for (const r of rows) {
    if (!r.provincia || !r.producto) continue;
    if (!r.provincia.toUpperCase().includes('SANTA FE')) continue;
    if (r.producto !== 'Gas Oil Grado 2') continue;
    const precio = parseFloat(r.precio);
    if (!Number.isFinite(precio) || precio <= 0) continue;
    if (!byMonth.has(r.indice_tiempo)) byMonth.set(r.indice_tiempo, []);
    byMonth.get(r.indice_tiempo).push(precio);
  }

  const meses = Array.from(byMonth.keys()).sort().reverse();
  const mes = meses.find((m) => byMonth.get(m).length >= MIN_MUESTRAS) || meses[0];
  if (!mes) return null;

  const vals = byMonth.get(mes);
  const promedio = vals.reduce((a, b) => a + b, 0) / vals.length;

  return {
    producto: 'Gas Oil Grado 2',
    provincia: 'Santa Fe',
    mes,
    promedio_ars_litro: Math.round(promedio * 100) / 100,
    min_ars_litro: Math.min(...vals),
    max_ars_litro: Math.max(...vals),
    muestras: vals.length,
    fuente: 'Secretaría de Energía — Precios en Surtidor (datos.energia.gob.ar)',
  };
}

// GET /api/fuel-reference/gasoil — publico, sin auth (mismo criterio que /api/ais-positions)
router.get('/gasoil', async (req, res) => {
  try {
    if (!_cache.data || Date.now() - _cache.at > CACHE_TTL_MS) {
      const fresh = await computeReference();
      if (fresh) _cache = { at: Date.now(), data: fresh };
    }
    if (!_cache.data) return res.status(503).json({ error: 'Sin datos disponibles todavia' });
    res.json({ ..._cache.data, cached_at: new Date(_cache.at).toISOString() });
  } catch (e) {
    console.error('[fuel-reference]', e.message);
    // Si falla la descarga pero hay un valor cacheado viejo, mejor devolver ese que nada
    if (_cache.data) return res.json({ ..._cache.data, cached_at: new Date(_cache.at).toISOString(), stale: true });
    res.status(502).json({ error: 'No se pudo obtener el precio de referencia' });
  }
});

module.exports = router;
