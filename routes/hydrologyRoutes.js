// ============================================
// FLUVIAFLEET — Hydrology Routes
// Extracted from app.js for modularity
// ============================================
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }
});

// --- HYDROLOGY PROXY (multi-coordinate Open-Meteo Flood API) ---
const hydrologyCache = { data: null, expires: 0 };
const HYDRO_STATIONS = [
  { id: 'asuncion', name: 'Asunción', river: 'Paraguay', lat: -25.296, lon: -57.649,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,0.1],[0.1,-0.1],[-0.2,0],[0,-0.2]],
    fallback: { discharge: 3240, median: 3100 } },
  { id: 'rosario', name: 'Rosario', river: 'Paraná', lat: -32.955, lon: -60.692,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,-0.1],[-0.1,0.1],[0,-0.2],[0.2,0]],
    fallback: { discharge: 12800, median: 11900 } },
  { id: 'corumba', name: 'Corumbá', river: 'Paraguay', lat: -19.009, lon: -57.658,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,-0.1]],
    fallback: { discharge: 1820, median: 1950 } }
];

async function fetchBestDischarge(station) {
  let bestMean = -1;
  let bestResult = null;
  for (const [dlat, dlon] of station.offsets) {
    const lat = parseFloat((station.lat + dlat).toFixed(4));
    const lon = parseFloat((station.lon + dlon).toFixed(4));
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean&past_days=30&forecast_days=7`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const meanSeries = data.daily?.river_discharge_mean || data.daily?.river_discharge;
      if (!meanSeries) continue;
      const valid = meanSeries.filter(v => v != null && v > 0);
      if (!valid.length) continue;
      const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
      if (mean > bestMean) {
        bestMean = mean;
        bestResult = {
          discharge: Math.round(mean),
          median: Math.round(mean * 0.95),
          series: data.daily.river_discharge || meanSeries,
          medianSeries: meanSeries,
          dates: data.daily.time
        };
      }
    } catch (e) { /* try next offset */ }
  }
  if (bestMean < 100) {
    return { ...station.fallback, series: null, medianSeries: null, dates: null, usedFallback: true };
  }
  return { ...bestResult, usedFallback: false };
}

router.get('/', apiLimiter, async (req, res) => {
  const now = Date.now();
  if (hydrologyCache.data && hydrologyCache.expires > now) {
    return res.json(hydrologyCache.data);
  }
  try {
    const stations = await Promise.all(HYDRO_STATIONS.map(async s => {
      const d = await fetchBestDischarge(s);
      return { id: s.id, name: s.name, river: s.river, ...d };
    }));
    const response = { stations, timestamp: new Date().toISOString() };
    hydrologyCache.data = response;
    hydrologyCache.expires = now + 6 * 60 * 60 * 1000; // 6-hour cache
    res.json(response);
  } catch (e) {
    console.error('Hydrology proxy error:', e.message);
    res.json({
      stations: HYDRO_STATIONS.map(s => ({
        id: s.id, name: s.name, river: s.river,
        ...s.fallback, series: null, medianSeries: null, dates: null, usedFallback: true
      })),
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
