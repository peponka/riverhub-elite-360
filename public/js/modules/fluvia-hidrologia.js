// ═══════════════════════════════════════════
// FLUVIAFLEET — Hidrología Module
// Extracted from fluvia.js + Promise.all optimization
// ═══════════════════════════════════════════

var hidroChart = null;

async function loadHidrologia(){
    try{
        // FIX #14: Fetch main station + Pilar in PARALLEL (was sequential)
        var [mainR, pilarR] = await Promise.all([
            fetch('https://flood-api.open-meteo.com/v1/flood?latitude=-25.3&longitude=-57.7&daily=river_discharge&past_days=7&forecast_days=7'),
            fetch('https://flood-api.open-meteo.com/v1/flood?latitude=-26.85&longitude=-58.35&daily=river_discharge&past_days=1&forecast_days=0')
        ]);
        
        var d = await mainR.json();
        var dp = await pilarR.json();
        
        if(d.daily && d.daily.river_discharge){
            var vals=d.daily.river_discharge;
            var dates=d.daily.time;
            var today=vals[7]||vals[Math.floor(vals.length/2)];
            var yesterday=vals[6]||vals[Math.floor(vals.length/2)-1];
            document.getElementById('hidro-asu').textContent=today?today.toFixed(0)+' m³/s':'--';
            document.getElementById('hidro-trend').textContent=today>yesterday?'↑ Sube':today<yesterday?'↓ Baja':'→ Estable';
            document.getElementById('hidro-trend').style.color=today>yesterday?'var(--success)':today<yesterday?'var(--error)':'var(--text-secondary)';
            // Chart
            if(hidroChart)hidroChart.destroy();
            var ctx=document.getElementById('hidro-chart');
            if(ctx){hidroChart=new Chart(ctx,{type:'line',data:{labels:dates.map(function(d){return d.substring(5)}),datasets:[{label:'Caudal (m³/s)',data:vals,borderColor:'#3B82F6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4,pointRadius:2}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false}}}}});}
        }
        
        // Pilar data (already fetched in parallel)
        if(dp.daily && dp.daily.river_discharge && dp.daily.river_discharge[0]){
            document.getElementById('hidro-pir').textContent=dp.daily.river_discharge[0].toFixed(0)+' m³/s';
        }
        
        // FIX #14: Fetch ALL stations in PARALLEL (was sequential for loop)
        var stationsData=[
            {name:'Asuncion',river:'Rio Paraguay',lat:-25.3,lng:-57.7},
            {name:'Pilar',river:'Bajo Paraguay',lat:-26.85,lng:-58.35},
            {name:'Concepcion',river:'Alto Paraguay',lat:-23.4,lng:-57.5},
            {name:'Rosario',river:'Rio Parana',lat:-32.95,lng:-60.65}
        ];
        
        var stationPromises = stationsData.map(function(st){
            return fetch('https://flood-api.open-meteo.com/v1/flood?latitude='+st.lat+'&longitude='+st.lng+'&daily=river_discharge&past_days=1&forecast_days=0')
                .then(function(r){ return r.json(); })
                .catch(function(e){ return { error: e.message }; });
        });
        
        var stationResults = await Promise.all(stationPromises);
        
        var stHtml='';
        stationsData.forEach(function(st, i){
            var sd = stationResults[i];
            var flow = '--';
            if(sd.daily && sd.daily.river_discharge && sd.daily.river_discharge[0]){
                flow = sd.daily.river_discharge[0].toFixed(0)+' m³/s';
            }
            stHtml+='<div class="info-card"><i class="fa-solid fa-water" style="color:var(--accent)"></i><div class="info-card-text"><h4>'+st.name+' <span style="font-weight:400;color:var(--text-secondary);font-size:12px">'+st.river+'</span></h4><p>Caudal: <strong>'+flow+'</strong> — Lat: '+st.lat+' | Lng: '+st.lng+'</p></div></div>';
        });
        document.getElementById('hidro-stations').innerHTML=stHtml;
    }catch(e){console.log('Hydro:',e);}
}
