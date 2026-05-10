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

        // Station cards from proxy
        var stHtml = '';
        hData.stations.forEach(function(s){
            stHtml += '<div class="info-card"><i class="fa-solid fa-water" style="color:var(--accent)"></i>' +
                '<div class="info-card-text"><h4>' + s.name + ' <span style="font-weight:400;color:var(--text-secondary);font-size:12px">Río ' + s.river + '</span></h4>' +
                '<p>Caudal: <strong>' + s.discharge.toLocaleString() + ' m³/s</strong>' + (s.usedFallback ? ' (est.)' : '') + '</p></div></div>';
        });
        var stEl = document.getElementById('hidro-stations');
        if(stEl) stEl.innerHTML = stHtml;

    }catch(e){
        void('Hydro:', e);
    }
}
