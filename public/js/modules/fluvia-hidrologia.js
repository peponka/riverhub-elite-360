// ═══════════════════════════════════════════
// FLUVIAFLEET — Hidrología Module
// Uses /api/hydrology server-side proxy
// ═══════════════════════════════════════════

var hidroChart = null;

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

    }catch(e){
        console.error('Hydro:', e);
    }
}
