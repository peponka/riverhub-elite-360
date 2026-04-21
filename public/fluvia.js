// Supabase Init
const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'REDACTED_SUPABASE_ANON_KEY';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function doLogin(){
    var email=document.getElementById('login-email').value.trim();
    var pass=document.getElementById('login-password').value;
    var errDiv=document.getElementById('login-error');
    var btn=document.getElementById('login-btn');
    if(!email||!pass){errDiv.textContent='Completa todos los campos';errDiv.style.display='block';return;}
    btn.disabled=true;btn.textContent='Ingresando...';errDiv.style.display='none';
    try{
        var r=await sb.auth.signInWithPassword({email:email,password:pass});
        if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';btn.disabled=false;btn.textContent='Iniciar Sesion';return;}
        showApp(r.data.user);
    }catch(e){errDiv.textContent='Error de conexion';errDiv.style.display='block';btn.disabled=false;btn.textContent='Iniciar Sesion';}
}

async function doLogout(){
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
            sb.from('companies').select('id').eq('name','RiverHub Admin').single().then(function(c2){
                var cid = c2.data ? c2.data.id : null;
                sb.from('user_profiles').insert({user_id:user.id, company_id:cid, role:'superadmin', full_name:'Administrador'}).then(function(ins){
                    console.log('Profile created:', ins);
                    currentCompanyId=cid;
                    currentUserRole='superadmin';
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
const loaders = {dashboard:loadDashboard,fleet:loadFleet,mapa:function(){if(!map)initMap();else setTimeout(function(){map.invalidateSize()},100)},admin:loadAdmin,viajes:loadViajes,bitacora:loadBitacora,tripulacion:loadCrew,combustible:loadFuel,mantenimiento:loadMaint,panol:loadPanol,comunicaciones:loadComms,hidrologia:loadHidrologia,reportes:loadReportes,copiloto:function(){},convoy:loadConvoy,tracking:loadTracking,planes:function(){},calado:loadCalado,incidentes:loadIncidentes,briefing:loadBriefing};

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
    });
});
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
        list.innerHTML='<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><p>Sin notificaciones nuevas</p></div>';
        if(badge)badge.style.display='none';
        return;
    }
    if(badge){badge.textContent=notifData.length;badge.style.display='flex';}
    list.innerHTML=notifData.map(function(n,i){
        var t=n.created_at?new Date(n.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
        var cls=i<3?'notif-item unread':'notif-item';
        return '<div class="'+cls+'"><div class="notif-title">'+(n.title||n.action_type||'Actividad')+'</div><div class="notif-desc">'+(n.description||n.details||'')+'</div><div class="notif-time">'+t+'</div></div>';
    }).join('');
}
loadNotifications();
// Real-time subscription for new notifications
try{
    sb.channel('notif-logs').on('postgres_changes',{event:'INSERT',schema:'public',table:'logs'},function(payload){
        notifData.unshift(payload.new);
        if(notifData.length>15)notifData.pop();
        renderNotifs();
    }).subscribe();
}catch(e){console.log('Realtime notif:',e);}

// LOADERS
async function loadDashboard(){
    try{
        var r=await sb.from('vessels').select('status');
        var vessels=r.data;if(!vessels)return;
        var a=0,d=0,m=0;
        vessels.forEach(function(v){var s=(v.status||'').toLowerCase();if(s==='en viaje'||s==='active')a++;else if(s.indexOf('manten')>=0)m++;else d++;});
        var r2=await sb.from('logs').select('action_type').eq('action_type','alert').limit(10);
        document.querySelector('#view-dashboard .kpi-card:nth-child(1) .kpi-value').textContent=a;
        document.querySelector('#view-dashboard .kpi-card:nth-child(2) .kpi-value').textContent=d;
        document.querySelector('#view-dashboard .kpi-card:nth-child(3) .kpi-value').textContent=m;
        document.querySelector('#view-dashboard .kpi-card:nth-child(4) .kpi-value').textContent=(r2.data?r2.data.length:0);
        loadDashboardExtras();
    }catch(e){console.log('Dashboard:',e);}
}

async function loadFleet(){
    try{
        var r=await sb.from('vessels').select('*');var data=r.data;if(!data)return;
        var tb=document.getElementById('fleet-tbody');tb.innerHTML='';
        data.forEach(function(v){
            var s=(v.status||'').toLowerCase();
            var c=s.indexOf('viaje')>=0||s==='active'?'var(--success)':s.indexOf('manten')>=0?'var(--warning)':'var(--accent)';
            var tr=document.createElement('tr');
            tr.innerHTML='<td>'+(v.name||v.vessel_name||'')+'</td><td>'+(v.type||v.vessel_type||'')+'</td><td><span class="status-dot" style="background:'+c+'"></span>'+(v.status||'')+'</td><td>'+(v.location||v.current_position||'')+'</td><td><button class="delete-btn" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></td>';
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
        if(data&&data.length>0){em.style.display='none';data.forEach(function(v){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(v.vessel_name||'')+' > '+(v.destination_port||'')+'</h4><p>'+(v.origin_port||'')+' - '+(v.cargo_tons||'')+' ton</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge">'+(v.status||'PENDIENTE').toUpperCase()+'</span><button class="delete-btn" style="background:none;border:none;color:var(--error);cursor:pointer;" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('voyages',v.id,(v.vessel_name||'Viaje'),loadViajes);});l.appendChild(d);});}else{em.style.display='';}
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
                d.innerHTML='<div><h4>'+(row.title||row.action_type||'Entrada')+'</h4><p>'+(row.vessel_name||'')+' - '+(row.description||row.details||'')+' - '+t+'</p></div><button class="delete-btn" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>';
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
        var r=await sb.from('crew_members').select('*');var data=r.data;
        var l=document.getElementById('crew-list');var em=document.getElementById('crew-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(c){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(c.full_name||c.name||'')+'</h4><p>'+(c.role||'')+' - '+(c.vessel_name||'')+'</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:var(--success)">'+(c.status||'EMBARCADO').toUpperCase()+'</span><button class="delete-btn" style="background:none;border:none;color:var(--error);cursor:pointer;" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('crew_members',c.id,(c.full_name||c.name||'Tripulante'),loadCrew);});l.appendChild(d);});document.getElementById('crew-total').textContent=data.length;document.getElementById('crew-on').textContent=data.filter(function(c){return(c.status||'').toLowerCase()==='embarcado'}).length;}else{em.style.display='';}
    }catch(e){console.log('Crew:',e);}
}

async function loadFuel(){
    try{
        var r=await sb.from('fuel_logs').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('fuel-list');var em=document.getElementById('fuel-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(f){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(f.vessel_name||'')+' -- '+(f.liters||f.quantity||0)+'L</h4><p>'+(f.fuel_type||'Gasoil')+' - '+(f.created_at?new Date(f.created_at).toLocaleDateString('es'):'')+'</p></div><button class="delete-btn" style="background:none;border:none;color:var(--error);cursor:pointer;" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('fuel_logs',f.id,(f.vessel_name||'Registro'),loadFuel);});l.appendChild(d);});document.getElementById('fuel-count').textContent=data.length;}else{em.style.display='';}
    }catch(e){console.log('Fuel:',e);}
}

async function loadMaint(){
    try{
        var r=await sb.from('maintenance_tasks').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('maint-list');l.innerHTML='';
        if(data&&data.length>0){data.forEach(function(m){var d=document.createElement('div');d.className='list-item';var pc=m.priority==='Alta'||m.priority==='high'?'var(--error)':m.priority==='Media'?'var(--warning)':'var(--text-secondary)';d.innerHTML='<div><h4>'+(m.description||m.title||'')+'</h4><p>'+String.fromCodePoint(0x1F6A2)+' '+(m.vessel_name||'')+'</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:'+pc+'">'+(m.status||m.priority||'').toUpperCase()+'</span><button class="delete-btn" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('maintenance_tasks',m.id,(m.description||m.title||'Orden'),loadMaint);});l.appendChild(d);});document.getElementById('maint-pending').textContent=data.filter(function(m){return(m.status||'').toLowerCase()!=='completed'}).length;}
    }catch(e){console.log('Maint:',e);}
}

async function loadPanol(){
    try{
        var r=await sb.from('inventory_items').select('*');var data=r.data;
        var l=document.getElementById('panol-list');l.innerHTML='';
        if(data&&data.length>0){data.forEach(function(i){var d=document.createElement('div');d.className='list-item';var q=i.quantity||i.stock||0;var mn=i.min_stock||0;var low=q<=mn;d.innerHTML='<div><h4>'+(i.name||'')+'</h4><p>'+(i.category||'')+' - Repuesto</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:'+(low?'var(--warning)':'var(--success)')+'">'+(low?'STOCK BAJO':'OK')+'<br>'+q+' uds</span><button class="delete-btn" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('inventory_items',i.id,(i.name||'Item'),loadPanol);});l.appendChild(d);});document.getElementById('panol-total').textContent=data.length;}
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
    // Auto-refresh AIS every 30s
    setInterval(loadAISTraffic, 30000);
    // Hidrovia route — polyline completa Paraguay-Paraná
    var hidroviaRoute=[[-19.0,-57.65],[-20.5,-57.8],[-22.3,-57.9],[-23.4,-57.8],[-25.3,-57.6],[-26.5,-58.1],[-27.3,-58.5],[-29.0,-59.5],[-30.5,-59.9],[-31.5,-60.5],[-32.9,-60.6],[-33.5,-58.5],[-34.6,-58.4]];
    L.polyline(hidroviaRoute,{color:'#3B82F6',weight:2.5,dashArray:'8,6',opacity:0.45}).addTo(map);
    // Zoom fit to hidrovía bounds
    map.fitBounds([[-19.0,-60.5],[-34.6,-56.5]],{padding:[30,30],maxZoom:7});
}
function loadFleetMarkers(){
    sb.from('vessels').select('*').then(function(r){
        var data=r.data;if(!data)return;
        data.forEach(function(v){var lat=v.latitude||v.lat;var lng=v.longitude||v.lng;if(!lat||!lng)return;var s=(v.status||'').toLowerCase();var c=s.indexOf('viaje')>=0||s==='active'?'#2EA043':s.indexOf('manten')>=0?'#F59E0B':'#3B82F6';L.circleMarker([lat,lng],{radius:8,fillColor:c,color:'#fff',weight:2,fillOpacity:1}).addTo(map).bindPopup('<strong>'+(v.name||'')+'</strong><br>'+(v.status||'')+'<br><small>Flota propia</small>');});
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
    fleet:{title:'Agregar Activo',fields:[{id:'fleet-name',label:'NOMBRE',type:'text',placeholder:'Ej: R/M ATLAS'},{id:'fleet-type',label:'TIPO',type:'select',options:['Barcaza','Remolcador','Ponton']},{id:'fleet-status',label:'ESTADO',type:'select',options:['En Viaje','En Puerto','Mantenimiento']},{id:'fleet-location',label:'UBICACION',type:'text',placeholder:'Ej: Km 1420'}]},
    viaje:{title:'Nueva Solicitud de Viaje',fields:[{id:'viaje-vessel',label:'EMBARCACION',type:'text',placeholder:'Nombre'},{id:'viaje-origin',label:'ORIGEN',type:'text',placeholder:'Puerto origen'},{id:'viaje-dest',label:'DESTINO',type:'text',placeholder:'Puerto destino'},{id:'viaje-cargo',label:'CARGA (TON)',type:'text',placeholder:'3500'},{id:'viaje-date',label:'FECHA SALIDA',type:'date'}]},
    bitacora:{title:'Nueva Entrada de Bitacora',fields:[{id:'bit-title',label:'TITULO',type:'text',placeholder:'Resumen'},{id:'bit-vessel',label:'EMBARCACION',type:'text',placeholder:'Embarcacion'},{id:'bit-type',label:'TIPO',type:'select',options:['Observacion','Incidente','Maniobra','Navegacion']},{id:'bit-desc',label:'DESCRIPCION',type:'textarea',placeholder:'Detalle...'}]},
    crew:{title:'Agregar Tripulante',fields:[{id:'crew-name',label:'NOMBRE',type:'text',placeholder:'Juan Perez'},{id:'crew-role',label:'ROL',type:'select',options:['Capitan','Timonel','Maquinista','Marinero','Cocinero']},{id:'crew-vessel',label:'EMBARCACION',type:'text',placeholder:'Asignar a...'},{id:'crew-doc',label:'DOCUMENTO',type:'text',placeholder:'Nro documento'}]},
    fuel:{title:'Registrar Combustible',fields:[{id:'fuel-vessel',label:'EMBARCACION',type:'text',placeholder:'Nombre'},{id:'fuel-liters',label:'LITROS',type:'text',placeholder:'5000'},{id:'fuel-type',label:'TIPO',type:'select',options:['Gasoil','IFO 380','MGO']},{id:'fuel-date',label:'FECHA',type:'date'}]},
    maint:{title:'Nueva Orden de Mantenimiento',fields:[{id:'maint-title',label:'DESCRIPCION',type:'text',placeholder:'Que reparar'},{id:'maint-vessel',label:'EMBARCACION',type:'text',placeholder:'Embarcacion'},{id:'maint-priority',label:'PRIORIDAD',type:'select',options:['Alta','Media','Baja']},{id:'maint-notes',label:'NOTAS',type:'textarea',placeholder:'Detalles...'}]},
    panol:{title:'Agregar Item',fields:[{id:'panol-name',label:'REPUESTO',type:'text',placeholder:'Filtro de aceite'},{id:'panol-cat',label:'CATEGORIA',type:'select',options:['Motor','Electrico','Hidraulico','Casco','General']},{id:'panol-qty',label:'CANTIDAD',type:'text',placeholder:'10'},{id:'panol-min',label:'STOCK MINIMO',type:'text',placeholder:'2'}]},
    calado:{title:'Registrar Lectura de Calado',fields:[{id:'calado-vessel',label:'EMBARCACION',type:'text',placeholder:'Nombre de la embarcacion'},{id:'calado-value',label:'CALADO (METROS)',type:'text',placeholder:'2.45'},{id:'calado-max',label:'CALADO MAXIMO (M)',type:'text',placeholder:'3.50'},{id:'calado-notes',label:'OBSERVACIONES',type:'textarea',placeholder:'Condiciones, ubicacion...'}]},
    incidente:{title:'Reportar Incidente',fields:[{id:'inc-title',label:'TITULO',type:'text',placeholder:'Descripcion breve del incidente'},{id:'inc-vessel',label:'EMBARCACION',type:'text',placeholder:'Embarcacion afectada'},{id:'inc-severity',label:'SEVERIDAD',type:'select',options:['Critico','Alto','Medio','Bajo']},{id:'inc-type',label:'TIPO',type:'select',options:['Colision','Encalladura','Derrame','Averia mecanica','Incendio','Medico','Otro']},{id:'inc-desc',label:'DESCRIPCION DETALLADA',type:'textarea',placeholder:'Que ocurrio, donde, cuando, medidas tomadas...'}]}
};
var currentModal=null;
function openModal(type){
    currentModal=type;var c=modalForms[type];document.getElementById('modal-title').textContent=c.title;
    var h='';c.fields.forEach(function(f){h+='<label>'+f.label+'</label>';if(f.type==='select'){h+='<select id="'+f.id+'">'+f.options.map(function(o){return '<option>'+o+'</option>'}).join('')+'</select>';}else if(f.type==='textarea'){h+='<textarea id="'+f.id+'" placeholder="'+(f.placeholder||'')+'"></textarea>';}else{h+='<input type="'+f.type+'" id="'+f.id+'" placeholder="'+(f.placeholder||'')+'">';}});
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
        else if(t==='incidente'&&d['inc-title']){await sb.from('logs').insert({title:d['inc-title'],vessel_name:d['inc-vessel'],action_type:'INCIDENTE',description:d['inc-desc'],details:JSON.stringify({severity:d['inc-severity'],type:d['inc-type'],status:'Abierto'}),company_id:cid});loadIncidentes();}
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
    document.getElementById('modal-body').innerHTML='<div style="background:var(--surface-low);border-radius:12px;padding:20px;margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:600">'+name+'</span><span style="font-family:Newsreader,serif;font-size:28px;font-weight:400">$'+price.toLocaleString('en-US')+'</span></div><p style="font-size:11px;color:var(--text-secondary);margin-top:4px">Facturacion '+(currentPeriod==='monthly'?'mensual':'anual')+' - 14 dias gratis</p></div><label>NOMBRE EN TARJETA</label><input type="text" id="pay-name" placeholder="Como aparece en la tarjeta"><label>NUMERO DE TARJETA</label><input type="text" id="pay-card" placeholder="4242 4242 4242 4242" maxlength="19"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label>VENCIMIENTO</label><input type="text" id="pay-exp" placeholder="MM/AA" maxlength="5"></div><div><label>CVV</label><input type="text" id="pay-cvv" placeholder="123" maxlength="4"></div></div>';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Pagar $'+price.toLocaleString('en-US');
    document.getElementById('modal-submit').onclick=function(){processPayment(plan,price)};
}
async function processPayment(plan,price){
    document.getElementById('modal-submit').disabled=true;
    document.getElementById('modal-submit').textContent='Procesando...';
    setTimeout(function(){
        document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:40px 0"><i class="fa-solid fa-circle-check" style="font-size:48px;color:var(--success)"></i><h3 style="font-family:Newsreader,serif;font-size:24px;margin-top:16px">Pago Exitoso!</h3><p style="color:var(--text-secondary);margin-top:8px">Tu plan <strong>'+planNames[plan]+'</strong> esta activo.</p><p style="color:var(--text-secondary);font-size:12px;margin-top:4px">Factura enviada a tu email.</p></div>';
        document.getElementById('modal-submit').style.display='none';
        document.querySelector('.modal-actions .btn-secondary').textContent='Cerrar';
    },2000);
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
    var cr=await sb.from('companies').select('*').order('created_at',{ascending:false});
    var html='';
    if(cr.data)cr.data.forEach(function(c){
        html+='<div class="info-card"><i class="fa-solid fa-building" style="color:var(--text-primary)"></i><div class="info-card-text"><h4>'+c.name+'</h4><p>Plan: '+(c.plan||'basico')+' | Max: '+(c.max_vessels||1)+' barcos | '+(c.active!==false?'Activa':'Inactiva')+'</p></div></div>';
    });
    document.getElementById('admin-companies').innerHTML=html||'<div class="empty-state"><p>Sin empresas</p></div>';
    // Users list
    var ur=await sb.from('user_profiles').select('*').order('created_at',{ascending:false});
    var uhtml='';
    if(ur.data)ur.data.forEach(function(u){
        uhtml+='<div class="info-card"><i class="fa-solid fa-user" style="color:var(--text-primary)"></i><div class="info-card-text"><h4>'+(u.full_name||'Sin nombre')+'</h4><p>Rol: '+(u.role||'admin')+' | Company: '+(u.company_id?u.company_id.substring(0,8)+'...':'Sin asignar')+'</p></div></div>';
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
        var opts=r.data?r.data.map(function(c){return '<option value="'+c.id+'">'+c.name+'</option>'}).join(''):'';
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
async function sendCopiloto(){
    var input=document.getElementById('copiloto-input');
    var chat=document.getElementById('copiloto-chat');
    var msg=input.value.trim();if(!msg)return;
    chat.innerHTML+='<div style="margin:12px 0;text-align:right"><span style="background:var(--text-primary);color:white;padding:8px 14px;border-radius:12px 12px 4px 12px;font-size:13px;display:inline-block;max-width:70%">'+msg+'</span></div>';
    input.value='';input.disabled=true;
    document.getElementById('copiloto-send').disabled=true;
    chat.innerHTML+='<div style="margin:12px 0" id="ai-typing"><span style="background:var(--surface-low);padding:8px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Analizando datos...</span></div>';
    chat.scrollTop=chat.scrollHeight;
    // Gather context from Supabase
    try{
        var ctx='';
        var v=await sb.from('vessels').select('name,status,type,location');if(v.data)ctx+='Flota: '+JSON.stringify(v.data)+'\n';
        var vj=await sb.from('voyages').select('vessel_name,origin_port,destination_port,status,cargo_tons').limit(10);if(vj.data)ctx+='Viajes: '+JSON.stringify(vj.data)+'\n';
        var fl=await sb.from('fuel_logs').select('vessel_name,liters,fuel_type').limit(5);if(fl.data)ctx+='Combustible: '+JSON.stringify(fl.data)+'\n';
        var mt=await sb.from('maintenance_tasks').select('description,vessel_name,priority,status').limit(5);if(mt.data)ctx+='Mantenimiento: '+JSON.stringify(mt.data)+'\n';
        var res=await fetch('/api/n8n/ai-analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Eres el Copiloto IA de RiverHub, asistente maritimo-fluvial experto en la Hidrovia Paraguay-Parana. Responde en español, breve y profesional. Contexto de la empresa:\n'+ctx+'\nPregunta del capitan: '+msg})});
        var data=await res.json();
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        var answer=data.analysis||data.message||'No pude procesar la consulta.';
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;max-width:80%;line-height:1.5"><i class="fa-solid fa-robot" style="color:var(--accent);margin-right:6px"></i>'+answer.replace(/\n/g,'<br>')+'</span></div>';
    }catch(e){
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;color:var(--error)"><i class="fa-solid fa-exclamation-triangle" style="margin-right:6px"></i>Error al conectar con el servidor IA.</span></div>';
    }
    input.disabled=false;document.getElementById('copiloto-send').disabled=false;
    chat.scrollTop=chat.scrollHeight;input.focus();
}

// DASHBOARD DINAMICO
async function loadDashboardExtras(){
    // Weather from open-meteo
    try{
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code&timezone=America/Asuncion');
        var wd=await w.json();
        if(wd.current){
            var codes={0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',61:'Lluvia',80:'Chaparron',95:'Tormenta'};
            var desc=codes[wd.current.weather_code]||'Variado';
            document.getElementById('dash-weather').textContent=desc+', '+Math.round(wd.current.temperature_2m)+'°C - Viento '+Math.round(wd.current.wind_speed_10m)+' km/h';
        }
    }catch(e){}
    // Fuel summary
    try{
        var f=await sb.from('fuel_logs').select('liters').limit(50);
        if(f.data&&f.data.length>0){var total=f.data.reduce(function(s,x){return s+(x.liters||0)},0);document.getElementById('dash-fuel').textContent='Total registrado: '+total.toLocaleString()+' L ('+f.data.length+' cargas)';}
        else{document.getElementById('dash-fuel').textContent='Sin registros de consumo';}
    }catch(e){}
    // Viajes count
    try{
        var vj=await sb.from('voyages').select('status');
        if(vj.data){var nav=vj.data.filter(function(v){return(v.status||'').toLowerCase()==='navegando'||v.status==='en_curso'}).length;document.getElementById('dash-viajes').textContent=nav+' en curso, '+(vj.data.length-nav)+' completados';}
    }catch(e){}
    // AIS count
    try{
        var ais=await sb.from('ais_traffic').select('mmsi',{count:'exact',head:true});
        document.getElementById('dash-ais').textContent=(ais.count||0)+' embarcaciones detectadas en la Hidrovia';
    }catch(e){}
}

// HIDROLOGIA - Flood API
var hidroChart=null;
async function loadHidrologia(){
    try{
        // Open-Meteo Flood API - Rio Paraguay (calibrated GloFAS grid coords)
        var r=await fetch('https://flood-api.open-meteo.com/v1/flood?latitude=-25.3&longitude=-57.7&daily=river_discharge&past_days=7&forecast_days=7');
        var d=await r.json();
        if(d.daily&&d.daily.river_discharge){
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
        // Pilar - real data
        try{
            var rp=await fetch('https://flood-api.open-meteo.com/v1/flood?latitude=-26.85&longitude=-58.35&daily=river_discharge&past_days=1&forecast_days=0');
            var dp=await rp.json();
            if(dp.daily&&dp.daily.river_discharge&&dp.daily.river_discharge[0]){
                document.getElementById('hidro-pir').textContent=dp.daily.river_discharge[0].toFixed(0)+' m³/s';
            }
        }catch(e){}
        // Stations info with real coords
        var stationsData=[
            {name:'Asuncion',river:'Rio Paraguay',lat:-25.3,lng:-57.7},
            {name:'Pilar',river:'Bajo Paraguay',lat:-26.85,lng:-58.35},
            {name:'Concepcion',river:'Alto Paraguay',lat:-23.4,lng:-57.5},
            {name:'Rosario',river:'Rio Parana',lat:-32.95,lng:-60.65}
        ];
        var stHtml='';
        for(var i=0;i<stationsData.length;i++){
            var st=stationsData[i];
            var flow='--';
            try{
                var sr=await fetch('https://flood-api.open-meteo.com/v1/flood?latitude='+st.lat+'&longitude='+st.lng+'&daily=river_discharge&past_days=1&forecast_days=0');
                var sd=await sr.json();
                if(sd.daily&&sd.daily.river_discharge&&sd.daily.river_discharge[0]){
                    flow=sd.daily.river_discharge[0].toFixed(0)+' m³/s';
                }
            }catch(e){}
            stHtml+='<div class="info-card"><i class="fa-solid fa-water" style="color:var(--accent)"></i><div class="info-card-text"><h4>'+st.name+' <span style="font-weight:400;color:var(--text-secondary);font-size:12px">'+st.river+'</span></h4><p>Caudal: <strong>'+flow+'</strong> — Lat: '+st.lat+' | Lng: '+st.lng+'</p></div></div>';
        }
        document.getElementById('hidro-stations').innerHTML=stHtml;
    }catch(e){console.log('Hydro:',e);}
}

// REPORTES & ANALYTICS
var fleetChart=null,fuelChart=null,activityChart=null;
async function loadReportes(){
    try{
        // Stats
        var v=await sb.from('vessels').select('status');
        var vj=await sb.from('voyages').select('id',{count:'exact',head:true});
        var fl=await sb.from('fuel_logs').select('liters');
        var lg=await sb.from('logs').select('id',{count:'exact',head:true});
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
        // Activity Chart
        if(activityChart)activityChart.destroy();
        var ctx3=document.getElementById('chart-activity');
        var days=[];var counts=[];
        for(var i=29;i>=0;i--){var dt=new Date();dt.setDate(dt.getDate()-i);days.push((dt.getMonth()+1)+'/'+dt.getDate());counts.push(Math.floor(Math.random()*5));}
        if(ctx3){activityChart=new Chart(ctx3,{type:'line',data:{labels:days,datasets:[{label:'Entradas',data:counts,borderColor:'#1A1A2E',backgroundColor:'rgba(26,26,46,0.05)',fill:true,tension:0.4,pointRadius:0}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false},ticks:{maxTicksLimit:10}}}}});}
    }catch(e){console.log('Reports:',e);}
}

// CONVOY - Load fleet chips for drag-and-drop
async function loadConvoy(){
    try{
        var r=await sb.from('vessels').select('*');var data=r.data;
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

// TRACKING - Show active cargo in transit
async function loadTracking(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;
        var container=document.querySelector('#view-tracking .empty-state');
        if(!container)return;
        var parent=container.parentNode;
        // Remove old list if exists
        var old=parent.querySelector('.tracking-list');if(old)old.remove();
        if(data&&data.length>0){
            var inTransit=data.filter(function(v){var s=(v.status||'').toLowerCase();return s==='navegando'||s==='en_curso'||s==='en viaje';});
            if(inTransit.length>0){
                container.style.display='none';
                var list=document.createElement('div');list.className='tracking-list';
                list.style.marginTop='20px';
                inTransit.forEach(function(v){
                    var card=document.createElement('div');card.className='info-card';
                    card.innerHTML='<i class="fa-solid fa-location-dot" style="color:var(--success)"></i><div class="info-card-text"><h4>'+(v.vessel_name||'')+'</h4><p>'+(v.origin_port||'?')+' → '+(v.destination_port||'?')+' | '+(v.cargo_tons||0)+' ton | '+(v.status||'').toUpperCase()+'</p></div><i class="fa-solid fa-chevron-right chevron"></i>';
                    list.appendChild(card);
                });
                parent.appendChild(list);
            } else {
                container.style.display='';
                container.innerHTML='<i class="fa-solid fa-location-dot"></i><p>No hay cargas en transito activo</p><p style="font-size:11px;color:var(--text-tertiary);margin-top:4px">'+data.length+' viajes registrados en total</p>';
            }
        } else {
            container.style.display='';
        }
    }catch(e){console.log('Tracking:',e);}
}

// DELETE CONFIRMATION (Fluvia modal, no native confirm)
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
    }catch(e){console.log('Calado:',e);}
}

// INCIDENTES
var incidentesData=[];
async function loadIncidentes(){
    try{
        var r=await sb.from('logs').select('*').eq('action_type','INCIDENTE').order('created_at',{ascending:false}).limit(50);
        incidentesData=r.data||[];renderIncidents();
    }catch(e){console.log('Incidentes:',e);}
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
            l.innerHTML+='<div class="list-item"><div><h4 style="display:flex;align-items:center;gap:8px"><span class="status-dot" style="background:'+sevC+'"></span>'+(d.title||'Incidente')+'</h4><p>'+(d.vessel_name||'')+' - '+(det.type||'')+' - '+t+'</p></div><div style="display:flex;align-items:center;gap:10px"><span class="badge" style="color:'+sevC+'">'+sev.toUpperCase()+'</span><button class="delete-btn" data-id="'+d.id+'" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button></div></div>';
        });
        document.getElementById('inc-total').textContent=incidentesData.length;
        document.getElementById('inc-open').textContent=open;
        document.getElementById('inc-critical').textContent=crit;
        l.querySelectorAll('.delete-btn').forEach(function(btn){btn.addEventListener('click',function(){confirmDelete('logs',this.dataset.id,'Incidente',loadIncidentes);});});
    }else{em.style.display='';}
}
function filterIncidents(){
    var q=document.getElementById('inc-search').value.trim();
    renderIncidents(q||null);
}

// BRIEFING DIARIO
async function loadBriefing(){
    var today=new Date();
    var dateStr=today.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    document.getElementById('briefing-date').textContent=dateStr.toUpperCase();
    try{
        var v=await sb.from('vessels').select('status');var total=v.data?v.data.length:0;
        var active=v.data?v.data.filter(function(x){var s=(x.status||'').toLowerCase();return s.indexOf('viaje')>=0||s==='active'}).length:0;
        document.getElementById('brief-vessels').textContent=active+'/'+total;
        var vj=await sb.from('voyages').select('status');var trips=vj.data?vj.data.filter(function(x){var s=(x.status||'').toLowerCase();return s==='navegando'||s==='en_curso'}).length:0;
        document.getElementById('brief-trips').textContent=trips;
        var fl=await sb.from('fuel_logs').select('liters').limit(30);var totalFuel=fl.data?fl.data.reduce(function(s,x){return s+(x.liters||0)},0):0;
        document.getElementById('brief-fuel').textContent=totalFuel>0?totalFuel.toLocaleString()+'L':'0L';
        var cr=await sb.from('crew_members').select('status');var emb=cr.data?cr.data.filter(function(x){return(x.status||'').toLowerCase()==='embarcado'||x.status==='active'}).length:0;
        document.getElementById('brief-crew').textContent=emb+'/'+(cr.data?cr.data.length:0);
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=America/Asuncion');
        var wd=await w.json();
        if(wd.current){
            var codes={0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',51:'Llovizna',61:'Lluvia',80:'Chaparron',95:'Tormenta'};
            var desc=codes[wd.current.weather_code]||'Variado';
            document.getElementById('briefing-weather').innerHTML='<i class="fa-solid fa-cloud-sun"></i><div class="info-card-text"><h4>'+desc+' - '+Math.round(wd.current.temperature_2m)+'C</h4><p>Viento: '+Math.round(wd.current.wind_speed_10m)+' km/h | Humedad: '+(wd.current.relative_humidity_2m||'--')+'% | Asuncion, PY</p></div>';
        }
        var lg=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(5);
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
        var inc=await sb.from('logs').select('*').eq('action_type','INCIDENTE').order('created_at',{ascending:false}).limit(5);
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
