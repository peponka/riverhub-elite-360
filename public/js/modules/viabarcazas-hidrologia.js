// ═══════════════════════════════════════════
// VIABARCAZAS — Hidrología Module
// Uses /api/hydrology server-side proxy
// ═══════════════════════════════════════════

var hidroChart = null;
// Global reference for inline onchange handler
window.loadUKC = null;

async function loadHidrologia(){
    // Independiente del resto: si el proxy de Open-Meteo falla, la referencia
    // de calado (que usa el endpoint del INA) se muestra igual.
    loadCaladoReferencia();
    try{
        var res = await fetch('/api/hydrology');
        if(!res.ok) throw new Error('Proxy HTTP ' + res.status);
        var hData = await res.json();

        var stMap = {};
        hData.stations.forEach(function(s){ stMap[s.id] = s; });

        var asu = stMap['asuncion'];
        if(asu){
            document.getElementById('hidro-asu').textContent = asu.discharge.toLocaleString() + ' m³/s';

            // Trend: compare discharge vs median
            var trendEl = document.getElementById('hidro-trend');
            if(trendEl){
                var pct = asu.median ? ((asu.discharge - asu.median) / asu.median * 100) : 0;
                trendEl.textContent = pct > 5 ? '↑ Sube' : pct < -5 ? '↓ Baja' : '→ Estable';
                trendEl.style.color = pct > 5 ? 'var(--success)' : pct < -5 ? 'var(--error)' : 'var(--text-secondary)';
            }

            // Chart (30-day series if available)
            if(hidroChart) hidroChart.destroy();
            var ctx = document.getElementById('hidro-chart');
            if(ctx && asu.series && asu.dates){
                hidroChart = new Chart(ctx, {
                    type:'line',
                    data:{
                        labels: asu.dates.map(function(d){ return d.substring(5); }),
                        datasets:[{
                            label:'Caudal (m³/s)',
                            data: asu.series,
                            borderColor:'#3B82F6',
                            backgroundColor:'rgba(59,130,246,0.1)',
                            fill:true, tension:0.4, pointRadius:2
                        }]
                    },
                    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false}}}}
                });
            }
        }

        // Pilar element (not in proxy — show placeholder)
        var pirEl = document.getElementById('hidro-pir');
        if(pirEl) pirEl.textContent = '-- m³/s';

        // Station cards from proxy — redesigned as professional grid cards
        var stColors = {'asuncion':'#3B82F6','pilar':'#8B5CF6','pilcomayo':'#F97316','bermejo':'#DC2626','corrientes':'#0EA5E9','rosario':'#10B981','parana':'#06B6D4','santa_fe':'#F59E0B'};
        var stIcons = {'asuncion':'fa-city','pilar':'fa-location-dot','pilcomayo':'fa-water','bermejo':'fa-water','corrientes':'fa-anchor','rosario':'fa-industry','parana':'fa-water','santa_fe':'fa-bridge-water'};
        var stHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:12px">';
        hData.stations.forEach(function(s){
            var color = stColors[s.id] || '#94A3B8';
            var icon = stIcons[s.id] || 'fa-water';
            var discharge = s.discharge || 0;
            var isLow = discharge < 1500;
            var isHigh = discharge > 4000;
            var condColor = isLow ? '#F59E0B' : isHigh ? '#DC2626' : '#2EA043';
            var condLabel = isLow ? 'BAJO' : isHigh ? 'CRECIDA' : 'NORMAL';
            var condBg = isLow ? 'rgba(245,158,11,0.08)' : isHigh ? 'rgba(220,38,38,0.08)' : 'rgba(46,160,67,0.08)';
            // Gauge percentage (0-100 based on 0-6000 range)
            var gaugePct = Math.min(100, Math.round((discharge / 6000) * 100));

            stHtml += '<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:all 0.2s;cursor:default" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
            // Header: icon + name + condition badge
            stHtml += '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">';
            stHtml += '<div style="display:flex;align-items:center;gap:10px">';
            stHtml += '<div style="width:42px;height:42px;border-radius:12px;background:' + color + '12;display:flex;align-items:center;justify-content:center"><i class="fa-solid ' + icon + '" style="font-size:17px;color:' + color + '"></i></div>';
            stHtml += '<div><div style="font-size:15px;font-weight:700;color:var(--text-primary)">' + (s.name || s.id) + '</div>';
            stHtml += '<div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;gap:4px"><i class="fa-solid fa-water" style="font-size:9px;color:' + color + '"></i> Rio ' + (s.river || '--') + '</div></div></div>';
            stHtml += '<span style="font-size:9px;font-weight:700;letter-spacing:0.3px;color:' + condColor + ';background:' + condBg + ';padding:4px 10px;border-radius:6px;display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:' + condColor + '"></span>' + condLabel + '</span>';
            stHtml += '</div>';
            // Discharge value
            stHtml += '<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">Caudal actual</div>';
            stHtml += '<div style="font-size:24px;font-weight:800;color:var(--text-primary);letter-spacing:-0.5px">' + discharge.toLocaleString() + ' <span style="font-size:13px;font-weight:500;color:var(--text-secondary)">m³/s</span></div></div>';
            // Gauge bar
            stHtml += '<div style="width:100%;height:8px;background:var(--surface-low,#f0f0f0);border-radius:4px;overflow:hidden;margin-bottom:12px">';
            stHtml += '<div style="width:' + gaugePct + '%;height:100%;background:linear-gradient(90deg,' + color + ',' + condColor + ');border-radius:4px;transition:width 0.5s ease"></div></div>';
            // Footer
            stHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--separator)">';
            stHtml += '<span style="font-size:10px;color:var(--text-tertiary);display:flex;align-items:center;gap:4px"><i class="fa-regular fa-clock" style="font-size:9px"></i> Actualizado hoy</span>';
            if(s.usedFallback) stHtml += '<span style="font-size:9px;color:var(--text-tertiary);background:var(--bg-tertiary,#f5f5f5);padding:2px 6px;border-radius:4px">Est.</span>';
            stHtml += '</div></div>';
        });
        stHtml += '</div>';
        var stEl = document.getElementById('hidro-stations');
        if(stEl) stEl.innerHTML = stHtml;

        // --- UKC (Under Keel Clearance) NAVIGATOR ---
        await loadUKC();

        // --- INA Argentina Real-Time Gauge Data (fire-and-forget) ---
        loadINA().catch(function(e){ console.error('INA Error:', e); });

        // --- INA Forecast (fire-and-forget, independent) ---
        loadINAForecastChart().catch(function(e){ console.error('Forecast Error:', e); });

    }catch(e){
        console.error('Hydro:', e);
    }
}

// UKC Section: Navigation Safety Semaphore
async function loadUKC(draft){
    window.loadUKC = loadUKC; // expose globally for inline handler
    var draftVal = draft || 2.5; // Default draft in meters
    try{
        var res = await fetch('/api/hydrology/ukc?draft=' + draftVal + '&margin=0.3');
        if(!res.ok) return;
        var data = await res.json();

        var overallBg = data.overallStatus === 'SAFE' ? 'rgba(16,185,129,0.08)' : data.overallStatus === 'CAUTION' ? 'rgba(245,158,11,0.08)' : 'rgba(220,38,38,0.08)';
        var overallColor = data.overallStatus === 'SAFE' ? '#10B981' : data.overallStatus === 'CAUTION' ? '#F59E0B' : '#DC2626';
        var overallIcon = data.overallStatus === 'SAFE' ? 'fa-check-circle' : data.overallStatus === 'CAUTION' ? 'fa-exclamation-triangle' : 'fa-times-circle';

        var ukcHtml = '<div style="margin-top:28px">';
        // Section header
        ukcHtml += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
        ukcHtml += '<div>';
        ukcHtml += '<div style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:1.5px;text-transform:uppercase">NAVEGABILIDAD — UKC</div>';
        ukcHtml += '<div style="font-size:12px;color:var(--text-tertiary)">Under Keel Clearance por estación</div>';
        ukcHtml += '</div>';
        // Overall status badge
        ukcHtml += '<span style="font-size:10px;font-weight:700;color:' + overallColor + ';background:' + overallBg + ';padding:6px 14px;border-radius:8px;display:flex;align-items:center;gap:5px"><i class="fa-solid ' + overallIcon + '" style="font-size:11px"></i>' + data.overallStatus + '</span>';
        ukcHtml += '</div>';

        // Draft input
        ukcHtml += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;background:var(--bg-secondary);border:1px solid var(--separator);border-radius:12px;padding:10px 14px">';
        ukcHtml += '<i class="fa-solid fa-ruler-vertical" style="color:var(--text-secondary)"></i>';
        ukcHtml += '<span style="font-size:12px;color:var(--text-secondary)">Calado del buque:</span>';
        ukcHtml += '<input type="number" id="ukc-draft-input" value="' + draftVal + '" step="0.1" min="0" max="10" style="width:70px;background:var(--bg-primary);border:1px solid var(--separator);border-radius:8px;padding:6px 10px;font-size:14px;font-weight:700;color:var(--text-primary);text-align:center" onchange="loadUKC(parseFloat(this.value))">';
        ukcHtml += '<span style="font-size:12px;color:var(--text-secondary)">metros</span>';
        ukcHtml += '</div>';

        // Station UKC cards grid
        ukcHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">';
        data.stations.forEach(function(st){
            var bg = st.status === 'SAFE' ? 'rgba(16,185,129,0.06)' : st.status === 'CAUTION' ? 'rgba(245,158,11,0.06)' : 'rgba(220,38,38,0.06)';
            var borderC = st.status === 'SAFE' ? 'rgba(16,185,129,0.2)' : st.status === 'CAUTION' ? 'rgba(245,158,11,0.2)' : 'rgba(220,38,38,0.2)';
            var sIcon = st.status === 'SAFE' ? 'fa-check' : st.status === 'CAUTION' ? 'fa-exclamation' : 'fa-times';

            ukcHtml += '<div style="background:' + bg + ';border:1px solid ' + borderC + ';border-radius:14px;padding:14px;transition:all 0.2s">';
            // Header: name + status
            ukcHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
            ukcHtml += '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">' + st.name + '</div>';
            ukcHtml += '<div style="width:24px;height:24px;border-radius:50%;background:' + st.color + ';display:flex;align-items:center;justify-content:center"><i class="fa-solid ' + sIcon + '" style="font-size:10px;color:white"></i></div>';
            ukcHtml += '</div>';
            // Values
            ukcHtml += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;text-align:center">';
            ukcHtml += '<div><div style="font-size:9px;color:var(--text-tertiary)">Prof. est.</div><div style="font-size:14px;font-weight:700;color:var(--text-primary)">' + st.estimatedDepth + 'm</div></div>';
            ukcHtml += '<div><div style="font-size:9px;color:var(--text-tertiary)">Calado</div><div style="font-size:14px;font-weight:700;color:var(--text-primary)">' + st.vesselDraft + 'm</div></div>';
            ukcHtml += '<div><div style="font-size:9px;color:var(--text-tertiary)">UKC</div><div style="font-size:14px;font-weight:800;color:' + st.color + '">' + st.ukc + 'm</div></div>';
            ukcHtml += '</div>';
            // Status label
            ukcHtml += '<div style="text-align:center;margin-top:8px;font-size:9px;font-weight:700;letter-spacing:0.5px;color:' + st.color + '">' + st.status + '</div>';
            ukcHtml += '</div>';
        });
        ukcHtml += '</div></div>';

        var ukcEl = document.getElementById('hidro-ukc');
        if(!ukcEl){
            ukcEl = document.createElement('div');
            ukcEl.id = 'hidro-ukc';
            var stationsEl = document.getElementById('hidro-stations');
            if(stationsEl) stationsEl.parentNode.insertBefore(ukcEl, stationsEl.nextSibling);
        }
        if(ukcEl) ukcEl.innerHTML = ukcHtml;

    }catch(e){
        console.error('UKC:', e);
    }
}

// ═══════════════════════════════════════════
// INA ARGENTINA — Official Gauge Heights
// ═══════════════════════════════════════════
async function loadINA(){
    try{
        console.log('[INA] Fetching /api/hydrology/ina...');
        var res = await fetch('/api/hydrology/ina');
        if(!res.ok){ console.warn('[INA] HTTP', res.status); return; }
        var data = await res.json();
        console.log('[INA] Got', data.stationCount, 'stations');
        if(!data.stations || !data.stations.length){ console.warn('[INA] No stations in response'); return; }

        var riverColors = {
            'Paraguay': '#8B5CF6', 'Paraná': '#3B82F6', 'Paraná de las Palmas': '#0EA5E9',
            'San Javier': '#06B6D4', 'Uruguay': '#10B981', 'Río de la Plata': '#F59E0B'
        };
        var statusLabels = { 'NORMAL': 'Normal', 'ALERTA': 'Alerta', 'EVACUACION': 'Evacuación', 'AGUAS_BAJAS': 'Aguas Bajas', 'SIN_DATOS': 'Sin datos' };
        var statusColors = { 'NORMAL': '#10B981', 'ALERTA': '#F59E0B', 'EVACUACION': '#DC2626', 'AGUAS_BAJAS': '#3B82F6', 'SIN_DATOS': '#94A3B8' };
        var statusIcons = { 'NORMAL': 'fa-check-circle', 'ALERTA': 'fa-exclamation-triangle', 'EVACUACION': 'fa-xmark-circle', 'AGUAS_BAJAS': 'fa-arrow-down', 'SIN_DATOS': 'fa-question-circle' };

        var html = '<div style="margin-top:36px">';
        // Section header
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">';
        html += '<div>';
        html += '<div style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:1.5px;text-transform:uppercase">INA ARGENTINA — ALTURAS HIDROMÉTRICAS</div>';
        html += '<div style="font-size:12px;color:var(--text-tertiary)">Datos oficiales del Sistema de Información y Alerta Hidrológico — ' + data.stationCount + ' estaciones</div>';
        html += '</div>';
        html += '<a href="https://alerta.ina.gob.ar/a5/" target="_blank" style="font-size:10px;font-weight:600;color:#3B82F6;text-decoration:none;background:rgba(59,130,246,0.08);padding:5px 12px;border-radius:6px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-external-link" style="font-size:9px"></i>INA API</a>';
        html += '</div>';

        // Group by river
        var rivers = {};
        data.stations.forEach(function(st){
            if(!rivers[st.river]) rivers[st.river] = [];
            rivers[st.river].push(st);
        });

        Object.keys(rivers).forEach(function(riverName){
            var stList = rivers[riverName];
            var riverColor = riverColors[riverName] || '#94A3B8';

            html += '<div style="margin-bottom:20px">';
            html += '<div style="font-size:12px;font-weight:700;color:' + riverColor + ';margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-water" style="font-size:10px"></i>Río ' + riverName + ' (' + stList.length + ')</div>';
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">';

            stList.forEach(function(st){
                var sc = statusColors[st.status] || '#94A3B8';
                var sl = statusLabels[st.status] || st.status;
                var si = statusIcons[st.status] || 'fa-circle';
                var level = st.currentLevel != null ? st.currentLevel.toFixed(2) + ' m' : '-- m';
                var alertPct = (st.alertLevel && st.currentLevel) ? Math.min(100, Math.round((st.currentLevel / st.alertLevel) * 100)) : 0;

                html += '<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:14px;padding:16px;transition:all 0.2s" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(0,0,0,0.06)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';

                // Header
                html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
                html += '<div>';
                html += '<div style="font-size:14px;font-weight:700;color:var(--text-primary)">' + st.name + '</div>';
                html += '<div style="font-size:10px;color:var(--text-tertiary)">Serie #' + st.seriesId + '</div>';
                html += '</div>';
                html += '<span style="font-size:9px;font-weight:700;color:' + sc + ';background:' + sc + '14;padding:4px 8px;border-radius:6px;display:flex;align-items:center;gap:3px"><i class="fa-solid ' + si + '" style="font-size:8px"></i>' + sl + '</span>';
                html += '</div>';

                // Level value
                html += '<div style="font-size:28px;font-weight:800;color:var(--text-primary);letter-spacing:-0.5px;margin-bottom:10px">' + level + '</div>';

                // Alert gauge
                if(st.alertLevel){
                    html += '<div style="margin-bottom:10px">';
                    html += '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-tertiary);margin-bottom:3px"><span>Aguas bajas ' + (st.lowLevel || '--') + 'm</span><span>Alerta ' + st.alertLevel + 'm</span></div>';
                    html += '<div style="width:100%;height:6px;background:var(--surface-low,#f0f0f0);border-radius:3px;overflow:hidden;position:relative">';
                    html += '<div style="width:' + alertPct + '%;height:100%;background:linear-gradient(90deg,#3B82F6,' + sc + ');border-radius:3px;transition:width 0.5s"></div>';
                    html += '</div></div>';
                }

                // Footer
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--separator)">';
                if(st.timestamp){
                    var tDate = new Date(st.timestamp);
                    var tStr = tDate.toLocaleDateString('es-AR', {day:'2-digit',month:'short'}) + ' ' + tDate.toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'});
                    html += '<span style="font-size:9px;color:var(--text-tertiary);display:flex;align-items:center;gap:3px"><i class="fa-regular fa-clock" style="font-size:8px"></i>' + tStr + '</span>';
                } else {
                    html += '<span style="font-size:9px;color:var(--text-tertiary)">Sin fecha</span>';
                }
                html += '<span style="font-size:9px;color:var(--text-tertiary)">' + st.obsCount + ' obs</span>';
                html += '</div></div>';
            });

            html += '</div></div>';
        });

        html += '</div>';

        var inaEl = document.getElementById('hidro-ina');
        if(!inaEl){
            inaEl = document.createElement('div');
            inaEl.id = 'hidro-ina';
            var ukcEl = document.getElementById('hidro-ukc');
            if(ukcEl) ukcEl.parentNode.insertBefore(inaEl, ukcEl.nextSibling);
            else {
                var stEl = document.getElementById('hidro-stations');
                if(stEl) stEl.parentNode.appendChild(inaEl);
            }
        }
        if(inaEl) inaEl.innerHTML = html;

        // Also populate calado-ina container if it exists
        var caladoIna = document.getElementById('calado-ina');
        if(caladoIna) caladoIna.innerHTML = html;

        // Store globally for map + dashboard use
        window._inaStations = data.stations;

    }catch(e){
        console.error('INA:', e);
    }
}

// ═══════════════════════════════════════════
// FEATURE 1: INA Stations on Fleet Map
// ═══════════════════════════════════════════
var inaMapMarkers = [];
async function loadINAMapMarkers(){
    try{
        if(!window.L || !window.map) return;
        // Remove old markers
        inaMapMarkers.forEach(function(m){ window.map.removeLayer(m); });
        inaMapMarkers = [];

        var res = await fetch('/api/hydrology/ina');
        if(!res.ok) return;
        var data = await res.json();
        if(!data.stations) return;

        var statusColors = {
            'NORMAL': '#10B981', 'ALERTA': '#F59E0B',
            'EVACUACION': '#DC2626', 'AGUAS_BAJAS': '#3B82F6', 'SIN_DATOS': '#94A3B8'
        };
        var statusLabels = {
            'NORMAL': 'Normal', 'ALERTA': '⚠ Alerta',
            'EVACUACION': '🔴 Evacuación', 'AGUAS_BAJAS': '↓ Aguas Bajas', 'SIN_DATOS': 'Sin datos'
        };

        data.stations.forEach(function(st){
            if(!st.lat || !st.lon) return;
            var color = statusColors[st.status] || '#94A3B8';
            var label = statusLabels[st.status] || st.status;
            var level = st.currentLevel != null ? st.currentLevel.toFixed(2) + 'm' : '--';

            var icon = L.divIcon({
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                popupAnchor: [0, -14],
                html: '<div style="width:28px;height:28px;border-radius:50%;background:' + color + ';border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer"><i class="fa-solid fa-water" style="font-size:11px;color:white"></i></div>'
            });

            var popup = '<div style="font-family:Inter,sans-serif;min-width:180px">' +
                '<div style="font-weight:700;font-size:14px;margin-bottom:4px">' + st.name + '</div>' +
                '<div style="font-size:11px;color:#666;margin-bottom:8px">Río ' + st.river + ' · Serie #' + st.seriesId + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
                '<span style="font-size:22px;font-weight:800">' + level + '</span>' +
                '<span style="font-size:10px;font-weight:700;color:' + color + ';background:' + color + '18;padding:3px 8px;border-radius:6px">' + label + '</span>' +
                '</div>';
            if(st.alertLevel){
                var pct = st.currentLevel ? Math.min(100, Math.round((st.currentLevel / st.alertLevel) * 100)) : 0;
                popup += '<div style="height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:3px"></div></div>';
                popup += '<div style="display:flex;justify-content:space-between;font-size:9px;color:#999"><span>Bajo ' + (st.lowLevel || '--') + 'm</span><span>Alerta ' + st.alertLevel + 'm</span></div>';
            }
            popup += '<div style="margin-top:6px;font-size:9px;color:#aaa;text-align:center">Fuente: INA SIyAH Argentina</div></div>';

            var m = L.marker([st.lat, st.lon], { icon: icon }).addTo(window.map).bindPopup(popup);
            inaMapMarkers.push(m);
        });

        // Update map legend
        var legend = document.querySelector('.map-legend');
        if(legend){
            var existing = legend.querySelector('.ina-count');
            var alertCount = data.stations.filter(function(s){ return s.status === 'ALERTA' || s.status === 'EVACUACION'; }).length;
            var txt = data.stationCount + ' estaciones INA' + (alertCount > 0 ? ' · ' + alertCount + ' en alerta' : '');
            if(existing){ existing.textContent = txt; }
            else{
                var d = document.createElement('div');
                d.className = 'map-legend-item ina-count';
                d.style.cssText = 'margin-top:4px;font-size:10px;color:#3B82F6;font-weight:600';
                d.textContent = txt;
                legend.appendChild(d);
            }
        }
    }catch(e){
        console.error('INA Map:', e);
    }
}

// ═══════════════════════════════════════════
// FEATURE 2: Dashboard KPI — INA Alert Count
// ═══════════════════════════════════════════
async function loadINADashboardKPI(){
    try{
        var res = await fetch('/api/hydrology/ina');
        if(!res.ok) return;
        var data = await res.json();
        if(!data.stations) return;

        var alertas = data.stations.filter(function(s){ return s.status === 'ALERTA'; }).length;
        var crecidas = data.stations.filter(function(s){ return s.status === 'EVACUACION'; }).length;
        var bajas = data.stations.filter(function(s){ return s.status === 'AGUAS_BAJAS'; }).length;
        var normales = data.stations.filter(function(s){ return s.status === 'NORMAL'; }).length;

        // Update the CALADO MÍNIMO KPI card with INA data (more relevant)
        var kpiCalado = document.getElementById('dash-kpi-calado');
        var kpiCaladoSub = document.getElementById('dash-kpi-calado-sub');
        if(kpiCalado){
            // Find minimum water level among all stations
            var levels = data.stations.filter(function(s){ return s.currentLevel != null; }).map(function(s){ return s.currentLevel; });
            if(levels.length > 0){
                var minLevel = Math.min.apply(null, levels);
                kpiCalado.textContent = minLevel.toFixed(1);
                kpiCalado.nextElementSibling.textContent = 'm';
            }
        }
        if(kpiCaladoSub){
            kpiCaladoSub.textContent = normales + ' normal · ' + (alertas + crecidas) + ' alerta';
            kpiCaladoSub.style.color = (alertas + crecidas) > 0 ? 'var(--warning)' : 'var(--success)';
        }

        // Also populate the ALARMAS CRÍTICAS card with INA count
        var kpiAlertas = document.getElementById('dash-kpi-alertas');
        var kpiAlertasSub = document.getElementById('dash-kpi-alertas-sub');
        if(kpiAlertas && (alertas + crecidas) > 0){
            var current = parseInt(kpiAlertas.textContent) || 0;
            kpiAlertas.textContent = current + alertas + crecidas;
        }
        if(kpiAlertasSub && (alertas + crecidas) > 0){
            kpiAlertasSub.innerHTML = '<i class="fa-solid fa-water" style="margin-right:4px"></i>' + alertas + ' alerta + ' + crecidas + ' crecida INA';
        }

        // Populate hydro status
        var hidroStatus = document.getElementById('dash-hidro-status');
        if(hidroStatus){
            if(crecidas > 0) hidroStatus.textContent = 'Crecida en ' + crecidas + ' estaciones INA';
            else if(alertas > 0) hidroStatus.textContent = 'Alerta en ' + alertas + ' estaciones INA';
            else if(bajas > 0) hidroStatus.textContent = 'Aguas bajas en ' + bajas + ' estaciones';
            else hidroStatus.textContent = 'Navegable — ' + normales + ' estaciones normales';
        }

    }catch(e){
        console.error('INA Dashboard KPI:', e);
    }
}

// ═══════════════════════════════════════════
// FEATURE 3: INA Forecast — Pure HTML Visual
// ═══════════════════════════════════════════
async function loadINAForecastChart(){
    try{
        var container = document.getElementById('hidro-forecast-chart');
        if(!container){
            // Fallback: create the container if it doesn't exist
            var title = document.querySelector('.section-title');
            if(!title) return;
            container = document.createElement('div');
            container.id = 'hidro-forecast-chart';
            container.style.cssText = 'background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:24px;margin-top:12px';
            title.parentNode.appendChild(container);
        }
        // If cached HTML has a <canvas>, replace it with a <div>
        if(container.tagName === 'CANVAS'){
            var newDiv = document.createElement('div');
            newDiv.id = 'hidro-forecast-chart';
            newDiv.style.cssText = container.parentElement ? container.parentElement.style.cssText : 'background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:24px;margin-top:12px';
            container.parentElement.replaceChild(newDiv, container);
            container = newDiv;
        }
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Cargando pronóstico INA...</div>';

        var res = await fetch('/api/hydrology/ina/forecast');
        if(!res.ok){ container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary)">Sin datos de pronóstico</div>'; return; }
        var data = await res.json();
        if(!data.forecasts || data.forecasts.length === 0){ container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary)">Sin pronósticos disponibles</div>'; return; }

        var colors = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#F97316','#14B8A6'];

        // Find global min/max for scale
        var allVals = [];
        data.forecasts.forEach(function(fc){
            if(!fc.forecast) return;
            fc.forecast.forEach(function(p){ if(p.v != null) allVals.push(p.v); });
        });
        var minVal = Math.min.apply(null, allVals);
        var maxVal = Math.max.apply(null, allVals);
        var range = maxVal - minVal || 1;

        var html = '';

        // Header
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
        html += '<div><div style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:1.5px;text-transform:uppercase">PRONÓSTICO OFICIAL INA</div>';
        html += '<div style="font-size:12px;color:var(--text-tertiary)">Modelo: ' + (data.model || 'tabprono_central') + ' · ' + data.stationsWithForecast + ' estaciones</div></div>';
        html += '<span style="font-size:9px;background:rgba(59,130,246,0.08);color:#3B82F6;padding:4px 10px;border-radius:6px;font-weight:700">' + (data.forecastDate ? new Date(data.forecastDate).toLocaleDateString('es', {day:'numeric',month:'short',year:'numeric'}) : 'Reciente') + '</span>';
        html += '</div>';

        // Station forecast cards
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';

        data.forecasts.forEach(function(fc, i){
            if(!fc.forecast || fc.forecast.length === 0) return;
            var color = colors[i % colors.length];
            var vals = fc.forecast.filter(function(p){ return p.v != null; });
            if(vals.length === 0) return;

            var current = vals[0].v;
            var last = vals[vals.length - 1].v;
            var diff = last - current;
            var trendIcon = diff > 0.1 ? 'fa-arrow-trend-up' : diff < -0.1 ? 'fa-arrow-trend-down' : 'fa-minus';
            var trendColor = diff > 0.1 ? '#EF4444' : diff < -0.1 ? '#10B981' : '#94A3B8';
            var trendLabel = diff > 0.1 ? 'Sube +' + diff.toFixed(2) + 'm' : diff < -0.1 ? 'Baja ' + diff.toFixed(2) + 'm' : 'Estable';

            html += '<div style="background:var(--bg-primary);border:1px solid var(--separator);border-radius:14px;padding:16px;transition:all 0.2s" onmouseover="this.style.borderColor=\'' + color + '40\'" onmouseout="this.style.borderColor=\'var(--separator)\'">';

            // Station header
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
            html += '<div style="display:flex;align-items:center;gap:8px">';
            html += '<div style="width:10px;height:10px;border-radius:50%;background:' + color + '"></div>';
            html += '<span style="font-size:14px;font-weight:700;color:var(--text-primary)">' + fc.station + '</span>';
            html += '</div>';
            html += '<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:' + trendColor + ';font-weight:600"><i class="fa-solid ' + trendIcon + '" style="font-size:10px"></i> ' + trendLabel + '</div>';
            html += '</div>';

            // Bar chart for each date
            html += '<div style="display:flex;align-items:flex-end;gap:4px;height:80px;margin-bottom:8px">';
            vals.forEach(function(p){
                var pct = Math.max(10, Math.round(((p.v - minVal) / range) * 100));
                var dateLabel = new Date(p.t).toLocaleDateString('es', { day:'numeric', month:'short' });
                html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
                html += '<span style="font-size:10px;font-weight:700;color:var(--text-primary)">' + p.v.toFixed(1) + '</span>';
                html += '<div style="width:100%;height:' + pct + '%;background:linear-gradient(180deg,' + color + ',' + color + '80);border-radius:6px 6px 2px 2px;min-height:8px;transition:height 0.5s"></div>';
                html += '<span style="font-size:8px;color:var(--text-tertiary);white-space:nowrap">' + dateLabel + '</span>';
                html += '</div>';
            });
            html += '</div>';

            // Range indicator
            html += '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-tertiary);border-top:1px solid var(--separator);padding-top:6px;margin-top:4px">';
            html += '<span>Mín: ' + Math.min.apply(null, vals.map(function(v){ return v.v; })).toFixed(2) + 'm</span>';
            html += '<span>Máx: ' + Math.max.apply(null, vals.map(function(v){ return v.v; })).toFixed(2) + 'm</span>';
            html += '</div>';

            html += '</div>';
        });

        html += '</div>';

        // Source footer
        html += '<div style="text-align:center;margin-top:14px;font-size:9px;color:var(--text-tertiary)"><i class="fa-solid fa-shield-halved" style="margin-right:4px"></i>Fuente: INA Argentina · Sistema de Información y Alerta Hidrológico (SIyAH) · Corrida #' + (data.corridaId || '--') + '</div>';

        container.innerHTML = html;

    }catch(e){
        console.error('INA Forecast:', e);
        var c = document.getElementById('hidro-forecast-chart');
        if(c) c.innerHTML = '<div style="text-align:center;padding:20px;color:var(--error)">Error cargando pronóstico</div>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Referencia de calado a partir del nivel del rio en Rosario
// ═══════════════════════════════════════════════════════════════════════════
// El calado autorizado real por tramo lo publicaba el Boletin Fluvial de la
// Subsecretaria de Puertos y Vias Navegables, que dejo de publicarse en marzo
// 2025 (concesion de dragado en transicion, licitada a 25 anios con ofertas
// abiertas en feb-2026). No hay hoy fuente oficial en vivo de calado por paso.
//
// Lo unico documentado y verificable es el umbral historico del hidrometro de
// Rosario: con >= 2,47 m la concesionaria estaba obligada a garantizar 34 pies
// desde Puerto San Martin al mar. Se muestra eso, rotulado como referencia
// orientativa. NO se extrapola a las otras estaciones: no hay umbral publicado
// para cada una e inventarlos seria un dato falso con apariencia de preciso.
var CALADO_UMBRAL_ROSARIO_M = 2.47;
var CALADO_PIES_GARANTIZADOS = 34;

async function loadCaladoReferencia(){
    var el = document.getElementById('calado-referencia');
    if(!el) return;
    try{
        var res = await fetch('/api/hydrology/ina');
        if(!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        var ros = (data.stations || []).filter(function(s){
            return (s.name || '').toLowerCase() === 'rosario' && s.currentLevel != null;
        })[0];
        if(!ros){ el.innerHTML = ''; return; }

        var nivel = Number(ros.currentLevel);
        var alcanza = nivel >= CALADO_UMBRAL_ROSARIO_M;
        var margen = nivel - CALADO_UMBRAL_ROSARIO_M;
        var color = alcanza ? '#10B981' : '#F59E0B';
        var icono = alcanza ? 'fa-circle-check' : 'fa-triangle-exclamation';

        var h = '<div style="background:var(--bg-secondary);border:1px solid ' + color + '59;border-radius:16px;padding:20px">';
        h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
        h += '<div style="width:38px;height:38px;border-radius:10px;background:' + color + '1F;display:flex;align-items:center;justify-content:center">';
        h += '<i class="fa-solid ' + icono + '" style="color:' + color + ';font-size:16px"></i></div>';
        h += '<div><div style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:var(--text-secondary)">REFERENCIA DE CALADO — ROSARIO</div>';
        h += '<div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-top:2px">'
           + (alcanza ? 'Nivel sobre el umbral de ' : 'Nivel bajo el umbral de ') + CALADO_PIES_GARANTIZADOS + ' pies</div></div></div>';

        h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">';
        h += caladoDato('Nivel actual', nivel.toFixed(2) + ' m', color);
        h += caladoDato('Umbral', CALADO_UMBRAL_ROSARIO_M.toFixed(2) + ' m', 'var(--text-secondary)');
        h += caladoDato('Margen', (margen >= 0 ? '+' : '') + margen.toFixed(2) + ' m', color);
        h += '</div>';

        h += '<div style="font-size:10px;color:var(--text-tertiary);line-height:1.5">'
           + 'Referencia orientativa, no es el calado autorizado oficial. Umbral histórico del hidrómetro de Rosario '
           + '(≥ ' + CALADO_UMBRAL_ROSARIO_M.toFixed(2) + ' m ⇒ ' + CALADO_PIES_GARANTIZADOS + ' pies garantizados de Puerto San Martín al mar). '
           + 'El Boletín Fluvial oficial no se publica desde marzo 2025 por la transición de la concesión.</div>';
        h += '</div>';
        el.innerHTML = h;
    }catch(e){
        console.error('loadCaladoReferencia:', e);
        el.innerHTML = '';
    }
}

function caladoDato(label, valor, color){
    return '<div style="background:var(--bg-primary);border-radius:10px;padding:10px 12px">'
         + '<div style="font-size:9px;color:var(--text-tertiary)">' + label + '</div>'
         + '<div style="font-size:15px;font-weight:700;color:' + color + ';margin-top:2px">' + valor + '</div></div>';
}
