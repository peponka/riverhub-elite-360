/* ============================================================================
 * sb-real.js — implementación REAL de window.sb
 * ============================================================================
 * Los módulos de las páginas admin (flota-fluvia.js, tripulacion-fluvia.js,
 * etc.) piden los datos con `window.sb.fetchMine(tabla, columnas)` — el contrato
 * está bien escrito. El problema era que `window.sb` NUNCA se definía de verdad:
 *
 *   • En admin-flota-fluvia.html directamente no existía → el módulo caía a
 *     `getDemoAssets()` y mostraba 5 embarcaciones inventadas.
 *   • En otras páginas se definía un `window.sb` MOCK con arrays hardcodeados
 *     (en admin-bitacora el propio código lo llama "nuestro array de mentira").
 *
 * Este archivo provee la implementación real contra Supabase. Se carga ANTES
 * del módulo de cada página. Como los módulos ya tienen su propio fallback a
 * datos demo cuando la consulta falla o vuelve vacía, el riesgo es bajo: con
 * datos reales los muestra, y si algo falla se comporta igual que antes.
 *
 * RLS sigue aplicando: supabase-js restaura la sesión desde localStorage, así
 * que cada usuario ve lo de su empresa y un superadmin ve todo.
 * ========================================================================== */
(function () {
  'use strict';

  // Si ya hay un sb real cargado, no lo pisamos.
  if (window.sb && window.sb.__real) return;

  var SB_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

  var _client = null;
  function getClient() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient) return null;
    _client = window.supabase.createClient(SB_URL, SB_KEY);
    return _client;
  }

  function instalar() {
    window.sb = {
      __real: true,

      get client() { return getClient(); },

      /* fetchMine(tabla, columnas) -> { data, error }
         `columnas` se pasa tal cual a .select(), así que admite joins del
         estilo '*, profiles:user_id(full_name)'. */
      fetchMine: async function (table, columns) {
        var c = getClient();
        if (!c) return { data: null, error: new Error('supabase-js no disponible') };
        try {
          var res = await c.from(table).select(columns || '*');
          if (res.error) console.warn('[sb.fetchMine] ' + table + ':', res.error.message);
          return res;
        } catch (e) {
          console.warn('[sb.fetchMine] ' + table + ':', e.message);
          return { data: null, error: e };
        }
      },

      /* insertMine(tabla, registro|registros) -> { data, error } */
      insertMine: async function (table, record) {
        var c = getClient();
        if (!c) return { data: null, error: new Error('supabase-js no disponible') };
        try {
          var rows = Array.isArray(record) ? record : [record];
          var res = await c.from(table).insert(rows).select();
          if (res.error) console.warn('[sb.insertMine] ' + table + ':', res.error.message);
          return res;
        } catch (e) {
          console.warn('[sb.insertMine] ' + table + ':', e.message);
          return { data: null, error: e };
        }
      }
    };
  }

  if (window.supabase) {
    instalar();
  } else {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = instalar;
    s.onerror = function () { console.warn('[sb-real] no se pudo cargar supabase-js'); };
    document.head.appendChild(s);
  }
})();
