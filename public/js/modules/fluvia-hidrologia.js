// ═══════════════════════════════════════════
// FLUVIAFLEET — Hidrología Module
// Uses /api/hydrology server-side proxy
// ═══════════════════════════════════════════

var hidroChart = null;
// Global reference for inline onchange handler
window.loadUKC = null;

async function loadHidrologia(){
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

        // --- INA Argentina Real-Time Gauge Data ---
        await loadINA();

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
        var res = await fetch('/api/hydrology/ina');
        if(!res.ok) return;
        var data = await res.json();
        if(!data.stations || !data.stations.length) return;

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

    }catch(e){
        console.error('INA:', e);
    }
}
