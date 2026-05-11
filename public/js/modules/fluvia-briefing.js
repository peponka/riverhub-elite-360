// ═══════════════════════════════════════════
// FLUVIAFLEET — Briefing Diario Module
// ═══════════════════════════════════════════

var isEN = window.location.pathname.indexOf('-en') >= 0;
var bTxt = {
    vessels: isEN ? 'Active Fleet' : 'Flota Activa',
    trips:   isEN ? 'Trips Today'  : 'Viajes Hoy',
    fuel:    isEN ? 'Fuel'         : 'Combustible',
    crew:    isEN ? 'Crew'         : 'Tripulación',
    wind:    isEN ? 'Wind'         : 'Viento',
    humidity:isEN ? 'Humidity'     : 'Humedad',
    location:isEN ? 'Asuncion, PY' : 'Asuncion, PY',
    noActivity: isEN ? 'No recent activity' : 'Sin actividad reciente',
    noAlerts:   isEN ? 'No critical alerts today' : 'Sin alertas críticas hoy',
    weatherCodes: isEN
        ? {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',51:'Drizzle',61:'Rain',80:'Showers',95:'Thunderstorm'}
        : {0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',61:'Lluvia',80:'Chaparon',95:'Tormenta'},
    catLabels: isEN
        ? {navegacion:'Navigation',navegación:'Navigation',combustible:'Fuel',clima:'Weather',tripulacion:'Crew',tripulación:'Crew',mantenimiento:'Maintenance',maniobra:'Maneuver',incidente:'Incident',observacion:'Observation',observación:'Observation',carga:'Cargo',seguridad:'Safety',INCIDENTE:'Incident',INCIDENT:'Incident',DRAFT_READING:'Draft'}
        : {navegacion:'Navegación',combustible:'Combustible',clima:'Clima',tripulacion:'Tripulación',mantenimiento:'Mantenimiento',maniobra:'Maniobra',incidente:'Incidente',observacion:'Observación',carga:'Carga',seguridad:'Seguridad',INCIDENTE:'Incidente',INCIDENT:'Incidente',DRAFT_READING:'Calado'},
    open:       isEN ? 'OPEN'      : 'ABIERTO',
    inProgress: isEN ? 'IN PROGRESS' : 'EN PROCESO',
    closed:     isEN ? 'CLOSED'    : 'CERRADO'
};

var wIcons = {0:'fa-sun',1:'fa-sun',2:'fa-cloud-sun',3:'fa-cloud',45:'fa-smog',51:'fa-cloud-drizzle',61:'fa-cloud-rain',80:'fa-cloud-showers-heavy',95:'fa-cloud-bolt'};
var wColors = {0:'#F59E0B',1:'#F59E0B',2:'#94A3B8',3:'#64748B',45:'#94A3B8',51:'#3B82F6',61:'#3B82F6',80:'#0EA5E9',95:'#DC2626'};
var catIcons = {navegacion:'fa-route',navegación:'fa-route',combustible:'fa-gas-pump',clima:'fa-cloud-sun',tripulacion:'fa-users',tripulación:'fa-users',mantenimiento:'fa-wrench',maniobra:'fa-anchor',incidente:'fa-triangle-exclamation',observacion:'fa-eye',observación:'fa-eye',carga:'fa-box',seguridad:'fa-shield-halved',INCIDENTE:'fa-triangle-exclamation',INCIDENT:'fa-triangle-exclamation',DRAFT_READING:'fa-ruler-vertical'};
var catColors = {navegacion:'#3B82F6',navegación:'#3B82F6',combustible:'#F97316',clima:'#0EA5E9',tripulacion:'#8B5CF6',tripulación:'#8B5CF6',mantenimiento:'#6B7280',maniobra:'#10B981',incidente:'#DC2626',observacion:'#F59E0B',observación:'#F59E0B',carga:'#0EA5E9',seguridad:'#EF4444',INCIDENTE:'#DC2626',INCIDENT:'#DC2626',DRAFT_READING:'#06B6D4'};

async function loadBriefing(){
    var today = new Date();
    var dateStr = today.toLocaleDateString(isEN ? 'en' : 'es', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
    document.getElementById('briefing-date').textContent = dateStr.toUpperCase();

    try{
        var [v, vj, fl, cr] = await Promise.all([
            sb.from('vessels').select('status'),
            sb.from('voyages').select('status'),
            sb.from('fuel_logs').select('liters').limit(30),
            sb.from('crew_members').select('status')
        ]);

        var total  = v.data  ? v.data.length  : 0;
        var active = v.data  ? v.data.filter(function(x){var s=(x.status||'').toLowerCase();return s.indexOf('viaje')>=0||s==='active';}).length : 0;
        var trips  = vj.data ? vj.data.filter(function(x){var s=(x.status||'').toLowerCase();return s==='navegando'||s==='en_curso';}).length : 0;
        var totalFuel = fl.data ? fl.data.reduce(function(s,x){return s+(x.liters||0);},0) : 0;
        var emb    = cr.data ? cr.data.filter(function(x){return(x.status||'').toLowerCase()==='embarcado'||x.status==='active';}).length : 0;
        var crewTotal = cr.data ? cr.data.length : 0;

        document.getElementById('brief-vessels').textContent = active+'/'+total;
        document.getElementById('brief-trips').textContent   = trips;
        document.getElementById('brief-fuel').textContent    = totalFuel > 0 ? totalFuel.toLocaleString()+'L' : '0L';
        document.getElementById('brief-crew').textContent    = emb+'/'+crewTotal;

        // ── WEATHER CARD ──────────────────────────────────────────────
        try{
            var w   = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=America/Asuncion');
            var wd  = await w.json();
            if(wd.current){
                var code  = wd.current.weather_code || 0;
                var desc  = bTxt.weatherCodes[code] || (isEN ? 'Variable' : 'Variado');
                var temp  = Math.round(wd.current.temperature_2m);
                var wind  = Math.round(wd.current.wind_speed_10m);
                var hum   = wd.current.relative_humidity_2m || '--';
                var wIcon = wIcons[code] || 'fa-cloud-sun';
                var wCol  = wColors[code] || '#94A3B8';
                var isCold= temp < 10;
                var isHot = temp > 28;
                var tempColor = isHot ? '#DC2626' : isCold ? '#3B82F6' : 'var(--text-primary)';

                document.getElementById('briefing-weather').innerHTML =
                    '<div style="display:flex;align-items:center;gap:20px;width:100%">'
                  + '<div style="width:64px;height:64px;border-radius:18px;background:'+wCol+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
                  +   '<i class="fa-solid '+wIcon+'" style="font-size:28px;color:'+wCol+'"></i>'
                  + '</div>'
                  + '<div style="flex:1">'
                  +   '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">'
                  +     '<span style="font-family:Newsreader,serif;font-size:36px;font-weight:400;color:'+tempColor+';line-height:1">'+temp+'°C</span>'
                  +     '<span style="font-size:14px;font-weight:600;color:var(--text-primary)">'+desc+'</span>'
                  +   '</div>'
                  +   '<div style="display:flex;gap:16px;margin-top:8px">'
                  +     '<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)">'
                  +       '<i class="fa-solid fa-wind" style="font-size:10px;color:var(--text-tertiary)"></i>'+bTxt.wind+' '+wind+' km/h'
                  +     '</span>'
                  +     '<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)">'
                  +       '<i class="fa-solid fa-droplet" style="font-size:10px;color:#3B82F6"></i>'+bTxt.humidity+' '+hum+'%'
                  +     '</span>'
                  +     '<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)">'
                  +       '<i class="fa-solid fa-location-dot" style="font-size:10px;color:var(--text-tertiary)"></i>'+bTxt.location
                  +     '</span>'
                  +   '</div>'
                  + '</div>'
                  + '</div>';
            }
        }catch(we){/* weather fallback */;}

        // ── ACTIVITY FEED ─────────────────────────────────────────────
        var [lg, inc] = await Promise.all([
            sb.from('logs').select('*').order('created_at',{ascending:false}).limit(6),
            sb.from('logs').select('*').eq('action_type', isEN ? 'INCIDENT' : 'INCIDENTE').order('created_at',{ascending:false}).limit(5)
        ]);

        var act = document.getElementById('briefing-activity');
        act.innerHTML = '';
        if(lg.data && lg.data.length > 0){
            var ah = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-top:4px">';
            lg.data.forEach(function(l){
                var cat   = (l.action_type || l.title || 'entrada').toLowerCase();
                var icon  = catIcons[l.action_type] || catIcons[cat] || 'fa-bookmark';
                var color = catColors[l.action_type] || catColors[cat] || '#94A3B8';
                var label = bTxt.catLabels[l.action_type] || bTxt.catLabels[cat] || (l.action_type || 'Log');
                var t     = l.created_at ? new Date(l.created_at).toLocaleString(isEN ? 'en' : 'es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
                ah += '<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:12px;padding:14px;border-left:3px solid '+color+';transition:box-shadow 0.15s" onmouseover="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.06)\'" onmouseout="this.style.boxShadow=\'none\'">';
                ah += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
                ah += '<div style="width:28px;height:28px;border-radius:8px;background:'+color+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:11px;color:'+color+'"></i></div>';
                ah += '<span style="font-size:10px;font-weight:700;letter-spacing:0.4px;color:'+color+';background:'+color+'12;padding:2px 8px;border-radius:5px;text-transform:uppercase">'+label+'</span>';
                ah += '<span style="font-size:10px;color:var(--text-tertiary);margin-left:auto">'+t+'</span>';
                ah += '</div>';
                if(l.vessel_name){ah += '<div style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:3px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+l.vessel_name+'</div>';}
                ah += '<div style="font-size:11px;color:var(--text-secondary);line-height:1.5">'+(l.description||l.details||'').substring(0,80)+(((l.description||'').length>80)?'…':'')+'</div>';
                ah += '</div>';
            });
            ah += '</div>';
            act.innerHTML = ah;
        }else{
            act.innerHTML = '<div style="text-align:center;padding:30px;border:1px dashed var(--separator);border-radius:12px;color:var(--text-secondary);font-size:13px"><i class="fa-regular fa-circle-check" style="font-size:20px;margin-bottom:8px;display:block;color:var(--text-tertiary)"></i>'+bTxt.noActivity+'</div>';
        }

        // ── ALERTS ────────────────────────────────────────────────────
        var sevColors2 = {Critico:'#DC2626',Critical:'#DC2626',Alto:'#F59E0B',High:'#F59E0B',Medio:'#3B82F6',Medium:'#3B82F6',Bajo:'#10B981',Low:'#10B981'};
        var alertsDiv = document.getElementById('briefing-alerts');
        if(inc.data && inc.data.length > 0){
            var alh = '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">';
            inc.data.forEach(function(i){
                var det  = typeof i.details === 'string' ? JSON.parse(i.details||'{}') : i.details||{};
                var sev  = det.severity || (isEN ? 'Medium' : 'Medio');
                var sevC = sevColors2[sev] || '#94A3B8';
                var isCrit = sev === 'Critico' || sev === 'Critical';
                alh += '<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:12px;padding:14px;border-left:3px solid '+sevC+'">';
                alh += '<div style="display:flex;align-items:center;gap:10px">';
                alh += '<div style="position:relative;width:28px;height:28px;flex-shrink:0">';
                alh += '<div style="width:28px;height:28px;border-radius:8px;background:'+sevC+'15;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-triangle-exclamation" style="font-size:11px;color:'+sevC+'"></i></div>';
                if(isCrit){alh += '<span style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;border-radius:50%;background:'+sevC+';animation:pulse 1.5s infinite"></span>';}
                alh += '</div>';
                alh += '<div style="flex:1">';
                alh += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">';
                alh += '<span style="font-size:10px;font-weight:700;color:'+sevC+';background:'+sevC+'12;padding:2px 8px;border-radius:5px;letter-spacing:0.4px">'+sev.toUpperCase()+'</span>';
                if(i.vessel_name){alh += '<span style="font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:3px"><i class="fa-solid fa-ship" style="font-size:8px"></i> '+i.vessel_name+'</span>';}
                alh += '</div>';
                alh += '<div style="font-size:12px;font-weight:600;color:var(--text-primary)">'+(i.title||'Incident')+'</div>';
                if(det.type){alh += '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px">'+det.type+(det.status?' · '+det.status:'')+'</div>';}
                alh += '</div></div></div>';
            });
            alh += '</div>';
            alertsDiv.innerHTML = alh;
        }else{
            alertsDiv.innerHTML = '<div style="text-align:center;padding:30px;border:1px dashed var(--separator);border-radius:12px;color:var(--text-secondary);font-size:13px"><i class="fa-solid fa-shield-halved" style="font-size:20px;margin-bottom:8px;display:block;color:#10B981"></i>'+bTxt.noAlerts+'</div>';
        }

    }catch(e){void(e);}
}
