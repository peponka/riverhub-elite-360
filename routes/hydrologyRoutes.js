// ============================================
// VIABARCAZAS — Hydrology Routes
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
    refDepth: 7.0, // Profundidad de referencia canal (metros)
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,0.1],[0.1,-0.1],[-0.2,0],[0,-0.2]],
    fallback: { discharge: 3240, median: 3100 } },
  { id: 'pilar', name: 'Pilar', river: 'Bajo Paraguay', lat: -26.857, lon: -58.312,
    refDepth: 5.5,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,0.1]],
    fallback: { discharge: 2800, median: 2650 } },
  { id: 'concepcion', name: 'Concepción', river: 'Alto Paraguay', lat: -23.407, lon: -57.434,
    refDepth: 6.0,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,-0.1]],
    fallback: { discharge: 1450, median: 1600 } },
  { id: 'corrientes', name: 'Corrientes', river: 'Paraná', lat: -27.471, lon: -58.839,
    refDepth: 10.0,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,0.1],[0.1,-0.1]],
    fallback: { discharge: 15500, median: 14800 } },
  { id: 'rosario', name: 'Rosario', river: 'Paraná', lat: -32.955, lon: -60.692,
    refDepth: 10.36, // Canal Mitre dragado
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,-0.1],[-0.1,0.1],[0,-0.2],[0.2,0]],
    fallback: { discharge: 12800, median: 11900 } },
  { id: 'santa_fe', name: 'Santa Fe', river: 'Paraná', lat: -31.634, lon: -60.700,
    refDepth: 8.5,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0],[0.1,0.1],[-0.1,-0.1]],
    fallback: { discharge: 13200, median: 12500 } },
  { id: 'bermejo', name: 'Confluencia Bermejo', river: 'Bermejo/Paraguay', lat: -26.876, lon: -58.415,
    refDepth: 4.5,
    offsets: [[0,0],[0,0.1],[0,-0.1],[0.1,0],[-0.1,0]],
    fallback: { discharge: 680, median: 750 } },
  { id: 'corumba', name: 'Corumbá', river: 'Paraguay', lat: -19.009, lon: -57.658,
    refDepth: 5.0,
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

// --- UKC (Under Keel Clearance) CALCULATOR ---
// Estimates available depth from discharge and compares vs vessel draft
function estimateDepthFromDischarge(station, discharge) {
  // Simple linear model: depth = refDepth * (discharge / fallbackDischarge)^0.3
  // This is a hydrological approximation — real systems use rating curves
  const baseQ = station.fallback.discharge;
  const ratio = discharge / baseQ;
  const depth = station.refDepth * Math.pow(Math.max(ratio, 0.3), 0.3);
  return Math.round(depth * 100) / 100;
}

router.get('/ukc', apiLimiter, async (req, res) => {
  const vesselDraft = parseFloat(req.query.draft) || 2.5; // meters
  const safetyMargin = parseFloat(req.query.margin) || 0.3; // meters

  try {
    // Get current hydrology data (cached)
    let hydroData;
    const now = Date.now();
    if (hydrologyCache.data && hydrologyCache.expires > now) {
      hydroData = hydrologyCache.data;
    } else {
      // Fetch fresh
      const stations = await Promise.all(HYDRO_STATIONS.map(async s => {
        const d = await fetchBestDischarge(s);
        return { id: s.id, name: s.name, river: s.river, ...d };
      }));
      hydroData = { stations, timestamp: new Date().toISOString() };
      hydrologyCache.data = hydroData;
      hydrologyCache.expires = now + 6 * 60 * 60 * 1000;
    }

    const ukcResults = hydroData.stations.map(st => {
      const stConfig = HYDRO_STATIONS.find(s => s.id === st.id);
      const estimatedDepth = estimateDepthFromDischarge(stConfig, st.discharge);
      const ukc = estimatedDepth - vesselDraft - safetyMargin;
      let status = 'SAFE'; // green
      let color = '#10B981';
      if (ukc < 0) { status = 'BLOCKED'; color = '#DC2626'; }
      else if (ukc < 0.5) { status = 'CRITICAL'; color = '#DC2626'; }
      else if (ukc < 1.0) { status = 'CAUTION'; color = '#F59E0B'; }

      return {
        station: st.id,
        name: st.name,
        river: st.river,
        discharge: st.discharge,
        estimatedDepth,
        vesselDraft,
        safetyMargin,
        ukc: Math.round(ukc * 100) / 100,
        status,
        color,
        refDepth: stConfig.refDepth
      };
    });

    const worstStatus = ukcResults.some(r => r.status === 'BLOCKED') ? 'BLOCKED'
      : ukcResults.some(r => r.status === 'CRITICAL') ? 'CRITICAL'
      : ukcResults.some(r => r.status === 'CAUTION') ? 'CAUTION' : 'SAFE';

    res.json({
      vesselDraft,
      safetyMargin,
      overallStatus: worstStatus,
      stations: ukcResults,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('UKC error:', e.message);
    res.status(500).json({ error: 'Error calculating UKC' });
  }
});

// ============================================
// INA ARGENTINA — Official Hydrometric Data
// API: https://alerta.ina.gob.ar/a5/
// Public, no auth required. Returns JSON.
// ============================================

const INA_BASE = 'https://alerta.ina.gob.ar/a5';

// Key navigation stations on the Paraguay-Paraná-Uruguay waterway
// series_id = INA internal ID for "Altura hidrométrica (H)" / "medición directa"
const INA_STATIONS = [
  // --- Río Paraguay ---
  { seriesId: 55, name: 'Puerto Pilcomayo', river: 'Paraguay', lat: -25.367, lon: -57.650, alertLevel: 5.35, evacLevel: 6.0, lowLevel: 1.4 },
  { seriesId: 56, name: 'Bouvier', river: 'Paraguay', lat: -25.452, lon: -57.568, alertLevel: 6.0, evacLevel: 6.4, lowLevel: 0 },
  { seriesId: 57, name: 'Puerto Formosa', river: 'Paraguay', lat: -26.183, lon: -58.183, alertLevel: 7.8, evacLevel: 8.3, lowLevel: 1.6 },
  { seriesId: 58, name: 'Bermejo', river: 'Paraguay', lat: -26.926, lon: -58.506, alertLevel: 6.5, evacLevel: 7.0, lowLevel: null },
  { seriesId: 59, name: 'Isla del Cerrito', river: 'Paraguay', lat: -27.317, lon: -58.617, alertLevel: null, evacLevel: null, lowLevel: 2.6 },
  // --- Río Paraná Medio ---
  { seriesId: 19, name: 'Corrientes', river: 'Paraná', lat: -27.464, lon: -58.839, alertLevel: 6.5, evacLevel: 7.0, lowLevel: 1.83 },
  { seriesId: 20, name: 'Barranqueras', river: 'Paraná', lat: -27.483, lon: -58.933, alertLevel: 6.0, evacLevel: 6.5, lowLevel: 1.93 },
  { seriesId: 21, name: 'Empedrado', river: 'Paraná', lat: -27.954, lon: -58.819, alertLevel: 6.5, evacLevel: 6.7, lowLevel: 2.8 },
  { seriesId: 22, name: 'Bella Vista', river: 'Paraná', lat: -28.518, lon: -59.059, alertLevel: 6.0, evacLevel: 6.4, lowLevel: 3.0 },
  { seriesId: 23, name: 'Goya', river: 'Paraná', lat: -29.144, lon: -59.273, alertLevel: 5.2, evacLevel: 5.7, lowLevel: 2.23 },
  { seriesId: 25, name: 'Esquina', river: 'Paraná', lat: -30.019, lon: -59.537, alertLevel: 5.0, evacLevel: 5.4, lowLevel: 2.2 },
  { seriesId: 26, name: 'La Paz', river: 'Paraná', lat: -30.734, lon: -59.638, alertLevel: 5.8, evacLevel: 6.15, lowLevel: 2.38 },
  // --- Río Paraná Inferior ---
  { seriesId: 28, name: 'Hernandarias', river: 'Paraná', lat: -31.227, lon: -59.992, alertLevel: 5.5, evacLevel: 6.0, lowLevel: 2.18 },
  { seriesId: 29, name: 'Paraná', river: 'Paraná', lat: -31.718, lon: -60.523, alertLevel: 4.7, evacLevel: 5.0, lowLevel: 1.61 },
  { seriesId: 30, name: 'Santa Fe', river: 'Paraná', lat: -31.651, lon: -60.700, alertLevel: 5.3, evacLevel: 5.7, lowLevel: 2.0 },
  { seriesId: 31, name: 'Diamante', river: 'Paraná', lat: -32.072, lon: -60.643, alertLevel: 5.3, evacLevel: 5.5, lowLevel: 2.4 },
  { seriesId: 33, name: 'San Lorenzo', river: 'Paraná', lat: -32.734, lon: -60.726, alertLevel: 5.2, evacLevel: 5.7, lowLevel: 1.78 },
  { seriesId: 34, name: 'Rosario', river: 'Paraná', lat: -32.943, lon: -60.631, alertLevel: 5.0, evacLevel: 5.25, lowLevel: 1.64 },
  { seriesId: 35, name: 'Villa Constitución', river: 'Paraná', lat: -33.235, lon: -60.309, alertLevel: 4.0, evacLevel: 4.5, lowLevel: 1.3 },
  { seriesId: 36, name: 'San Nicolás', river: 'Paraná', lat: -33.342, lon: -60.190, alertLevel: 4.2, evacLevel: 5.0, lowLevel: 1.35 },
  { seriesId: 37, name: 'Ramallo', river: 'Paraná', lat: -33.478, lon: -59.996, alertLevel: 3.5, evacLevel: 4.0, lowLevel: 1.1 },
  { seriesId: 38, name: 'San Pedro', river: 'Paraná', lat: -33.675, lon: -59.650, alertLevel: 3.4, evacLevel: 3.6, lowLevel: 0.84 },
  { seriesId: 40, name: 'Zárate', river: 'Paraná de las Palmas', lat: -34.099, lon: -59.011, alertLevel: 2.0, evacLevel: 2.2, lowLevel: 0.25 },
  { seriesId: 41, name: 'Campana', river: 'Paraná de las Palmas', lat: -34.156, lon: -58.958, alertLevel: 2.2, evacLevel: 2.45, lowLevel: null },
  // --- Reconquista / San Javier ---
  { seriesId: 24, name: 'Reconquista', river: 'San Javier', lat: -29.238, lon: -59.581, alertLevel: 5.1, evacLevel: 5.3, lowLevel: 2.18 },
  // --- Río Uruguay ---
  { seriesId: 72, name: 'Paso de los Libres', river: 'Uruguay', lat: -29.717, lon: -57.083, alertLevel: 7.5, evacLevel: 8.5, lowLevel: 0.9 },
  { seriesId: 79, name: 'Concordia', river: 'Uruguay', lat: -31.400, lon: -58.017, alertLevel: 11.0, evacLevel: 12.5, lowLevel: 0.88 },
  { seriesId: 81, name: 'Concepción del Uruguay', river: 'Uruguay', lat: -32.483, lon: -58.233, alertLevel: 5.3, evacLevel: 6.3, lowLevel: 0.8 },
  // --- Río de la Plata ---
  { seriesId: 85, name: 'Buenos Aires', river: 'Río de la Plata', lat: -34.561, lon: -58.399, alertLevel: 3.3, evacLevel: 3.9, lowLevel: 0.21 },
  { seriesId: 52, name: 'San Fernando', river: 'Río de la Plata', lat: -34.433, lon: -58.550, alertLevel: 3.0, evacLevel: 3.5, lowLevel: 0.33 },
];

const inaCache = { data: null, expires: 0, refreshing: false };
const INA_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

// Background refresh function (reusable for pre-warm)
async function refreshINAData() {
  if (inaCache.refreshing) return; // prevent concurrent refreshes
  inaCache.refreshing = true;
  try {
    const today = new Date();
    const daysAgo = new Date(today); daysAgo.setDate(daysAgo.getDate() - 7);
    const timestart = daysAgo.toISOString().slice(0, 10);
    const timeend = today.toISOString().slice(0, 10);

    const BATCH_SIZE = 3;
    const BATCH_DELAY = 2000;
    const allResults = [];
    for (let i = 0; i < INA_STATIONS.length; i += BATCH_SIZE) {
      const batch = INA_STATIONS.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (st) => {
          const url = `${INA_BASE}/obs/puntual/series/${st.seriesId}/observaciones?timestart=${timestart}&timeend=${timeend}`;
          let resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
          if (resp.status === 429) {
            await new Promise(r => setTimeout(r, 3000));
            resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
          }
          if (!resp.ok) throw new Error(`INA ${st.name}: HTTP ${resp.status}`);
          const json = await resp.json();
          let observations = Array.isArray(json) ? json : (json.observaciones || []);
          const validObs = observations.filter(o => o.valor != null && o.valor !== '');
          const latest = validObs.length > 0 ? validObs[validObs.length - 1] : null;
          let status = 'NORMAL', value = null, timestamp = null;
          if (latest) {
            value = parseFloat(latest.valor);
            timestamp = latest.timestart || latest.fecha;
            if (st.evacLevel && value >= st.evacLevel) status = 'EVACUACION';
            else if (st.alertLevel && value >= st.alertLevel) status = 'ALERTA';
            else if (st.lowLevel && value <= st.lowLevel) status = 'AGUAS_BAJAS';
          }
          const series = validObs.slice(-168).map(o => ({ t: o.timestart || o.fecha, v: parseFloat(o.valor) }));
          return {
            seriesId: st.seriesId, name: st.name, river: st.river,
            lat: st.lat, lon: st.lon, currentLevel: value, unit: 'm',
            timestamp, status, alertLevel: st.alertLevel,
            evacLevel: st.evacLevel, lowLevel: st.lowLevel,
            series, obsCount: validObs.length
          };
        })
      );
      allResults.push(...batchResults);
      if (i + BATCH_SIZE < INA_STATIONS.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    const stations = allResults.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      const st = INA_STATIONS[i];
      return {
        seriesId: st.seriesId, name: st.name, river: st.river,
        lat: st.lat, lon: st.lon, currentLevel: null, unit: 'm',
        timestamp: null, status: 'SIN_DATOS', alertLevel: st.alertLevel,
        evacLevel: st.evacLevel, lowLevel: st.lowLevel,
        series: [], obsCount: 0, error: r.reason?.message
      };
    });

    inaCache.data = {
      source: 'INA Argentina — Sistema de Información y Alerta Hidrológico',
      api: 'https://alerta.ina.gob.ar/a5/',
      stationCount: stations.length, stations,
      timestamp: new Date().toISOString()
    };
    inaCache.expires = Date.now() + INA_CACHE_TTL;
    console.log(`✅ INA data refreshed: ${stations.filter(s => s.currentLevel != null).length}/${stations.length} stations with data`);
  } catch (e) {
    console.error('INA refresh error:', e.message);
  } finally {
    inaCache.refreshing = false;
  }
}

// Pre-warm INA cache on startup (10s delay to let server stabilize)
setTimeout(() => {
  console.log('🔄 Pre-warming INA cache...');
  refreshINAData();
}, 10000);

// GET /api/hydrology/ina — Real-time gauge heights from INA
router.get('/ina', apiLimiter, async (req, res) => {
  const now = Date.now();
  // Serve fresh cache
  if (inaCache.data && inaCache.expires > now) {
    return res.json(inaCache.data);
  }
  // Stale-while-revalidate: serve stale data instantly, refresh in background
  if (inaCache.data) {
    refreshINAData(); // fire-and-forget background refresh
    return res.json(inaCache.data);
  }

  // Cold start — no cache at all, must wait
  try {
    await refreshINAData();
    if (inaCache.data) return res.json(inaCache.data);
    res.status(503).json({ error: 'INA data not yet available, please retry in 30s' });
  } catch (e) {
    console.error('INA API error:', e.message);
    res.status(500).json({ error: 'Error fetching INA data', detail: e.message });
  }
});

// GET /api/hydrology/ina/stations — Station catalog (metadata only, fast)
router.get('/ina/stations', apiLimiter, (req, res) => {
  res.json({
    source: 'INA Argentina',
    stations: INA_STATIONS.map(st => ({
      seriesId: st.seriesId,
      name: st.name,
      river: st.river,
      lat: st.lat, lon: st.lon,
      alertLevel: st.alertLevel,
      evacLevel: st.evacLevel,
      lowLevel: st.lowLevel
    })),
    count: INA_STATIONS.length
  });
});

// GET /api/hydrology/ina/forecast — Official INA forecasts for stations that have them
const inaForecastCache = { data: null, expires: 0 };

// Stations with known INA forecast calibration
// cal_id 289 = tabprono_central (official daily level forecast)
const INA_FORECAST_CAL_ID = 289;

// Map series_id to station name
const INA_FORECAST_MAP = {
  1540: 'Corrientes',
  3523: 'Barranqueras',
  3524: 'Goya',
  3526: 'Reconquista',
  3527: 'La Paz',
  3408: 'Paraná',
  1542: 'Santa Fe',
  3412: 'Rosario',
  3414: 'San Nicolás',
};

router.get('/ina/forecast', apiLimiter, async (req, res) => {
  const now = Date.now();
  if (inaForecastCache.data && inaForecastCache.expires > now) {
    return res.json(inaForecastCache.data);
  }

  try {
    // Fetch last corrida from the tabprono_central calibrated model with forecast values
    const url = `${INA_BASE}/sim/calibrados/${INA_FORECAST_CAL_ID}/corridas?timestart=${new Date(Date.now() - 7 * 86400000).toISOString().slice(0,10)}&includeProno=true`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error(`INA Forecast HTTP ${resp.status}`);
    const corridas = await resp.json();

    if (!Array.isArray(corridas) || corridas.length === 0) {
      return res.json({
        source: 'INA Argentina — Pronósticos hidrológicos oficiales',
        forecasts: [],
        stationsWithForecast: 0,
        note: 'No hay corridas recientes disponibles',
        timestamp: new Date().toISOString()
      });
    }

    // Use the latest corrida
    const lastCorrida = corridas[corridas.length - 1];
    const forecasts = [];

    if (lastCorrida.series && Array.isArray(lastCorrida.series)) {
      for (const s of lastCorrida.series) {
        const stationName = INA_FORECAST_MAP[s.series_id];
        if (!stationName) continue;

        // Parse pronosticos — filter for 'medio' qualifier (central forecast)
        const pronosticos = (s.pronosticos || []).filter(p => p.qualifier === 'medio' || !p.qualifier);
        if (pronosticos.length === 0) continue;

        forecasts.push({
          station: stationName,
          seriesId: s.series_id,
          beginDate: s.begin_date,
          endDate: s.end_date,
          forecast: pronosticos.map(p => ({
            t: p.timestart,
            v: parseFloat(p.valor)
          })).filter(p => !isNaN(p.v)),
          qualifiers: s.qualifiers || [],
          pointCount: pronosticos.length
        });
      }
    }

    const response = {
      source: 'INA Argentina — Pronósticos hidrológicos oficiales',
      model: 'tabprono_central',
      calibrationId: INA_FORECAST_CAL_ID,
      corridaId: lastCorrida.id,
      forecastDate: lastCorrida.forecast_date,
      forecasts,
      stationsWithForecast: forecasts.length,
      timestamp: new Date().toISOString()
    };

    inaForecastCache.data = response;
    inaForecastCache.expires = now + 60 * 60 * 1000; // 1-hour cache
    res.json(response);
  } catch (e) {
    console.error('INA Forecast error:', e.message);
    res.status(500).json({ error: 'Error fetching INA forecasts', detail: e.message });
  }
});

module.exports = router;
