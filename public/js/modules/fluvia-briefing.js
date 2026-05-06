// ═══════════════════════════════════════════
// FLUVIAFLEET — Briefing Diario Module
// Extracted from fluvia.js
// ═══════════════════════════════════════════

async function loadBriefing(){
    var today=new Date();
    var dateStr=today.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    document.getElementById('briefing-date').textContent=dateStr.toUpperCase();
    try{
        // FIX #14: Parallel queries instead of sequential
        var [v, vj, fl, cr] = await Promise.all([
            sb.from('vessels').select('status'),
            sb.from('voyages').select('status'),
            sb.from('fuel_logs').select('liters').limit(30),
            sb.from('crew_members').select('status')
        ]);

        var total=v.data?v.data.length:0;
        var active=v.data?v.data.filter(function(x){var s=(x.status||'').toLowerCase();return s.indexOf('viaje')>=0||s==='active'}).length:0;
        document.getElementById('brief-vessels').textContent=active+'/'+total;

        var trips=vj.data?vj.data.filter(function(x){var s=(x.status||'').toLowerCase();return s==='navegando'||s==='en_curso'}).length:0;
        document.getElementById('brief-trips').textContent=trips;

        var totalFuel=fl.data?fl.data.reduce(function(s,x){return s+(x.liters||0)},0):0;
        document.getElementById('brief-fuel').textContent=totalFuel>0?totalFuel.toLocaleString()+'L':'0L';

        var emb=cr.data?cr.data.filter(function(x){return(x.status||'').toLowerCase()==='embarcado'||x.status==='active'}).length:0;
        document.getElementById('brief-crew').textContent=emb+'/'+(cr.data?cr.data.length:0);

        // Weather
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=America/Asuncion');
        var wd=await w.json();
        if(wd.current){
            var codes={0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',61:'Lluvia',80:'Chaparron',95:'Tormenta'};
            var desc=codes[wd.current.weather_code]||'Variado';
            document.getElementById('briefing-weather').innerHTML='<i class="fa-solid fa-cloud-sun"></i><div class="info-card-text"><h4>'+desc+' - '+Math.round(wd.current.temperature_2m)+'C</h4><p>Viento: '+Math.round(wd.current.wind_speed_10m)+' km/h | Humedad: '+(wd.current.relative_humidity_2m||'--')+'% | Asuncion, PY</p></div>';
        }

        // Activity feed + alerts in parallel
        var [lg, inc] = await Promise.all([
            sb.from('logs').select('*').order('created_at',{ascending:false}).limit(5),
            sb.from('logs').select('*').eq('action_type','INCIDENTE').order('created_at',{ascending:false}).limit(5)
        ]);

        var act=document.getElementById('briefing-activity');act.innerHTML='';
        if(lg.data&&lg.data.length>0){
            lg.data.forEach(function(l){
                var t=l.created_at?new Date(l.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
                var icon=l.action_type==='INCIDENTE'?'fa-triangle-exclamation':l.action_type==='DRAFT_READING'?'fa-ruler-vertical':'fa-bookmark';
                var color=l.action_type==='INCIDENTE'?'var(--error)':'var(--text-primary)';
                act.innerHTML+='<div class="info-card" style="margin-bottom:8px"><i class="fa-solid '+icon+'" style="color:'+color+'"></i><div class="info-card-text"><h4>'+(l.title||l.action_type||'Actividad')+'</h4><p>'+(l.vessel_name||'')+' - '+(l.description||'')+' - '+t+'</p></div></div>';
            });
        }else{act.innerHTML='<div class="empty-state"><i class="fa-regular fa-circle-check"></i><p>Sin actividad reciente</p></div>';}

        var alertsDiv=document.getElementById('briefing-alerts');
        if(inc.data&&inc.data.length>0){
            alertsDiv.innerHTML='';
            inc.data.forEach(function(i){
                var det=typeof i.details==='string'?JSON.parse(i.details||'{}'):i.details||{};
                var sev=det.severity||'Medio';
                var sevC=sev==='Critico'?'var(--error)':sev==='Alto'?'var(--warning)':'var(--accent)';
                alertsDiv.innerHTML+='<div class="info-card" style="margin-bottom:8px;border-left:3px solid '+sevC+'"><i class="fa-solid fa-triangle-exclamation" style="color:'+sevC+'"></i><div class="info-card-text"><h4>'+(i.title||'Incidente')+'</h4><p>'+(i.vessel_name||'')+' - '+sev+' - '+(det.type||'')+' '+(det.status||'')+'</p></div></div>';
            });
        }
    }catch(e){console.log('Briefing:',e);}
}
