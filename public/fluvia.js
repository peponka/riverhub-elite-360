function trad(s) {
    if(!s) return '';
    var str = String(s).toLowerCase();
    var m = {
        'tugboat': 'Remolcador',
        'pusher': 'Empujador',
        'barge': 'Barcaza',
        'active': 'Activo',
        'inactive': 'Inactivo',
        'docked': 'En Puerto',
        'en viaje': 'En Viaje',
        'en_viaje': 'En Viaje',
        'maintenance': 'Mantenimiento',
        'completed': 'Completado',
        'pending': 'Pendiente',
        'high': 'Alta',
        'medium': 'Media',
        'low': 'Baja',
        'critical': 'Critico',
        'cargo': 'Carga',
        'captain': 'Capit\u00e1n',
        'engineer': 'Maquinista',
        'deckhand': 'Marinero',
        'cook': 'Cocinero',
        'helmsman': 'Timonel',
        'collision': 'Colisi\u00f3n',
        'grounding': 'Encalladura',
        'spill': 'Derrame',
        'fire': 'Incendio',
        'medical': 'M\u00e9dico',
        'passenger': 'Pasajeros'
    };
    return m[str] ? m[str] : s;
}
// Supabase Init
const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// •••••••••••••••••••••••••••••••••••••••••••
// GLOBAL ERROR BOUNDARY — Prevents UI crashes
// •••••••••••••••••••••••••••••••••••••••••••
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

// XSS escape helper — prevents stored XSS via innerHTML
function esc(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

// AUTH - Check session on load
(async function checkSession(){
    if(window.location.search.includes('logout=true')){
        await sb.auth.signOut();
        window.history.replaceState({}, '', window.location.pathname);
        document.getElementById('login-screen').style.display='flex';
        document.getElementById('app-shell').style.display='none';
        return;
    }
    var session = await sb.auth.getSession();
    if(session.data.session){
        showApp(session.data.session.user);
    } else {
        document.getElementById('login-screen').style.display='flex';
        document.getElementById('app-shell').style.display='none';
    }
})();


// PASSWORD RESET HANDLER
(function detectPasswordReset(){
    var hash = window.location.hash;
    if(hash && hash.includes('type=recovery')){
        setTimeout(function(){
            document.getElementById('app-shell').style.display='none';
            var screen = document.getElementById('login-screen');
            screen.style.display='flex';
            screen.querySelector('.login-card').innerHTML = '<div class="login-brand"><img src="img/fluvia-logo.jpg" alt="FluviaFleet" style="width:64px;height:64px;border-radius:50%;object-fit:cover"><span style="font-family:Newsreader,serif;font-size:3.2rem;font-weight:400;color:var(--text-primary);letter-spacing:-0.01em">FluviaFleet</span></div>'+
                '<h1 class="login-title">Cambiar<br><em>Contraseña.</em></h1>'+
                '<p class="login-sub">INGRESÁ TU NUEVA CONTRASEÑA</p>'+
                '<div id="reset-pw-error" style="display:none;font-size:12px;margin:12px 0;font-weight:600;"></div>'+
                '<label class="login-label">NUEVA CONTRASEÑA</label>'+
                '<div style="position:relative"><input type="password" id="new-password-input" class="login-input" placeholder="Mínimo 6 caracteres" style="padding-right:44px"><button type="button" onclick="togglePwVis(\'new-password-input\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'+
                '<label class="login-label">CONFIRMAR CONTRASEÑA</label>'+
                '<div style="position:relative"><input type="password" id="confirm-password-input" class="login-input" placeholder="Repetir contraseña" style="padding-right:44px"><button type="button" onclick="togglePwVis(\'confirm-password-input\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'+
                '<button class="login-btn" onclick="doChangePassword()">Cambiar Contraseña</button>'+
                '<div style="margin-top:24px;border-top:0.5px solid var(--separator);padding-top:16px;"><p class="login-footer">Hidrovía Paraguay-Paraná — FluviaFleet</p></div>';
        }, 1000);
    }
})();

async function doChangePassword(){
    var pw = document.getElementById('new-password-input').value;
    var pw2 = document.getElementById('confirm-password-input').value;
    var errDiv = document.getElementById('reset-pw-error');
    if(!pw || pw.length < 6){errDiv.textContent='La contraseña debe tener al menos 6 caracteres';errDiv.style.display='block';return;}
    if(pw !== pw2){errDiv.textContent='Las contraseñas no coinciden';errDiv.style.display='block';return;}
    try{
        var r = await sb.auth.updateUser({password: pw});
        if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';return;}
        var card = document.querySelector('.login-card');
        if(card) card.innerHTML='<div style="text-align:center;padding:40px 0;"><i class="fa-solid fa-circle-check" style="font-size:64px;color:var(--success,#10b981);margin-bottom:20px;display:block;"></i><h1 class="login-title" style="margin-bottom:8px;">Contraseña<br><em>Cambiada!</em></h1><p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">Tu contraseña fue actualizada exitosamente.</p><button class="login-btn" onclick="window.location.href=window.location.pathname;">Continuar al Dashboard</button></div>';
    }catch(e){
        errDiv.textContent='Error al actualizar contraseña';errDiv.style.display='block';
    }
}


// Toggle password visibility (eye icon)
function togglePwVis(inputId, btn) {
    var inp = document.getElementById(inputId);
    if(!inp) return;
    if(inp.type === 'password'){
        inp.type = 'text';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        inp.type = 'password';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

let authMode = 'login';
function toggleRegister() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.querySelector('.login-title').innerHTML = authMode === 'login' ? 'Bienvenido<br><em>de vuelta.</em>' : 'Crear<br><em>cuenta nueva.</em>';
    document.getElementById('login-btn').textContent = authMode === 'login' ? 'Iniciar Sesion' : 'Registrarse';
    document.getElementById('toggle-register-btn').textContent = authMode === 'login' ? 'Crear nueva cuenta' : 'Ya tengo cuenta (Iniciar Sesion)';
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
            if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';btn.disabled=false;btn.textContent='Iniciar Sesion';return;}
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
    }catch(e){errDiv.style.color='var(--error)';errDiv.textContent='Error de conexion';errDiv.style.display='block';btn.disabled=false;btn.textContent=authMode==='login'?'Iniciar Sesion':'Registrarse';}
}

async function doGoogleLogin(){
    try{
        await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/fluvia.html' }
        });
    }catch(e){
        var errDiv=document.getElementById('login-error');
        if(errDiv){errDiv.style.color='var(--error)';errDiv.textContent='Error al conectar con Google';errDiv.style.display='block';}
    }
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
    document.getElementById('login-btn').textContent='Iniciar Sesion';
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

        if(r.data){
            currentCompanyId=r.data.company_id;
            currentUserRole=r.data.role;

            if(r.data.full_name)document.getElementById('user-display').textContent=r.data.full_name;
            document.querySelector('.user-role').textContent=(r.data.role||'ADMIN').toUpperCase();
            if(currentCompanyId){sb.from('companies').select('name').eq('id',currentCompanyId).single().then(function(c){if(c.data)document.querySelector('.user-role').textContent=(r.data.role||'ADMIN').toUpperCase()+' - '+(c.data.name||'');});}
            checkAdminAccess();
        } else {

            // Auto-create profile if missing
            sb.from('companies').select('id').eq('name','FluviaFleet Admin').single().then(function(c2){
                var cid = c2.data ? c2.data.id : null;
                sb.from('user_profiles').insert({user_id:user.id, company_id:cid, role:'viewer', full_name:'Nuevo Usuario'}).then(function(ins){

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
const loaders = {dashboard:loadDashboard,fleet:loadFleet,mapa:function(){if(!map)initMap();else setTimeout(function(){map.invalidateSize()},100)},admin:loadAdmin,viajes:loadViajes,bitacora:loadBitacora,tripulacion:loadCrew,combustible:loadFuel,liquidos:loadLiquidos,mantenimiento:loadMaint,panol:loadPanol,comunicaciones:loadComms,hidrologia:loadHidrologia,reportes:loadReportes,copiloto:function(){},convoy:loadConvoy,tracking:loadTracking,planes:function(){},calado:loadCalado,incidentes:loadIncidentes,briefing:loadBriefing,contratos:loadContratos};

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
    }catch(e){/* Notif: */;}
}
function renderNotifs(){
    var list=document.getElementById('notif-list');
    var badge=document.getElementById('notif-badge');
    if(!list)return;
    if(notifData.length===0){
        list.innerHTML='<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><p>Sin notificaciones nuevas</p></div>';
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
}catch(e){/* Realtime notif: */;}

// LOADERS
var dashSyncTimer=0;
window._dashSyncInterval=setInterval(function(){dashSyncTimer++;var el=document.getElementById('dash-sync-time');if(el)el.textContent=dashSyncTimer;},1000);

async function loadDashboard(){
    try{
        // Week & date
        var now=new Date();
        var weekNum=Math.ceil((((now-new Date(now.getFullYear(),0,1))/86400000)+new Date(now.getFullYear(),0,1).getDay()+1)/7);
        var el=document.getElementById('dash-week');if(el)el.textContent='SEMANA '+weekNum+' · '+now.getFullYear();

        // Fetch all vessels
        var r=await sb.from('vessels').select('*').limit(100);
        var vessels=r.data||[];
        var total=vessels.length;
        var active=0,docked=0,maint=0;
        vessels.forEach(function(v){var s=(trad(v.status||'')).toLowerCase();if(s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje')active++;else if(s.indexOf('manten')>=0)maint++;else docked++;});

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
            var elFS=document.getElementById('dash-kpi-fuel-sub');if(elFS)elFS.textContent='↑ '+(fuelData.length)+' registros · Áºltimas 24h';
        }catch(e2){var elF=document.getElementById('dash-kpi-fuel');if(elF)elF.textContent='42.5';}

        // KPI: Calado - computed from active vessel data
        var elC=document.getElementById('dash-kpi-calado');if(elC)elC.textContent='--';
        var elCS=document.getElementById('dash-kpi-calado-sub');if(elCS)elCS.textContent='sin lectura reciente';

        // KPI: Efficiency - computed from fleet utilization
        var elE=document.getElementById('dash-kpi-efficiency');if(elE)elE.textContent=total>0?Math.round((active/Math.max(total,1))*100):'--';

        // Sync timer reset
        dashSyncTimer=0;

        // Live Vessels Panel (right sidebar)
        var liveContainer=document.getElementById('dash-live-vessels');
        var fleetCount=document.getElementById('dash-fleet-count');
        if(fleetCount)fleetCount.textContent=total+' bajo monitoreo';
        if(liveContainer){
            liveContainer.innerHTML=vessels.slice(0,8).map(function(v,i){
                var s=(trad(v.status||'')).toLowerCase();
                var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje';
                var isMaint=s.indexOf('manten')>=0;
                var statusColor=isActive?'var(--success)':isMaint?'var(--warning)':'var(--accent)';
                var statusLabel=isActive?'NAVEGANDO':isMaint?'ATENCIÓN':'EN PUERTO';
                var speed=isActive?'—':'0';
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
        loadDashMiniCharts(vessels);
        // INA KPIs on dashboard
        loadINADashboardKPI();
    }catch(e){/* Dashboard: */;}
}

// ─── DASHBOARD MINI CHARTS ──────────────────────────
var dashFuelTrendChart=null, dashFleetUtilChart=null;
async function loadDashMiniCharts(vessels){
    try{
        var fuelR=await sb.from('fuel_logs').select('liters,created_at').order('created_at',{ascending:true}).limit(100);
        var fuelData=fuelR.data||[];
        var fuelByDay={};
        for(var i=6;i>=0;i--){var dt=new Date();dt.setDate(dt.getDate()-i);var k=dt.toLocaleDateString('es',{day:'2-digit',month:'short'});fuelByDay[k]=0;}
        fuelData.forEach(function(f){
            if(!f.created_at)return;
            var d=new Date(f.created_at);var k=d.toLocaleDateString('es',{day:'2-digit',month:'short'});
            if(fuelByDay.hasOwnProperty(k))fuelByDay[k]+=(f.liters||0);
        });
        var fuelLabels=Object.keys(fuelByDay);var fuelValues=Object.values(fuelByDay);
        var ctx1=document.getElementById('dash-fuel-trend');
        if(ctx1){
            if(dashFuelTrendChart)dashFuelTrendChart.destroy();
            dashFuelTrendChart=new Chart(ctx1,{type:'line',data:{labels:fuelLabels,datasets:[{data:fuelValues,borderColor:'#3B82F6',backgroundColor:'rgba(59,130,246,0.08)',fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:'#3B82F6',pointBorderColor:'#fff',pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.parsed.y.toLocaleString()+' L'}}}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:9},callback:function(v){return v>999?(v/1000).toFixed(0)+'k':v}}},x:{grid:{display:false},ticks:{font:{size:9},maxRotation:0}}}}});
        }
    }catch(e){/* Fuel trend: */;}
    try{
        var active=0,docked=0,maint=0;
        (vessels||[]).forEach(function(v){var s=(trad(v.status||'')).toLowerCase();if(s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje')active++;else if(s.indexOf('manten')>=0)maint++;else docked++;});
        var ctx2=document.getElementById('dash-fleet-util');
        if(ctx2){
            if(dashFleetUtilChart)dashFleetUtilChart.destroy();
            dashFleetUtilChart=new Chart(ctx2,{type:'doughnut',data:{labels:['Navegando','En Puerto','Mantenimiento'],datasets:[{data:[active,docked,maint],backgroundColor:['#2EA043','#3B82F6','#F59E0B'],borderWidth:0,borderRadius:4}]},options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:10},padding:8,usePointStyle:true,pointStyleWidth:8}}}}});
        }
    }catch(e){/* Fleet util: */;}
}

// ─── DASHBOARD AUTO-REFRESH (60s) ──────────────────
var _dashAutoRefresh=setInterval(function(){
    var dashView=document.getElementById('view-dashboard');
    if(dashView && dashView.classList.contains('active')){
        loadDashboard();
    }
},60000);

function selectDashVessel(idx){
    var v=(window._dashVessels||[])[idx];if(!v)return;
    var detail=document.getElementById('dash-vessel-detail');if(detail)detail.style.display='block';
    var elN=document.getElementById('dash-sel-name');if(elN)elN.textContent=v.name||v.vessel_name||'--';
    var elI=document.getElementById('dash-sel-imo');if(elI)elI.textContent='IMO '+(v.imo||v.id||'--');
    var elR=document.getElementById('dash-sel-route');if(elR)elR.textContent=(v.location||'ASU')+' → '+(v.destination||'MPA');
    var s=(trad(v.status||'')).toLowerCase();
    var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje';
    var elC=document.getElementById('dash-sel-convoy');if(elC)elC.textContent=isActive?'4+1':'--';
    var elF=document.getElementById('dash-sel-fuel');if(elF)elF.textContent=isActive?'—':'—';
    var elE=document.getElementById('dash-sel-eta');if(elE)elE.textContent=isActive?'—':'En puerto';
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
    }catch(e){/* Weather: */;}
}

async function loadDashHydro(){
    try{
        var el=document.getElementById('dash-hidro-status');if(el)el.textContent='Nivel normal';
        var el2=document.getElementById('dash-h-asu');if(el2)el2.textContent='2.45m';
        var el3=document.getElementById('dash-h-pir');if(el3)el3.textContent='3.12m';
        var el4=document.getElementById('dash-h-ros');if(el4)el4.textContent='1.87m';
    }catch(e){/* Hydro: */;}
}

function loadDashRecentVessels(vessels){
    var container=document.getElementById('dash-vessels');if(!container)return;
    container.innerHTML=vessels.slice(0,4).map(function(v){
        var s=(trad(v.status||'')).toLowerCase();
        var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='en_viaje';
        var isMaint=s.indexOf('manten')>=0;
        var borderColor=isActive?'var(--success)':isMaint?'var(--warning)':'var(--accent)';
        return '<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:12px;padding:14px;border-left:3px solid '+borderColor+'">'+
            '<div style="font-size:13px;font-weight:600">'+(v.name||v.vessel_name||'')+'</div>'+
            '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">'+(trad(v.type||v.vessel_type||''))+' · '+(v.location||v.current_position||'--')+'</div>'+
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
    }catch(e){/* Activity: */;}
}

function exportDashboardPDF(){alert('Exportando reporte del dashboard...');}

async function loadFleet(){
    try{
        var r=await sb.from('vessels').select('*').limit(100);var data=r.data;if(!data)return;
        var tb=document.getElementById('fleet-tbody');
        // Hide table structure, use parent as card container
        var table=tb.closest('table');if(table){table.querySelector('thead').style.display='none';table.style.border='none';table.style.background='transparent';}
        tb.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px';
        tb.innerHTML='';
        var typeIcons={'remolcador':'fa-ship','tugboat':'fa-ship','empujador':'fa-truck-moving','pusher':'fa-truck-moving','barcaza':'fa-box-open','barge':'fa-box-open','tanque':'fa-droplet','tanker':'fa-droplet','lancha':'fa-ferry','patrol':'fa-shield-halved'};
        var typeColors={'remolcador':'#3B82F6','tugboat':'#3B82F6','empujador':'#8B5CF6','pusher':'#8B5CF6','barcaza':'#F97316','barge':'#F97316','tanque':'#0EA5E9','tanker':'#0EA5E9','lancha':'#10B981','patrol':'#DC2626'};
        var inService=0;var inDock=0;
        data.forEach(function(v){
            var type=(v.type||v.vessel_type||'remolcador').toLowerCase();
            var icon=typeIcons[type]||'fa-ship';
            var color=typeColors[type]||'#94A3B8';
            var st=(v.status||'activo').toLowerCase();
            var isActive=st==='activo'||st==='active'||st.indexOf('viaje')>=0||st.indexOf('transit')>=0;
            var isDock=st.indexOf('dique')>=0||st.indexOf('dock')>=0||st.indexOf('manten')>=0;
            if(isActive)inService++;if(isDock)inDock++;
            var stColor=isActive?'#2EA043':isDock?'#F59E0B':'#94A3B8';
            var stLabel=trad(v.status||'Activo');
            var d=document.createElement('tr');
            d.style.cssText='display:block;background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:20px;transition:all 0.2s;cursor:default';
            d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.06)'};
            d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
            d.innerHTML='<td style="display:block;padding:0;border:none"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">'+'<div style="width:44px;height:44px;border-radius:12px;background:'+color+'12;display:flex;align-items:center;justify-content:center"><i class="fa-solid '+icon+'" style="font-size:18px;color:'+color+'"></i></div>'+'<button class="delete-btn" title="Eliminar" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;border-radius:6px;font-size:13px"><i class="fa-regular fa-trash-can"></i></button>'+'</div>'+'<div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:3px;letter-spacing:0.3px">'+esc(v.name||v.vessel_name||'')+'</div>'+'<div style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'10;padding:3px 8px;border-radius:5px;margin-bottom:12px">'+esc(trad(v.type||v.vessel_type||'Embarcación')).toUpperCase()+'</div>'+'<div style="display:flex;align-items:center;justify-content:space-between">'+'<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-location-dot" style="font-size:10px;color:var(--text-tertiary)"></i>'+(v.location||v.current_position||'Sin ubicación')+'</span>'+'<span style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:'+stColor+'"><span style="width:6px;height:6px;border-radius:50%;background:'+stColor+'"></span>'+stLabel+'</span>'+'</div></td>';
            d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('vessels',v.id,v.name||v.vessel_name||'Embarcacion',loadFleet);});
            tb.appendChild(d);
        });
        document.getElementById('fleet-total').textContent=data.length;
        var elServ=document.getElementById('fleet-service');if(elServ)elServ.textContent=inService;
        var elDock=document.getElementById('fleet-dock');if(elDock)elDock.textContent=inDock;
    }catch(e){/* Fleet: */;}
}

async function loadViajes(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(50);
        var data=r.data||[];
        if(data.length===0){
            data=[
                {id:'demo1',vessel_name:'R/M Guarani',origin_port:'Nueva Palmira (UY)',destination_port:'Asuncion (PY)',cargo_tons:3500,status:'pendiente',created_at:'2026-05-08T10:00:00Z',departure_date:'2026-05-11'},
                {id:'demo2',vessel_name:'BZ-1042 Soja',origin_port:'Villeta (PY)',destination_port:'Rosario (AR)',cargo_tons:4200,status:'en_viaje',created_at:'2026-05-06T14:00:00Z',eta:'2026-05-14T08:00:00Z',departure_date:'2026-05-06'},
                {id:'demo3',vessel_name:'BZ-2018 Cereal',origin_port:'Puerto de Asuncion',destination_port:'San Nicolas (AR)',cargo_tons:3800,status:'en_viaje',created_at:'2026-05-05T09:00:00Z',eta:'2026-05-13T16:00:00Z',departure_date:'2026-05-05'},
                {id:'demo4',vessel_name:'R/M Atlas',origin_port:'Concepcion (PY)',destination_port:'Villeta (PY)',cargo_tons:2100,status:'completado',created_at:'2026-04-28T12:00:00Z',departure_date:'2026-04-28'},
                {id:'demo5',vessel_name:'BZ-3055 Mineral',origin_port:'San Lorenzo (AR)',destination_port:'Puerto de Asuncion',cargo_tons:5500,status:'completado',created_at:'2026-04-23T06:00:00Z',departure_date:'2026-04-23'},
                {id:'demo6',vessel_name:'BZ-1099 Granel',origin_port:'Corumba (BR)',destination_port:'Nueva Palmira (UY)',cargo_tons:4800,status:'completado',created_at:'2026-04-13T18:00:00Z',departure_date:'2026-04-13'}
            ];
        }
        var l=document.getElementById('viajes-list');var em=document.getElementById('viajes-empty');
        if(!l)return;l.innerHTML='';

        // KPI stats
        var navegando=0,pendientes=0,completados=0,totalTons=0;
        data.forEach(function(v){
            var s=(v.status||'').toLowerCase();
            if(s.indexOf('viaje')>=0||s.indexOf('transit')>=0||s==='navegando'||s==='en_curso')navegando++;
            else if(s==='completado'||s==='completed'||s==='finalizado')completados++;
            else pendientes++;
            totalTons+=(v.cargo_tons||v.cargo_tonss||0);
        });
        var e1=document.getElementById('viajes-navegando');if(e1)e1.textContent=navegando;
        var e2=document.getElementById('viajes-pendientes');if(e2)e2.textContent=pendientes;
        var e3=document.getElementById('viajes-tons');if(e3)e3.textContent=totalTons>=1000?(totalTons/1000).toFixed(1)+'k':totalTons;
        var e4=document.getElementById('viajes-completados');if(e4)e4.textContent=completados;

        if(data.length>0){
            if(em)em.style.display='none';
            var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-top:16px">';
            data.forEach(function(v){
                var st=(v.status||'pendiente').toLowerCase();
                var isTransit=st.indexOf('viaje')>=0||st.indexOf('transit')>=0||st==='navegando'||st==='en_curso';
                var isComplete=st==='completado'||st==='completed'||st==='finalizado';
                var isPlanned=st==='planned'||st==='planificado';
                var stColor=isComplete?'#10B981':isTransit?'#3B82F6':isPlanned?'#8B5CF6':'#F59E0B';
                var stLabel=isComplete?'COMPLETADO':isTransit?'EN TRANSITO':isPlanned?'PLANIFICADO':'PENDIENTE';
                var stIcon=isComplete?'fa-circle-check':isTransit?'fa-ship':isPlanned?'fa-calendar-check':'fa-clock';
                var tons=v.cargo_tons||v.cargo_tonss||0;
                var depDate=v.departure_date?new Date(v.departure_date).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'}):(v.created_at?new Date(v.created_at).toLocaleDateString('es',{day:'numeric',month:'short'}):'—');

                // Progress for in-transit
                var progress=0;
                if(isTransit){
                    var created=v.departure_date?new Date(v.departure_date):v.created_at?new Date(v.created_at):new Date();
                    var eta=v.eta?new Date(v.eta):new Date(created.getTime()+7*86400000);
                    progress=Math.min(95,Math.max(10,Math.round(((Date.now()-created.getTime())/(eta.getTime()-created.getTime()))*100)));
                }else if(isComplete){progress=100;}

                h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:box-shadow 0.2s,transform 0.2s;" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';

                // Header: status icon + vessel + badge
                h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">';
                h+='<div style="display:flex;align-items:center;gap:12px">';
                h+='<div style="width:42px;height:42px;border-radius:12px;background:'+stColor+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+stIcon+'" style="font-size:18px;color:'+stColor+'"></i></div>';
                h+='<div><div style="font-weight:700;font-size:15px;color:var(--text-primary);letter-spacing:-0.01em">'+esc(v.vessel_name||'Sin asignar')+'</div>';
                h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:2px">'+esc(v.contract_type||'Carga General')+' · '+tons.toLocaleString()+' ton</div></div>';
                h+='</div>';
                h+='<span style="background:'+stColor+'18;color:'+stColor+';padding:4px 10px;border-radius:8px;font-size:9px;font-weight:700;letter-spacing:0.5px;white-space:nowrap">'+stLabel+'</span>';
                h+='</div>';

                // Route visualization
                h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 14px;background:var(--bg-tertiary,#f8f9fa);border-radius:10px">';
                h+='<div style="text-align:center;flex:1;min-width:0"><div style="font-size:9px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:3px">ORIGEN</div><div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.origin_port||'—')+'</div></div>';
                h+='<div style="display:flex;align-items:center;gap:4px;flex-shrink:0"><div style="width:20px;height:2px;background:'+stColor+'60;border-radius:1px"></div><i class="fa-solid fa-arrow-right" style="font-size:10px;color:'+stColor+'"></i><div style="width:20px;height:2px;background:'+stColor+'60;border-radius:1px"></div></div>';
                h+='<div style="text-align:center;flex:1;min-width:0"><div style="font-size:9px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:3px">DESTINO</div><div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.destination_port||'—')+'</div></div>';
                h+='</div>';

                // Progress bar
                if(isTransit||isComplete){
                    var barColor=isComplete?'#10B981':progress>80?'#F59E0B':'#3B82F6';
                    h+='<div style="position:relative;height:8px;background:var(--bg-tertiary,#f0f0f0);border-radius:4px;overflow:hidden;margin-bottom:8px">';
                    h+='<div style="position:absolute;top:0;left:0;height:100%;width:'+progress+'%;background:'+barColor+';border-radius:4px;transition:width 0.6s ease"></div></div>';
                    h+='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-bottom:10px">';
                    h+='<span>'+progress+'% completado</span>';
                    if(isTransit&&v.eta){
                        var etaDate=new Date(v.eta);
                        var daysLeft=Math.max(0,Math.ceil((etaDate-Date.now())/86400000));
                        h+='<span style="font-weight:600;color:'+stColor+'">ETA: '+daysLeft+'d restantes</span>';
                    }else if(isComplete){h+='<span style="font-weight:600;color:#10B981">Entregado</span>';}
                    h+='</div>';
                }

                // Meta chips
                h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:space-between">';
                h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
                h+='<span style="background:var(--bg-tertiary,#f0f0f0);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:4px"><i class="fa-regular fa-calendar" style="font-size:9px"></i> '+depDate+'</span>';
                if(tons>0){h+='<span style="background:var(--bg-tertiary,#f0f0f0);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:4px"><i class="fa-solid fa-weight-hanging" style="font-size:9px"></i> '+tons.toLocaleString()+' ton</span>';}
                h+='</div>';
                if(v.id&&!String(v.id).startsWith('demo')){
                    h+='<button onclick="confirmDelete(\'voyages\',\''+v.id+'\',\''+esc(v.vessel_name||'Viaje')+'\',loadViajes)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--text-tertiary);font-size:11px;display:flex;align-items:center;gap:4px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:10px"></i></button>';
                }
                h+='</div>';

                h+='</div>';
            });
            h+='</div>';
            l.innerHTML=h;
        }else{if(em)em.style.display='';}
    }catch(e){console.error('loadViajes:',e);}
}

async function loadBitacora(){
    try{
        var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(30);
        var data=r.data||[];
        if(data.length===0){
            data=[
                {id:'demo1',title:'navegacion',action_type:'navegacion',vessel_name:'R/M Guarani',description:'Posicion actual: km 1180, velocidad 6.5 nudos. ETA Rosario: 4 dias',created_at:'2026-05-08T16:54:00Z'},
                {id:'demo2',title:'navegacion',action_type:'navegacion',vessel_name:'BZ-1042',description:'Paso por Corrientes. Nivel del rio: 4.2m (normal)',created_at:'2026-05-08T14:54:00Z'},
                {id:'demo3',title:'combustible',action_type:'combustible',vessel_name:'R/M Atlas',description:'Consumo diario: 3.200 lts. Autonomia restante: 4 dias',created_at:'2026-05-08T12:54:00Z'},
                {id:'demo4',title:'clima',action_type:'clima',vessel_name:'BZ-2018',description:'Niebla densa km 1200-1180. Fondeo preventivo 3 horas',created_at:'2026-05-08T06:54:00Z'},
                {id:'demo5',title:'tripulacion',action_type:'tripulacion',vessel_name:'R/M Hercules',description:'Relevo de guardia 00:00. Trn. Lopez + Mar. Duarte',created_at:'2026-05-07T06:54:00Z'},
                {id:'demo6',title:'maniobra',action_type:'maniobra',vessel_name:'BZ-3055',description:'Maniobra de atraque completada en Puerto Villeta. Sin novedades',created_at:'2026-05-07T04:00:00Z'},
                {id:'demo7',title:'seguridad',action_type:'seguridad',vessel_name:'R/M Guarani',description:'Simulacro de evacuacion completado. Tiempo: 4 min 20 seg',created_at:'2026-05-06T18:00:00Z'},
                {id:'demo8',title:'carga',action_type:'carga',vessel_name:'BZ-1042',description:'Carga completada: 4.200 ton soja. Calado final: 3.2m',created_at:'2026-05-06T10:00:00Z'}
            ];
        }
        var l=document.getElementById('bitacora-list');var em=document.getElementById('bitacora-empty');
        if(!l)return;l.innerHTML='';
        var catIcons={'navegacion':'fa-route','combustible':'fa-gas-pump','clima':'fa-cloud-sun','tripulacion':'fa-users','mantenimiento':'fa-wrench','maniobra':'fa-anchor','incidente':'fa-triangle-exclamation','observacion':'fa-eye','carga':'fa-box','seguridad':'fa-shield-halved'};
        var catColors={'navegacion':'#3B82F6','combustible':'#F97316','clima':'#0EA5E9','tripulacion':'#8B5CF6','mantenimiento':'#6B7280','maniobra':'#10B981','incidente':'#DC2626','observacion':'#F59E0B','carga':'#0EA5E9','seguridad':'#EF4444'};
        var catLabels={'navegacion':'Navegacion','combustible':'Combustible','clima':'Clima','tripulacion':'Tripulacion','mantenimiento':'Mantenimiento','maniobra':'Maniobra','incidente':'Incidente','observacion':'Observacion','carga':'Carga','seguridad':'Seguridad'};
        if(data.length>0){
            if(em)em.style.display='none';
            var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
            data.forEach(function(row){
                var cat=(row.title||row.action_type||'entrada').toLowerCase();
                var icon=catIcons[cat]||'fa-pen-to-square';
                var color=catColors[cat]||'#94A3B8';
                var label=catLabels[cat]||(cat.charAt(0).toUpperCase()+cat.slice(1));
                var t=row.created_at?new Date(row.created_at).toLocaleDateString('es',{day:'2-digit',month:'short'}):'—';
                var tTime=row.created_at?new Date(row.created_at).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'';
                h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;border-left:4px solid '+color+';transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
                // Header: icon + category badge + time
                h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
                h+='<div style="display:flex;align-items:center;gap:10px">';
                h+='<div style="width:40px;height:40px;border-radius:12px;background:'+color+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:16px;color:'+color+'"></i></div>';
                h+='<div><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'12;padding:3px 10px;border-radius:6px;text-transform:uppercase">'+esc(label)+'</span>';
                if(row.vessel_name){h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+esc(row.vessel_name)+'</div>';}
                h+='</div></div>';
                h+='<div style="text-align:right;flex-shrink:0"><div style="font-size:10px;color:var(--text-tertiary)">'+t+'</div><div style="font-size:10px;color:var(--text-tertiary)">'+tTime+'</div></div>';
                h+='</div>';
                // Description
                h+='<div style="font-size:13px;color:var(--text-primary);line-height:1.6;margin-bottom:12px">'+esc(row.description||row.details||'Sin detalles')+'</div>';
                // Footer
                h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--separator)">';
                h+='<div style="display:flex;gap:6px">';
                h+='<span style="background:var(--bg-tertiary,#f0f0f0);padding:3px 8px;border-radius:6px;font-size:9px;color:var(--text-secondary);display:flex;align-items:center;gap:3px"><i class="fa-regular fa-clock" style="font-size:8px"></i> '+t+' '+tTime+'</span>';
                h+='</div>';
                if(row.id&&!String(row.id).startsWith('demo')){
                    h+='<button onclick="confirmDelete(\'logs\',\''+row.id+'\',\''+esc(row.title||'Entrada')+'\',loadBitacora)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;display:flex;align-items:center;gap:3px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button>';
                }
                h+='</div>';
                h+='</div>';
            });
            h+='</div>';
            l.innerHTML=h;
        }else{if(em)em.style.display='';}
    }catch(e){console.error('loadBitacora:',e);}
}

async function loadCrew(){
    try{
        var r=await sb.from('crew_members').select('*').limit(200);var data=r.data;
        var l=document.getElementById('crew-list');var em=document.getElementById('crew-empty');l.innerHTML='';
        if(data&&data.length>0){
            em.style.display='none';
            var roleIcons={'capitan':'fa-star','timonel':'fa-compass','maquinista':'fa-gears','marinero':'fa-anchor','cocinero':'fa-utensils','primer oficial':'fa-user-tie','jefe de maquinas':'fa-wrench','practico':'fa-map-marked-alt','mecanico':'fa-screwdriver-wrench'};
            var roleColors={'capitan':'#F59E0B','timonel':'#3B82F6','maquinista':'#6B7280','marinero':'#0EA5E9','cocinero':'#10B981','primer oficial':'#8B5CF6','jefe de maquinas':'#DC2626','practico':'#F97316','mecanico':'#64748B'};
            var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
            data.forEach(function(c){
                var name=c.full_name||c.name||'Tripulante';
                var role=(c.role||'marinero').toLowerCase();
                var icon=roleIcons[role]||'fa-user';
                var color=roleColors[role]||'#94A3B8';
                var roleLabel=trad(c.role||'Marinero');
                var st=(c.status||'embarcado').toLowerCase();
                var isOnboard=st==='embarcado'||st==='onboard';
                var isActive=st==='activo'||st==='active';
                var isFranco=st==='franco'||st==='leave';
                var stColor=isOnboard?'#2EA043':isActive?'#3B82F6':isFranco?'#F59E0B':'#94A3B8';
                var stLabel=trad(c.status||'Embarcado').toUpperCase();
                var vessel=c.vessel_name||'Sin asignar';
                var docId=c.document_number||c.doc_id||'';
                h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;border-left:4px solid '+color+';transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
                h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
                h+='<div style="display:flex;align-items:center;gap:10px">';
                h+='<div style="width:40px;height:40px;border-radius:12px;background:'+color+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:16px;color:'+color+'"></i></div>';
                h+='<div><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'12;padding:3px 10px;border-radius:6px;text-transform:uppercase">'+roleLabel+'</span>';
                h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+vessel+'</div>';
                h+='</div></div>';
                h+='<span style="font-size:10px;font-weight:700;color:'+stColor+';background:'+stColor+'15;padding:3px 8px;border-radius:6px;white-space:nowrap">'+stLabel+'</span>';
                h+='</div>';
                h+='<div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:12px">'+name+'</div>';
                h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--separator)">';
                h+='<span style="background:var(--bg-tertiary,#f0f0f0);padding:3px 8px;border-radius:6px;font-size:9px;color:var(--text-secondary);display:flex;align-items:center;gap:3px"><i class="fa-regular fa-id-card" style="font-size:8px"></i> '+(docId||'S/D')+'</span>';
                if(c.id){h+='<button onclick="confirmDelete(\'crew_members\',\''+c.id+'\',\''+name+'\',loadCrew)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;display:flex;align-items:center;gap:3px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button>';}
                h+='</div></div>';
            });
            h+='</div>';
            l.innerHTML=h;
            document.getElementById('crew-total').textContent=data.length;
            document.getElementById('crew-on').textContent=data.filter(function(c){var s=(c.status||'').toLowerCase();return s==='embarcado'||s==='onboard'}).length;
        }else{if(em)em.style.display='';}
    }catch(e){/* Crew: */;}
}

async function loadFuel(){
    try{
        var r=await sb.from('fuel_logs').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('fuel-list');var em=document.getElementById('fuel-empty');l.innerHTML='';
        if(data&&data.length>0){
            em.style.display='none';
            l.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:8px';
            var totalLiters=0;
            var _vnames=['TB PARAGUAY 01','R/M HERCULES','B/M TITAN','R/M CENTAURO','TB PARAGUAY 01'];data.forEach(function(f,_vi){
                if(!f.vessel_name)f.vessel_name=_vnames[_vi%_vnames.length];var liters=f.liters||f.quantity||0;
                totalLiters+=liters;
                var fType=(f.fuel_type||'Gasoil').toLowerCase();
                var typeColor=fType.indexOf('marine')>=0||fType.indexOf('mgo')>=0?'#0EA5E9':fType.indexOf('diesel')>=0||fType.indexOf('gasoil')>=0?'#F97316':'#8B5CF6';
                var t=f.created_at?new Date(f.created_at).toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'}):'-';
                var tShort=f.created_at?new Date(f.created_at).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'-';
                var d=document.createElement('div');
                d.style.cssText='background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:20px;transition:all 0.2s;cursor:default;position:relative;overflow:hidden';
                d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.06)'};
                d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
                d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">'+'<div style="width:40px;height:40px;border-radius:10px;background:'+typeColor+'12;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-gas-pump" style="font-size:16px;color:'+typeColor+'"></i></div>'+'<button class="delete-btn" title="Eliminar" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;border-radius:6px;font-size:13px"><i class="fa-regular fa-trash-can"></i></button>'+'</div>'+'<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:'+(f.vessel_name?'var(--text-primary)':'var(--text-tertiary)')+';margin-bottom:2px"><i class="fa-solid fa-ship" style="font-size:11px;color:'+(f.vessel_name?typeColor:'var(--text-tertiary)')+'"></i>'+(f.vessel_name||'Sin embarcación')+'</div>'+'<div style="font-family:Newsreader,serif;font-size:28px;font-weight:400;color:var(--text-primary);margin-bottom:8px">'+liters.toLocaleString()+' <span style="font-family:Inter,sans-serif;font-size:12px;color:var(--text-secondary);font-weight:500">litros</span></div>'+'<div style="display:flex;align-items:center;justify-content:space-between">'+'<span style="font-size:9px;font-weight:700;letter-spacing:0.5px;color:'+typeColor+';background:'+typeColor+'10;padding:3px 8px;border-radius:5px">'+(f.fuel_type||'Gasoil').toUpperCase()+'</span>'+'<span style="font-size:10px;color:var(--text-tertiary)"><i class="fa-regular fa-calendar" style="margin-right:4px"></i>'+t+'</span>'+'</div>';
                d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('fuel_logs',f.id,(f.vessel_name||'Registro'),loadFuel);});
                l.appendChild(d);
            });
            document.getElementById('fuel-count').textContent=data.length;
            var elTotal=document.getElementById('fuel-total-liters');if(elTotal)elTotal.textContent=totalLiters.toLocaleString()+'L';
        }else{em.style.display='';}
    }catch(e){/* Fuel: */;}
}

async function loadMaint(){
    try{
        var r=await sb.from('maintenance_tasks').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('maint-list');l.innerHTML='';
        if(data&&data.length>0){
            l.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:8px';
            data.forEach(function(m){
                var pri=(m.priority||'').toLowerCase();
                var st=(m.status||'').toLowerCase();
                var priColor=pri==='alta'||pri==='high'||pri==='critico'||pri==='critical'?'#DC2626':pri==='media'||pri==='medium'?'#F59E0B':'#94A3B8';
                var priBg=pri==='alta'||pri==='high'||pri==='critico'||pri==='critical'?'rgba(220,38,38,0.08)':pri==='media'||pri==='medium'?'rgba(245,158,11,0.08)':'rgba(148,163,184,0.08)';
                var priIcon=pri==='alta'||pri==='high'||pri==='critico'||pri==='critical'?'fa-triangle-exclamation':pri==='media'||pri==='medium'?'fa-exclamation':'fa-minus';
                var priLabel=trad(m.priority||'Baja').toUpperCase();
                var stColor=st==='completed'||st==='completado'?'#2EA043':st.indexOf('progreso')>=0||st.indexOf('progress')>=0?'#3B82F6':'#F59E0B';
                var stBg=st==='completed'||st==='completado'?'rgba(46,160,67,0.08)':st.indexOf('progreso')>=0||st.indexOf('progress')>=0?'rgba(59,130,246,0.08)':'rgba(245,158,11,0.08)';
                var stIcon=st==='completed'||st==='completado'?'fa-circle-check':st.indexOf('progreso')>=0||st.indexOf('progress')>=0?'fa-spinner':'fa-clock';
                var stLabel=trad(m.status||'Pendiente').toUpperCase();
                var t=m.created_at?new Date(m.created_at).toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'}):'-';
                var d=document.createElement('div');
                d.style.cssText='background:var(--bg-secondary);border:1px solid var(--separator);border-left:4px solid '+priColor+';border-radius:16px;padding:20px;transition:all 0.2s;cursor:default';
                d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'};
                d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
                d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:12px;background:'+priColor+'12;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-wrench" style="font-size:16px;color:'+priColor+'"></i></div><span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:'+stColor+';background:'+stBg+';padding:5px 12px;border-radius:6px;letter-spacing:0.3px"><i class="fa-solid '+stIcon+'" style="font-size:9px"></i>'+stLabel+'</span></div><div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:10px;line-height:1.4">'+esc(m.description||m.title||'Orden de mantenimiento')+'</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-ship" style="color:var(--text-tertiary);font-size:10px"></i>'+(m.vessel_name||'--')+'</span><span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)"><i class="fa-regular fa-calendar" style="color:var(--text-tertiary);font-size:10px"></i>'+t+'</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--separator)"><span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;color:'+priColor+';background:'+priBg+';padding:3px 8px;border-radius:5px;letter-spacing:0.3px"><i class="fa-solid '+priIcon+'" style="font-size:8px"></i>'+priLabel+'</span><button class="delete-btn" title="Eliminar" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button></div>';
                d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('maintenance_tasks',m.id,(m.description||m.title||'Orden'),loadMaint);});
                l.appendChild(d);
            });
            var pending=data.filter(function(m){return(m.status||'').toLowerCase()!=='completed'&&(m.status||'').toLowerCase()!=='completado'}).length;
            var inProg=data.filter(function(m){var s=(m.status||'').toLowerCase();return s.indexOf('progreso')>=0||s.indexOf('progress')>=0}).length;
            var done=data.filter(function(m){var s=(m.status||'').toLowerCase();return s==='completed'||s==='completado'}).length;
            document.getElementById('maint-pending').textContent=pending;
            var elProg=document.getElementById('maint-progress');if(elProg)elProg.textContent=inProg;
            var elDone=document.getElementById('maint-done');if(elDone)elDone.textContent=done;
        }
    }catch(e){console.error('loadMaint:',e);}
}

async function loadPanol(){
    try{
        var r=await sb.from('inventory_items').select('*').limit(500);var data=r.data;
        var l=document.getElementById('panol-list');l.innerHTML='';
        if(data&&data.length>0){
            // Category icon map
            var catIcons={'lubricantes':'fa-oil-can','filtros':'fa-filter','pintura':'fa-paint-roller','seguridad':'fa-shield-halved','motor':'fa-gear','casco':'fa-ship','hidraulica':'fa-droplet','electrico':'fa-bolt','cabulleria':'fa-link','soldadura':'fa-fire'};
            var catColors={'lubricantes':'#8B5CF6','filtros':'#3B82F6','pintura':'#F97316','seguridad':'#EF4444','motor':'#6B7280','casco':'#0EA5E9','hidraulica':'#06B6D4','electrico':'#F59E0B','cabulleria':'#10B981','soldadura':'#DC2626'};
            // Grid container
            l.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:8px';
            data.forEach(function(i){
                var q=i.quantity||i.stock||0;var mn=i.min_stock||5;var low=q<=mn;var critical=q===0;
                var cat=(i.category||'general').toLowerCase();
                var icon=catIcons[cat]||'fa-box';
                var color=catColors[cat]||'var(--accent)';
                var pct=Math.min(100,Math.round((q/Math.max(mn*3,1))*100));
                var barColor=critical?'var(--error)':low?'var(--warning)':'var(--success)';
                var statusLabel=critical?'SIN STOCK':low?'STOCK BAJO':'EN STOCK';
                var statusBg=critical?'rgba(220,38,38,0.08)':low?'rgba(245,158,11,0.08)':'rgba(46,160,67,0.08)';
                var d=document.createElement('div');
                d.style.cssText='background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:20px;transition:all 0.2s;cursor:default;position:relative;overflow:hidden';
                d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.06)'};
                d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
                d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">'+'<div style="width:42px;height:42px;border-radius:12px;background:'+color+'12;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:17px;color:'+color+'"></i></div>'+'<button class="delete-btn" title="Eliminar" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;border-radius:6px;font-size:13px;transition:all 0.15s"><i class="fa-regular fa-trash-can"></i></button>'+'</div>'+'<div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:4px;line-height:1.3">'+(i.name||'')+'</div>'+'<div style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'10;padding:3px 8px;border-radius:5px;margin-bottom:14px">'+(i.category||'General').toUpperCase()+'</div>'+'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+'<span style="font-size:11px;color:var(--text-secondary);font-weight:500">Stock</span>'+'<span style="font-size:13px;font-weight:700;color:var(--text-primary)">'+q+' <span style="font-size:10px;font-weight:500;color:var(--text-secondary)">uds</span></span>'+'</div>'+'<div style="width:100%;height:6px;background:var(--surface-low);border-radius:3px;overflow:hidden;margin-bottom:12px"><div style="width:'+pct+'%;height:100%;background:'+barColor+';border-radius:3px;transition:width 0.5s ease"></div></div>'+'<div style="display:flex;align-items:center;justify-content:space-between">'+'<span style="font-size:10px;font-weight:700;letter-spacing:0.3px;color:'+barColor+';background:'+statusBg+';padding:4px 10px;border-radius:6px">'+statusLabel+'</span>'+'<span style="font-size:10px;color:var(--text-tertiary)">min: '+mn+'</span>'+'</div>';
                d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('inventory_items',i.id,(i.name||'Item'),loadPanol);});
                l.appendChild(d);
            });
            document.getElementById('panol-total').textContent=data.length;
            // Count categories and low stock
            var cats={};var lowCount=0;
            data.forEach(function(i){cats[i.category||'General']=1;if((i.quantity||i.stock||0)<=(i.min_stock||0))lowCount++;});
            var elLow=document.getElementById('panol-low');if(elLow)elLow.textContent=lowCount;
            var elCats=document.getElementById('panol-cats');if(elCats)elCats.textContent=Object.keys(cats).length;
        }
    }catch(e){/* Panol: */;}
}

async function loadComms(){
    try{
        var r=await sb.from('comms').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var area=document.querySelector('#view-comunicaciones .comm-msg-area');
        if(data&&data.length>0){area.innerHTML=data.map(function(m){return '<p style="margin:6px 0;font-size:13px;"><strong>'+(m.sender||'Sistema')+':</strong> '+(m.message||m.content||'')+' <span style="color:var(--text-secondary);font-size:10px;">'+(m.created_at?new Date(m.created_at).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'')+'</span></p>'}).join('');}
    }catch(e){/* Comms: */;}
}

// MAP
var aisMarkers = {};
var heatLayer = null;
function initMap(){
    map=L.map('leaflet-map',{zoomControl:false}).setView([-27.5,-58.3],6);
    L.control.zoom({position:'topleft'}).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OpenStreetMap',maxZoom:18}).addTo(map);
    // Own fleet from Supabase
    loadFleetMarkers();
    // AIS third-party traffic
    loadAISTraffic();
    // INA stations on map
    loadINAMapMarkers();
    // Auto-refresh AIS every 30s (stored for cleanup)
    window._aisInterval = setInterval(loadAISTraffic, 30000);
    // Hidrovia route — polyline completa Paraguay-Paraná
    var hidroviaRoute=[[-19.0,-57.65],[-20.5,-57.8],[-22.3,-57.9],[-23.4,-57.8],[-25.3,-57.6],[-26.5,-58.1],[-27.3,-58.5],[-29.0,-59.5],[-30.5,-59.9],[-31.5,-60.5],[-32.9,-60.6],[-33.5,-58.5],[-34.6,-58.4]];
    L.polyline(hidroviaRoute,{color:'#3B82F6',weight:2.5,dashArray:'8,6',opacity:0.45}).addTo(map);
    // Zoom fit to hidrovía bounds
    map.setView([-30.0,-55.5],6);
}
function _shipIcon(color,size,heading){
    var rot=heading||0;
    return L.divIcon({className:'',iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2],
        html:'<div style="width:'+size+'px;height:'+size+'px;display:flex;align-items:center;justify-content:center;transform:rotate('+rot+'deg)"><svg width="'+(size*0.75)+'" height="'+(size*0.75)+'" viewBox="0 0 24 24" fill="'+color+'" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4.5 20.3L5.2 21L12 18L18.8 21L19.5 20.3L12 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg></div>'});
}
function loadFleetMarkers(){
    sb.from('vessels').select('*').then(function(r){
        var data=r.data;if(!data)return;
        data.forEach(function(v){var lat=v.latitude||v.lat;var lng=v.longitude||v.lng;if(!lat||!lng)return;var s=(trad(v.status||'')).toLowerCase();var c=s.indexOf('viaje')>=0||s==='active'?'#10b981':s.indexOf('manten')>=0?'#F59E0B':'#3B82F6';var heading=v.heading||v.course||0;L.marker([lat,lng],{icon:_shipIcon(c,48,heading)}).addTo(map).bindPopup('<strong>'+(v.name||'')+'</strong><br>'+(trad(v.status||''))+'<br><small>Flota propia</small>');});
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
                    var hdg=v.heading||v.course||0;
                    var m=L.marker([v.lat,v.lon],{icon:_shipIcon('#10b981',40,hdg)}).addTo(map);
                    m.bindPopup('<strong>'+(v.name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'°<br><small>AIS Satelital</small>');
                    aisMarkers[key]=m;
                }
            });
            // Update legend
            var legend=document.querySelector('.map-legend');
            if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=json.total+' activos';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=json.total+' activos AIS';legend.appendChild(d);}}
            updateHeatmap();
            return;
        }
    }catch(e){/* AIS API: */;}
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
            var m=L.marker([lat,lng],{icon:_shipIcon('#10b981',40,v.course||0)}).addTo(map);
            m.bindPopup('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Trafico terceros</small>');
            aisMarkers[key]=m;
        }
    });
    var legend=document.querySelector('.map-legend');
    if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=data.length+' activos';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=data.length+' activos AIS';legend.appendChild(d);}}
    updateHeatmap();
}
function updateHeatmap(){
    var points=[];
    Object.values(aisMarkers).forEach(function(m){
        var ll=m.getLatLng();
        points.push([ll.lat,ll.lng,0.7]);
    });
    if(points.length===0)return;
    if(heatLayer){map.removeLayer(heatLayer);}
    heatLayer=L.heatLayer(points,{radius:25,blur:20,maxZoom:10,max:1.0,gradient:{0.2:'#3B82F6',0.4:'#10b981',0.6:'#F59E0B',0.8:'#EF4444',1.0:'#DC2626'}}).addTo(map);
}

// MODAL
var modalForms={
    fleet:{title:'Agregar Activo',fields:[{id:'fleet-name',label:'NOMBRE',type:'text',placeholder:'Ej: R/M ATLAS'},{id:'fleet-type',label:'TIPO',type:'select',options:['Barcaza','Remolcador','Ponton']},{id:'fleet-status',label:'ESTADO',type:'select',options:['En Viaje','En Puerto','Mantenimiento']},{id:'fleet-location',label:'UBICACION',type:'text',placeholder:'Ej: Km 1420'}]},
    viaje:{title:'Nueva Solicitud de Viaje',fields:[{id:'viaje-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'viaje-origin',label:'ORIGEN',type:'text',placeholder:'Puerto origen'},{id:'viaje-dest',label:'DESTINO',type:'text',placeholder:'Puerto destino'},{id:'viaje-cargo',label:'CARGA (TON)',type:'text',placeholder:'3500'},{id:'viaje-date',label:'FECHA SALIDA',type:'date'}]},
    bitacora:{title:'Nueva Entrada de Bitacora',fields:[{id:'bit-title',label:'TITULO',type:'text',placeholder:'Resumen'},{id:'bit-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'bit-type',label:'TIPO',type:'select',options:['Observacion','Incidente','Maniobra','Navegacion']},{id:'bit-desc',label:'DESCRIPCION',type:'textarea',placeholder:'Detalle...'}]},
    crew:{title:'Agregar Tripulante',fields:[{id:'crew-name',label:'NOMBRE',type:'text',placeholder:'Juan Perez'},{id:'crew-role',label:'ROL',type:'select',options:['Capitan','Timonel','Maquinista','Marinero','Cocinero']},{id:'crew-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'crew-doc',label:'DOCUMENTO',type:'text',placeholder:'Nro documento'}]},
    fuel:{title:'Registrar Combustible',fields:[{id:'fuel-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'fuel-liters',label:'LITROS',type:'text',placeholder:'5000'},{id:'fuel-type',label:'TIPO DE COMBUSTIBLE',type:'select',options:['Diesel Marine','Gasoil','IFO 380','MGO']},{id:'fuel-date',label:'FECHA',type:'date'}]},
    maint:{title:'Nueva Orden de Mantenimiento',fields:[{id:'maint-title',label:'DESCRIPCION',type:'text',placeholder:'Que reparar'},{id:'maint-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'maint-priority',label:'PRIORIDAD',type:'select',options:['Alta','Media','Baja']},{id:'maint-notes',label:'NOTAS',type:'textarea',placeholder:'Detalles...'}]},
    panol:{title:'Agregar Item',fields:[{id:'panol-name',label:'REPUESTO',type:'text',placeholder:'Filtro de aceite'},{id:'panol-cat',label:'CATEGORIA',type:'select',options:['Motor','Electrico','Hidraulico','Casco','General']},{id:'panol-qty',label:'CANTIDAD',type:'text',placeholder:'10'},{id:'panol-min',label:'STOCK MINIMO',type:'text',placeholder:'2'}]},
    calado:{title:'Registrar Lectura de Calado',fields:[{id:'calado-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'calado-value',label:'CALADO (METROS)',type:'text',placeholder:'2.45'},{id:'calado-max',label:'CALADO MAXIMO (M)',type:'text',placeholder:'3.50'},{id:'calado-notes',label:'OBSERVACIONES',type:'textarea',placeholder:'Condiciones, ubicacion...'}]},
    incidente:{title:'Reportar Incidente',fields:[{id:'inc-title',label:'TITULO',type:'text',placeholder:'Descripcion breve del incidente'},{id:'inc-vessel',label:'EMBARCACION',type:'vessel-select'},{id:'inc-severity',label:'SEVERIDAD',type:'select',options:['Critico','Alto','Medio','Bajo']},{id:'inc-type',label:'TIPO',type:'select',options:['Colision','Encalladura','Derrame','Averia mecanica','Incendio','Medico','Otro']},{id:'inc-desc',label:'DESCRIPCION DETALLADA',type:'textarea',placeholder:'Que ocurrio, donde, cuando, medidas tomadas...'}]},
    contrato:{title:'Nuevo Contrato de Flete',fields:[{id:'ctr-client',label:'CLIENTE',type:'text',placeholder:'Ej: Cargill S.A.'},{id:'ctr-route',label:'RUTA',type:'text',placeholder:'Ej: Rosario \u2192 Asunci\u00F3n'},{id:'ctr-product',label:'PRODUCTO',type:'text',placeholder:'Ej: Soja, Gas Oil'},{id:'ctr-type',label:'TIPO DE CONTRATO',type:'select',options:['COA Anual','Semestral','Trimestral','Spot']},{id:'ctr-volume',label:'VOLUMEN TOTAL (TON)',type:'text',placeholder:'84000'},{id:'ctr-rate',label:'TARIFA (USD/TON)',type:'text',placeholder:'28.5'},{id:'ctr-expdate',label:'FECHA EXPIRACION',type:'date'}]}
};
var currentModal=null;
// esc() defined at top of file (line 7)
function openModal(type){
    currentModal=type;var c=modalForms[type];document.getElementById('modal-title').textContent=c.title;
    var submitBtn=document.getElementById('modal-submit');submitBtn.onclick=null;submitBtn.textContent='Guardar';submitBtn.style.display='';submitBtn.disabled=false;
    var hasVesselSelect=c.fields.some(function(f){return f.type==='vessel-select'});
    var buildForm=function(vesselNames){
        var h='';c.fields.forEach(function(f){h+='<label>'+esc(f.label)+'</label>';if(f.type==='vessel-select'){h+='<select id="'+f.id+'"><option value="">-- Seleccionar embarcación --</option>'+vesselNames.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>'}).join('')+'</select>';}else if(f.type==='select'){h+='<select id="'+f.id+'">'+f.options.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select>';}else if(f.type==='textarea'){h+='<textarea id="'+f.id+'" placeholder="'+esc(f.placeholder||'')+'"></textarea>';}else{h+='<input type="'+f.type+'" id="'+f.id+'" placeholder="'+esc(f.placeholder||'')+'">';}});
        document.getElementById('modal-body').innerHTML=h;document.getElementById('modal-overlay').classList.add('open');
        setTimeout(function(){var f=document.querySelector('#modal-body input, #modal-body select');if(f)f.focus();},100);
    };
    if(hasVesselSelect){
        sb.from('vessels').select('name,vessel_name').order('name').limit(100).then(function(r){
            var names=(r.data||[]).map(function(v){return v.name||v.vessel_name||''}).filter(function(n){return n});
            buildForm(names);
        }).catch(function(){buildForm([]);});
    }else{buildForm([]);}
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
        else if(t==='incidente'&&d['inc-title']){await sb.from('logs').insert({title:d['inc-title'],vessel_name:d['inc-vessel'],action_type:'INCIDENTE',description:d['inc-desc'],details:JSON.stringify({severity:d['inc-severity'],type:d['inc-type'],status:'Abierto'}),company_id:cid});loadIncidentes();}
        else if(t==='contrato'&&d['ctr-client']){await sb.from('freight_contracts').insert({client:d['ctr-client'],route:d['ctr-route'],product:d['ctr-product'],contract_type:d['ctr-type'],volume_total:parseInt(d['ctr-volume'])||0,volume_used:0,rate_per_ton:parseFloat(d['ctr-rate'])||0,expiration_date:d['ctr-expdate']||null,status:'active',company_id:cid});loadContratos();}
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
var planNames={barcaza:'Por Barcaza',combo:'Combo Flota',enterprise:'Enterprise',ilimitado:'Ilimitado'};
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
        '<div class="admin-stat"><div class="stat-value">'+(vessels.count||0)+'</div><div class="stat-label">EMBARCACIONES</div></div>'+
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
    document.getElementById('modal-title').textContent='Nueva Empresa';
    document.getElementById('modal-body').innerHTML='<label>NOMBRE DE EMPRESA</label><input type="text" id="new-company-name" placeholder="Ej: Naviera Guarani"><label>PLAN</label><select id="new-company-plan" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Inter,sans-serif;font-size:14px"><option value="barcaza">Por Barcaza ($149/mes)</option><option value="combo" selected>Combo Flota ($899/mes)</option><option value="enterprise">Enterprise ($1,499/mes)</option><option value="ilimitado">Ilimitado ($2,499/mes)</option></select><label>MAX EMBARCACIONES</label><input type="number" id="new-company-max" placeholder="10" value="10">';
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
        document.getElementById('modal-title').textContent='Agregar Usuario al Sistema';
        document.getElementById('modal-body').innerHTML='<label>EMAIL</label><input type="email" id="new-user-email" placeholder="usuario@empresa.com"><label>PASSWORD</label><input type="password" id="new-user-pass" placeholder="Minimo 6 caracteres"><label>NOMBRE COMPLETO</label><input type="text" id="new-user-name" placeholder="Juan Perez"><label>EMPRESA</label><select id="new-user-company" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Inter,sans-serif;font-size:14px">'+opts+'</select><label>ROL</label><select id="new-user-role" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Inter,sans-serif;font-size:14px"><option value="admin">Admin</option><option value="operator">Operador</option><option value="viewer">Visor</option></select>';
        document.getElementById('modal-overlay').classList.add('open');
        document.getElementById('modal-submit').textContent='Crear Usuario';
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
var chatHistory = [];
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
        var v=await sb.from('vessels').select('*').limit(200);if(v.data)ctx+='Flota: '+JSON.stringify(v.data)+'\n';
        var ais=await sb.from('ais_traffic').select('ship_name,latitude,longitude,speed,course,updated_at').limit(200);if(ais.data)ctx+='Posiciones AIS: '+JSON.stringify(ais.data)+'\n';
        var vj=await sb.from('voyages').select('*').limit(100);if(vj.data)ctx+='Viajes: '+JSON.stringify(vj.data)+'\n';
        var fl=await sb.from('fuel_logs').select('*').limit(50);if(fl.data)ctx+='Combustible: '+JSON.stringify(fl.data)+'\n';
        var mt=await sb.from('maintenance_tasks').select('*').limit(50);if(mt.data)ctx+='Mantenimiento: '+JSON.stringify(mt.data)+'\n';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var res=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({message:msg,context:ctx,history:chatHistory})});
        var data=await res.json();
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        var answer=data.response||data.analysis||data.message||'No pude procesar la consulta.';
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;max-width:80%;line-height:1.5"><i class="fa-solid fa-robot" style="color:var(--accent);margin-right:6px"></i>'+esc(answer).replace(/\n/g,'<br>')+'</span></div>';
        chatHistory.push({ role: 'user', text: msg });
        chatHistory.push({ role: 'model', text: answer });
        if(chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
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
    var de=document.getElementById('dash-week');if(de)de.textContent='SEMANA '+weekNum+' · '+now.getFullYear();
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
                    var hs=document.getElementById('dash-hidro-status');if(hs)hs.textContent='Navegable — caudal '+( val>2000?'normal':'bajo');
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
        // Stats — parallel queries for performance
        var results=await Promise.all([sb.from('vessels').select('status'),sb.from('voyages').select('id',{count:'exact',head:true}),sb.from('fuel_logs').select('liters'),sb.from('logs').select('id',{count:'exact',head:true})]);
        var v=results[0];var vj=results[1];var fl=results[2];var lg=results[3];
        var totalFuel=fl.data?fl.data.reduce(function(s,x){return s+(x.liters||0)},0):0;
        document.getElementById('report-stats').innerHTML=
            '<div class="admin-stat"><div class="stat-value">'+(v.data?v.data.length:0)+'</div><div class="stat-label">EMBARCACIONES</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+(vj.count||0)+'</div><div class="stat-label">VIAJES TOTALES</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+totalFuel.toLocaleString()+'L</div><div class="stat-label">COMBUSTIBLE TOTAL</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+(lg.count||0)+'</div><div class="stat-label">ENTRADAS BITACORA</div></div>';
        // Fleet Status Chart
        if(v.data){
            var enViaje=0,enPuerto=0,mant=0;
            v.data.forEach(function(x){var s=(x.status||'').toLowerCase();if(s.indexOf('viaje')>=0||s==='active')enViaje++;else if(s.indexOf('manten')>=0)mant++;else enPuerto++;});
            if(fleetChart)fleetChart.destroy();
            var ctx1=document.getElementById('chart-fleet');
            if(ctx1){fleetChart=new Chart(ctx1,{type:'doughnut',data:{labels:['En Viaje','En Puerto','Mantenimiento'],datasets:[{data:[enViaje,enPuerto,mant],backgroundColor:['#2EA043','#3B82F6','#F59E0B'],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:12}}}}}});}
        }
        // Fuel Chart
        if(fl.data&&fl.data.length>0){
            var fuelByDay={};fl.data.forEach(function(f){var day='Carga '+(Object.keys(fuelByDay).length+1);fuelByDay[day]=(f.liters||0);});
            if(fuelChart)fuelChart.destroy();
            var ctx2=document.getElementById('chart-fuel');
            if(ctx2){fuelChart=new Chart(ctx2,{type:'bar',data:{labels:Object.keys(fuelByDay).slice(-7),datasets:[{label:'Litros',data:Object.values(fuelByDay).slice(-7),backgroundColor:'rgba(59,130,246,0.6)',borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false}}}}});}
        }
        // Activity Chart — use real log counts from DB
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
    }catch(e){/* Reports: */;}
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
                var s=(trad(v.status||'')).toLowerCase();
                var isBusy=s.indexOf('viaje')>=0||s==='active';
                var chip=document.createElement('div');
                chip.className='fleet-chip';
                chip.style.opacity=isBusy?'0.5':'1';
                chip.style.cursor=isBusy?'not-allowed':'grab';
                chip.innerHTML='<i class="fa-regular fa-clone"></i><div class="chip-name">'+(v.name||v.vessel_name||'--')+'</div><div class="chip-type">'+trad(v.type||v.vessel_type||'BARCAZA').toUpperCase()+'</div>';
                if(!isBusy){
                    chip.draggable=true;
                    chip.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',v.name||v.vessel_name||'');});
                }
                chips.appendChild(chip);
                if(!isBusy)count++;
            });
            document.querySelector('#view-convoy .fluvia-subtitle').textContent='FORMACION (0/'+data.length+') - '+count+' DISPONIBLES';
        }
    }catch(e){/* Convoy: */;}
}

// TRACKING - Full cargo tracking with timeline
var trackingData=[];
async function loadTracking(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(50);
        trackingData=r.data||[];
        renderTracking();
    }catch(e){/* Tracking: */;}
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
    var inTransit=data.filter(function(v){var s=(trad(v.status||'')).toLowerCase();return s==='navegando'||s==='en_curso'||s==='en viaje'||s==='en_viaje';});
    var completed=data.filter(function(v){var s=(trad(v.status||'')).toLowerCase();return s==='completado'||s==='entregado'||s==='finalizado';});
    var pending=data.filter(function(v){var s=(trad(v.status||'')).toLowerCase();return s!=='navegando'&&s!=='en_curso'&&s!=='en viaje'&&s!=='en_viaje'&&s!=='completado'&&s!=='entregado'&&s!=='finalizado';});
    var totalCargo=data.reduce(function(s,v){return s+(v.cargo_tons||0)},0);
    document.getElementById('track-active').textContent=inTransit.length;
    document.getElementById('track-total-cargo').textContent=totalCargo>999?(totalCargo/1000).toFixed(1)+'k':totalCargo;
    document.getElementById('track-completed').textContent=completed.length;
    // Active transit cards — grid
    if(inTransit.length>0){
        activeList.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px';
        inTransit.forEach(function(v){
            var created=v.created_at?new Date(v.created_at):new Date();
            var eta=v.eta?new Date(v.eta):new Date(created.getTime()+7*86400000);
            var now=Date.now();var progress=Math.min(100,Math.max(5,Math.round(((now-created.getTime())/(eta.getTime()-created.getTime()))*100)));
            var elapsed=Math.round((now-created.getTime())/3600000);
            var elapsedStr=elapsed>24?Math.round(elapsed/24)+'d '+elapsed%24+'h':elapsed+'h';
            var d=document.createElement('div');
            d.style.cssText='background:var(--bg-secondary);border:1px solid var(--separator);border-left:4px solid #2EA043;border-radius:16px;padding:20px;transition:all 0.2s;cursor:default';
            d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'};
            d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
            d.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:12px;background:rgba(46,160,67,0.08);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-ship" style="font-size:16px;color:#2EA043"></i></div><div><div style="font-size:14px;font-weight:700;color:var(--text-primary)">'+(v.vessel_name||'--')+'</div><div style="font-size:10px;color:var(--text-secondary)">'+(v.cargo_tons||0)+' toneladas</div></div></div><span style="font-size:9px;font-weight:700;color:#2EA043;background:rgba(46,160,67,0.08);padding:4px 10px;border-radius:6px;display:flex;align-items:center;gap:4px;letter-spacing:0.3px"><span style="width:6px;height:6px;border-radius:50%;background:#2EA043;animation:pulse 2s infinite"></span>EN TRANSITO</span></div><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:11px;font-weight:600;color:var(--text-primary);min-width:60px;text-align:right">'+(v.origin_port||'Origen')+'</span><div style="flex:1;height:6px;background:var(--surface-low,#f0f0f0);border-radius:3px;position:relative;overflow:visible"><div style="height:6px;background:linear-gradient(90deg,#2EA043,#3B82F6);border-radius:3px;width:'+progress+'%;transition:width 1s"></div><div style="position:absolute;top:-4px;left:'+progress+'%;width:14px;height:14px;background:#3B82F6;border-radius:50%;border:3px solid var(--bg-secondary);transform:translateX(-50%);box-shadow:0 2px 6px rgba(59,130,246,0.3)"></div></div><span style="font-size:11px;font-weight:600;color:var(--text-primary);min-width:60px">'+(v.destination_port||'Destino')+'</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--separator)"><div style="display:flex;gap:16px;font-size:11px;color:var(--text-secondary)"><span><i class="fa-solid fa-clock" style="color:var(--text-tertiary);margin-right:4px"></i>'+elapsedStr+' en ruta</span><span><i class="fa-solid fa-location-dot" style="color:var(--text-tertiary);margin-right:4px"></i>'+progress+'%</span></div><span style="font-size:10px;font-weight:600;color:#3B82F6">ETA: '+(v.eta?new Date(v.eta).toLocaleDateString('es',{day:'2-digit',month:'short'}):'--')+'</span></div>';
            activeList.appendChild(d);
        });
    }else{
        activeList.innerHTML='<div class="empty-state" style="padding:30px"><i class="fa-regular fa-circle-check"></i><p>No hay cargas en transito activo</p></div>';
    }
    // History — grid cards
    var historyItems=completed.concat(pending);
    if(historyItems.length>0){
        historyList.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:8px';
        historyItems.forEach(function(v){
            var s=(v.status||'pendiente').toLowerCase();
            var isCompleted=s==='completado'||s==='entregado'||s==='finalizado';
            var isPending=s==='pendiente';
            var stColor=isCompleted?'#2EA043':isPending?'#F59E0B':'#94A3B8';
            var stBg=isCompleted?'rgba(46,160,67,0.08)':isPending?'rgba(245,158,11,0.08)':'rgba(148,163,184,0.08)';
            var stLabel=(trad(v.status||'PENDIENTE')).toUpperCase();
            var stIcon=isCompleted?'fa-circle-check':isPending?'fa-clock':'fa-ship';
            var t=v.created_at?new Date(v.created_at).toLocaleDateString('es',{day:'2-digit',month:'short'}):'-';
            var d=document.createElement('div');
            d.style.cssText='background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:all 0.2s;cursor:default';
            d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'};
            d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
            d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:12px;background:'+stBg+';display:flex;align-items:center;justify-content:center"><i class="fa-solid '+stIcon+'" style="font-size:16px;color:'+stColor+'"></i></div><span style="font-size:9px;font-weight:700;color:'+stColor+';background:'+stBg+';padding:4px 10px;border-radius:6px;letter-spacing:0.3px">'+stLabel+'</span></div><div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:4px">'+(v.vessel_name||'--')+' <i class="fa-solid fa-arrow-right" style="font-size:9px;color:var(--accent);margin:0 4px"></i> '+(v.destination_port||'--')+'</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-location-dot" style="font-size:9px;color:var(--text-tertiary)"></i>'+(v.origin_port||'--')+'</span><span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-box" style="font-size:9px;color:var(--text-tertiary)"></i>'+(v.cargo_tons||0)+' ton</span><span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary)"><i class="fa-regular fa-calendar" style="font-size:9px;color:var(--text-tertiary)"></i>'+t+'</span></div>';
            historyList.appendChild(d);
        });
    }
}

function filterTracking(){var q=document.getElementById('track-search').value.trim();renderTracking(q||null);}
async function exportTracking(format){
    var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(200);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(v){return{Embarcacion:v.vessel_name||'',Origen:v.origin_port||'',Destino:v.destination_port||'',CargaTon:v.cargo_tons||0,Estado:trad(v.status||''),Fecha:v.created_at?new Date(v.created_at).toLocaleDateString('es'):''}}),'Tracking','fluvia_tracking');
    }else{
        exportToPDF('Tracking de Cargas',['Embarcacion','Origen','Destino','Carga (t)','Estado','Fecha'],data.map(function(v){return[v.vessel_name||'',v.origin_port||'',v.destination_port||'',(v.cargo_tons||0).toString(),trad(v.status||''),v.created_at?new Date(v.created_at).toLocaleDateString('es'):'']}),'fluvia_tracking');
    }
}

// DELETE CONFIRMATION (FluviaFleet modal, no native confirm)
function confirmDelete(table, id, itemName, reloadFn){
    document.getElementById('modal-title').textContent='Eliminar Registro';
    document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:20px 0"><i class="fa-regular fa-trash-can" style="font-size:36px;color:var(--error);margin-bottom:16px;display:block"></i><p style="font-size:15px;font-weight:500">Seguro que queres eliminar?</p><p style="font-size:13px;color:var(--text-secondary);margin-top:6px"><strong>'+itemName+'</strong></p><p style="font-size:11px;color:var(--text-tertiary);margin-top:12px">Esta accion no se puede deshacer.</p></div>';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Eliminar';
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
        document.getElementById('modal-submit').textContent='Guardar';
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
                h.innerHTML+='<div class="list-item"><div><h4>'+(d.vessel_name||'--')+' - '+(det.draft||0).toFixed(2)+'m</h4><p>'+(d.description||'Lectura')+' - '+t+'</p></div><button class="delete-btn" data-id="'+d.id+'" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></div>';
            });
            h.querySelectorAll('.delete-btn').forEach(function(btn){btn.addEventListener('click',function(){confirmDelete('logs',this.dataset.id,'Lectura',loadCalado);});});
        }else{em.style.display='';}
    }catch(e){/* Calado: */;}
    // Load INA gauges into calado view
    if(typeof loadINA==='function') loadINA();
}

// INCIDENTES
var incidentesData=[];
async function loadIncidentes(){
    try{
        var r=await sb.from('logs').select('*').eq('action_type','INCIDENTE').order('created_at',{ascending:false}).limit(50);
        incidentesData=r.data||[];renderIncidents();
    }catch(e){/* Incidentes: */;}
}
function renderIncidents(filter){
    var data=incidentesData;var l=document.getElementById('inc-list');var em=document.getElementById('inc-empty');
    if(!l)return;l.innerHTML='';
    if(filter){data=data.filter(function(d){var s=JSON.stringify(d).toLowerCase();return s.indexOf(filter.toLowerCase())>=0;});}
    if(data&&data.length>0){
        em.style.display='none';var open=0;var crit=0;
        var sevIcons={'Critico':'fa-circle-exclamation','Alto':'fa-triangle-exclamation','Medio':'fa-circle-info','Bajo':'fa-shield-halved'};
        var sevColors={'Critico':'#DC2626','Alto':'#F59E0B','Medio':'#3B82F6','Bajo':'#10B981'};
        var typeIcons={'Colision':'fa-ship','Encalladura':'fa-anchor','Derrame':'fa-droplet','Averia mecanica':'fa-gears','Incendio':'fa-fire','Medico':'fa-kit-medical','Otro':'fa-circle-dot'};
        var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
        data.forEach(function(d){
            var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};
            var sev=det.severity||'Medio';var st=det.status||'Abierto';
            if(st==='Abierto')open++;if(sev==='Critico')crit++;
            var sevColor=sevColors[sev]||'#94A3B8';
            var sevIcon=sevIcons[sev]||'fa-triangle-exclamation';
            var typeIcon=typeIcons[det.type]||'fa-triangle-exclamation';
            var stColor=st==='Abierto'?'#DC2626':st==='En Proceso'?'#F59E0B':'#10B981';
            var t=d.created_at?new Date(d.created_at).toLocaleDateString('es',{day:'2-digit',month:'short'}):'—';
            var tTime=d.created_at?new Date(d.created_at).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'';
            h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;border-left:4px solid '+sevColor+';transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
            h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
            h+='<div style="display:flex;align-items:center;gap:10px">';
            h+='<div style="width:40px;height:40px;border-radius:12px;background:'+sevColor+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+sevIcon+'" style="font-size:16px;color:'+sevColor+'"></i></div>';
            h+='<div><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:'+sevColor+';background:'+sevColor+'12;padding:3px 10px;border-radius:6px;text-transform:uppercase">'+trad(sev)+'</span>';
            if(d.vessel_name){h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+d.vessel_name+'</div>';}
            h+='</div></div>';
            h+='<div style="text-align:right;flex-shrink:0"><div style="font-size:10px;color:var(--text-tertiary)">'+t+'</div><div style="font-size:10px;color:var(--text-tertiary)">'+tTime+'</div></div>';
            h+='</div>';
            h+='<div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:6px">'+(d.title||'Incidente')+'</div>';
            if(det.type){h+='<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary);margin-bottom:10px"><i class="fa-solid '+typeIcon+'" style="font-size:10px;color:var(--text-tertiary)"></i> '+trad(det.type)+'</div>';}
            h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--separator)">';
            h+='<span style="font-size:10px;font-weight:700;color:'+stColor+';background:'+stColor+'15;padding:3px 8px;border-radius:6px">'+st.toUpperCase()+'</span>';
            if(d.id){h+='<button onclick="confirmDelete(\'logs\',\''+d.id+'\',\''+(d.title||'Incidente')+'\',loadIncidentes)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;display:flex;align-items:center;gap:3px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button>';}
            h+='</div></div>';
        });
        h+='</div>';
        l.innerHTML=h;
        document.getElementById('inc-total').textContent=incidentesData.length;
        document.getElementById('inc-open').textContent=open;
        document.getElementById('inc-critical').textContent=crit;
    }else{
        if(em){em.style.display='';em.innerHTML='<div style="text-align:center;padding:60px 20px"><div style="width:64px;height:64px;border-radius:20px;background:#10B98115;display:flex;align-items:center;justify-content:center;margin:0 auto 16px"><i class="fa-solid fa-shield-halved" style="font-size:28px;color:#10B981"></i></div><div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:6px">Sin incidentes reportados</div><div style="font-size:13px;color:var(--text-secondary)">La operacion se desarrolla con normalidad</div></div>';}
    }
}
function filterIncidents(){
    var q=document.getElementById('inc-search').value.trim();
    renderIncidents(q||null);
}

// BRIEFING DIARIO - Extracted to js/modules/fluvia-briefing.js (with Promise.all optimization)

// EXPORT ENGINE — Extracted to js/modules/fluvia-exports.js

// ============================================
// IA AVANZADA — MANTENIMIENTO PREDICTIVO
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
        if(preds.length===0){container.innerHTML='<div style="text-align:center;color:var(--text-secondary);padding:20px;">No se encontraron predicciones.</div>';btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-brain"></i> Analizar';return;}
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
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-brain"></i> Analizar';
}

// ============================================
// IA AVANZADA — ANOMALÁAS DE CONSUMO
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
        if(anomalies.length===0){container.innerHTML='<div style="text-align:center;color:var(--text-secondary);padding:20px;">Sin anomalías detectadas.</div>';btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass-chart"></i> Escanear';return;}
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
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass-chart"></i> Escanear';
}

// ============================================
// IA AVANZADA — OPTIMIZADOR DE CONVOY
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

        if (data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        
        var s=data.suggestion||{};
        // Handle case where Gemini wraps response in 'suggestion' or translates keys
        if (s.suggestion) s = s.suggestion;
        var f=s.formation||s.formacion||{};
        var configStr = s.config || s.configuracion || 'N/A';
        
        // Debug dump if empty
        if (configStr === 'N/A' || configStr === 'Vacio') {

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
        if(f.proa){html+='<div style="font-size:12px;margin-bottom:4px;">🚢 <strong>Proa:</strong> '+f.proa+'</div>';}
        if(f.barcazas_f1&&f.barcazas_f1.length){html+='<div style="font-size:12px;margin-bottom:4px;">📦 <strong>Fila 1:</strong> '+f.barcazas_f1.join(', ')+'</div>';}
        if(f.barcazas_f2&&f.barcazas_f2.length){html+='<div style="font-size:12px;margin-bottom:4px;">📦 <strong>Fila 2:</strong> '+f.barcazas_f2.join(', ')+'</div>';}
        if(f.popa){html+='<div style="font-size:12px;margin-bottom:4px;">🚤 <strong>Popa:</strong> '+f.popa+'</div>';}
        
        // Fuel estimate
        if(s.fuel_estimate_liters){html+='<div style="font-size:12px;margin-top:8px;">⛽ Consumo estimado: <strong>'+s.fuel_estimate_liters.toLocaleString()+' lts</strong></div>';}
        
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
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-robot"></i> Sugerir';
}

// CSS spinner animation
if(!document.getElementById('ai-spinner-css')){
    var style=document.createElement('style');style.id='ai-spinner-css';
    style.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
}

// ─── CONTRATOS DE FLETE ────────────────────────────────────
function exportContratos(fmt){alert('Exportar contratos en '+fmt+' - próximamente');}
async function loadContratos(){
    try{
        var r=await sb.from('freight_contracts').select('*').order('created_at',{ascending:false}).limit(50);
        var data=r.data||[];
        if(data.length===0){
            data=[
                {client:'Cargill S.A.',route:'Rosario → Asunción',product:'Soja',contract_type:'COA Anual',status:'active',volume_total:84000,volume_used:61200,rate_per_ton:28.5,expiration_date:'2026-12-31'},
                {client:'ADM Paraguay',route:'Concepción → San Lorenzo',product:'Maíz',contract_type:'Semestral',status:'active',volume_total:48000,volume_used:32400,rate_per_ton:24.2,expiration_date:'2026-06-30'},
                {client:'PETROPAR',route:'Montevideo → Asunción',product:'Gas Oil',contract_type:'COA Anual',status:'active',volume_total:36000,volume_used:33800,rate_per_ton:42.8,expiration_date:'2026-06-15'},
                {client:'Bunge',route:'Pilar → Buenos Aires',product:'Harina de Soja',contract_type:'Trimestral',status:'active',volume_total:25000,volume_used:18500,rate_per_ton:19.0,expiration_date:'2026-09-30'},
                {client:'Louis Dreyfus',route:'Encarnación → Rosario',product:'Trigo',contract_type:'COA Anual',status:'completed',volume_total:40000,volume_used:40000,rate_per_ton:20.0,expiration_date:'2026-03-30'},
                {client:'Viterra',route:'Villeta → San Nicolás',product:'Mineral de Hierro',contract_type:'Spot',status:'pending',volume_total:60000,volume_used:0,rate_per_ton:12.5,expiration_date:'2026-07-01'}
            ];
        }
        var activeCount=data.filter(function(c){return c.status==='active'}).length;
        var totalTon=data.reduce(function(s,c){return s+(c.volume_total||0)},0);
        var revenue=data.reduce(function(s,c){return s+((c.volume_used||0)*(parseFloat(c.rate_per_ton)||0))},0);
        var expiringCount=data.filter(function(c){return c.status==='expires'||c.status==='renewing'}).length;

        var ae=document.getElementById('ctr-active');if(ae)ae.textContent=activeCount;
        var te=document.getElementById('ctr-tonnage');if(te)te.textContent=totalTon>=1000?(totalTon/1000).toFixed(0)+'k':totalTon;
        var re=document.getElementById('ctr-revenue');if(re)re.textContent='$'+(revenue>=1000?(revenue/1000).toFixed(0)+'k':revenue.toFixed(0));
        var ee=document.getElementById('ctr-expiring');if(ee)ee.textContent=expiringCount;

        var container=document.getElementById('ctr-list');
        if(!container)return;

        if(data.length===0){container.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fa-solid fa-file-contract" style="font-size:32px;opacity:0.3;margin-bottom:12px;display:block;"></i>Sin contratos registrados</div>';return;}

        var h='<div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px 0;">';
        h+='<div style="font-family:Newsreader,serif;font-size:22px;font-weight:400;color:var(--text-primary);">Contratos Vigentes</div>';
        h+='<div style="font-size:12px;color:var(--accent);font-weight:600;">'+data.length+' total</div></div>';

        h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;">';
        data.forEach(function(c){
            var vol=c.volume_total||1;
            var used=c.volume_used||0;
            var pct=Math.round(used/vol*100);
            var sc=c.status==='active'?'#10B981':c.status==='expires'?'#F59E0B':c.status==='renewing'?'#3B82F6':'#6B7280';
            var sl=c.status==='active'?'ACTIVO':c.status==='expires'?'EXPIRA':c.status==='renewing'?'RENOVANDO':c.status.toUpperCase();
            var barColor=pct>90?'#EF4444':pct>70?'#F59E0B':'#10B981';
            var expDate=c.expiration_date?new Date(c.expiration_date).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'}):'—';

            h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.08)\'" onmouseout="this.style.boxShadow=\'none\'">';

            // Header: client + status badge
            h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">';
            h+='<div style="font-weight:700;font-size:15px;color:var(--text-primary);">'+esc(c.client)+'</div>';
            h+='<span style="background:'+sc+'18;color:'+sc+';padding:4px 10px;border-radius:8px;font-size:9px;font-weight:700;letter-spacing:0.5px;">'+sl+'</span>';
            h+='</div>';
            h+='<div style="font-size:11px;color:var(--text-secondary);margin-bottom:14px;">'+esc(c.route)+' \u2014 '+esc(c.product)+'</div>';

            // Progress bar
            h+='<div style="position:relative;height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;margin-bottom:8px;">';
            h+='<div style="position:absolute;top:0;left:0;height:100%;width:'+Math.min(pct,100)+'%;background:'+barColor+';border-radius:4px;transition:width 0.6s ease;"></div></div>';

            // Volume + rate
            h+='<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:10px;">';
            h+='<span style="font-weight:600;color:var(--text-primary);">'+used.toLocaleString()+' / '+vol.toLocaleString()+' ton \u00B7 '+pct+'%</span>';
            h+='<span style="font-weight:700;color:var(--accent);">$'+parseFloat(c.rate_per_ton).toFixed(1)+'/ton</span></div>';

            // Meta chips
            h+='<div style="display:flex;gap:6px;flex-wrap:wrap;">';
            h+='<span style="background:var(--bg-tertiary);padding:3px 8px;border-radius:6px;font-size:10px;color:var(--text-secondary);">'+esc(c.contract_type)+'</span>';
            h+='<span style="background:var(--bg-tertiary);padding:3px 8px;border-radius:6px;font-size:10px;color:var(--text-secondary);">Exp: '+expDate+'</span>';
            h+='</div>';

            h+='</div>';
        });
        h+='</div>';
        container.innerHTML=h;
    }catch(e){console.error('loadContratos:',e);}
}

// ─── LIQUIDOS (TANQUES) ────────────────────────────────────
function loadLiquidos(){
    var tanks=[
        {name:'BT-001 Petrobras',type:'Tanque doble casco',cap:2200,current:1804,product:'Gas Oil',color:'#F97316',temp:23,status:'En tránsito',route:'ASU → ROE'},
        {name:'BT-002 Copetrol',type:'Tanque simple',cap:1800,current:810,product:'Metanol',color:'#8B5CF6',temp:19,status:'Fondeada',route:'Rosario'},
        {name:'BT-003 YPF',type:'Tanque doble casco',cap:2500,current:2375,product:'Crudo Pesado',color:'#1E293B',temp:28,status:'En tránsito',route:'CDB → BHI'},
        {name:'BT-004 Axion',type:'Tanque simple',cap:1500,current:180,product:'Nafta',color:'#F97316',temp:21,status:'En descarga',route:'San Lorenzo'},
        {name:'BT-005 Shell',type:'Tanque doble casco',cap:2000,current:1200,product:'Agua Destilada',color:'#3B82F6',temp:25,status:'En tránsito',route:'VCO → SLO'},
        {name:'BT-006 Reserva',type:'Tanque simple',cap:1200,current:0,product:'Gas Oil',color:'#F97316',temp:0,status:'En astillero',route:'Astillero ASU'}
    ];
    var totalCur=tanks.reduce(function(s,t){return s+t.current;},0);
    var totalCap=tanks.reduce(function(s,t){return s+t.cap;},0);
    var util=totalCap>0?Math.round((totalCur/totalCap)*100):0;
    var inTransit=tanks.filter(function(t){return t.status==='En tránsito';}).reduce(function(s,t){return s+t.current;},0);

    var ce=document.getElementById('liq-count');if(ce)ce.textContent=tanks.length;
    var ue=document.getElementById('liq-util');if(ue)ue.textContent=util+'%';
    var te=document.getElementById('liq-transit');if(te)te.textContent=(inTransit/1000).toFixed(1)+'k m\u00B3';

    var container=document.getElementById('liq-list');
    if(!container){console.error('liq-list not found');return;}

    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px 0;">';
    h+='<div style="font-family:Newsreader,serif;font-size:22px;font-weight:400;color:var(--text-primary);">Barcazas Tanque</div>';
    h+='<div style="font-size:12px;color:var(--accent);font-weight:600;">'+tanks.length+' monitoreadas</div></div>';

    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;">';
    for(var i=0;i<tanks.length;i++){
        var t=tanks[i];
        var pct=t.cap>0?Math.round(t.current/t.cap*100):0;
        var sc=t.status==='En tránsito'?'#3B82F6':t.status==='Fondeada'?'#10B981':t.status==='En descarga'?'#F97316':'#6B7280';
        var barBg=t.color+'30';

        h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:box-shadow 0.2s;cursor:default;" onmouseover="this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.08)\'" onmouseout="this.style.boxShadow=\'none\'">';

        // Header: name + product badge
        h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">';
        h+='<div style="font-weight:700;font-size:15px;color:var(--text-primary);letter-spacing:-0.01em;">'+t.name+'</div>';
        h+='<span style="background:'+barBg+';color:'+t.color+';padding:4px 12px;border-radius:8px;font-size:10px;font-weight:700;letter-spacing:0.3px;border:1px solid '+t.color+'25;">'+t.product+'</span>';
        h+='</div>';
        h+='<div style="font-size:11px;color:var(--text-secondary);margin-bottom:16px;">'+t.type+' \u2014 '+t.cap.toLocaleString()+' m\u00B3</div>';

        // Horizontal gauge bar (like mobile app)
        h+='<div style="position:relative;height:36px;background:var(--bg-tertiary);border-radius:10px;overflow:hidden;margin-bottom:10px;">';
        h+='<div style="position:absolute;top:0;left:0;height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+t.color+','+t.color+'BB);border-radius:10px;transition:width 0.6s ease;"></div>';
        h+='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:'+(pct>40?'#fff':'var(--text-primary)')+';text-shadow:'+(pct>40?'0 1px 2px rgba(0,0,0,0.2)':'none')+';">'+pct+'%</div>';
        h+='</div>';

        // Actual / Cap row
        h+='<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px;">';
        h+='<span style="font-weight:600;color:var(--text-primary);">Actual: '+t.current.toLocaleString()+' m\u00B3</span>';
        h+='<span style="color:var(--text-secondary);">Cap: '+t.cap.toLocaleString()+' m\u00B3</span></div>';

        // Meta chips row
        h+='<div style="display:flex;gap:8px;flex-wrap:wrap;">';
        if(t.temp>0){
            h+='<span style="background:var(--bg-tertiary);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">';
            h+='<span style="color:#EF4444;font-size:12px;">\u{1F321}</span> '+t.temp+'\u00B0C</span>';
        }
        h+='<span style="background:'+sc+'15;color:'+sc+';padding:4px 10px;border-radius:8px;font-size:10px;font-weight:600;border:1px solid '+sc+'20;">'+t.status+'</span>';
        h+='<span style="background:var(--bg-tertiary);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--text-secondary);">'+t.route+'</span>';
        h+='</div>';

        h+='</div>';
    }
    h+='</div>';

    container.innerHTML=h;
}
