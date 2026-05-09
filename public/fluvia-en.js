// Supabase Init
const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════
// GLOBAL ERROR BOUNDARY — Prevents UI crashes
// ═══════════════════════════════════════════
window.onerror = function(msg, src, line, col, err) {
    // Suppress Supabase auth noise
    if (typeof msg === 'string' && (msg.includes('refresh_token') || msg.includes('AuthApiException'))) return true;
    console.error('[FluviaFleet Error]', msg, '@ ' + src + ':' + line);
    return true; // Prevent default error handling
};
window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason ? (e.reason.message || String(e.reason)) : '';
    // Swallow Supabase auth + network errors silently
    if (msg.includes('refresh_token') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('AuthApiException')) {
        e.preventDefault();
        return;
    }
    console.warn('[FluviaFleet Unhandled]', msg);
    e.preventDefault();
});

// XSS escape helper — prevents stored XSS via innerHTML
function esc(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

// AUTH - Check session on load
(async function checkSession(){
    var session = await sb.auth.getSession();
    if(session.data.session){
        showApp(session.data.session.user);
    } else {
        document.getElementById('login-screen').style.display='flex';
        document.getElementById('app-shell').style.display='none';
    }
})();

let authMode = 'login';
function toggleRegister() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.querySelector('.login-title').innerHTML = authMode === 'login' ? 'Bienvenido<br><em>de vuelta.</em>' : 'Crear<br><em>cuenta nueva.</em>';
    document.getElementById('login-btn').textContent = authMode === 'login' ? 'Log In' : 'Registrarse';
    document.getElementById('toggle-register-btn').textContent = authMode === 'login' ? 'Create new account' : 'Ya tengo cuenta (Log In)';
    document.getElementById('login-error').style.display = 'none';
}

async function doLogin(){
    var email=document.getElementById('login-email').value.trim();
    var pass=document.getElementById('login-password').value;
    var errDiv=document.getElementById('login-error');
    var btn=document.getElementById('login-btn');
    errDiv.style.color='var(--error)';
    if(!email||!pass){errDiv.textContent='Completa todos los campos';errDiv.style.display='block';return;}
    btn.disabled=true;btn.textContent=authMode==='login'?'Ingresando...':'Registrando...';errDiv.style.display='none';
    try{
        if (authMode === 'login') {
            var r=await sb.auth.signInWithPassword({email:email,password:pass});
            if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';btn.disabled=false;btn.textContent='Log In';return;}
            showApp(r.data.user);
        } else {
            var r=await sb.auth.signUp({email:email,password:pass});
            if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';btn.disabled=false;btn.textContent='Registrarse';return;}
            errDiv.style.color = 'var(--success, #10b981)';
            errDiv.textContent = 'Registro exitoso. Inicia sesión para continuar.';
            errDiv.style.display='block';
            btn.disabled=false;btn.textContent='Registrarse';
            setTimeout(() => { errDiv.style.display='none'; toggleRegister(); }, 3000);
        }
    }catch(e){errDiv.style.color='var(--error)';errDiv.textContent='Error de conexion';errDiv.style.display='block';btn.disabled=false;btn.textContent=authMode==='login'?'Log In':'Registrarse';}
}

async function doResetPassword() {
    var email=document.getElementById('login-email').value.trim();
    var errDiv=document.getElementById('login-error');
    if(!email){
        errDiv.style.color = 'var(--error)';
        errDiv.textContent='Ingresa tu email arriba para recuperar la contraseña';
        errDiv.style.display='block';
        return;
    }
    try {
        var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/fluvia.html' });
        if(r.error){errDiv.style.color='var(--error)';errDiv.textContent=r.error.message;errDiv.style.display='block';return;}
        errDiv.style.color = 'var(--success, #10b981)';
        errDiv.textContent='Se ha enviado un enlace a tu correo.';
        errDiv.style.display='block';
    } catch(e) {
        errDiv.style.color='var(--error)';
        errDiv.textContent='Error al enviar correo.';
        errDiv.style.display='block';
    }
}

async function doLogout(){
    // Cleanup timers and realtime subscriptions
    if(window._dashSyncInterval) clearInterval(window._dashSyncInterval);
    if(window._aisInterval) clearInterval(window._aisInterval);
    if(window._notifChannel) { try { window._notifChannel.unsubscribe(); } catch(e){} }
    await sb.auth.signOut();
    document.getElementById('app-shell').style.display='none';
    document.getElementById('login-screen').style.display='flex';
    document.getElementById('login-password').value='';
    document.getElementById('login-error').style.display='none';
    document.getElementById('login-btn').disabled=false;
    document.getElementById('login-btn').textContent='Log In';
}

var currentCompanyId = null;
var currentUserRole = null;

function showApp(user){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app-shell').style.display='flex';
    var email=user.email||'';
    var parts=email.split('@')[0].split('.');
    var initials=parts.length>=2?(parts[0][0]+parts[1][0]).toUpperCase():email.substring(0,2).toUpperCase();
    document.getElementById('user-initials').textContent=initials;
    document.getElementById('user-display').textContent=email.split('@')[0];
    // Load profile for multi-tenancy
    sb.from('user_profiles').select('company_id, role, full_name').eq('user_id',user.id).single().then(function(r){
        console.log('PROFILE LOADED:', r.data, 'ERROR:', r.error);
        if(r.data){
            currentCompanyId=r.data.company_id;
            currentUserRole=r.data.role;
            console.log('ROLE:', currentUserRole, 'COMPANY:', currentCompanyId);
            if(r.data.full_name)document.getElementById('user-display').textContent=r.data.full_name;
            document.querySelector('.user-role').textContent=(r.data.role||'ADMIN').toUpperCase();
            if(currentCompanyId){sb.from('companies').select('name').eq('id',currentCompanyId).single().then(function(c){if(c.data)document.querySelector('.user-role').textContent=(r.data.role||'ADMIN').toUpperCase()+' - '+(c.data.name||'');});}
            checkAdminAccess();
        } else {
            console.log('NO PROFILE FOUND - creating one...');
            // Auto-create profile if missing
            sb.from('companies').select('id').eq('name','FluviaFleet Admin').single().then(function(c2){
                var cid = c2.data ? c2.data.id : null;
                sb.from('user_profiles').insert({user_id:user.id, company_id:cid, role:'viewer', full_name:'New User'}).then(function(ins){
                    console.log('Profile created:', ins);
                    currentCompanyId=cid;
                    currentUserRole='viewer';
                    checkAdminAccess();
                });
            });
        }
        loadDashboard();
    });
}

// Enter key on login
document.getElementById('login-password').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
document.getElementById('login-email').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('login-password').focus();});

// SPA Router
let map = null;
const loaders = {dashboard:loadDashboard,fleet:loadFleet,mapa:function(){if(!map)initMap();else setTimeout(function(){map.invalidateSize()},100)},admin:loadAdmin,viajes:loadViajes,bitacora:loadBitacora,tripulacion:loadCrew,combustible:loadFuel,mantenimiento:loadMaint,panol:loadPanol,comunicaciones:loadComms,hidrologia:loadHidrologia,reportes:loadReportes,copiloto:function(){},convoy:loadConvoy,tracking:loadTracking,planes:function(){},calado:loadCalado,incidentes:loadIncidents,briefing:loadBriefing};

document.querySelectorAll('.nav-item').forEach(function(item){
    item.addEventListener('click',function(e){
        e.preventDefault();
        var viewId=this.dataset.view;
        document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active')});
        this.classList.add('active');
        document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active')});
        var target=document.getElementById('view-'+viewId);
        if(target)target.classList.add('active');
        document.getElementById('topbar-title').textContent=this.textContent.trim();
        if(loaders[viewId])loaders[viewId]();
        // Scroll content to top on view change
        var contentArea=document.querySelector('.content');if(contentArea)contentArea.scrollTop=0;
    });
});
// Navigate programmatically
function navigate(viewId){
    var item=document.querySelector('.nav-item[data-view="'+viewId+'"]');
    if(item)item.click();
}
loadDashboard();

// ─── MOBILE HAMBURGER ────────────────────────────────
function toggleMobileSidebar(){
    var sb2=document.querySelector('.sidebar');
    var ov=document.getElementById('sidebar-overlay');
    sb2.classList.toggle('mobile-open');
    ov.classList.toggle('open');
}
// Close sidebar on mobile when nav-item clicked
document.querySelectorAll('.nav-item').forEach(function(item){
    item.addEventListener('click',function(){
        if(window.innerWidth<=768){
            document.querySelector('.sidebar').classList.remove('mobile-open');
            document.getElementById('sidebar-overlay').classList.remove('open');
        }
    });
});

// ─── NOTIFICATIONS ───────────────────────────────────
function toggleNotifPanel(){
    document.getElementById('notif-panel').classList.toggle('open');
}
var notifData=[];
async function loadNotifications(){
    try{
        var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(10);
        notifData=r.data||[];
        renderNotifs();
    }catch(e){console.log('Notif:',e);}
}
function renderNotifs(){
    var list=document.getElementById('notif-list');
    var badge=document.getElementById('notif-badge');
    if(!list)return;
    if(notifData.length===0){
        list.innerHTML='<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><p>No new notifications</p></div>';
        if(badge)badge.style.display='none';
        return;
    }
    if(badge){badge.textContent=notifData.length;badge.style.display='flex';}
    list.innerHTML=notifData.map(function(n,i){
        var t=n.created_at?new Date(n.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
        var cls=i<3?'notif-item unread':'notif-item';
        return '<div class="'+cls+'"><div class="notif-title">'+esc(n.title||n.action_type||'Actividad')+'</div><div class="notif-desc">'+esc(n.description||n.details||'')+'</div><div class="notif-time">'+t+'</div></div>';
    }).join('');
}
loadNotifications();
// Real-time subscription for new notifications
try{
    var notifFilter = currentCompanyId ? 'company_id=eq.'+currentCompanyId : undefined;
    var channelOpts = {event:'INSERT',schema:'public',table:'logs'};
    if(notifFilter) channelOpts.filter = notifFilter;
    window._notifChannel = sb.channel('notif-logs').on('postgres_changes',channelOpts,function(payload){
        notifData.unshift(payload.new);
        if(notifData.length>15)notifData.pop();
        renderNotifs();
    }).subscribe();
}catch(e){console.log('Realtime notif:',e);}

// LOADERS
var dashSyncTimer=0;
window._dashSyncInterval=setInterval(function(){dashSyncTimer++;var el=document.getElementById('dash-sync-time');if(el)el.textContent=dashSyncTimer;},1000);

async function loadDashboard(){
    try{
        // Week & date
        var now=new Date();
        var weekNum=Math.ceil((((now-new Date(now.getFullYear(),0,1))/86400000)+new Date(now.getFullYear(),0,1).getDay()+1)/7);
        var el=document.getElementById('dash-week');if(el)el.textContent='WEEK '+weekNum+' · '+now.getFullYear();

        // Fetch all vessels
        var r=await sb.from('vessels').select('*').limit(100);
        var vessels=r.data||[];
        var total=vessels.length;
        var active=0,docked=0,maint=0;
        vessels.forEach(function(v){var s=(v.status||'').toLowerCase();if(s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje')active++;else if(s.indexOf('manten')>=0)maint++;else docked++;});

        // KPI: Fleet Active
        var el1=document.getElementById('dash-kpi-viaje');if(el1)el1.textContent=active;
        var elT=document.getElementById('dash-kpi-total');if(elT)elT.textContent=total;
        var elSub=document.getElementById('dash-kpi-viaje-sub');if(elSub)elSub.innerHTML='<i class="fa-solid fa-arrow-up"></i> '+(Math.round((active/Math.max(total,1))*100))+'% disp. +'+docked+' vs. ayer';

        // KPI: Alertas
        var el3=document.getElementById('dash-kpi-alertas');if(el3)el3.textContent=maint>0?('0'+maint).slice(-2):'00';

        // KPI: Fuel - try to get real data
        try{
            var fuelR=await sb.from('fuel_records').select('liters').limit(50);
            var fuelData=fuelR.data||[];
            var totalFuel=0;fuelData.forEach(function(f){totalFuel+=(f.liters||0);});
            var fuelKL=(totalFuel/1000).toFixed(1);
            var elF=document.getElementById('dash-kpi-fuel');if(elF)elF.textContent=fuelKL;
            var elFS=document.getElementById('dash-kpi-fuel-sub');if(elFS)elFS.textContent='↑ '+(fuelData.length)+' registros · últimas 24h';
        }catch(e2){var elF=document.getElementById('dash-kpi-fuel');if(elF)elF.textContent='42.5';}

        // KPI: Calado - computed from active vessel data
        var elC=document.getElementById('dash-kpi-calado');if(elC)elC.textContent='--';
        var elCS=document.getElementById('dash-kpi-calado-sub');if(elCS)elCS.textContent='no recent reading';

        // KPI: Efficiency - computed from fleet utilization
        var elE=document.getElementById('dash-kpi-efficiency');if(elE)elE.textContent=total>0?Math.round((active/Math.max(total,1))*100):'--';

        // Sync timer reset
        dashSyncTimer=0;

        // Live Vessels Panel (right sidebar)
        var liveContainer=document.getElementById('dash-live-vessels');
        var fleetCount=document.getElementById('dash-fleet-count');
        if(fleetCount)fleetCount.textContent=total+' being monitored';
        if(liveContainer){
            liveContainer.innerHTML=vessels.slice(0,8).map(function(v,i){
                var s=(v.status||'').toLowerCase();
                var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje';
                var isMaint=s.indexOf('manten')>=0;
                var statusColor=isActive?'var(--success)':isMaint?'var(--warning)':'var(--accent)';
                var statusLabel=isActive?'IN TRANSIT':isMaint?'ATENCIÓN':'EN PUERTO';
                var speed=isActive?'—':'0';
                var loc=v.location||v.current_position||'ASU';
                var type=v.type||v.vessel_type||'REM';
                return '<div onclick="selectDashVessel('+i+')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;background:var(--bg-primary)" onmouseover="this.style.borderColor=\'var(--separator)\'" onmouseout="this.style.borderColor=\'transparent\'">'+
                    '<div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">'+(v.name||v.vessel_name||'Vessel')+'</div>'+
                    '<div style="font-size:10px;color:var(--text-secondary);margin-top:2px">'+type.substring(0,3).toUpperCase()+' · '+loc.substring(0,3).toUpperCase()+' · '+speed+' KN</div></div>'+
                    '<span style="font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;border-radius:4px;background:'+statusColor+'15;color:'+statusColor+'">'+statusLabel+'</span></div>';
            }).join('');
        }

        // Store vessels for detail selection
        window._dashVessels=vessels;

        // Auto-select first vessel
        if(vessels.length>0)selectDashVessel(0);

        // Load extras (weather, hydro, recent vessels, activity)
        loadDashWeather();
        loadDashHydro();
        loadDashRecentVessels(vessels);
        loadDashActivity();
    }catch(e){console.log('Dashboard:',e);}
}

function selectDashVessel(idx){
    var v=(window._dashVessels||[])[idx];if(!v)return;
    var detail=document.getElementById('dash-vessel-detail');if(detail)detail.style.display='block';
    var elN=document.getElementById('dash-sel-name');if(elN)elN.textContent=v.name||v.vessel_name||'--';
    var elI=document.getElementById('dash-sel-imo');if(elI)elI.textContent='IMO '+(v.imo||v.id||'--');
    var elR=document.getElementById('dash-sel-route');if(elR)elR.textContent=(v.location||'ASU')+' → '+(v.destination||'MPA');
    var s=(v.status||'').toLowerCase();
    var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje';
    var elC=document.getElementById('dash-sel-convoy');if(elC)elC.textContent=isActive?'4+1':'--';
    var elF=document.getElementById('dash-sel-fuel');if(elF)elF.textContent=isActive?'—':'—';
    var elE=document.getElementById('dash-sel-eta');if(elE)elE.textContent=isActive?'—':'En puerto';
}

async function loadDashWeather(){
    try{
        var resp=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.28&longitude=-57.63&current_weather=true&hourly=relativehumidity_2m');
        var d=await resp.json();
        if(d.current_weather){
            var w=d.current_weather;
            var el=document.getElementById('dash-temp');if(el)el.textContent=w.temperature;
            var el2=document.getElementById('dash-wind');if(el2)el2.textContent=w.windspeed;
            var el3=document.getElementById('dash-weather2');if(el3)el3.textContent=w.temperature+'°C · '+(w.windspeed<20?'Condiciones óptimas':'Viento fuerte');
        }
        if(d.hourly&&d.hourly.relativehumidity_2m){var h=d.hourly.relativehumidity_2m[new Date().getHours()];var el4=document.getElementById('dash-humidity');if(el4)el4.textContent=h;}
    }catch(e){console.log('Weather:',e);}
}

async function loadDashHydro(){
    try{
        var el=document.getElementById('dash-hidro-status');if(el)el.textContent='Normal level';
        var el2=document.getElementById('dash-h-asu');if(el2)el2.textContent='2.45m';
        var el3=document.getElementById('dash-h-pir');if(el3)el3.textContent='3.12m';
        var el4=document.getElementById('dash-h-ros');if(el4)el4.textContent='1.87m';
    }catch(e){console.log('Hydro:',e);}
}

function loadDashRecentVessels(vessels){
    var container=document.getElementById('dash-vessels');if(!container)return;
    container.innerHTML=vessels.slice(0,4).map(function(v){
        var s=(v.status||'').toLowerCase();
        var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje';
        var isMaint=s.indexOf('manten')>=0;
        var borderColor=isActive?'var(--success)':isMaint?'var(--warning)':'var(--accent)';
        return '<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:12px;padding:14px;border-left:3px solid '+borderColor+'">'+
            '<div style="font-size:13px;font-weight:600">'+(v.name||v.vessel_name||'')+'</div>'+
            '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">'+(v.type||v.vessel_type||'')+' · '+(v.location||v.current_position||'--')+'</div>'+
            '<div style="font-size:10px;margin-top:6px;color:'+borderColor+';font-weight:600">'+(v.status||'--').toUpperCase()+'</div></div>';
    }).join('');
}

async function loadDashActivity(){
    try{
        var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(5);
        var data=r.data||[];
        var container=document.getElementById('dash-activity');
        var empty=document.getElementById('dash-activity-empty');
        if(!container)return;
        if(data.length===0){if(empty)empty.style.display='';container.innerHTML='';return;}
        if(empty)empty.style.display='none';
        container.innerHTML=data.map(function(l){
            var t=l.created_at?new Date(l.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
            return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--separator)">'+
                '<div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-bolt" style="font-size:12px;color:var(--accent)"></i></div>'+
                '<div style="flex:1"><div style="font-size:12px;font-weight:500">'+(l.title||l.action_type||'Actividad')+'</div><div style="font-size:11px;color:var(--text-secondary)">'+(l.description||l.details||'')+'</div></div>'+
                '<div style="font-size:10px;color:var(--text-secondary);white-space:nowrap">'+t+'</div></div>';
        }).join('');
    }catch(e){console.log('Activity:',e);}
}

function exportDashboardPDF(){alert('Exportando reporte del dashboard...');}

async function loadFleet(){
    try{
        var r=await sb.from('vessels').select('*').limit(100);var data=r.data;if(!data)return;
        var tb=document.getElementById('fleet-tbody');tb.innerHTML='';
        data.forEach(function(v){
            var s=(v.status||'').toLowerCase();
            var c=s.indexOf('viaje')>=0||s==='active'?'var(--success)':s.indexOf('manten')>=0?'var(--warning)':'var(--accent)';
            var tr=document.createElement('tr');
            tr.innerHTML='<td>'+esc(v.name||v.vessel_name||'')+'</td><td>'+esc(v.type||v.vessel_type||'')+'</td><td><span class="status-dot" style="background:'+c+'"></span>'+esc(v.status||'')+'</td><td>'+esc(v.location||v.current_position||'')+'</td><td><button class="delete-btn" title="Delete"><i class="fa-regular fa-trash-can"></i></button></td>';
            tr.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('vessels',v.id,v.name||v.vessel_name||'Embarcacion',loadFleet);});
            tb.appendChild(tr);
        });
        document.getElementById('fleet-total').textContent=data.length;
    }catch(e){console.log('Fleet:',e);}
}

async function loadViajes(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('viajes-list');var em=document.getElementById('viajes-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(v){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+esc(v.vessel_name||'')+' &gt; '+esc(v.destination_port||'')+'</h4><p>'+esc(v.origin_port||'')+' - '+(v.cargo_tons||'')+' ton</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge">'+esc((v.status||'PENDIENTE').toUpperCase())+'</span><button class="delete-btn" style="background:none;border:none;color:var(--error);cursor:pointer;" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('voyages',v.id,(v.vessel_name||'Viaje'),loadViajes);});l.appendChild(d);});}else{em.style.display='';}
    }catch(e){console.log('Viajes:',e);}
}

async function loadBitacora(){
    try{
        var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(30);
        var data=r.data;var l=document.getElementById('bitacora-list');var em=document.getElementById('bitacora-empty');
        if(!l)return;
        l.innerHTML='';
        if(data&&data.length>0){
            if(em)em.style.display='none';
            data.forEach(function(row){
                var d=document.createElement('div');d.className='list-item';
                var t=row.created_at?new Date(row.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
                d.innerHTML='<div><h4>'+(row.title||row.action_type||'Entrada')+'</h4><p>'+(row.vessel_name||'')+' - '+(row.description||row.details||'')+' - '+t+'</p></div><button class="delete-btn" title="Delete"><i class="fa-regular fa-trash-can"></i></button>';
                if(row.id){
                    var btn=d.querySelector('.delete-btn');
                    if(btn)btn.addEventListener('click',function(){confirmDelete('logs',row.id,(row.title||'Entrada'),loadBitacora);});
                }
                l.appendChild(d);
            });
        }else{if(em)em.style.display='';}
    }catch(e){console.log('Bitacora:',e);}
}

async function loadCrew(){
    try{
        var r=await sb.from('crew_members').select('*').limit(200);var data=r.data;
        var l=document.getElementById('crew-list');var em=document.getElementById('crew-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(c){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(c.full_name||c.name||'')+'</h4><p>'+(c.role||'')+' - '+(c.vessel_name||'')+'</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:var(--success)">'+(c.status||'EMBARCADO').toUpperCase()+'</span><button class="delete-btn" style="background:none;border:none;color:var(--error);cursor:pointer;" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('crew_members',c.id,(c.full_name||c.name||'Tripulante'),loadCrew);});l.appendChild(d);});document.getElementById('crew-total').textContent=data.length;document.getElementById('crew-on').textContent=data.filter(function(c){return(c.status||'').toLowerCase()==='embarcado'}).length;}else{em.style.display='';}
    }catch(e){console.log('Crew:',e);}
}

async function loadFuel(){
    try{
        var r=await sb.from('fuel_logs').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('fuel-list');var em=document.getElementById('fuel-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(f){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(f.vessel_name||'')+' -- '+(f.liters||f.quantity||0)+'L</h4><p>'+(f.fuel_type||'Gasoil')+' - '+(f.created_at?new Date(f.created_at).toLocaleDateString('es'):'')+'</p></div><button class="delete-btn" style="background:none;border:none;color:var(--error);cursor:pointer;" title="Delete"><i class="fa-regular fa-trash-can"></i></button>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('fuel_logs',f.id,(f.vessel_name||'Registro'),loadFuel);});l.appendChild(d);});document.getElementById('fuel-count').textContent=data.length;}else{em.style.display='';}
    }catch(e){console.log('Fuel:',e);}
}

async function loadMaint(){
    try{
        var r=await sb.from('maintenance_tasks').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('maint-list');l.innerHTML='';
        if(data&&data.length>0){data.forEach(function(m){var d=document.createElement('div');d.className='list-item';var pc=m.priority==='Alta'||m.priority==='high'?'var(--error)':m.priority==='Media'?'var(--warning)':'var(--text-secondary)';d.innerHTML='<div><h4>'+(m.description||m.title||'')+'</h4><p>'+String.fromCodePoint(0x1F6A2)+' '+(m.vessel_name||'')+'</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:'+pc+'">'+(m.status||m.priority||'').toUpperCase()+'</span><button class="delete-btn" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('maintenance_tasks',m.id,(m.description||m.title||'Orden'),loadMaint);});l.appendChild(d);});document.getElementById('maint-pending').textContent=data.filter(function(m){return(m.status||'').toLowerCase()!=='completed'}).length;}
    }catch(e){console.log('Maint:',e);}
}

async function loadPanol(){
    try{
        var r=await sb.from('inventory_items').select('*').limit(500);var data=r.data;
        var l=document.getElementById('panol-list');l.innerHTML='';
        if(data&&data.length>0){data.forEach(function(i){var d=document.createElement('div');d.className='list-item';var q=i.quantity||i.stock||0;var mn=i.min_stock||0;var low=q<=mn;d.innerHTML='<div><h4>'+(i.name||'')+'</h4><p>'+(i.category||'')+' - Repuesto</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:'+(low?'var(--warning)':'var(--success)')+'">'+(low?'STOCK BAJO':'OK')+'<br>'+q+' uds</span><button class="delete-btn" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('inventory_items',i.id,(i.name||'Item'),loadPanol);});l.appendChild(d);});document.getElementById('panol-total').textContent=data.length;}
    }catch(e){console.log('Panol:',e);}
}

async function loadComms(){
    try{
        var r=await sb.from('comms').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var area=document.querySelector('#view-comunicaciones .comm-msg-area');
        if(data&&data.length>0){area.innerHTML=data.map(function(m){return '<p style="margin:6px 0;font-size:13px;"><strong>'+(m.sender||'Sistema')+':</strong> '+(m.message||m.content||'')+' <span style="color:var(--text-secondary);font-size:10px;">'+(m.created_at?new Date(m.created_at).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'')+'</span></p>'}).join('');}
    }catch(e){console.log('Comms:',e);}
}

// MAP
var aisMarkers = {};
function initMap(){
    map=L.map('leaflet-map',{zoomControl:false}).setView([-27.5,-58.3],6);
    L.control.zoom({position:'topleft'}).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OpenStreetMap',maxZoom:18}).addTo(map);
    // Own fleet from Supabase
    loadFleetMarkers();
    // AIS third-party traffic
    loadAISTraffic();
    // Auto-refresh AIS every 30s (stored for cleanup)
    window._aisInterval = setInterval(loadAISTraffic, 30000);
    // Hidrovia route — polyline completa Paraguay-Paraná
    var hidroviaRoute=[[-19.0,-57.65],[-20.5,-57.8],[-22.3,-57.9],[-23.4,-57.8],[-25.3,-57.6],[-26.5,-58.1],[-27.3,-58.5],[-29.0,-59.5],[-30.5,-59.9],[-31.5,-60.5],[-32.9,-60.6],[-33.5,-58.5],[-34.6,-58.4]];
    L.polyline(hidroviaRoute,{color:'#3B82F6',weight:2.5,dashArray:'8,6',opacity:0.45}).addTo(map);
    // Zoom fit to hidrovía bounds
    map.fitBounds([[-19.0,-60.5],[-34.6,-56.5]],{padding:[30,30],maxZoom:7});
}
function loadFleetMarkers(){
    sb.from('vessels').select('*').then(function(r){
        var data=r.data;if(!data)return;
        data.forEach(function(v){var lat=v.latitude||v.lat;var lng=v.longitude||v.lng;if(!lat||!lng)return;var s=(v.status||'').toLowerCase();var c=s.indexOf('viaje')>=0||s==='active'?'#2EA043':s.indexOf('manten')>=0?'#F59E0B':'#3B82F6';L.circleMarker([lat,lng],{radius:8,fillColor:c,color:'#fff',weight:2,fillOpacity:1}).addTo(map).bindPopup('<strong>'+(v.name||'')+'</strong><br>'+(v.status||'')+'<br><small>Own fleet</small>');});
    });
}
async function loadAISTraffic(){
    try{
        // Primary: fetch from public API (server memory - no auth needed)
        var api=await fetch('/api/ais-positions');
        var json=await api.json();
        if(json.vessels&&json.vessels.length>0){
            json.vessels.forEach(function(v){
                var key=v.mmsi;
                if(!v.lat||!v.lon)return;
                if(aisMarkers[key]){
                    aisMarkers[key].setLatLng([v.lat,v.lon]);
                }else{
                    var m=L.circleMarker([v.lat,v.lon],{radius:5,fillColor:'#94A3B8',color:'#fff',weight:1.5,fillOpacity:0.8}).addTo(map);
                    m.bindPopup('<strong>'+(v.name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'°<br><small>AIS Satelital</small>');
                    aisMarkers[key]=m;
                }
            });
            // Update legend
            var legend=document.querySelector('.map-legend');
            if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=json.total+' activos';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=json.total+' activos AIS';legend.appendChild(d);}}
            return;
        }
    }catch(e){console.log('AIS API:',e);}
    // Fallback: Supabase
    try{
        var r=await sb.from('ais_traffic').select('*').limit(200);
        if(r.data&&r.data.length>0)renderAISMarkers(r.data);
    }catch(e){}
}
function renderAISMarkers(data){
    data.forEach(function(v){
        var key=v.mmsi;
        var lat=v.latitude||v.lat;var lng=v.longitude||v.lon||v.lng;
        if(!lat||!lng)return;
        if(aisMarkers[key]){
            aisMarkers[key].setLatLng([lat,lng]);
            aisMarkers[key].setPopupContent('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Trafico terceros</small>');
        }else{
            var m=L.circleMarker([lat,lng],{radius:5,fillColor:'#94A3B8',color:'#fff',weight:1.5,fillOpacity:0.8}).addTo(map);
            m.bindPopup('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Trafico terceros</small>');
            aisMarkers[key]=m;
        }
    });
    var legend=document.querySelector('.map-legend');
    if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=data.length+' activos';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=data.length+' activos AIS';legend.appendChild(d);}}
}

// MODAL
var modalForms={
    fleet:{title:'Add Active',fields:[{id:'fleet-name',label:'NOMBRE',type:'text',placeholder:'Ej: R/M ATLAS'},{id:'fleet-type',label:'TYPE',type:'select',options:['Barge','Tugboat','Ponton']},{id:'fleet-status',label:'STATUS',type:'select',options:['In Transit','In Port','Maintenance']},{id:'fleet-location',label:'LOCATION',type:'text',placeholder:'Ej: Km 1420'}]},
    viaje:{title:'New Solicitud de Viaje',fields:[{id:'viaje-vessel',label:'VESSEL',type:'text',placeholder:'Nombre'},{id:'viaje-origin',label:'ORIGEN',type:'text',placeholder:'Puerto origen'},{id:'viaje-dest',label:'DESTINO',type:'text',placeholder:'Puerto destino'},{id:'viaje-cargo',label:'CARGA (TON)',type:'text',placeholder:'3500'},{id:'viaje-date',label:'FECHA SALIDA',type:'date'}]},
    bitacora:{title:'New Entrada de Bitacora',fields:[{id:'bit-title',label:'TITULO',type:'text',placeholder:'Resumen'},{id:'bit-vessel',label:'VESSEL',type:'text',placeholder:'Embarcacion'},{id:'bit-type',label:'TYPE',type:'select',options:['Observacion','Incidente','Maniobra','Navegacion']},{id:'bit-desc',label:'DESCRIPCION',type:'textarea',placeholder:'Detalle...'}]},
    crew:{title:'Add Tripulante',fields:[{id:'crew-name',label:'NOMBRE',type:'text',placeholder:'Juan Perez'},{id:'crew-role',label:'ROL',type:'select',options:['Capitan','Timonel','Maquinista','Marinero','Cocinero']},{id:'crew-vessel',label:'VESSEL',type:'text',placeholder:'Asignar a...'},{id:'crew-doc',label:'DOCUMENTO',type:'text',placeholder:'Nro documento'}]},
    fuel:{title:'Registrar Fuel',fields:[{id:'fuel-vessel',label:'VESSEL',type:'text',placeholder:'Nombre'},{id:'fuel-liters',label:'LITROS',type:'text',placeholder:'5000'},{id:'fuel-type',label:'TYPE',type:'select',options:['Gasoil','IFO 380','MGO']},{id:'fuel-date',label:'FECHA',type:'date'}]},
    maint:{title:'New Orden de Maintenance',fields:[{id:'maint-title',label:'DESCRIPCION',type:'text',placeholder:'Que reparar'},{id:'maint-vessel',label:'VESSEL',type:'text',placeholder:'Embarcacion'},{id:'maint-priority',label:'PRIORIDAD',type:'select',options:['Alta','Media','Baja']},{id:'maint-notes',label:'NOTAS',type:'textarea',placeholder:'Detalles...'}]},
    panol:{title:'Add Item',fields:[{id:'panol-name',label:'REPUESTO',type:'text',placeholder:'Filtro de aceite'},{id:'panol-cat',label:'CATEGORIA',type:'select',options:['Motor','Electrico','Hidraulico','Casco','General']},{id:'panol-qty',label:'CANTIDAD',type:'text',placeholder:'10'},{id:'panol-min',label:'STOCK MINIMO',type:'text',placeholder:'2'}]},
    calado:{title:'Record Reading de Calado',fields:[{id:'calado-vessel',label:'VESSEL',type:'text',placeholder:'Nombre de la embarcacion'},{id:'calado-value',label:'CALADO (METROS)',type:'text',placeholder:'2.45'},{id:'calado-max',label:'CALADO MAXIMO (M)',type:'text',placeholder:'3.50'},{id:'calado-notes',label:'OBSERVACIONES',type:'textarea',placeholder:'Condiciones, ubicacion...'}]},
    incidente:{title:'Report Incident',fields:[{id:'inc-title',label:'TITULO',type:'text',placeholder:'Descripcion breve del incidente'},{id:'inc-vessel',label:'VESSEL',type:'text',placeholder:'Embarcacion afectada'},{id:'inc-severity',label:'SEVERIDAD',type:'select',options:['Critico','Alto','Medio','Bajo']},{id:'inc-type',label:'TYPE',type:'select',options:['Colision','Encalladura','Derrame','Averia mecanica','Incendio','Medico','Otro']},{id:'inc-desc',label:'DESCRIPCION DETALLADA',type:'textarea',placeholder:'Que ocurrio, donde, cuando, medidas tomadas...'}]}
};
var currentModal=null;
// esc() defined at top of file (line 7)
function openModal(type){
    currentModal=type;var c=modalForms[type];document.getElementById('modal-title').textContent=c.title;
    var submitBtn=document.getElementById('modal-submit');submitBtn.onclick=null;submitBtn.textContent='Save';submitBtn.style.display='';submitBtn.disabled=false;
    var h='';c.fields.forEach(function(f){h+='<label>'+esc(f.label)+'</label>';if(f.type==='select'){h+='<select id="'+f.id+'">'+f.options.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select>';}else if(f.type==='textarea'){h+='<textarea id="'+f.id+'" placeholder="'+esc(f.placeholder||'')+'"></textarea>';}else{h+='<input type="'+f.type+'" id="'+f.id+'" placeholder="'+esc(f.placeholder||'')+'">';}});
    document.getElementById('modal-body').innerHTML=h;document.getElementById('modal-overlay').classList.add('open');
    setTimeout(function(){var f=document.querySelector('#modal-body input, #modal-body select');if(f)f.focus();},100);
}
function closeModal(e){if(e&&e.target!==document.getElementById('modal-overlay'))return;document.getElementById('modal-overlay').classList.remove('open');}

// SAVE TO SUPABASE
document.getElementById('modal-submit').addEventListener('click',async function(){
    var t=currentModal;if(!t)return;var c=modalForms[t];var d={};c.fields.forEach(function(f){d[f.id]=document.getElementById(f.id).value;});
    try{
        var cid=currentCompanyId;
        if(t==='fleet'&&d['fleet-name']){await sb.from('vessels').insert({name:d['fleet-name'],type:d['fleet-type'],status:d['fleet-status'],location:d['fleet-location'],company_id:cid});loadFleet();}
        else if(t==='viaje'&&d['viaje-vessel']){await sb.from('voyages').insert({vessel_name:d['viaje-vessel'],origin_port:d['viaje-origin'],destination_port:d['viaje-dest'],cargo_tons:parseInt(d['viaje-cargo'])||0,departure_date:d['viaje-date']||null,status:'pendiente',company_id:cid});loadViajes();}
        else if(t==='bitacora'&&d['bit-title']){await sb.from('logs').insert({title:d['bit-title'],vessel_name:d['bit-vessel'],action_type:d['bit-type'].toLowerCase(),description:d['bit-desc'],company_id:cid});loadBitacora();}
        else if(t==='crew'&&d['crew-name']){await sb.from('crew_members').insert({full_name:d['crew-name'],role:d['crew-role'],vessel_name:d['crew-vessel'],document_number:d['crew-doc'],status:'embarcado',company_id:cid});loadCrew();}
        else if(t==='fuel'&&d['fuel-vessel']){await sb.from('fuel_logs').insert({vessel_name:d['fuel-vessel'],liters:parseInt(d['fuel-liters'])||0,fuel_type:d['fuel-type'],company_id:cid});loadFuel();}
        else if(t==='maint'&&d['maint-title']){await sb.from('maintenance_tasks').insert({description:d['maint-title'],vessel_name:d['maint-vessel'],priority:d['maint-priority'],status:'pendiente',notes:d['maint-notes'],company_id:cid});loadMaint();}
        else if(t==='panol'&&d['panol-name']){await sb.from('inventory_items').insert({name:d['panol-name'],category:d['panol-cat'],quantity:parseInt(d['panol-qty'])||0,min_stock:parseInt(d['panol-min'])||0,company_id:cid});loadPanol();}
        else if(t==='calado'&&d['calado-vessel']){await sb.from('logs').insert({title:'Lectura de calado: '+d['calado-vessel'],vessel_name:d['calado-vessel'],action_type:'DRAFT_READING',description:d['calado-notes']||'Calado: '+d['calado-value']+'m / Max: '+d['calado-max']+'m',details:JSON.stringify({draft:parseFloat(d['calado-value'])||0,max_draft:parseFloat(d['calado-max'])||3.5}),company_id:cid});loadCalado();}
        else if(t==='incidente'&&d['inc-title']){await sb.from('logs').insert({title:d['inc-title'],vessel_name:d['inc-vessel'],action_type:'INCIDENTE',description:d['inc-desc'],details:JSON.stringify({severity:d['inc-severity'],type:d['inc-type'],status:'Abierto'}),company_id:cid});loadIncidents();}
    }catch(e){console.error('Save:',e);}
    document.getElementById('modal-overlay').classList.remove('open');
});

// Comms send
var commBtn=document.getElementById('comm-send-btn');
if(commBtn){commBtn.addEventListener('click',async function(){var i=document.querySelector('#view-comunicaciones .comm-input');var m=i.value.trim();if(!m)return;try{await sb.from('comms').insert({message:m,sender:'Web',channel:'CH-16'});i.value='';loadComms();}catch(e){console.error('Comms:',e);}});}

// PRICING
var currentPeriod='monthly';
function togglePeriod(period){
    currentPeriod=period;
    document.getElementById('plan-monthly').classList.toggle('active',period==='monthly');
    document.getElementById('plan-yearly').classList.toggle('active',period==='yearly');
    document.querySelectorAll('.plan-amount').forEach(function(el){
        var val=parseInt(el.dataset[period]);
        el.textContent='$'+val.toLocaleString('en-US');
    });
}
var planNames={barcaza:'Per Barge',combo:'Combo Flota',enterprise:'Enterprise',ilimitado:'Unlimited'};
var planPrices={barcaza:{monthly:149,yearly:119},combo:{monthly:899,yearly:719},enterprise:{monthly:1499,yearly:1199},ilimitado:{monthly:2499,yearly:1999}};
function selectPlan(plan){
    var price=planPrices[plan][currentPeriod];
    var name=planNames[plan];
    document.getElementById('modal-title').textContent='Checkout - '+name;
    document.getElementById('modal-body').innerHTML='<div style="background:var(--surface-low);border-radius:12px;padding:20px;margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:600">'+esc(name)+'</span><span style="font-family:Newsreader,serif;font-size:28px;font-weight:400">$'+price.toLocaleString('en-US')+'</span></div><p style="font-size:11px;color:var(--text-secondary);margin-top:4px">Facturacion '+(currentPeriod==='monthly'?'mensual':'anual')+' - 14 dias gratis</p></div><div style="text-align:center;padding:20px 0"><i class="fa-solid fa-lock" style="font-size:32px;color:var(--accent);margin-bottom:12px"></i><p style="font-size:14px;color:var(--text-primary);font-weight:600">Pago seguro via pasarela externa</p><p style="font-size:12px;color:var(--text-secondary);margin-top:8px">Al confirmar seras redirigido a la pasarela de pago segura para completar la transaccion.</p></div>';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Contratar '+esc(name);
    document.getElementById('modal-submit').onclick=function(){processPayment(plan,price)};
}
async function processPayment(plan,price){
    document.getElementById('modal-submit').disabled=true;
    document.getElementById('modal-submit').textContent='Redirigiendo...';
    setTimeout(function(){
        document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:40px 0"><i class="fa-solid fa-envelope" style="font-size:48px;color:var(--accent)"></i><h3 style="font-family:Newsreader,serif;font-size:24px;margin-top:16px">Solicitud Enviada</h3><p style="color:var(--text-secondary);margin-top:8px">Nuestro equipo se pondra en contacto para activar tu plan <strong>'+esc(planNames[plan])+'</strong>.</p><p style="color:var(--text-secondary);font-size:12px;margin-top:4px">Recibirás un email con instrucciones de pago.</p></div>';
        document.getElementById('modal-submit').style.display='none';
        document.querySelector('.modal-actions .btn-secondary').textContent='Cerrar';
    },1500);
}

// ADMIN PANEL
function checkAdminAccess(){
    if(currentUserRole==='superadmin'){
        var na=document.getElementById('nav-admin');if(na)na.style.display='flex';
    }
}
async function loadAdmin(){
    if(currentUserRole!=='superadmin')return;
    // Stats
    var vessels=await sb.from('vessels').select('id',{count:'exact',head:true});
    var companies=await sb.from('companies').select('id',{count:'exact',head:true});
    var users=await sb.from('user_profiles').select('id',{count:'exact',head:true});
    var ais=await sb.from('ais_traffic').select('mmsi',{count:'exact',head:true});
    document.getElementById('admin-stats').innerHTML=
        '<div class="admin-stat"><div class="stat-value">'+(companies.count||0)+'</div><div class="stat-label">EMPRESAS</div></div>'+
        '<div class="admin-stat"><div class="stat-value">'+(users.count||0)+'</div><div class="stat-label">USUARIOS</div></div>'+
        '<div class="admin-stat"><div class="stat-value">'+(vessels.count||0)+'</div><div class="stat-label">VESSELES</div></div>'+
        '<div class="admin-stat"><div class="stat-value">'+(ais.count||0)+'</div><div class="stat-label">AIS ACTIVOS</div></div>';
    // Companies list
    var cr=await sb.from('companies').select('*').order('created_at',{ascending:false}).limit(100);
    var html='';
    if(cr.data)cr.data.forEach(function(c){
        html+='<div class="info-card"><i class="fa-solid fa-building" style="color:var(--text-primary)"></i><div class="info-card-text"><h4>'+esc(c.name)+'</h4><p>Plan: '+esc(c.plan||'basico')+' | Max: '+(c.max_vessels||1)+' barcos | '+(c.active!==false?'Activa':'Inactiva')+'</p></div></div>';
    });
    document.getElementById('admin-companies').innerHTML=html||'<div class="empty-state"><p>Sin empresas</p></div>';
    // Users list
    var ur=await sb.from('user_profiles').select('*').order('created_at',{ascending:false}).limit(200);
    var uhtml='';
    if(ur.data)ur.data.forEach(function(u){
        uhtml+='<div class="info-card"><i class="fa-solid fa-user" style="color:var(--text-primary)"></i><div class="info-card-text"><h4>'+esc(u.full_name||'Sin nombre')+'</h4><p>Rol: '+esc(u.role||'admin')+' | Company: '+(u.company_id?u.company_id.substring(0,8)+'...':'Sin asignar')+'</p></div></div>';
    });
    document.getElementById('admin-users').innerHTML=uhtml||'<div class="empty-state"><p>Sin usuarios</p></div>';
}
function openNewCompanyModal(){
    document.getElementById('modal-title').textContent='New Company';
    document.getElementById('modal-body').innerHTML='<label>NOMBRE DE EMPRESA</label><input type="text" id="new-company-name" placeholder="Ej: Naviera Guarani"><label>PLAN</label><select id="new-company-plan" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Inter,sans-serif;font-size:14px"><option value="barcaza">Per Barge ($149/mes)</option><option value="combo" selected>Combo Flota ($899/mes)</option><option value="enterprise">Enterprise ($1,499/mes)</option><option value="ilimitado">Unlimited ($2,499/mes)</option></select><label>MAX VESSELES</label><input type="number" id="new-company-max" placeholder="10" value="10">';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Crear Empresa';
    document.getElementById('modal-submit').style.display='';
    document.getElementById('modal-submit').disabled=false;
    document.getElementById('modal-submit').onclick=async function(){
        var name=document.getElementById('new-company-name').value.trim();
        if(!name)return;
        var plan=document.getElementById('new-company-plan').value;
        var max=parseInt(document.getElementById('new-company-max').value)||10;
        await sb.from('companies').insert({name:name,plan:plan,max_vessels:max});
        document.getElementById('modal-overlay').classList.remove('open');
        loadAdmin();
    };
}

// CREATE USER FROM ADMIN
function openNewUserModal(){
    sb.from('companies').select('id,name').then(function(r){
        var opts=r.data?r.data.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join(''):'';
        document.getElementById('modal-title').textContent='Add User al Sistema';
        document.getElementById('modal-body').innerHTML='<label>EMAIL</label><input type="email" id="new-user-email" placeholder="user@company.com"><label>PASSWORD</label><input type="password" id="new-user-pass" placeholder="Minimo 6 caracteres"><label>NOMBRE COMPLETO</label><input type="text" id="new-user-name" placeholder="Juan Perez"><label>EMPRESA</label><select id="new-user-company" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Inter,sans-serif;font-size:14px">'+opts+'</select><label>ROL</label><select id="new-user-role" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Inter,sans-serif;font-size:14px"><option value="admin">Admin</option><option value="operator">Operador</option><option value="viewer">Visor</option></select>';
        document.getElementById('modal-overlay').classList.add('open');
        document.getElementById('modal-submit').textContent='Crear User';
        document.getElementById('modal-submit').style.display='';
        document.getElementById('modal-submit').disabled=false;
        document.getElementById('modal-submit').onclick=async function(){
            var email=document.getElementById('new-user-email').value.trim();
            var pass=document.getElementById('new-user-pass').value;
            var name=document.getElementById('new-user-name').value.trim();
            var cid=document.getElementById('new-user-company').value;
            var role=document.getElementById('new-user-role').value;
            if(!email||!pass||pass.length<6)return;
            var r=await sb.auth.signUp({email:email,password:pass});
            if(r.data&&r.data.user){
                await sb.from('user_profiles').insert({user_id:r.data.user.id,company_id:cid,role:role,full_name:name||email.split('@')[0]});
            }
            document.getElementById('modal-overlay').classList.remove('open');
            loadAdmin();
        };
    });
}

// COPILOTO IA (GEMINI)
async function sendCopiloto(){
    var input=document.getElementById('copiloto-input');
    var chat=document.getElementById('copiloto-chat');
    var msg=input.value.trim();if(!msg)return;
    chat.innerHTML+='<div style="margin:12px 0;text-align:right"><span style="background:var(--text-primary);color:white;padding:8px 14px;border-radius:12px 12px 4px 12px;font-size:13px;display:inline-block;max-width:70%">'+esc(msg)+'</span></div>';
    input.value='';input.disabled=true;
    document.getElementById('copiloto-send').disabled=true;
    chat.innerHTML+='<div style="margin:12px 0" id="ai-typing"><span style="background:var(--surface-low);padding:8px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Analizando datos...</span></div>';
    chat.scrollTop=chat.scrollHeight;
    // Gather context from Supabase
    try{
        var ctx='';
        var v=await sb.from('vessels').select('name,status,type,location');if(v.data)ctx+='Flota: '+JSON.stringify(v.data)+'\n';
        var vj=await sb.from('voyages').select('vessel_name,origin_port,destination_port,status,cargo_tons').limit(10);if(vj.data)ctx+='Viajes: '+JSON.stringify(vj.data)+'\n';
        var fl=await sb.from('fuel_logs').select('vessel_name,liters,fuel_type').limit(5);if(fl.data)ctx+='Fuel: '+JSON.stringify(fl.data)+'\n';
        var mt=await sb.from('maintenance_tasks').select('description,vessel_name,priority,status').limit(5);if(mt.data)ctx+='Maintenance: '+JSON.stringify(mt.data)+'\n';
        var res=await fetch('/api/n8n/ai-analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Eres el AI Copilot de FluviaFleet, asistente maritimo-fluvial experto en la Paraguay-Parana Waterway. Responde en español, breve y profesional. Contexto de la empresa:\n'+ctx+'\nPregunta del capitan: '+msg})});
        var data=await res.json();
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        var answer=data.analysis||data.message||'No pude procesar la consulta.';
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;max-width:80%;line-height:1.5"><i class="fa-solid fa-robot" style="color:var(--accent);margin-right:6px"></i>'+esc(answer).replace(/\n/g,'<br>')+'</span></div>';
    }catch(e){
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;color:var(--error)"><i class="fa-solid fa-exclamation-triangle" style="margin-right:6px"></i>Error al conectar con el servidor IA.</span></div>';
    }
    input.disabled=false;document.getElementById('copiloto-send').disabled=false;
    chat.scrollTop=chat.scrollHeight;input.focus();
}

// DASHBOARD DINAMICO
async function loadDashboardExtras(){
    // Greeting by time of day
    var h=new Date().getHours();
    var greet=h<12?'Buenos dias,':h<18?'Buenas tardes,':'Buenas noches,';
    var sess=await sb.auth.getSession();var userName=(sess.data.session&&sess.data.session.user.email)?sess.data.session.user.email.split('@')[0]:'Capitan';
    userName=userName.charAt(0).toUpperCase()+userName.slice(1);
    var el=document.getElementById('dash-greeting');
    if(el)el.innerHTML=greet+'<br><em>'+esc(userName)+'.</em>';
    // Week & date
    var now=new Date();var oneJan=new Date(now.getFullYear(),0,1);var weekNum=Math.ceil((((now-oneJan)/86400000)+oneJan.getDay()+1)/7);
    var de=document.getElementById('dash-week');if(de)de.textContent='WEEK '+weekNum+' · '+now.getFullYear();
    var dd=document.getElementById('dash-date');if(dd)dd.textContent=now.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});
    // Sync indicator
    var sy=document.getElementById('dash-sync');if(sy)sy.textContent='FLOTA SINCRONIZADA · '+now.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
    // Weather
    try{
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=America/Asuncion');
        var wd=await w.json();
        if(wd.current){
            var codes={0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',61:'Lluvia',80:'Chaparron',95:'Tormenta'};
            var desc=codes[wd.current.weather_code]||'Variado';
            var t2=document.getElementById('dash-weather2');if(t2)t2.textContent=desc;
            var tt=document.getElementById('dash-temp');if(tt)tt.textContent=Math.round(wd.current.temperature_2m);
            var tw=document.getElementById('dash-wind');if(tw)tw.textContent=Math.round(wd.current.wind_speed_10m);
            var th=document.getElementById('dash-humidity');if(th)th.textContent=wd.current.relative_humidity_2m||'--';
        }
    }catch(e){}
    // Hydro levels (3 stations)
    try{
        var stations=[{id:'dash-h-asu',lat:-25.3,lon:-57.7},{id:'dash-h-pir',lat:-26.85,lon:-58.35},{id:'dash-h-ros',lat:-32.95,lon:-60.65}];
        for(var i=0;i<stations.length;i++){
            try{
                var sr=await fetch('https://flood-api.open-meteo.com/v1/flood?latitude='+stations[i].lat+'&longitude='+stations[i].lon+'&daily=river_discharge&past_days=1&forecast_days=0');
                var sd=await sr.json();
                var val=sd.daily&&sd.daily.river_discharge?sd.daily.river_discharge[0]:0;
                var el2=document.getElementById(stations[i].id);
                if(el2)el2.textContent=val?Math.round(val).toLocaleString()+' m³/s':'--';
                if(i===0){
                    var kh=document.getElementById('dash-kpi-hidro');if(kh)kh.textContent=val?Math.round(val).toLocaleString():'--';
                    var hs=document.getElementById('dash-hidro-status');if(hs)hs.textContent='Navegable — caudal '+( val>2000?'normal':'bajo');
                }
            }catch(e){}
        }
    }catch(e){}
    // Fuel KPI
    try{
        var f=await sb.from('fuel_logs').select('liters').limit(200);
        if(f.data&&f.data.length>0){
            var total=f.data.reduce(function(s,x){return s+(x.liters||0)},0);
            var kf=document.getElementById('dash-kpi-fuel');if(kf)kf.textContent=(total/1000).toFixed(1);
            var kfs=document.getElementById('dash-kpi-fuel-sub');if(kfs)kfs.textContent=f.data.length+' cargas registradas';
        }
    }catch(e){}
    // Crew KPI
    try{
        var cr=await sb.from('crew_members').select('status',{count:'exact'});
        var kc=document.getElementById('dash-kpi-crew');if(kc)kc.textContent=cr.count||0;
        var kcs=document.getElementById('dash-kpi-crew-sub');if(kcs)kcs.textContent='tripulantes activos';
    }catch(e){}
    // Vessels + KPIs
    try{
        var v=await sb.from('vessels').select('id,name,type,status,location').order('name').limit(6);
        if(v.data){
            var nav=v.data.filter(function(x){return(x.status||'').toLowerCase()==='navegando'||x.status==='en_viaje'}).length;
            var port=v.data.filter(function(x){return(x.status||'').toLowerCase()==='en_puerto'}).length;
            document.getElementById('dash-kpi-viaje').textContent=nav;
            document.getElementById('dash-kpi-viaje-sub').textContent='+'+v.data.length+' disp. total';
            document.getElementById('dash-kpi-puerto').textContent=port;
            document.getElementById('dash-kpi-puerto-sub').textContent=v.data.length+' embarcaciones';
            // Vessel cards
            var vh='';
            v.data.forEach(function(ves){
                var stColor=ves.status==='navegando'||ves.status==='en_viaje'?'var(--success)':ves.status==='mantenimiento'?'var(--warning)':'var(--accent)';
                var stLabel=(ves.status||'en_puerto').toUpperCase().replace('_',' ');
                vh+='<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:12px;padding:14px;cursor:pointer" onclick="navigate(\'fleet\')">'+
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
                    '<span style="font-size:13px;font-weight:600">'+ves.name+'</span>'+
                    '<span style="display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:'+stColor+'"></span><span style="font-size:9px;font-weight:700;color:var(--text-secondary);letter-spacing:0.3px">'+stLabel+'</span></span></div>'+
                    '<div style="font-size:11px;color:var(--text-secondary)">'+(ves.type||'Embarcacion')+' · '+(ves.location||'ASU')+'</div></div>';
            });
            document.getElementById('dash-vessels').innerHTML=vh;
        }
    }catch(e){}
    // Viajes alertas KPI
    try{
        var vj=await sb.from('voyages').select('status');
        if(vj.data){
            var pending=vj.data.filter(function(x){return x.status==='pendiente'}).length;
            document.getElementById('dash-kpi-alertas').textContent=pending;
            document.getElementById('dash-kpi-alertas-sub').textContent=vj.data.length+' viajes total';
        }
    }catch(e){}
    // Activity feed (recent logs)
    try{
        var lg=await sb.from('logs').select('title,action_type,vessel_name,created_at').order('created_at',{ascending:false}).limit(5);
        if(lg.data&&lg.data.length>0){
            var ah='';
            lg.data.forEach(function(l){
                var date=new Date(l.created_at);
                var diff=Math.round((Date.now()-date.getTime())/60000);
                var ago=diff<60?diff+'min':diff<1440?Math.round(diff/60)+'h':Math.round(diff/1440)+'d';
                var icon='fa-solid fa-circle-info';
                if(l.action_type==='DRAFT_READING')icon='fa-solid fa-ruler-vertical';
                else if(l.action_type==='INCIDENTE')icon='fa-solid fa-triangle-exclamation';
                else if(l.action_type==='FUEL')icon='fa-solid fa-gas-pump';
                ah+='<div class="info-card"><i class="'+icon+'"></i><div class="info-card-text"><h4>'+(l.title||l.action_type||'Actividad')+'</h4><p>'+(l.vessel_name||'')+' · hace '+ago+'</p></div></div>';
            });
            document.getElementById('dash-activity').innerHTML=ah;
            document.getElementById('dash-activity-empty').style.display='none';
        }else{
            document.getElementById('dash-activity-empty').style.display='block';
        }
    }catch(e){}
}

// HIDROLOGIA - Extracted to js/modules/fluvia-hidrologia.js (with Promise.all optimization)


// REPORTES & ANALYTICS
var fleetChart=null,fuelChart=null,activityChart=null;
async function loadReportes(){
    try{
        // Stats — parallel queries for performance
        var results=await Promise.all([sb.from('vessels').select('status'),sb.from('voyages').select('id',{count:'exact',head:true}),sb.from('fuel_logs').select('liters'),sb.from('logs').select('id',{count:'exact',head:true})]);
        var v=results[0];var vj=results[1];var fl=results[2];var lg=results[3];
        var totalFuel=fl.data?fl.data.reduce(function(s,x){return s+(x.liters||0)},0):0;
        document.getElementById('report-stats').innerHTML=
            '<div class="admin-stat"><div class="stat-value">'+(v.data?v.data.length:0)+'</div><div class="stat-label">VESSELES</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+(vj.count||0)+'</div><div class="stat-label">VIAJES TOTALES</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+totalFuel.toLocaleString()+'L</div><div class="stat-label">FUEL TOTAL</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+(lg.count||0)+'</div><div class="stat-label">ENTRADAS BITACORA</div></div>';
        // Fleet Status Chart
        if(v.data){
            var enViaje=0,enPuerto=0,mant=0;
            v.data.forEach(function(x){var s=(x.status||'').toLowerCase();if(s.indexOf('viaje')>=0||s==='active')enViaje++;else if(s.indexOf('manten')>=0)mant++;else enPuerto++;});
            if(fleetChart)fleetChart.destroy();
            var ctx1=document.getElementById('chart-fleet');
            if(ctx1){fleetChart=new Chart(ctx1,{type:'doughnut',data:{labels:['In Transit','In Port','Maintenance'],datasets:[{data:[enViaje,enPuerto,mant],backgroundColor:['#2EA043','#3B82F6','#F59E0B'],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:12}}}}}});}
        }
        // Fuel Chart
        if(fl.data&&fl.data.length>0){
            var fuelByDay={};fl.data.forEach(function(f){var day='Carga '+(Object.keys(fuelByDay).length+1);fuelByDay[day]=(f.liters||0);});
            if(fuelChart)fuelChart.destroy();
            var ctx2=document.getElementById('chart-fuel');
            if(ctx2){fuelChart=new Chart(ctx2,{type:'bar',data:{labels:Object.keys(fuelByDay).slice(-7),datasets:[{label:'Litros',data:Object.values(fuelByDay).slice(-7),backgroundColor:'rgba(59,130,246,0.6)',borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false}}}}});}
        }
        // Activity Chart — use real log counts from DB
        if(activityChart)activityChart.destroy();
        var ctx3=document.getElementById('chart-activity');
        var days=[];var counts=[];
        try {
            var logsData = await sb.from('logs').select('created_at').gte('created_at', new Date(Date.now()-30*86400000).toISOString()).order('created_at');
            var logsByDay = {};
            if(logsData.data) logsData.data.forEach(function(l){ var d = new Date(l.created_at); var k = (d.getMonth()+1)+'/'+d.getDate(); logsByDay[k] = (logsByDay[k]||0)+1; });
            for(var i=29;i>=0;i--){var dt=new Date();dt.setDate(dt.getDate()-i);var k=(dt.getMonth()+1)+'/'+dt.getDate();days.push(k);counts.push(logsByDay[k]||0);}
        } catch(e) {
            for(var i=29;i>=0;i--){var dt=new Date();dt.setDate(dt.getDate()-i);days.push((dt.getMonth()+1)+'/'+dt.getDate());counts.push(0);}
        }
        if(ctx3){activityChart=new Chart(ctx3,{type:'line',data:{labels:days,datasets:[{label:'Entradas',data:counts,borderColor:'#1A1A2E',backgroundColor:'rgba(26,26,46,0.05)',fill:true,tension:0.4,pointRadius:0}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false},ticks:{maxTicksLimit:10}}}}});}
    }catch(e){console.log('Reports:',e);}
}

// CONVOY - Load fleet chips for drag-and-drop
async function loadConvoy(){
    try{
        var r=await sb.from('vessels').select('*').limit(100);var data=r.data;
        var chips=document.getElementById('convoy-chips');if(!chips)return;
        chips.innerHTML='';
        if(data&&data.length>0){
            var count=0;
            data.forEach(function(v){
                var s=(v.status||'').toLowerCase();
                var isBusy=s.indexOf('viaje')>=0||s==='active';
                var chip=document.createElement('div');
                chip.className='fleet-chip';
                chip.style.opacity=isBusy?'0.5':'1';
                chip.style.cursor=isBusy?'not-allowed':'grab';
                chip.innerHTML='<i class="fa-regular fa-clone"></i><div class="chip-name">'+(v.name||v.vessel_name||'--')+'</div><div class="chip-type">'+(v.type||v.vessel_type||'BARCAZA').toUpperCase()+'</div>';
                if(!isBusy){
                    chip.draggable=true;
                    chip.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',v.name||v.vessel_name||'');});
                }
                chips.appendChild(chip);
                if(!isBusy)count++;
            });
            document.querySelector('#view-convoy .fluvia-subtitle').textContent='FORMACION (0/'+data.length+') - '+count+' DISPONIBLES';
        }
    }catch(e){console.log('Convoy:',e);}
}

// TRACKING - Full cargo tracking with timeline
var trackingData=[];
async function loadTracking(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(50);
        trackingData=r.data||[];
        renderTracking();
    }catch(e){console.log('Tracking:',e);}
}
function renderTracking(filter){
    var data=trackingData;
    var activeList=document.getElementById('tracking-active-list');
    var historyList=document.getElementById('tracking-history-list');
    var empty=document.getElementById('tracking-empty');
    if(!activeList||!historyList)return;
    activeList.innerHTML='';historyList.innerHTML='';
    if(filter){data=data.filter(function(d){return JSON.stringify(d).toLowerCase().indexOf(filter.toLowerCase())>=0;});}
    if(!data||data.length===0){empty.style.display='';return;}
    empty.style.display='none';
    var inTransit=data.filter(function(v){var s=(v.status||'').toLowerCase();return s==='navegando'||s==='en_curso'||s==='en viaje'||s==='en_viaje';});
    var completed=data.filter(function(v){var s=(v.status||'').toLowerCase();return s==='completado'||s==='entregado'||s==='finalizado';});
    var pending=data.filter(function(v){var s=(v.status||'').toLowerCase();return s!=='navegando'&&s!=='en_curso'&&s!=='en viaje'&&s!=='en_viaje'&&s!=='completado'&&s!=='entregado'&&s!=='finalizado';});
    // Stats
    var totalCargo=data.reduce(function(s,v){return s+(v.cargo_tons||0)},0);
    document.getElementById('track-active').textContent=inTransit.length;
    document.getElementById('track-total-cargo').textContent=totalCargo>999?(totalCargo/1000).toFixed(1)+'k':totalCargo;
    document.getElementById('track-completed').textContent=completed.length;
    // Active transit cards
    if(inTransit.length>0){
        inTransit.forEach(function(v){
            var created=v.created_at?new Date(v.created_at):new Date();
            var eta=v.eta?new Date(v.eta):new Date(created.getTime()+7*86400000);
            var now=Date.now();var progress=Math.min(100,Math.max(5,Math.round(((now-created.getTime())/(eta.getTime()-created.getTime()))*100)));
            var elapsed=Math.round((now-created.getTime())/3600000);
            var elapsedStr=elapsed>24?Math.round(elapsed/24)+'d '+elapsed%24+'h':elapsed+'h';
            activeList.innerHTML+='<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:18px;margin-bottom:12px">'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
                '<div style="display:flex;align-items:center;gap:10px"><span style="width:10px;height:10px;border-radius:50%;background:var(--success);animation:pulse 2s infinite"></span><span style="font-size:14px;font-weight:600">'+(v.vessel_name||'--')+'</span></div>'+
                '<span style="font-size:10px;font-weight:700;color:var(--success);letter-spacing:0.5px">EN TRANSITO</span></div>'+
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
                '<span style="font-size:12px;font-weight:500">'+(v.origin_port||'Origin')+'</span>'+
                '<div style="flex:1;height:4px;background:var(--surface-low);border-radius:2px;position:relative"><div style="height:4px;background:var(--success);border-radius:2px;width:'+progress+'%;transition:width 1s"></div><div style="position:absolute;top:-3px;left:'+progress+'%;width:10px;height:10px;background:var(--success);border-radius:50%;border:2px solid var(--bg-secondary);transform:translateX(-50%)"></div></div>'+
                '<span style="font-size:12px;font-weight:500">'+(v.destination_port||'Destination')+'</span></div>'+
                '<div style="display:flex;gap:20px;font-size:11px;color:var(--text-secondary)">'+
                '<span><i class="fa-solid fa-box" style="width:14px;color:var(--accent)"></i> '+(v.cargo_tons||0)+' ton</span>'+
                '<span><i class="fa-solid fa-clock" style="width:14px"></i> '+elapsedStr+' en ruta</span>'+
                '<span><i class="fa-solid fa-location-dot" style="width:14px"></i> '+progress+'% completado</span></div></div>';
        });
    }else{
        activeList.innerHTML='<div class="empty-state" style="padding:30px"><i class="fa-regular fa-circle-check"></i><p>No hay cargas en transito activo</p></div>';
    }
    // History list
    var historyItems=completed.concat(pending);
    if(historyItems.length>0){
        historyItems.forEach(function(v){
            var s=(v.status||'pendiente').toLowerCase();
            var stColor=s==='completado'||s==='entregado'||s==='finalizado'?'var(--success)':s==='pendiente'?'var(--warning)':'var(--text-secondary)';
            var stLabel=(v.status||'PENDIENTE').toUpperCase();
            var t=v.created_at?new Date(v.created_at).toLocaleDateString('es',{day:'2-digit',month:'short'}):'-';
            historyList.innerHTML+='<div class="list-item"><div><h4>'+(v.vessel_name||'--')+' → '+(v.destination_port||'--')+'</h4><p>'+(v.origin_port||'')+' | '+(v.cargo_tons||0)+' ton | '+t+'</p></div><span class="badge" style="color:'+stColor+'">'+stLabel+'</span></div>';
        });
    }
}
function filterTracking(){var q=document.getElementById('track-search').value.trim();renderTracking(q||null);}
async function exportTracking(format){
    var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(200);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(v){return{Embarcacion:v.vessel_name||'',Origin:v.origin_port||'',Destination:v.destination_port||'',CargaTon:v.cargo_tons||0,Status:v.status||'',Date:v.created_at?new Date(v.created_at).toLocaleDateString('es'):''}}),'Tracking','fluvia_tracking');
    }else{
        exportToPDF('Cargo Tracking',['Embarcacion','Origin','Destination','Carga (t)','Status','Date'],data.map(function(v){return[v.vessel_name||'',v.origin_port||'',v.destination_port||'',(v.cargo_tons||0).toString(),v.status||'',v.created_at?new Date(v.created_at).toLocaleDateString('es'):'']}),'fluvia_tracking');
    }
}

// DELETE CONFIRMATION (FluviaFleet modal, no native confirm)
function confirmDelete(table, id, itemName, reloadFn){
    document.getElementById('modal-title').textContent='Delete Registro';
    document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:20px 0"><i class="fa-regular fa-trash-can" style="font-size:36px;color:var(--error);margin-bottom:16px;display:block"></i><p style="font-size:15px;font-weight:500">Seguro que queres eliminar?</p><p style="font-size:13px;color:var(--text-secondary);margin-top:6px"><strong>'+itemName+'</strong></p><p style="font-size:11px;color:var(--text-tertiary);margin-top:12px">Esta accion no se puede deshacer.</p></div>';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Delete';
    document.getElementById('modal-submit').style.display='';
    document.getElementById('modal-submit').style.background='var(--error)';
    document.getElementById('modal-submit').disabled=false;
    document.getElementById('modal-submit').onclick=async function(){
        document.getElementById('modal-submit').disabled=true;
        document.getElementById('modal-submit').textContent='Eliminando...';
        try{
            await sb.from(table).delete().eq('id',id);
        }catch(e){console.error('Delete error:',e);}
        document.getElementById('modal-overlay').classList.remove('open');
        document.getElementById('modal-submit').style.background='';
        document.getElementById('modal-submit').textContent='Save';
        document.getElementById('modal-submit').onclick=null;
        if(reloadFn)reloadFn();
    };
}


// CALADO
async function loadCalado(){
    try{
        var r=await sb.from('logs').select('*').eq('action_type','DRAFT_READING').order('created_at',{ascending:false}).limit(50);
        var data=r.data;var l=document.getElementById('calado-list');var h=document.getElementById('calado-history');var em=document.getElementById('calado-empty');
        if(!l)return;l.innerHTML='';h.innerHTML='';
        var vessels={};
        if(data&&data.length>0){
            em.style.display='none';
            data.forEach(function(d){
                var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};
                var vn=d.vessel_name||d.title||'Desconocido';
                if(!vessels[vn])vessels[vn]={name:vn,draft:det.draft||0,max:det.max_draft||3.5,date:d.created_at};
            });
            var vList=Object.values(vessels);var alerts=0;var totalDraft=0;
            vList.forEach(function(v){
                var pct=v.max>0?((v.draft/v.max)*100):0;
                var color=pct>90?'var(--error)':pct>75?'var(--warning)':'var(--success)';
                var status=pct>90?'CRITICO':pct>75?'ALERTA':'OPTIMO';
                if(pct>75)alerts++;totalDraft+=v.draft;
                l.innerHTML+='<div class="info-card" style="margin-bottom:10px"><i class="fa-solid fa-ruler-vertical" style="color:'+color+'"></i><div class="info-card-text"><h4>'+v.name+'</h4><p>Calado: <strong>'+v.draft.toFixed(2)+'m</strong> / Max: '+v.max.toFixed(2)+'m - '+status+'</p></div><div style="min-width:80px;text-align:right"><div style="font-family:Newsreader,serif;font-size:22px;font-weight:400">'+Math.round(pct)+'%</div><div style="height:4px;background:var(--surface-low);border-radius:2px;margin-top:4px"><div style="height:4px;background:'+color+';border-radius:2px;width:'+Math.min(pct,100)+'%"></div></div></div></div>';
            });
            document.getElementById('calado-total').textContent=vList.length;
            document.getElementById('calado-alerts').textContent=alerts;
            document.getElementById('calado-avg').textContent=vList.length>0?(totalDraft/vList.length).toFixed(2):'--';
            data.slice(0,10).forEach(function(d){
                var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};
                var t=d.created_at?new Date(d.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
                h.innerHTML+='<div class="list-item"><div><h4>'+(d.vessel_name||'--')+' - '+(det.draft||0).toFixed(2)+'m</h4><p>'+(d.description||'Lectura')+' - '+t+'</p></div><button class="delete-btn" data-id="'+d.id+'" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div>';
            });
            h.querySelectorAll('.delete-btn').forEach(function(btn){btn.addEventListener('click',function(){confirmDelete('logs',this.dataset.id,'Lectura',loadCalado);});});
        }else{em.style.display='';}
    }catch(e){console.log('Calado:',e);}
}

// INCIDENTES
var incidentesData=[];
async function loadIncidents(){
    try{
        var r=await sb.from('logs').select('*').eq('action_type','INCIDENTE').order('created_at',{ascending:false}).limit(50);
        incidentesData=r.data||[];renderIncidents();
    }catch(e){console.log('Incidents:',e);}
}
function renderIncidents(filter){
    var data=incidentesData;var l=document.getElementById('inc-list');var em=document.getElementById('inc-empty');
    if(!l)return;l.innerHTML='';
    if(filter){data=data.filter(function(d){var s=JSON.stringify(d).toLowerCase();return s.indexOf(filter.toLowerCase())>=0;});}
    if(data&&data.length>0){
        em.style.display='none';var open=0;var crit=0;
        data.forEach(function(d){
            var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};
            var sev=det.severity||'Medio';var st=det.status||'Abierto';
            if(st==='Abierto')open++;if(sev==='Critico')crit++;
            var sevC=sev==='Critico'?'var(--error)':sev==='Alto'?'var(--warning)':sev==='Medio'?'var(--accent)':'var(--text-secondary)';
            var t=d.created_at?new Date(d.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
            l.innerHTML+='<div class="list-item"><div><h4 style="display:flex;align-items:center;gap:8px"><span class="status-dot" style="background:'+sevC+'"></span>'+(d.title||'Incidente')+'</h4><p>'+(d.vessel_name||'')+' - '+(det.type||'')+' - '+t+'</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:'+sevC+'">'+sev.toUpperCase()+'</span><button class="delete-btn" data-id="'+d.id+'" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div></div>';
        });
        document.getElementById('inc-total').textContent=incidentesData.length;
        document.getElementById('inc-open').textContent=open;
        document.getElementById('inc-critical').textContent=crit;
        l.querySelectorAll('.delete-btn').forEach(function(btn){btn.addEventListener('click',function(){confirmDelete('logs',this.dataset.id,'Incidente',loadIncidents);});});
    }else{em.style.display='';}
}
function filterIncidents(){
    var q=document.getElementById('inc-search').value.trim();
    renderIncidents(q||null);
}

// BRIEFING DIARIO - Extracted to js/modules/fluvia-briefing.js (with Promise.all optimization)

// EXPORT ENGINE — Extracted to js/modules/fluvia-exports.js

// ============================================
// IA AVANZADA — MANTENIMIENTO PREDICTIVO
// ============================================
async function runPredictiveMaintenance(){
    var btn=document.getElementById('btn-predict-maint');
    var container=document.getElementById('predict-maint-results');
    if(!btn||!container)return;
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Analizando...';
    container.innerHTML='<div style="text-align:center;padding:40px 0;"><div class="loading-spinner" style="width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px;"></div><div style="font-size:12px;color:var(--text-secondary);">Gemini está analizando tu flota...</div></div>';
    try{
        var companyId=currentCompanyId||'a1b2c3d4-0001-4000-8000-000000000001';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var r=await fetch('/api/ai/predict-maintenance',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({companyId:companyId})});
        var data=await r.json();
        var preds=data.predictions||[];
        if(preds.length===0){container.innerHTML='<div style="text-align:center;color:var(--text-secondary);padding:20px;">No se encontraron predicciones.</div>';btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-brain"></i> Analyze';return;}
        var html='';
        preds.forEach(function(p){
            var sevColor=p.severity==='critical'?'#ef4444':p.severity==='high'?'#f59e0b':p.severity==='medium'?'#3b82f6':'#10b981';
            var sevLabel=p.severity==='critical'?'CRITICO':p.severity==='high'?'ALTO':p.severity==='medium'?'MEDIO':'BAJO';
            var prob=p.probability||0;
            html+='<div style="border:1px solid var(--border);border-left:4px solid '+sevColor+';border-radius:8px;padding:12px;margin-bottom:8px;">';
            html+='<div style="display:flex;justify-content:space-between;align-items:center;">';
            html+='<div style="font-weight:700;font-size:13px;">🚢 '+p.vessel+'</div>';
            html+='<span style="background:'+sevColor+';color:#fff;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;">'+sevLabel+'</span>';
            html+='</div>';
            html+='<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">⚙️ '+p.component+'</div>';
            html+='<div style="font-size:12px;margin-top:6px;">'+p.action+'</div>';
            html+='<div style="display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--text-secondary);">';
            html+='<span>📊 Probabilidad: <strong style="color:'+sevColor+'">'+prob+'%</strong></span>';
            html+='<span>📅 '+p.days_until+' días</span>';
            html+='</div>';
            html+='<div style="background:var(--bg-main);border-radius:4px;height:6px;margin-top:6px;overflow:hidden;"><div style="height:100%;width:'+prob+'%;background:'+sevColor+';border-radius:4px;transition:width 0.5s;"></div></div>';
            html+='</div>';
        });
        container.innerHTML=html;
    }catch(e){
        container.innerHTML='<div style="color:#ef4444;text-align:center;padding:20px;">Error: '+e.message+'</div>';
    }
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-brain"></i> Analyze';
}

// ============================================
// IA AVANZADA — ANOMALÍAS DE CONSUMO
// ============================================
async function runFuelAnomalies(){
    var btn=document.getElementById('btn-fuel-anomalies');
    var container=document.getElementById('fuel-anomaly-results');
    if(!btn||!container)return;
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Escaneando...';
    container.innerHTML='<div style="text-align:center;padding:40px 0;"><div class="loading-spinner" style="width:30px;height:30px;border:3px solid var(--border);border-top-color:#10b981;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px;"></div><div style="font-size:12px;color:var(--text-secondary);">Auditando consumo de combustible...</div></div>';
    try{
        var companyId=currentCompanyId||'a1b2c3d4-0001-4000-8000-000000000001';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var r=await fetch('/api/ai/fuel-anomalies',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({companyId:companyId})});
        var data=await r.json();
        var anomalies=data.anomalies||[];
        if(anomalies.length===0){container.innerHTML='<div style="text-align:center;color:var(--text-secondary);padding:20px;">Sin anomalías detectadas.</div>';btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass-chart"></i> Scan';return;}
        var html='';
        anomalies.forEach(function(a){
            var sevColor=a.severity==='critical'?'#ef4444':a.severity==='high'?'#f59e0b':a.severity==='medium'?'#3b82f6':'#10b981';
            var icon=a.type==='theft_risk'?'🚨':a.type==='overconsumption'?'📈':a.type==='spike'?'⚡':a.type==='trend'?'📉':'✅';
            var typeLabel=a.type==='theft_risk'?'RIESGO ROBO':a.type==='overconsumption'?'SOBRECONSUMO':a.type==='spike'?'PICO ANÓMALO':a.type==='trend'?'TENDENCIA':'NORMAL';
            html+='<div style="border:1px solid var(--border);border-left:4px solid '+sevColor+';border-radius:8px;padding:12px;margin-bottom:8px;">';
            html+='<div style="display:flex;justify-content:space-between;align-items:center;">';
            html+='<div style="font-weight:700;font-size:13px;">'+icon+' '+a.vessel+'</div>';
            html+='<span style="background:'+sevColor+';color:#fff;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;">'+typeLabel+'</span>';
            html+='</div>';
            html+='<div style="font-size:12px;margin-top:6px;">'+a.description+'</div>';
            if(a.deviation_pct){html+='<div style="font-size:11px;color:'+sevColor+';margin-top:4px;font-weight:600;">Desviación: '+(a.deviation_pct>0?'+':'')+a.deviation_pct+'%</div>';}
            html+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">💡 '+a.recommendation+'</div>';
            html+='</div>';
        });
        container.innerHTML=html;
    }catch(e){
        container.innerHTML='<div style="color:#ef4444;text-align:center;padding:20px;">Error: '+e.message+'</div>';
    }
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass-chart"></i> Scan';
}

// ============================================
// IA AVANZADA — OPTIMIZADOR DE CONVOY
// ============================================
async function suggestConvoyIA(){
    var btn=document.getElementById('btn-convoy-ai');
    var container=document.getElementById('convoy-ai-result');
    var dest=document.getElementById('convoy-destination')?.value||'';
    if(!btn||!container)return;
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Calculando...';
    container.style.display='block';
    container.innerHTML='<div style="text-align:center;padding:20px 0;"><div class="loading-spinner" style="width:24px;height:24px;border:3px solid var(--border);border-top-color:#8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 8px;"></div><div style="font-size:12px;color:var(--text-secondary);">Gemini está optimizando la formación...</div></div>';
    try{
        var companyId=currentCompanyId||'a1b2c3d4-0001-4000-8000-000000000001';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var r=await fetch('/api/ai/optimize-convoy',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({companyId:companyId,destination:dest})});
        var data=await r.json();
        console.log('AI Convoy Response Data:', data);
        if (data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        
        var s=data.suggestion||{};
        // Handle case where Gemini wraps response in 'suggestion' or translates keys
        if (s.suggestion) s = s.suggestion;
        var f=s.formation||s.formacion||{};
        var configStr = s.config || s.configuracion || 'N/A';
        
        // Debug dump if empty
        if (configStr === 'N/A' || configStr === 'Vacio') {
            console.log('AI Convoy Response Dump:', s);
            return container.innerHTML = '<div style="background:var(--bg-card);padding:16px;border-radius:10px;font-size:12px;overflow:auto;"><strong style="color:#ef4444;">DEBUG - Respuesta IA inesperada (o vacía):</strong><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
        }
        
        var riskColor=(s.risk_score||100)<=30?'#10b981':(s.risk_score||100)<=60?'#f59e0b':'#ef4444';
        var html='<div style="background:var(--bg-card);border-radius:10px;padding:16px;">';
        
        // Config + Risk
        html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
        html+='<div style="font-weight:800;font-size:18px;color:#8b5cf6;">⚓ '+configStr+'</div>';
        html+='<div style="text-align:center;"><div style="width:50px;height:50px;border-radius:50%;border:4px solid '+riskColor+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:'+riskColor+';">'+(s.risk_score||'?')+'</div><div style="font-size:9px;color:var(--text-secondary);margin-top:2px;">RIESGO</div></div>';
        html+='</div>';
        
        // Formation
        if(f.proa){html+='<div style="font-size:12px;margin-bottom:4px;">🔴 <strong>Proa:</strong> '+f.proa+'</div>';}
        if(f.barcazas_f1&&f.barcazas_f1.length){html+='<div style="font-size:12px;margin-bottom:4px;">📦 <strong>Fila 1:</strong> '+f.barcazas_f1.join(', ')+'</div>';}
        if(f.barcazas_f2&&f.barcazas_f2.length){html+='<div style="font-size:12px;margin-bottom:4px;">📦 <strong>Fila 2:</strong> '+f.barcazas_f2.join(', ')+'</div>';}
        if(f.popa){html+='<div style="font-size:12px;margin-bottom:4px;">🔵 <strong>Popa:</strong> '+f.popa+'</div>';}
        
        // Fuel estimate
        if(s.fuel_estimate_liters){html+='<div style="font-size:12px;margin-top:8px;">⛽ Consumption estimado: <strong>'+s.fuel_estimate_liters.toLocaleString()+' lts</strong></div>';}
        
        // Warnings
        if(s.warnings&&s.warnings.length){
            html+='<div style="margin-top:10px;">';
            s.warnings.forEach(function(w){html+='<div style="font-size:11px;color:#f59e0b;margin-bottom:2px;">⚠️ '+w+'</div>';});
            html+='</div>';
        }
        
        // Recommendation
        if(s.recommendation){html+='<div style="margin-top:10px;padding:10px;background:rgba(139,92,246,0.1);border-radius:8px;font-size:12px;">🤖 '+s.recommendation+'</div>';}
        
        html+='</div>';
        container.innerHTML=html;
    }catch(e){
        container.innerHTML='<div style="color:#ef4444;text-align:center;padding:20px;">Error: '+e.message+'</div>';
    }
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-robot"></i> Suggest';
}

// CSS spinner animation
if(!document.getElementById('ai-spinner-css')){
    var style=document.createElement('style');style.id='ai-spinner-css';
    style.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
}
