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
const loaders = {dashboard:loadDashboard,fleet:loadFleet,mapa:function(){if(!map)initMap();else setTimeout(function(){map.invalidateSize()},100)},admin:loadAdmin,viajes:loadViajes,bitacora:loadBitacora,tripulacion:loadCrew,combustible:loadFuel,mantenimiento:loadMaint,panol:loadPanol,comunicaciones:loadComms};

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
            tr.innerHTML='<td>'+(v.name||v.vessel_name||'')+'</td><td>'+(v.type||v.vessel_type||'')+'</td><td><span class="status-dot" style="background:'+c+'"></span>'+(v.status||'')+'</td><td>'+(v.location||v.current_position||'')+'</td>';
            tb.appendChild(tr);
        });
        document.getElementById('fleet-total').textContent=data.length;
    }catch(e){console.log('Fleet:',e);}
}

async function loadViajes(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('viajes-list');var em=document.getElementById('viajes-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(v){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(v.vessel_name||'')+' > '+(v.destination_port||'')+'</h4><p>'+(v.origin_port||'')+' - '+(v.cargo_tons||'')+' ton</p></div><span class="badge">'+(v.status||'PENDIENTE').toUpperCase()+'</span>';l.appendChild(d);});}else{em.style.display='';}
    }catch(e){console.log('Viajes:',e);}
}

async function loadBitacora(){
    try{
        var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(30);
        var data=r.data;var l=document.getElementById('bitacora-list');var em=document.getElementById('bitacora-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(row){var d=document.createElement('div');d.className='list-item';var t=row.created_at?new Date(row.created_at).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';d.innerHTML='<div><h4>'+(row.title||row.action_type||'Entrada')+'</h4><p>'+(row.vessel_name||'')+' - '+(row.description||row.details||'')+' - '+t+'</p></div>';l.appendChild(d);});}else{em.style.display='';}
    }catch(e){console.log('Bitacora:',e);}
}

async function loadCrew(){
    try{
        var r=await sb.from('crew_members').select('*');var data=r.data;
        var l=document.getElementById('crew-list');var em=document.getElementById('crew-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(c){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(c.full_name||c.name||'')+'</h4><p>'+(c.role||'')+' - '+(c.vessel_name||'')+'</p></div><span class="badge" style="color:var(--success)">'+(c.status||'EMBARCADO').toUpperCase()+'</span>';l.appendChild(d);});document.getElementById('crew-total').textContent=data.length;document.getElementById('crew-on').textContent=data.filter(function(c){return(c.status||'').toLowerCase()==='embarcado'}).length;}else{em.style.display='';}
    }catch(e){console.log('Crew:',e);}
}

async function loadFuel(){
    try{
        var r=await sb.from('fuel_logs').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('fuel-list');var em=document.getElementById('fuel-empty');l.innerHTML='';
        if(data&&data.length>0){em.style.display='none';data.forEach(function(f){var d=document.createElement('div');d.className='list-item';d.innerHTML='<div><h4>'+(f.vessel_name||'')+' -- '+(f.liters||f.quantity||0)+'L</h4><p>'+(f.fuel_type||'Gasoil')+' - '+(f.created_at?new Date(f.created_at).toLocaleDateString('es'):'')+'</p></div>';l.appendChild(d);});document.getElementById('fuel-count').textContent=data.length;}else{em.style.display='';}
    }catch(e){console.log('Fuel:',e);}
}

async function loadMaint(){
    try{
        var r=await sb.from('maintenance_tasks').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('maint-list');l.innerHTML='';
        if(data&&data.length>0){data.forEach(function(m){var d=document.createElement('div');d.className='list-item';var pc=m.priority==='Alta'||m.priority==='high'?'var(--error)':m.priority==='Media'?'var(--warning)':'var(--text-secondary)';d.innerHTML='<div><h4>'+(m.description||m.title||'')+'</h4><p>'+String.fromCodePoint(0x1F6A2)+' '+(m.vessel_name||'')+'</p></div><span class="badge" style="color:'+pc+'">'+(m.status||m.priority||'').toUpperCase()+'</span>';l.appendChild(d);});document.getElementById('maint-pending').textContent=data.filter(function(m){return(m.status||'').toLowerCase()!=='completed'}).length;}
    }catch(e){console.log('Maint:',e);}
}

async function loadPanol(){
    try{
        var r=await sb.from('inventory_items').select('*');var data=r.data;
        var l=document.getElementById('panol-list');l.innerHTML='';
        if(data&&data.length>0){data.forEach(function(i){var d=document.createElement('div');d.className='list-item';var q=i.quantity||i.stock||0;var mn=i.min_stock||0;var low=q<=mn;d.innerHTML='<div><h4>'+(i.name||'')+'</h4><p>'+(i.category||'')+' - Repuesto</p></div><span class="badge" style="color:'+(low?'var(--warning)':'var(--success)')+'">'+(low?'STOCK BAJO':'OK')+'<br>'+q+' uds</span>';l.appendChild(d);});document.getElementById('panol-total').textContent=data.length;}
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
    map=L.map('leaflet-map',{zoomControl:false}).setView([-25.3,-57.6],5);
    L.control.zoom({position:'topleft'}).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OpenStreetMap',maxZoom:18}).addTo(map);
    // Own fleet from Supabase
    loadFleetMarkers();
    // AIS third-party traffic
    loadAISTraffic();
    // Auto-refresh AIS every 30s
    setInterval(loadAISTraffic, 30000);
    // Hidrovia route
    L.polyline([[-22.5,-57.9],[-23.5,-57.8],[-25.3,-57.6],[-27,-58.5],[-29,-59.5],[-31.5,-60.5],[-33.5,-58.5],[-34.6,-58.4]],{color:'#1A1A2E',weight:2,dashArray:'6,6',opacity:0.5}).addTo(map);
}
function loadFleetMarkers(){
    sb.from('vessels').select('*').then(function(r){
        var data=r.data;if(!data)return;
        data.forEach(function(v){var lat=v.latitude||v.lat;var lng=v.longitude||v.lng;if(!lat||!lng)return;var s=(v.status||'').toLowerCase();var c=s.indexOf('viaje')>=0||s==='active'?'#2EA043':s.indexOf('manten')>=0?'#F59E0B':'#3B82F6';L.circleMarker([lat,lng],{radius:8,fillColor:c,color:'#fff',weight:2,fillOpacity:1}).addTo(map).bindPopup('<strong>'+(v.name||'')+'</strong><br>'+(v.status||'')+'<br><small>Flota propia</small>');});
    });
}
async function loadAISTraffic(){
    try{
        var r=await sb.from('ais_traffic').select('*').gte('updated_at',new Date(Date.now()-600000).toISOString());
        var data=r.data;if(!data||data.length===0)return;
        // Update or create markers
        data.forEach(function(v){
            var key=v.mmsi;
            if(aisMarkers[key]){
                aisMarkers[key].setLatLng([v.latitude,v.longitude]);
                aisMarkers[key].setPopupContent('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Trafico terceros</small>');
            }else{
                var m=L.circleMarker([v.latitude,v.longitude],{radius:5,fillColor:'#94A3B8',color:'#fff',weight:1.5,fillOpacity:0.8}).addTo(map);
                m.bindPopup('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Trafico terceros</small>');
                aisMarkers[key]=m;
            }
        });
        // Update legend count
        var legend=document.querySelector('.map-legend');
        if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=data.length+' activos';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=data.length+' activos AIS';legend.appendChild(d);}}
    }catch(e){console.log('AIS:',e);}
}

// MODAL
var modalForms={
    fleet:{title:'Agregar Activo',fields:[{id:'fleet-name',label:'NOMBRE',type:'text',placeholder:'Ej: R/M ATLAS'},{id:'fleet-type',label:'TIPO',type:'select',options:['Barcaza','Remolcador','Ponton']},{id:'fleet-status',label:'ESTADO',type:'select',options:['En Viaje','En Puerto','Mantenimiento']},{id:'fleet-location',label:'UBICACION',type:'text',placeholder:'Ej: Km 1420'}]},
    viaje:{title:'Nueva Solicitud de Viaje',fields:[{id:'viaje-vessel',label:'EMBARCACION',type:'text',placeholder:'Nombre'},{id:'viaje-origin',label:'ORIGEN',type:'text',placeholder:'Puerto origen'},{id:'viaje-dest',label:'DESTINO',type:'text',placeholder:'Puerto destino'},{id:'viaje-cargo',label:'CARGA (TON)',type:'text',placeholder:'3500'},{id:'viaje-date',label:'FECHA SALIDA',type:'date'}]},
    bitacora:{title:'Nueva Entrada de Bitacora',fields:[{id:'bit-title',label:'TITULO',type:'text',placeholder:'Resumen'},{id:'bit-vessel',label:'EMBARCACION',type:'text',placeholder:'Embarcacion'},{id:'bit-type',label:'TIPO',type:'select',options:['Observacion','Incidente','Maniobra','Navegacion']},{id:'bit-desc',label:'DESCRIPCION',type:'textarea',placeholder:'Detalle...'}]},
    crew:{title:'Agregar Tripulante',fields:[{id:'crew-name',label:'NOMBRE',type:'text',placeholder:'Juan Perez'},{id:'crew-role',label:'ROL',type:'select',options:['Capitan','Timonel','Maquinista','Marinero','Cocinero']},{id:'crew-vessel',label:'EMBARCACION',type:'text',placeholder:'Asignar a...'},{id:'crew-doc',label:'DOCUMENTO',type:'text',placeholder:'Nro documento'}]},
    fuel:{title:'Registrar Combustible',fields:[{id:'fuel-vessel',label:'EMBARCACION',type:'text',placeholder:'Nombre'},{id:'fuel-liters',label:'LITROS',type:'text',placeholder:'5000'},{id:'fuel-type',label:'TIPO',type:'select',options:['Gasoil','IFO 380','MGO']},{id:'fuel-date',label:'FECHA',type:'date'}]},
    maint:{title:'Nueva Orden de Mantenimiento',fields:[{id:'maint-title',label:'DESCRIPCION',type:'text',placeholder:'Que reparar'},{id:'maint-vessel',label:'EMBARCACION',type:'text',placeholder:'Embarcacion'},{id:'maint-priority',label:'PRIORIDAD',type:'select',options:['Alta','Media','Baja']},{id:'maint-notes',label:'NOTAS',type:'textarea',placeholder:'Detalles...'}]},
    panol:{title:'Agregar Item',fields:[{id:'panol-name',label:'REPUESTO',type:'text',placeholder:'Filtro de aceite'},{id:'panol-cat',label:'CATEGORIA',type:'select',options:['Motor','Electrico','Hidraulico','Casco','General']},{id:'panol-qty',label:'CANTIDAD',type:'text',placeholder:'10'},{id:'panol-min',label:'STOCK MINIMO',type:'text',placeholder:'2'}]}
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

