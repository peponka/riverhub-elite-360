/* ===========================================================================
 * Líquidos — barcazas tanque y operaciones de carga/descarga
 * ---------------------------------------------------------------------------
 * Esta página venía 100% escrita a mano en el HTML: 6 tarjetas de barcaza y 5
 * filas de operaciones fijas, con KPIs que ni siquiera coincidían entre sí
 * (el contador decía 12 barcazas y la grilla mostraba 6).
 *
 * Ahora todo sale de liquid_tanks / liquid_operations — las mismas tablas que
 * lee la app móvil y la vista de viabarcazas.html, así que los tres coinciden.
 * ======================================================================== */
(function () {
  'use strict';

  var PRODUCT_CLASS = { fuel: 'fuel', chemical: 'chemical', oil: 'oil', water: 'water' };

  // Iconos según el estado real de la barcaza (los valores son los que guarda
  // la base: 'En tránsito' | 'Fondeada' | 'Descargando' | 'Mantenimiento').
  var STATUS_ICON = {
    'En tránsito': 'fa-ship',
    'Fondeada': 'fa-anchor',
    'Descargando': 'fa-arrow-down',
    'Mantenimiento': 'fa-screwdriver-wrench'
  };

  var OP_CLASS = { 'Carga': 'load', 'Descarga': 'unload', 'Trasvasije': 'transfer' };
  var OP_ICON = { 'Carga': 'fa-arrow-up', 'Descarga': 'fa-arrow-down', 'Trasvasije': 'fa-arrows-left-right' };

  var _tanks = [];

  // La misma página existe en -en.html; los textos del módulo siguen el idioma.
  var EN = /-en\.html$/i.test(location.pathname);
  var T = EN ? {
    sinTanques: 'No tank barges registered.',
    sinOps: 'No operations recorded.',
    nuevaBarcaza: 'New tank barge', nuevaOp: 'Log operation',
    nombre: 'Name', tipo: 'Type', capacidad: 'Capacity (m³)', nivel: 'Current level (m³)',
    producto: 'Product', familia: 'Family', temperatura: 'Temperature (°C)',
    estado: 'Status', ruta: 'Route / location', barcaza: 'Barge', operacion: 'Operation',
    volumen: 'Volume (m³)', terminal: 'Terminal', duracion: 'Duration (minutes)',
    cancelar: 'Cancel', guardar: 'Save',
    errNombre: 'Name is required.', errCap: 'Capacity must be greater than zero.',
    errNivel: 'Current level cannot exceed capacity.', errVol: 'Volume must be greater than zero.',
    errGuardar: 'Could not save.', sinBarcazas: 'Add a tank barge first.',
    fFuel: 'Fuel', fChem: 'Chemical', fOil: 'Crude / oil', fWater: 'Water / other'
  } : {
    sinTanques: 'No hay barcazas tanque registradas.',
    sinOps: 'Sin operaciones registradas.',
    nuevaBarcaza: 'Nueva barcaza tanque', nuevaOp: 'Registrar operación',
    nombre: 'Nombre', tipo: 'Tipo', capacidad: 'Capacidad (m³)', nivel: 'Nivel actual (m³)',
    producto: 'Producto', familia: 'Familia', temperatura: 'Temperatura (°C)',
    estado: 'Estado', ruta: 'Ruta / ubicación', barcaza: 'Barcaza', operacion: 'Operación',
    volumen: 'Volumen (m³)', terminal: 'Terminal', duracion: 'Duración (minutos)',
    cancelar: 'Cancelar', guardar: 'Guardar',
    errNombre: 'El nombre es obligatorio.', errCap: 'La capacidad tiene que ser mayor a cero.',
    errNivel: 'El nivel actual no puede superar la capacidad.', errVol: 'El volumen tiene que ser mayor a cero.',
    errGuardar: 'No se pudo guardar.', sinBarcazas: 'Primero cargá una barcaza tanque.',
    fFuel: 'Combustible', fChem: 'Químico', fOil: 'Crudo / aceite', fWater: 'Agua / otros'
  };

  // La base guarda el valor canónico en español; en la página en inglés se
  // traduce solo para mostrar (nunca se cambia lo que se guarda).
  var LBL_TIPO = EN ? { 'Tanque doble casco': 'Double hull tank', 'Tanque simple': 'Single hull tank' } : {};
  var LBL_ESTADO = EN ? { 'En tránsito': 'In transit', 'Fondeada': 'At anchor', 'Descargando': 'Discharging', 'Mantenimiento': 'Maintenance' } : {};
  var LBL_OP = EN ? { 'Carga': 'Loading', 'Descarga': 'Discharge', 'Trasvasije': 'Transfer' } : {};
  function lbl(dict, v) { return dict[v] || v; }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function num(v) { return Number(v) || 0; }
  function miles(n) { return num(n).toLocaleString('es-AR'); }

  function fecha(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    var p = function (x) { return String(x).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function duracion(min) {
    var m = num(min);
    if (m <= 0) return '—';
    return (m / 60 | 0) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function renderTanks(tanks) {
    var grid = document.getElementById('liq-grid');
    if (!grid) return;
    if (!tanks.length) {
      grid.innerHTML = '<div style="padding:24px;color:var(--text-2);font-size:0.85rem;">' + T.sinTanques + '</div>';
      return;
    }
    grid.innerHTML = tanks.map(function (t) {
      var cap = num(t.capacity_m3), cur = num(t.current_m3);
      var pct = cap > 0 ? Math.round(cur / cap * 100) : 0;
      var cls = PRODUCT_CLASS[t.product_type] || 'fuel';
      var temp = num(t.temperature_c);
      var h = '';
      h += '<div class="tank-card">';
      h += '<div class="tank-header"><div>';
      h += '<div class="tank-name">' + esc(t.name) + '</div>';
      h += '<div class="tank-type">' + esc(lbl(LBL_TIPO, t.tank_type)) + ' — ' + miles(cap) + ' m³</div>';
      h += '</div><span class="tank-product-badge ' + cls + '">' + esc(t.product) + '</span></div>';
      h += '<div class="tank-gauge">';
      h += '<div class="tank-fill ' + cls + '" style="height:' + pct + '%"></div>';
      h += '<div class="tank-pct' + (pct > 55 ? ' light' : '') + '">' + pct + '%</div>';
      h += '</div>';
      h += '<div class="tank-capacity"><span>' + (EN ? 'Current' : 'Actual') + ': <strong>' + miles(cur) + ' m³</strong></span><span>Cap: ' + miles(cap) + ' m³</span></div>';
      h += '<div class="tank-meta">';
      if (temp > 0) h += '<span class="tank-meta-item"><i class="fas fa-temperature-half"></i> ' + temp + '°C</span>';
      h += '<span class="tank-meta-item"><i class="fas ' + (STATUS_ICON[t.status] || 'fa-circle-info') + '"></i> ' + esc(lbl(LBL_ESTADO, t.status)) + '</span>';
      h += '<span class="tank-meta-item"><i class="fas fa-route"></i> ' + esc(t.route) + '</span>';
      h += '</div></div>';
      return h;
    }).join('');
  }

  function renderOps(ops) {
    var body = document.getElementById('liq-ops-body');
    if (!body) return;
    if (!ops.length) {
      body.innerHTML = '<tr><td colspan="7" style="color:var(--text-2);padding:20px;">' + T.sinOps + '</td></tr>';
      return;
    }
    body.innerHTML = ops.map(function (o) {
      var cls = OP_CLASS[o.operation_type] || 'load';
      var h = '<tr>';
      h += '<td>' + fecha(o.started_at) + '</td>';
      h += '<td><span class="op-type ' + cls + '"><i class="fas ' + (OP_ICON[o.operation_type] || 'fa-circle') + '"></i> ' + esc(lbl(LBL_OP, o.operation_type)) + '</span></td>';
      h += '<td>' + esc(o.detail || '—') + '</td>';
      h += '<td>' + esc(o.product || '—') + '</td>';
      h += '<td style="font-weight:700">' + miles(o.volume_m3) + ' m³</td>';
      h += '<td>' + esc(o.terminal || '—') + '</td>';
      h += '<td>' + duracion(o.duration_min) + '</td>';
      return h + '</tr>';
    }).join('');
  }

  async function load() {
    var t = await window.sb.from('liquid_tanks').select('*').order('name');
    var o = await window.sb.from('liquid_operations').select('*').order('started_at', { ascending: false }).limit(50);
    if (t.error) console.error('[liquidos] tanques:', t.error);
    if (o.error) console.error('[liquidos] operaciones:', o.error);

    _tanks = t.data || [];
    var ops = o.data || [];

    var cap = _tanks.reduce(function (s, x) { return s + num(x.capacity_m3); }, 0);
    var cur = _tanks.reduce(function (s, x) { return s + num(x.current_m3); }, 0);
    // "en tránsito" es volumen realmente navegando, no la suma de toda la flota
    var transito = _tanks
      .filter(function (x) { return x.status === 'En tránsito'; })
      .reduce(function (s, x) { return s + num(x.current_m3); }, 0);

    setText('liq-count', _tanks.length);
    setText('liq-util', cap > 0 ? Math.round(cur / cap * 100) + '%' : '—');
    setText('liq-transit', (transito / 1000).toFixed(1) + 'k m³');
    setText('liq-ops', ops.length);

    renderTanks(_tanks);
    renderOps(ops);
  }

  /* ── Alta ────────────────────────────────────────────────────────────── */

  function modal(titulo, campos, onSave) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
    var html = '<div style="background:var(--bg);border-radius:16px;padding:24px;width:100%;max-width:420px;max-height:88vh;overflow:auto;">';
    html += '<div style="font-weight:700;font-size:1rem;margin-bottom:16px;">' + esc(titulo) + '</div>';
    campos.forEach(function (c) {
      html += '<label style="display:block;font-size:0.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-2);margin-bottom:5px;">' + esc(c.label) + '</label>';
      if (c.options) {
        html += '<select id="f-' + c.id + '" style="width:100%;padding:9px 10px;margin-bottom:14px;border:1px solid var(--sep);border-radius:8px;font-size:0.85rem;background:var(--bg);color:inherit;">';
        html += c.options.map(function (op) { return '<option value="' + esc(op.value) + '">' + esc(op.label) + '</option>'; }).join('');
        html += '</select>';
      } else {
        html += '<input id="f-' + c.id + '" type="' + (c.type || 'text') + '" placeholder="' + esc(c.placeholder || '') + '" style="width:100%;padding:9px 10px;margin-bottom:14px;border:1px solid var(--sep);border-radius:8px;font-size:0.85rem;background:var(--bg);color:inherit;">';
      }
    });
    html += '<div id="f-err" style="display:none;color:#DC2626;font-size:0.78rem;margin-bottom:10px;"></div>';
    html += '<div style="display:flex;gap:10px;justify-content:flex-end;">';
    html += '<button id="f-cancel" class="btn btn-sm" style="border:1px solid var(--sep);background:transparent;">' + esc(T.cancelar) + '</button>';
    html += '<button id="f-save" class="btn btn-primary btn-sm">' + esc(T.guardar) + '</button>';
    html += '</div></div>';
    ov.innerHTML = html;
    document.body.appendChild(ov);

    var cerrar = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
    ov.querySelector('#f-cancel').addEventListener('click', cerrar);
    ov.querySelector('#f-save').addEventListener('click', async function () {
      var vals = {};
      campos.forEach(function (c) { vals[c.id] = ov.querySelector('#f-' + c.id).value.trim(); });
      var err = ov.querySelector('#f-err');
      var btn = ov.querySelector('#f-save');
      btn.disabled = true;
      var res = await onSave(vals);
      if (res === true) { cerrar(); load(); return; }
      btn.disabled = false;
      err.textContent = res || T.errGuardar;
      err.style.display = 'block';
    });
  }

  function nuevaBarcaza() {
    modal(T.nuevaBarcaza, [
      { id: 'name', label: T.nombre, placeholder: 'BT-007 Ejemplo' },
      { id: 'tank_type', label: T.tipo, options: [{ value: 'Tanque doble casco', label: 'Tanque doble casco' }, { value: 'Tanque simple', label: 'Tanque simple' }] },
      { id: 'capacity_m3', label: T.capacidad, type: 'number', placeholder: '2000' },
      { id: 'current_m3', label: T.nivel, type: 'number', placeholder: '0' },
      { id: 'product', label: T.producto, placeholder: 'Gas Oil' },
      { id: 'product_type', label: T.familia, options: [{ value: 'fuel', label: T.fFuel }, { value: 'chemical', label: T.fChem }, { value: 'oil', label: T.fOil }, { value: 'water', label: T.fWater }] },
      { id: 'temperature_c', label: T.temperatura, type: 'number', placeholder: '20' },
      { id: 'status', label: T.estado, options: [{ value: 'Fondeada', label: 'Fondeada' }, { value: 'En tránsito', label: 'En tránsito' }, { value: 'Descargando', label: 'Descargando' }, { value: 'Mantenimiento', label: 'Mantenimiento' }] },
      { id: 'route', label: T.ruta, placeholder: 'ASU → ROE' }
    ], async function (v) {
      if (!v.name) return T.errNombre;
      var cap = num(v.capacity_m3), cur = num(v.current_m3);
      if (cap <= 0) return T.errCap;
      if (cur > cap) return T.errNivel;
      var r = await window.sb.from('liquid_tanks').insert({
        name: v.name, tank_type: v.tank_type, capacity_m3: cap, current_m3: cur,
        product: v.product || null, product_type: v.product_type,
        temperature_c: num(v.temperature_c), status: v.status, route: v.route || null,
        company_id: _tanks.length ? _tanks[0].company_id : null
      });
      return r.error ? r.error.message : true;
    });
  }

  function nuevaOperacion() {
    if (!_tanks.length) { alert(T.sinBarcazas); return; }
    modal(T.nuevaOp, [
      { id: 'tank_id', label: T.barcaza, options: _tanks.map(function (t) { return { value: t.id, label: t.name }; }) },
      { id: 'operation_type', label: T.operacion, options: [{ value: 'Carga', label: 'Carga' }, { value: 'Descarga', label: 'Descarga' }, { value: 'Trasvasije', label: 'Trasvasije' }] },
      { id: 'product', label: T.producto, placeholder: 'Gas Oil' },
      { id: 'volume_m3', label: T.volumen, type: 'number', placeholder: '1200' },
      { id: 'terminal', label: T.terminal, placeholder: 'Terminal San Lorenzo' },
      { id: 'duration_min', label: T.duracion, type: 'number', placeholder: '405' }
    ], async function (v) {
      var vol = num(v.volume_m3);
      if (vol <= 0) return T.errVol;
      var tank = _tanks.filter(function (t) { return t.id === v.tank_id; })[0];
      var r = await window.sb.from('liquid_operations').insert({
        tank_id: v.tank_id,
        operation_type: v.operation_type,
        product: v.product || (tank && tank.product) || null,
        volume_m3: vol,
        terminal: v.terminal || null,
        detail: tank ? tank.name : null,
        started_at: new Date().toISOString(),
        duration_min: num(v.duration_min) || null,
        company_id: tank ? tank.company_id : null
      });
      return r.error ? r.error.message : true;
    });
  }

  function init() {
    var bt = document.getElementById('liq-new-tank');
    if (bt) bt.addEventListener('click', nuevaBarcaza);
    var bo = document.getElementById('liq-new-op');
    if (bo) bo.addEventListener('click', nuevaOperacion);
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
