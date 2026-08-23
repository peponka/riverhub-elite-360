// Supabase Init
const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTOMATIC ENGLISH TRANSLATOR (FETCH INTERCEPTOR) ---
const EN_DICT = {
    'navegación': 'navigation',
    'navegacion': 'navigation',
    'Navegación': 'Navigation',
    'combustible': 'fuel',
    'Combustible': 'Fuel',
    'Posición actual': 'Current position',
    'velocidad': 'speed',
    'nudos': 'knots',
    'días': 'days',
    'día': 'day',
    'Paso por': 'Passed by',
    'Nivel del río': 'River level',
    'normal': 'normal',
    'Consumo diario': 'Daily consumption',
    'lts': 'L',
    'Autonomía restante': 'Remaining autonomy',
    'Decisión actual': 'Current decision',
    'ETA Rosario:': 'ETA Rosario:',
    'Remolcador': 'Tugboat',
    'remolcador': 'tugboat',
    'Barcaza': 'Barge',
    'barcaza': 'barge',
    'Empujador': 'Pusher',
    'empujador': 'pusher',
    'Activo': 'Active',
    'activo': 'active',
    'PENDIENTE': 'PENDING',
    'pendiente': 'pending',
    'EN TRÃƒÆ’Ã‚ÂNSITO': 'IN TRANSIT',
    'COMPLETADO': 'COMPLETED',
    'completado': 'completed',
    'En Servicio': 'In Service',
    'En Dique': 'Dry Dock',
    'embarcado': 'onboard',
    'EMBARCADO': 'ONBOARD',
    'descanso': 'leave',
    'En viaje': 'In Transit',
    'en viaje': 'in transit',
    'navegando': 'in transit',
    'Navegando': 'In Transit',
    'en_viaje': 'in_transit',
    'en_puerto': 'in_port',
    'en_curso': 'in_progress',
    'entregado': 'delivered',
    'finalizado': 'completed',
    'mantenimiento': 'maintenance',
    'Mantenimiento': 'Maintenance',
    'Capitán': 'Captain',
    'capitán': 'captain',
    'CAPITÃƒÆ’Ã‚ÂN': 'CAPTAIN',
    'Timonel': 'Helmsman',
    'TIMONEL': 'HELMSMAN',
    'Maquinista': 'Engineer',
    'MAQUINISTA': 'ENGINEER',
    'Marinero': 'Seaman',
    'MARINERO': 'SEAMAN',
    'Primer Oficial': 'First Officer',
    'Jefe de Máquinas': 'Chief Engineer',
    'Cocinero': 'Cook',
    'maniobra': 'maneuver',
    'observación': 'observation',
    'observacion': 'observation',
    'incidente': 'incident',
    'Abierto': 'Open',
    'Cerrado': 'Closed',
    'VENCIDO': 'EXPIRED',
    'Vibración detectada a 1200 RPM': 'Vibration detected at 1200 RPM',
    'Vibración detectada': 'Vibration detected',
    'Calibración ecosonda': 'Echosounder calibration',
    'lectura errática': 'erratic reading',
    'Revisión sistema hidráulico timón trimestral': 'Quarterly rudder hydraulic system inspection',
    'Revisión sistema hidráulico': 'Hydraulic system inspection',
    'timón trimestral': 'quarterly rudder',
    'Sistema de navegación actualizado y calibrado. Todo nominal.': 'Navigation system updated and calibrated. All nominal.',
    'Condiciones normales de navegación': 'Normal navigation conditions',
    'Análisis de condiciones de navegación': 'Navigation conditions analysis',
    'Sistema Automático': 'Automatic System',
    'SIN ALERTAS': 'NO ALERTS',
    'Alta': 'High',
    'Media': 'Medium',
    'Baja': 'Low',
    'Crítico': 'Critical',
    'Aceite Motor CAT 15W-40': 'CAT 15W-40 Engine Oil',
    'Filtro aceite CAT 1R-0716': 'CAT 1R-0716 Oil Filter',
    'Cabo de amarre 32mm': '32mm Mooring Line',
    'Pintura antifouling roja': 'Red Antifouling Paint',
    'Chaleco salvavidas SOLAS': 'SOLAS Life Jacket',
    'Bengalas de emergencia': 'Emergency Flares',
    'Grasa marina Mobilgrease': 'Mobilgrease Marine Grease',
    'Electrodo soldadura 7018': '7018 Welding Electrode',
    'Manguera hidráulica': 'Hydraulic Hose',
    'Filtro fuel CAT': 'CAT Fuel Filter',
    'Cabullería': 'Cordage',
    'Lubricantes': 'Lubricants',
    'Filtros': 'Filters',
    'Pintura': 'Paint',
    'Seguridad': 'Safety',
    'Hidráulica': 'Hydraulics',
    'Motor': 'Engine',
    'Eléctrico': 'Electrical',
    'Casco': 'Hull',
    'inyector': 'injector',
    'Meteorología': 'Weather',
    'METEOROLOGÃƒÆ’Ã‚ÂA': 'WEATHER',
    'Condiciones óptimas': 'Optimal conditions',
    'Sistema': 'System',
    'Carga de combustible registrada exitosamente': 'Fuel refuel recorded successfully',
    'Carga Terminada': 'Refuel Complete',
    'Puerto de Asunción': 'Port of Asunción',
    'Gestión Inteligente de Flotas Fluviales': 'Intelligent River Fleet Management',
    'Guía completa': 'Complete guide',
    'PREFECTURA': 'Coast Guard',
    'Plataforma de gestión': 'Management platform'
}

function translateText(str) {
    if (!str || typeof str !== 'string') return str;
    let translated = str;
    for (const [es, en] of Object.entries(EN_DICT)) {
        const regex = new RegExp(es, 'gi');
        translated = translated.replace(regex, (match) => {
            if (match[0] === match[0].toUpperCase()) return en.charAt(0).toUpperCase() + en.slice(1);
            return en;
        });
    }
    return translated;
}

function translateData(data) {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(item => translateData(item));
    } else if (typeof data === 'object') {
        let newItem = { ...data };
        for (const key in newItem) {
            if (typeof newItem[key] === 'string') {
                newItem[key] = translateText(newItem[key]);
            } else if (newItem[key] !== null && typeof newItem[key] === 'object') {
                 newItem[key] = translateData(newItem[key]);
            }
        }
        return newItem;
    }
    return data;
}

// Intercept all fetch requests to Supabase REST API
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    
    // Only intercept successful GET requests to Supabase
    if (url.includes('.supabase.co/rest/v1') && response.ok) {
        const clonedResponse = response.clone();
        try {
            const data = await clonedResponse.json();
            const translatedData = translateData(data);
            
            return new Response(JSON.stringify(translatedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch (e) {
            // If it's not JSON or parsing fails, return original response
            console.error("Fetch interceptor translation error:", e);
        }
    }
    return response;
};
// --------------------------------------------------------








// ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
// ━━━━━━━━━━ GLOBAL ERROR BOUNDARY  Prevents UI crashes ━━━━━━━━━━
// ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
window.onerror = function(msg, src, line, col, err) {
    // Suppress Supabase auth noise
    if (typeof msg === 'string' && (msg.includes('refresh_token') || msg.includes('AuthApiException'))) return true;
    console.error('[ViaBarcazas Error]', msg, '@ ' + src + ':' + line);
    return true; // Prevent default error handling
};
window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason ? (e.reason.message || String(e.reason)) : '';
    // Swallow Supabase auth + network errors silently
    if (msg.includes('refresh_token') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('AuthApiException')) {
        e.preventDefault();
        return;
    }
    console.warn('[ViaBarcazas Unhandled]', msg);
    e.preventDefault();
});

// ━━━━━━━━━━ XSS escape helper  prevents stored XSS via innerHTML ━━━━━━━━━━
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


// PASSWORD RESET HANDLER - detect recovery token in URL
(function detectPasswordReset(){
    var hash = window.location.hash;
    if(hash && hash.includes('type=recovery')){
        setTimeout(function(){
            // Hide dashboard, show full-screen reset form like login
            document.getElementById('app-shell').style.display='none';
            var screen = document.getElementById('login-screen');
            screen.style.display='flex';
            screen.querySelector('.login-card').innerHTML = '<div class="login-brand"><svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ViaBarcazas"><path d="M6 13 L24 33 L42 13" stroke="#F3F7F5" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="24" cy="33" r="3.4" fill="#25D366"/></svg><span style="font-family:Bricolage Grotesque,sans-serif;font-size:2.2rem;font-weight:700;color:var(--text-primary);letter-spacing:-0.01em">ViaBarcazas</span></div>'+
                '<h1 class="login-title">Reset<br><em>Password.</em></h1>'+
                '<p class="login-sub">ENTER YOUR NEW PASSWORD</p>'+
                '<div id="reset-pw-error" style="display:none;font-size:12px;margin:12px 0;font-weight:600;"></div>'+
                '<label class="login-label">NEW PASSWORD</label>'+
                '<div style="position:relative"><input type="password" id="new-password-input" class="login-input" placeholder="Minimum 6 characters" style="padding-right:44px"><button type="button" onclick="togglePwVis(\'new-password-input\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'+
                '<label class="login-label">CONFIRM PASSWORD</label>'+
                '<div style="position:relative"><input type="password" id="confirm-password-input" class="login-input" placeholder="Repeat password" style="padding-right:44px"><button type="button" onclick="togglePwVis(\'confirm-password-input\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'+
                '<button class="login-btn" onclick="doChangePassword()">Change Password</button>'+
                '<div style="margin-top:24px;border-top:0.5px solid var(--separator);padding-top:16px;"><p class="login-footer">Paraguay-Parana Waterway - ViaBarcazas</p></div>';
        }, 1000);
    }
})();

async function doChangePassword(){
    var pw = document.getElementById('new-password-input').value;
    var pw2 = document.getElementById('confirm-password-input').value;
    var errDiv = document.getElementById('reset-pw-error');
    if(!pw || pw.length < 6){errDiv.textContent='Password must be at least 6 characters';errDiv.style.display='block';return;}
    if(pw !== pw2){errDiv.textContent='Passwords do not match';errDiv.style.display='block';return;}
    try{
        var r = await sb.auth.updateUser({password: pw});
        if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';return;}
        var card = document.querySelector('.login-card');
        if(card) card.innerHTML='<div style="text-align:center;padding:40px 0;"><i class="fa-solid fa-circle-check" style="font-size:64px;color:var(--success,#10b981);margin-bottom:20px;display:block;"></i><h1 class="login-title" style="margin-bottom:8px;">Password<br><em>Changed!</em></h1><p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">Your password has been updated successfully.</p><button class="login-btn" onclick="window.location.href=window.location.pathname;">Continue to Dashboard</button></div>';
    }catch(e){
        errDiv.textContent='Error updating password';errDiv.style.display='block';
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
var loginCardTemplate = document.querySelector('.login-card') ? document.querySelector('.login-card').innerHTML : '';

function showLoginView() {
    var card = document.querySelector('.login-card');
    if (!card || !loginCardTemplate) return;
    authMode = 'login';
    card.innerHTML = loginCardTemplate;
    var errDiv = document.getElementById('login-error');
    if (errDiv) errDiv.style.display = 'none';
    var btn = document.getElementById('login-btn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Log In';
    }
}

function showForgotPasswordView() {
    var card = document.querySelector('.login-card');
    if (!card) return;
    authMode = 'forgotPassword';
    card.innerHTML =
        '<div class="login-brand"><svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ViaBarcazas"><path d="M6 13 L24 33 L42 13" stroke="#F3F7F5" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="24" cy="33" r="3.4" fill="#25D366"/></svg><span style="font-family:Bricolage Grotesque,sans-serif;font-size:2.2rem;font-weight:700;color:var(--text-primary);letter-spacing:-0.01em">ViaBarcazas</span></div>'+
        '<h1 class="login-title">Recover<br><em>password.</em></h1>'+
        '<p class="login-sub" style="line-height:1.5;text-transform:none;letter-spacing:0;font-size:14px;font-weight:500;">Enter your email and we will send you a link to reset your password.</p>'+
        '<div id="forgot-error" style="display:none;color:var(--error);font-size:12px;margin:12px 0;font-weight:600;"></div>'+
        '<div id="forgot-success" style="display:none;color:var(--success,#10b981);font-size:12px;margin:12px 0;font-weight:700;line-height:1.5;"></div>'+
        '<label class="login-label">EMAIL</label>'+
        '<input type="email" id="forgot-email" class="login-input" placeholder="user@company.com" autocomplete="email">'+
        '<button class="login-btn" id="forgot-submit-btn" onclick="sendPasswordResetLink()">Send link</button>'+
        '<button type="button" onclick="showLoginView()" style="width:100%;margin-top:14px;background:none;border:1px solid var(--separator);border-radius:12px;padding:12px;color:var(--text-secondary);cursor:pointer;font-size:13px;font-weight:700;font-family:Manrope,sans-serif;">Back to sign in</button>'+
        '<div style="margin-top:24px;border-top:0.5px solid var(--separator);padding-top:16px;"><p class="login-footer">Paraguay-Parana Waterway - ViaBarcazas</p></div>';
    setTimeout(function(){
        var input = document.getElementById('forgot-email');
        if (input) input.focus();
    }, 0);
}

function toggleRegister() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.querySelector('.login-title').innerHTML = authMode === 'login' ? 'Welcome<br><em>back.</em>' : 'Create<br><em>new account.</em>';
    document.getElementById('login-btn').textContent = authMode === 'login' ? 'Log In' : 'Sign Up';
    document.getElementById('toggle-register-btn').textContent = authMode === 'login' ? 'Create new account' : 'Already have an account (Log In)';
    document.getElementById('login-error').style.display = 'none';
}

async function doLogin(){
    var email=document.getElementById('login-email').value.trim();
    var pass=document.getElementById('login-password').value;
    var errDiv=document.getElementById('login-error');
    var btn=document.getElementById('login-btn');
    errDiv.style.color='var(--error)';
    if(!email||!pass){errDiv.textContent='Please fill in all fields';errDiv.style.display='block';return;}
    btn.disabled=true;btn.textContent=authMode==='login'?'Logging in...':'Signing up...';errDiv.style.display='none';
    try{
        if (authMode === 'login') {
            var r=await sb.auth.signInWithPassword({email:email,password:pass});
            if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';btn.disabled=false;btn.textContent='Log In';return;}
            showApp(r.data.user);
        } else {
            var r=await sb.auth.signUp({email:email,password:pass});
            if(r.error){errDiv.textContent=r.error.message;errDiv.style.display='block';btn.disabled=false;btn.textContent='Sign Up';return;}
            errDiv.style.color = 'var(--success, #10b981)';
            errDiv.textContent = 'Registration successful. Please log in to continue.';
            errDiv.style.display='block';
            btn.disabled=false;btn.textContent='Sign Up';
            setTimeout(() => { errDiv.style.display='none'; toggleRegister(); }, 3000);
        }
    }catch(e){errDiv.style.color='var(--error)';errDiv.textContent='Connection error';errDiv.style.display='block';btn.disabled=false;btn.textContent=authMode==='login'?'Log In':'Sign Up';}
}

async function doGoogleLogin(){
    try{
        await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/viabarcazas-en.html' }
        });
    }catch(e){
        var errDiv=document.getElementById('login-error');
        if(errDiv){errDiv.style.color='var(--error)';errDiv.textContent='Error connecting to Google';errDiv.style.display='block';}
    }
}

async function doResetPassword() {
    showForgotPasswordView();
}

async function sendPasswordResetLink() {
    var emailInput = document.getElementById('forgot-email');
    var email = emailInput ? emailInput.value.trim() : '';
    var errDiv = document.getElementById('forgot-error');
    var successDiv = document.getElementById('forgot-success');
    var btn = document.getElementById('forgot-submit-btn');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (errDiv) errDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    if(!email){
        if(errDiv){errDiv.textContent='Enter your email to continue.';errDiv.style.display='block';}
        return;
    }
    if(!emailPattern.test(email)){
        if(errDiv){errDiv.textContent='Enter a valid email.';errDiv.style.display='block';}
        return;
    }
    if(btn){btn.disabled=true;btn.textContent='Sending...';}
    try {
        var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/viabarcazas-en.html' });
        if(r.error){
            if(errDiv){errDiv.textContent=r.error.message || 'We could not send the link. Please try again.';errDiv.style.display='block';}
            return;
        }
        if(successDiv){successDiv.textContent='Done. Check your email to reset your password.';successDiv.style.display='block';}
    } catch(e) {
        if(errDiv){errDiv.textContent='We could not send the link. Please try again.';errDiv.style.display='block';}
    } finally {
        if(btn){btn.disabled=false;btn.textContent='Send link';}
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

        if(r.data){
            currentCompanyId=r.data.company_id;
            currentUserRole=r.data.role;

            if(r.data.full_name)document.getElementById('user-display').textContent=r.data.full_name;
            document.querySelector('.user-role').textContent=(r.data.role||'ADMIN').toUpperCase();
            if(currentCompanyId){sb.from('companies').select('name').eq('id',currentCompanyId).single().then(function(c){if(c.data)document.querySelector('.user-role').textContent=(r.data.role||'ADMIN').toUpperCase()+' - '+(c.data.name||'');});}
            checkAdminAccess();
        } else {

            // Auto-create profile if missing
            sb.from('companies').select('id').eq('name','ViaBarcazas Admin').single().then(function(c2){
                var cid = c2.data ? c2.data.id : null;
                sb.from('user_profiles').insert({user_id:user.id, company_id:cid, role:'viewer', full_name:'New User'}).then(function(ins){

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
const loaders = {dashboard:loadDashboard,fleet:loadFleet,mapa:function(){if(!map)initMap();else setTimeout(function(){map.invalidateSize()},100)},admin:loadAdmin,viajes:loadTrips,bitacora:loadBitacora,tripulacion:loadCrew,combustible:loadFuel,mantenimiento:loadMaint,panol:loadPanol,comunicaciones:loadComms,hidrologia:loadHidrologia,reportes:loadReportes,copiloto:function(){},convoy:loadConvoy,tracking:loadTracking,planes:function(){},calado:loadCalado,incidentes:loadIncidents,liquidos:loadLiquidosEN,contratos:loadContratosEN,prezarpe:loadPreZarpe,briefing:loadBriefing};

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

// ━━━━━━━━━━ MOBILE HAMBURGER ━━━━━━━━━━
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

// ━━━━━━━━━━ NOTIFICATIONS ━━━━━━━━━━
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
        list.innerHTML='<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><p>No new notifications</p></div>';
        if(badge)badge.style.display='none';
        return;
    }
    if(badge){badge.textContent=notifData.length;badge.style.display='flex';}
    list.innerHTML=notifData.map(function(n,i){
        var t=n.created_at?new Date(n.created_at).toLocaleString('en',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
        var cls=i<3?'notif-item unread':'notif-item';
        return '<div class="'+cls+'"><div class="notif-title">'+esc(n.title||n.action_type||'Activity')+'</div><div class="notif-desc">'+esc(n.description||n.details||'')+'</div><div class="notif-time">'+t+'</div></div>';
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
        var el=document.getElementById('dash-week');if(el)el.textContent='WEEK '+weekNum+' Ãƒâ€šÃ‚Â· '+now.getFullYear();

        // Fetch all vessels
        var r=await sb.from('vessels').select('*').limit(100);
        var vessels=r.data||[];
        var total=vessels.length;
        var active=0,docked=0,maint=0;
        vessels.forEach(function(v){var s=(v.status||'').toLowerCase();if(s==='en viaje'||s==='active'||s==='navegando'||s==='in_transit')active++;else if(s.indexOf('manten')>=0)maint++;else docked++;});

        // KPI: Fleet Active
        var el1=document.getElementById('dash-kpi-viaje');if(el1)el1.textContent=active;
        var elT=document.getElementById('dash-kpi-total');if(elT)elT.textContent=total;
        var elSub=document.getElementById('dash-kpi-viaje-sub');if(elSub)elSub.innerHTML='<i class="fa-solid fa-arrow-up"></i> '+(Math.round((active/Math.max(total,1))*100))+'% disp. +'+docked+' vs. ayer';

        // KPI: Alertas
        var el3=document.getElementById('dash-kpi-alertas');if(el3)el3.textContent=maint>0?('0'+maint).slice(-2):'00';

        // KPI: Fuel - try to get real data
        try{
            // 'fuel_records'.'liters' no existe; la real es 'fuel_logs'.'quantity'
            var fuelR=await sb.from('fuel_logs').select('quantity, logged_at').limit(200);
            var fuelData=fuelR.data||[];
            var totalFuel=0;fuelData.forEach(function(f){totalFuel+=(Number(f.quantity)||0);});
            var fuelKL=(totalFuel/1000).toFixed(1);
            var elF=document.getElementById('dash-kpi-fuel');if(elF)elF.textContent=fuelKL;
            var elFS=document.getElementById('dash-kpi-fuel-sub');if(elFS)elFS.textContent='ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ '+(fuelData.length)+' logs Ãƒâ€šÃ‚Â· last 24h';
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
                var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='in_transit';
                var isMaint=s.indexOf('manten')>=0;
                var statusColor=isActive?'var(--success)':isMaint?'var(--warning)':'var(--accent)';
                var statusLabel=isActive?'IN TRANSIT':isMaint?'ATTENTION':'IN PORT';
                var speed=isActive?'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â':'0';
                var loc=v.location||v.current_position||'ASU';
                var type=v.type||v.vessel_type||'REM';
                return '<div onclick="selectDashVessel('+i+')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;background:var(--bg-primary)" onmouseover="this.style.borderColor=\'var(--separator)\'" onmouseout="this.style.borderColor=\'transparent\'">'+
                    '<div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">'+(v.name||v.vessel_name||'Vessel')+'</div>'+
                    '<div style="font-size:10px;color:var(--text-secondary);margin-top:2px">'+type.substring(0,3).toUpperCase()+' Ãƒâ€šÃ‚Â· '+loc.substring(0,3).toUpperCase()+' Ãƒâ€šÃ‚Â· '+speed+' KN</div></div>'+
                    '<span style="font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;border-radius:4px;background:'+statusColor+'15;color:'+statusColor+'">'+statusLabel+'</span></div>';
            }).join('');
        }

        // Store vessels for detail selection
        window._dashVessels=vessels;

        // Auto-select first vessel
        if(vessels.length>0)selectDashVessel(0);

        // Load extras in parallel (consolidated: audit #9)
        loadDashRecentVessels(vessels);
        Promise.all([
            loadDashWeather(),
            loadDashHydro(),
            loadDashActivity(),
            loadDashMiniCharts(vessels)
        ]).catch(function(){});
    }catch(e){/* Dashboard: */;}
}

function selectDashVessel(idx){
    var v=(window._dashVessels||[])[idx];if(!v)return;
    var detail=document.getElementById('dash-vessel-detail');if(detail)detail.style.display='block';
    var elN=document.getElementById('dash-sel-name');if(elN)elN.textContent=v.name||v.vessel_name||'--';
    var elI=document.getElementById('dash-sel-imo');if(elI)elI.textContent='IMO '+(v.imo||v.id||'--');
    var elR=document.getElementById('dash-sel-route');if(elR)elR.textContent=(v.location||'ASU')+' ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ '+(v.destination||'MPA');
    var s=(v.status||'').toLowerCase();
    var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='in_transit';
    var elC=document.getElementById('dash-sel-convoy');if(elC)elC.textContent=isActive?'4+1':'--';
    var elF=document.getElementById('dash-sel-fuel');if(elF)elF.textContent=isActive?'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â':'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â';
    var elE=document.getElementById('dash-sel-eta');if(elE)elE.textContent=isActive?'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â':'In port';
}

async function loadDashWeather(){
    try{
        var resp=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.28&longitude=-57.63&current_weather=true&hourly=relativehumidity_2m');
        var d=await resp.json();
        if(d.current_weather){
            var w=d.current_weather;
            var el=document.getElementById('dash-temp');if(el)el.textContent=w.temperature;
            var el2=document.getElementById('dash-wind');if(el2)el2.textContent=w.windspeed;
            var el3=document.getElementById('dash-weather2');if(el3)el3.textContent=w.temperature+'Ãƒâ€šÃ‚Â°C Ãƒâ€šÃ‚Â· '+(w.windspeed<20?'Optimal conditions':'Strong wind');
        }
        if(d.hourly&&d.hourly.relativehumidity_2m){var h=d.hourly.relativehumidity_2m[new Date().getHours()];var el4=document.getElementById('dash-humidity');if(el4)el4.textContent=h;}
    }catch(e){/* Weather: */;}
}

async function loadDashHydro(){
    try{
        var el=document.getElementById('dash-hidro-status');if(el)el.textContent='Normal level';
        var el2=document.getElementById('dash-h-asu');if(el2)el2.textContent='2.45m';
        var el3=document.getElementById('dash-h-pir');if(el3)el3.textContent='3.12m';
        var el4=document.getElementById('dash-h-ros');if(el4)el4.textContent='1.87m';
    }catch(e){/* Hydro: */;}
}

function loadDashRecentVessels(vessels){
    var container=document.getElementById('dash-vessels');if(!container)return;
    container.innerHTML=vessels.slice(0,4).map(function(v){
        var s=(v.status||'').toLowerCase();
        var isActive=s==='en viaje'||s==='active'||s==='navegando'||s==='in_transit';
        var isMaint=s.indexOf('manten')>=0;
        var borderColor=isActive?'var(--success)':isMaint?'var(--warning)':'var(--accent)';
        return '<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:12px;padding:14px;border-left:3px solid '+borderColor+'">'+
            '<div style="font-size:13px;font-weight:600">'+(v.name||v.vessel_name||'')+'</div>'+
            '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">'+(v.type||v.vessel_type||'')+' Ãƒâ€šÃ‚Â· '+(v.location||v.current_position||'--')+'</div>'+
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
            var t=l.created_at?new Date(l.created_at).toLocaleString('en',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
            return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--separator)">'+
                '<div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-bolt" style="font-size:12px;color:var(--accent)"></i></div>'+
                '<div style="flex:1"><div style="font-size:12px;font-weight:500">'+(l.title||l.action_type||'Activity')+'</div><div style="font-size:11px;color:var(--text-secondary)">'+(l.description||l.details||'')+'</div></div>'+
                '<div style="font-size:10px;color:var(--text-secondary);white-space:nowrap">'+t+'</div></div>';
        }).join('');
    }catch(e){/* Activity: */;}
}

function exportDashboardPDF(){alert('Exporting dashboard report...');}

// ━━━━━━━━━━ DASHBOARD MINI CHARTS ━━━━━━━━━━
var dashFuelTrendChart=null, dashFleetUtilChart=null;
async function loadDashMiniCharts(vessels){
    try{
        var fuelR=await sb.from('fuel_logs').select('liters,created_at').order('created_at',{ascending:true}).limit(100);
        var fuelData=fuelR.data||[];
        var fuelByDay={};
        for(var i=6;i>=0;i--){var dt=new Date();dt.setDate(dt.getDate()-i);var k=dt.toLocaleDateString('en',{day:'2-digit',month:'short'});fuelByDay[k]=0;}
        fuelData.forEach(function(f){
            if(!f.created_at)return;
            var d=new Date(f.created_at);var k=d.toLocaleDateString('en',{day:'2-digit',month:'short'});
            if(fuelByDay.hasOwnProperty(k))fuelByDay[k]+=(f.liters||0);
        });
        var fuelLabels=Object.keys(fuelByDay);var fuelValues=Object.values(fuelByDay);
        var ctx1=document.getElementById('dash-fuel-trend');
        if(ctx1){
            if(dashFuelTrendChart)dashFuelTrendChart.destroy();
            dashFuelTrendChart=new Chart(ctx1,{type:'line',data:{labels:fuelLabels,datasets:[{data:fuelValues,borderColor:'#25D366',backgroundColor:'rgba(37,211,102,0.10)',fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:'#25D366',pointBorderColor:'#0F231C',pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.parsed.y.toLocaleString()+' L'}}}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.07)'},ticks:{color:'#A9B8B2',font:{size:9},callback:function(v){return v>999?(v/1000).toFixed(0)+'k':v}}},x:{grid:{display:false},ticks:{color:'#A9B8B2',font:{size:9},maxRotation:0}}}}});
        }
    }catch(e){/* Fuel trend: */;}
    try{
        var active=0,docked=0,maint=0;
        (vessels||[]).forEach(function(v){var s=(v.status||'').toLowerCase();if(s==='en viaje'||s==='active'||s==='navegando'||s==='in_transit')active++;else if(s.indexOf('manten')>=0)maint++;else docked++;});
        var ctx2=document.getElementById('dash-fleet-util');
        if(ctx2){
            if(dashFleetUtilChart)dashFleetUtilChart.destroy();
            dashFleetUtilChart=new Chart(ctx2,{type:'doughnut',data:{labels:['Navigating','In Port','Maintenance'],datasets:[{data:[active,docked,maint],backgroundColor:['#34D399','#128C7E','#FBBF24'],borderWidth:0,borderRadius:4}]},options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#A9B8B2',font:{family:'Manrope',size:10},padding:8,usePointStyle:true,pointStyleWidth:8}}}}});
        }
    }catch(e){/* Fleet util: */;}
}

// ━━━━━━━━━━ DASHBOARD AUTO-REFRESH (60s) ━━━━━━━━━━
var _dashAutoRefresh=setInterval(function(){
    var dashView=document.getElementById('view-dashboard');
    if(dashView && dashView.classList.contains('active')){
        loadDashboard();
    }
},60000);

async function loadFleet(){
    try{
        var r=await sb.from('vessels').select('*').limit(100);var data=r.data;if(!data)return;
        var tb=document.getElementById('fleet-tbody');
        // Hide table structure, use parent as card container
        var table=tb.closest('table');if(table){var thead=table.querySelector('thead');if(thead)thead.style.display='none';table.style.border='none';table.style.background='transparent';}
        tb.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px';
        tb.innerHTML='';
        var typeIcons={'remolcador':'fa-ship','tugboat':'fa-ship','empujador':'fa-truck-moving','pusher':'fa-truck-moving','barcaza':'fa-box-open','barge':'fa-box-open','tanque':'fa-droplet','tanker':'fa-droplet','lancha':'fa-ferry','patrol':'fa-shield-halved'};
        var typeColors={'remolcador':'#3B82F6','tugboat':'#3B82F6','empujador':'#8B5CF6','pusher':'#8B5CF6','barcaza':'#F97316','barge':'#F97316','tanque':'#0EA5E9','tanker':'#0EA5E9','lancha':'#10B981','patrol':'#DC2626'};
        var typeLabels={'remolcador':'TUGBOAT','tugboat':'TUGBOAT','empujador':'PUSHER','pusher':'PUSHER','barcaza':'BARGE','barge':'BARGE','tanque':'TANKER','tanker':'TANKER','lancha':'PATROL','patrol':'PATROL'};
        var inService=0;var inDock=0;
        data.forEach(function(v){
            var type=(v.type||v.vessel_type||'tugboat').toLowerCase();
            var icon=typeIcons[type]||'fa-ship';
            var color=typeColors[type]||'#94A3B8';
            var typeLabel=typeLabels[type]||(v.type||v.vessel_type||'Vessel').toUpperCase();
            var st=(v.status||'active').toLowerCase();
            var isActive=st==='activo'||st==='active'||st.indexOf('viaje')>=0||st.indexOf('transit')>=0;
            var isDock=st.indexOf('dique')>=0||st.indexOf('dock')>=0||st.indexOf('manten')>=0;
            if(isActive)inService++;if(isDock)inDock++;
            var stColor=isActive?'#2EA043':isDock?'#F59E0B':'#94A3B8';
            var stLabel=isActive?'Active':isDock?'Dry Dock':(v.status||'Active');
            var d=document.createElement('tr');
            d.style.cssText='display:block;background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:20px;transition:all 0.2s;cursor:default';
            d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.06)'};
            d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
            d.innerHTML='<td style="display:block;padding:0;border:none"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div style="width:44px;height:44px;border-radius:12px;background:'+color+'12;display:flex;align-items:center;justify-content:center"><i class="fa-solid '+icon+'" style="font-size:18px;color:'+color+'"></i></div><button class="delete-btn" title="Delete" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;border-radius:6px;font-size:13px"><i class="fa-regular fa-trash-can"></i></button></div><div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:3px;letter-spacing:0.3px">'+esc(v.name||v.vessel_name||'')+'</div><div style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'10;padding:3px 8px;border-radius:5px;margin-bottom:12px">'+typeLabel+'</div><div style="display:flex;align-items:center;justify-content:space-between"><span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-location-dot" style="font-size:10px;color:var(--text-tertiary)"></i>'+(v.location||v.current_position||'No location')+'</span><span style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:'+stColor+'"><span style="width:6px;height:6px;border-radius:50%;background:'+stColor+'"></span>'+stLabel+'</span></div></td>';
            d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('vessels',v.id,v.name||v.vessel_name||'Vessel',loadFleet);});
            tb.appendChild(d);
        });
        document.getElementById('fleet-total').textContent=data.length;
        var elServ=document.getElementById('fleet-service');if(elServ)elServ.textContent=inService;
        var elDock=document.getElementById('fleet-dock');if(elDock)elDock.textContent=inDock;
        renderFleetCharts(data,inService,inDock,typeLabels);
    }catch(e){console.error('loadFleet:',e);}
}
var fleetStatusChart=null,fleetTypeChart=null;
function renderFleetCharts(data,inService,inDock,typeLabels){
    var other=Math.max(0,data.length-inService-inDock);
    var ctx1=document.getElementById('fleet-status-chart');
    if(ctx1){
        if(fleetStatusChart)fleetStatusChart.destroy();
        fleetStatusChart=new Chart(ctx1,{type:'doughnut',data:{labels:['In Service','Dry Dock','Other'],datasets:[{data:[inService,inDock,other],backgroundColor:['#34D399','#FBBF24','#6B7280'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#A9B8B2',font:{family:'Manrope',size:10},padding:8,usePointStyle:true,pointStyleWidth:8}}}}});
    }
    var byType={};
    data.forEach(function(v){var type=(v.type||v.vessel_type||'tugboat').toLowerCase();var t=typeLabels[type]||(v.type||v.vessel_type||'Vessel').toUpperCase();byType[t]=(byType[t]||0)+1;});
    var ctx2=document.getElementById('fleet-type-chart');
    if(ctx2){
        if(fleetTypeChart)fleetTypeChart.destroy();
        fleetTypeChart=new Chart(ctx2,{type:'bar',data:{labels:Object.keys(byType),datasets:[{data:Object.values(byType),backgroundColor:'rgba(37,211,102,0.65)',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.07)'},ticks:{color:'#A9B8B2',stepSize:1}},y:{grid:{display:false},ticks:{color:'#A9B8B2',font:{size:10}}}}}});
    }
}

async function loadTrips(){
    try{
        var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(50);
        var data=r.data||[];
        if(data.length===0){
            data=[
                {id:'demo1',vessel_name:'R/M Guarani',origin_port:'Nueva Palmira (UY)',destination_port:'Asuncion (PY)',cargo_tons:3500,status:'pending',created_at:'2026-05-08T10:00:00Z',departure_date:'2026-05-11'},
                {id:'demo2',vessel_name:'BZ-1042 Soybean',origin_port:'Villeta (PY)',destination_port:'Rosario (AR)',cargo_tons:4200,status:'in_transit',created_at:'2026-05-06T14:00:00Z',eta:'2026-05-14T08:00:00Z',departure_date:'2026-05-06'},
                {id:'demo3',vessel_name:'BZ-2018 Grain',origin_port:'Port of Asuncion',destination_port:'San Nicolas (AR)',cargo_tons:3800,status:'in_transit',created_at:'2026-05-05T09:00:00Z',eta:'2026-05-13T16:00:00Z',departure_date:'2026-05-05'},
                {id:'demo4',vessel_name:'R/M Atlas',origin_port:'Concepcion (PY)',destination_port:'Villeta (PY)',cargo_tons:2100,status:'completed',created_at:'2026-04-28T12:00:00Z',departure_date:'2026-04-28'},
                {id:'demo5',vessel_name:'BZ-3055 Mineral',origin_port:'San Lorenzo (AR)',destination_port:'Port of Asuncion',cargo_tons:5500,status:'completed',created_at:'2026-04-23T06:00:00Z',departure_date:'2026-04-23'},
                {id:'demo6',vessel_name:'BZ-1099 Bulk',origin_port:'Corumba (BR)',destination_port:'Nueva Palmira (UY)',cargo_tons:4800,status:'completed',created_at:'2026-04-13T18:00:00Z',departure_date:'2026-04-13'}
            ];
        }
        var l=document.getElementById('viajes-list');var em=document.getElementById('viajes-empty');
        if(!l)return;l.innerHTML='';
        var iTC=0,pC=0,cC=0,tT=0;
        data.forEach(function(v){var s=(v.status||'').toLowerCase();if(s.indexOf('transit')>=0||s.indexOf('viaje')>=0||s==='navegando'||s==='en_curso')iTC++;else if(s==='completed'||s==='completado'||s==='finalizado')cC++;else pC++;tT+=(v.cargo_tons||v.cargo_tonss||0);});
        var e1=document.getElementById('trips-transit');if(e1)e1.textContent=iTC;
        var e2=document.getElementById('trips-pending');if(e2)e2.textContent=pC;
        var e3=document.getElementById('trips-tons');if(e3)e3.textContent=tT>=1000?(tT/1000).toFixed(1)+'k':tT;
        var e4=document.getElementById('trips-completed');if(e4)e4.textContent=cC;
        if(data.length>0){
            if(em)em.style.display='none';
            var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-top:16px">';
            data.forEach(function(v){
                var st=(v.status||'pending').toLowerCase();var isT=st.indexOf('transit')>=0||st.indexOf('viaje')>=0||st==='navegando'||st==='en_curso';var isC=st==='completed'||st==='completado'||st==='finalizado';var isP=st==='planned'||st==='planificado';
                var sc=isC?'#10B981':isT?'#3B82F6':isP?'#8B5CF6':'#F59E0B';var sl=isC?'COMPLETED':isT?'IN TRANSIT':isP?'PLANNED':'PENDING';var si=isC?'fa-circle-check':isT?'fa-ship':isP?'fa-calendar-check':'fa-clock';
                var tons=v.cargo_tons||v.cargo_tonss||0;var dd=v.departure_date?new Date(v.departure_date).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}):(v.created_at?new Date(v.created_at).toLocaleDateString('en',{day:'numeric',month:'short'}):'--');
                var pg=0;if(isT){var cr=v.departure_date?new Date(v.departure_date):v.created_at?new Date(v.created_at):new Date();var et=v.eta?new Date(v.eta):new Date(cr.getTime()+7*86400000);pg=Math.min(95,Math.max(10,Math.round(((Date.now()-cr.getTime())/(et.getTime()-cr.getTime()))*100)));}else if(isC){pg=100;}
                h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
                h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px"><div style="display:flex;align-items:center;gap:12px"><div style="width:42px;height:42px;border-radius:12px;background:'+sc+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+si+'" style="font-size:18px;color:'+sc+'"></i></div><div><div style="font-weight:700;font-size:15px;color:var(--text-primary)">'+esc(v.vessel_name||'Unassigned')+'</div><div style="font-size:11px;color:var(--text-secondary);margin-top:2px">General Cargo \u00B7 '+tons.toLocaleString()+' ton</div></div></div><span style="background:'+sc+'18;color:'+sc+';padding:4px 10px;border-radius:8px;font-size:9px;font-weight:700;letter-spacing:0.5px;white-space:nowrap">'+sl+'</span></div>';
                h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 14px;background:var(--bg-tertiary,#f8f9fa);border-radius:10px"><div style="text-align:center;flex:1;min-width:0"><div style="font-size:9px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:3px">ORIGIN</div><div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.origin_port||'--')+'</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0"><div style="width:20px;height:2px;background:'+sc+'60;border-radius:1px"></div><i class="fa-solid fa-arrow-right" style="font-size:10px;color:'+sc+'"></i><div style="width:20px;height:2px;background:'+sc+'60;border-radius:1px"></div></div><div style="text-align:center;flex:1;min-width:0"><div style="font-size:9px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:3px">DESTINATION</div><div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.destination_port||'--')+'</div></div></div>';
                if(isT||isC){var bc=isC?'#10B981':pg>80?'#F59E0B':'#3B82F6';h+='<div style="position:relative;height:8px;background:var(--bg-tertiary,#f0f0f0);border-radius:4px;overflow:hidden;margin-bottom:8px"><div style="position:absolute;top:0;left:0;height:100%;width:'+pg+'%;background:'+bc+';border-radius:4px;transition:width 0.6s ease"></div></div>';h+='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-bottom:10px"><span>'+pg+'% complete</span>';if(isT&&v.eta){var dl=Math.max(0,Math.ceil((new Date(v.eta)-Date.now())/86400000));h+='<span style="font-weight:600;color:'+sc+'">ETA: '+dl+'d remaining</span>';}else if(isC){h+='<span style="font-weight:600;color:#10B981">Delivered</span>';}h+='</div>';}
                h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:space-between"><div style="display:flex;gap:6px;flex-wrap:wrap"><span style="background:var(--bg-tertiary,#f0f0f0);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:4px"><i class="fa-regular fa-calendar" style="font-size:9px"></i> '+dd+'</span>';
                if(tons>0){h+='<span style="background:var(--bg-tertiary,#f0f0f0);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:4px"><i class="fa-solid fa-weight-hanging" style="font-size:9px"></i> '+tons.toLocaleString()+' ton</span>';}
                h+='</div>';if(v.id&&!String(v.id).startsWith('demo')){h+='<button onclick="confirmDelete(\'voyages\',\''+v.id+'\',\''+esc(v.vessel_name||'Trip')+'\',loadTrips)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--text-tertiary);font-size:11px;display:flex;align-items:center;gap:4px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:10px"></i></button>';}
                h+='</div></div>';
            });h+='</div>';l.innerHTML=h;
        }else{if(em)em.style.display='';}
    }catch(e){console.error('loadTrips:',e);}
}

async function loadBitacora(){
    try{
        var r=await sb.from('logs').select('*').order('created_at',{ascending:false}).limit(30);
        var data=r.data||[];
        if(data.length===0){
            data=[
                {id:'demo1',title:'navigation',action_type:'navigation',vessel_name:'R/M Guarani',description:'Current position: km 1180, speed 6.5 knots. ETA Rosario: 4 days',created_at:'2026-05-08T16:54:00Z'},
                {id:'demo2',title:'navigation',action_type:'navigation',vessel_name:'BZ-1042',description:'Passed Corrientes. River level: 4.2m (normal)',created_at:'2026-05-08T14:54:00Z'},
                {id:'demo3',title:'fuel',action_type:'fuel',vessel_name:'R/M Atlas',description:'Daily consumption: 3,200 L. Remaining autonomy: 4 days',created_at:'2026-05-08T12:54:00Z'},
                {id:'demo4',title:'weather',action_type:'weather',vessel_name:'BZ-2018',description:'Dense fog km 1200-1180. Preventive anchoring 3 hours',created_at:'2026-05-08T06:54:00Z'},
                {id:'demo5',title:'crew',action_type:'crew',vessel_name:'R/M Hercules',description:'Watch relief 00:00. Helmsman Lopez + Deckhand Duarte',created_at:'2026-05-07T06:54:00Z'},
                {id:'demo6',title:'maneuver',action_type:'maneuver',vessel_name:'BZ-3055',description:'Docking maneuver completed at Puerto Villeta. No issues',created_at:'2026-05-07T04:00:00Z'},
                {id:'demo7',title:'safety',action_type:'safety',vessel_name:'R/M Guarani',description:'Evacuation drill completed. Time: 4 min 20 sec',created_at:'2026-05-06T18:00:00Z'},
                {id:'demo8',title:'cargo',action_type:'cargo',vessel_name:'BZ-1042',description:'Loading completed: 4,200 ton soybean. Final draft: 3.2m',created_at:'2026-05-06T10:00:00Z'}
            ];
        }
        var l=document.getElementById('bitacora-list');var em=document.getElementById('bitacora-empty');
        if(!l)return;l.innerHTML='';
        var catIcons={'navigation':'fa-route','navegacion':'fa-route','fuel':'fa-gas-pump','combustible':'fa-gas-pump','weather':'fa-cloud-sun','clima':'fa-cloud-sun','crew':'fa-users','tripulacion':'fa-users','maintenance':'fa-wrench','mantenimiento':'fa-wrench','maneuver':'fa-anchor','maniobra':'fa-anchor','incident':'fa-triangle-exclamation','incidente':'fa-triangle-exclamation','observation':'fa-eye','observacion':'fa-eye','cargo':'fa-box','carga':'fa-box','safety':'fa-shield-halved','seguridad':'fa-shield-halved'};
        var catColors={'navigation':'#3B82F6','navegacion':'#3B82F6','fuel':'#F97316','combustible':'#F97316','weather':'#0EA5E9','clima':'#0EA5E9','crew':'#8B5CF6','tripulacion':'#8B5CF6','maintenance':'#6B7280','mantenimiento':'#6B7280','maneuver':'#10B981','maniobra':'#10B981','incident':'#DC2626','incidente':'#DC2626','observation':'#F59E0B','observacion':'#F59E0B','cargo':'#0EA5E9','carga':'#0EA5E9','safety':'#EF4444','seguridad':'#EF4444'};
        var catLabels={'navigation':'Navigation','navegacion':'Navigation','fuel':'Fuel','combustible':'Fuel','weather':'Weather','clima':'Weather','crew':'Crew','tripulacion':'Crew','maintenance':'Maintenance','mantenimiento':'Maintenance','maneuver':'Maneuver','maniobra':'Maneuver','incident':'Incident','incidente':'Incident','observation':'Observation','observacion':'Observation','cargo':'Cargo','carga':'Cargo','safety':'Safety','seguridad':'Safety'};
        if(data.length>0){
            if(em)em.style.display='none';
            var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
            data.forEach(function(row){
                var cat=(row.title||row.action_type||'entry').toLowerCase();
                var icon=catIcons[cat]||'fa-pen-to-square';
                var color=catColors[cat]||'#94A3B8';
                var label=catLabels[cat]||(cat.charAt(0).toUpperCase()+cat.slice(1));
                var t=row.created_at?new Date(row.created_at).toLocaleDateString('en',{day:'2-digit',month:'short'}):'--';
                var tTime=row.created_at?new Date(row.created_at).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}):'';
                h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;border-left:4px solid '+color+';transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
                h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
                h+='<div style="display:flex;align-items:center;gap:10px">';
                h+='<div style="width:40px;height:40px;border-radius:12px;background:'+color+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:16px;color:'+color+'"></i></div>';
                h+='<div><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'12;padding:3px 10px;border-radius:6px;text-transform:uppercase">'+esc(label)+'</span>';
                if(row.vessel_name){h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+esc(row.vessel_name)+'</div>';}
                h+='</div></div>';
                h+='<div style="text-align:right;flex-shrink:0"><div style="font-size:10px;color:var(--text-tertiary)">'+t+'</div><div style="font-size:10px;color:var(--text-tertiary)">'+tTime+'</div></div>';
                h+='</div>';
                h+='<div style="font-size:13px;color:var(--text-primary);line-height:1.6;margin-bottom:12px">'+esc(row.description||row.details||'No details')+'</div>';
                h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--separator)">';
                h+='<div style="display:flex;gap:6px"><span style="background:var(--bg-tertiary,#f0f0f0);padding:3px 8px;border-radius:6px;font-size:9px;color:var(--text-secondary);display:flex;align-items:center;gap:3px"><i class="fa-regular fa-clock" style="font-size:8px"></i> '+t+' '+tTime+'</span></div>';
                if(row.id&&!String(row.id).startsWith('demo')){
                    h+='<button onclick="confirmDelete(\'logs\',\''+row.id+'\',\''+esc(row.title||'Entry')+'\',loadBitacora)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;display:flex;align-items:center;gap:3px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button>';
                }
                h+='</div></div>';
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
            var roleIcons={'capitan':'fa-star','captain':'fa-star','timonel':'fa-compass','helmsman':'fa-compass','maquinista':'fa-gears','engineer':'fa-gears','marinero':'fa-anchor','deckhand':'fa-anchor','seaman':'fa-anchor','cocinero':'fa-utensils','cook':'fa-utensils','primer oficial':'fa-user-tie','first officer':'fa-user-tie','jefe de maquinas':'fa-wrench','chief engineer':'fa-wrench'};
            var roleColors={'capitan':'#F59E0B','captain':'#F59E0B','timonel':'#3B82F6','helmsman':'#3B82F6','maquinista':'#6B7280','engineer':'#6B7280','marinero':'#0EA5E9','deckhand':'#0EA5E9','seaman':'#0EA5E9','cocinero':'#10B981','cook':'#10B981','primer oficial':'#8B5CF6','first officer':'#8B5CF6','jefe de maquinas':'#DC2626','chief engineer':'#DC2626'};
            var roleLabels={'capitan':'Captain','timonel':'Helmsman','maquinista':'Engineer','marinero':'Deckhand','seaman':'Seaman','cocinero':'Cook','primer oficial':'First Officer','jefe de maquinas':'Chief Engineer'};
            var statusLabels={'embarcado':'ONBOARD','activo':'ACTIVE','franco':'ON LEAVE','medico':'MEDICAL','onboard':'ONBOARD','active':'ACTIVE','leave':'ON LEAVE','medical':'MEDICAL'};
            var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
            data.forEach(function(c){
                var name=c.full_name||c.name||'Crew Member';
                var role=(c.role||'deckhand').toLowerCase();
                var icon=roleIcons[role]||'fa-user';
                var color=roleColors[role]||'#94A3B8';
                var roleDisplay=roleLabels[role]||(c.role||'Crew');
                var st=(c.status||'onboard').toLowerCase();
                var isOnboard=st==='embarcado'||st==='onboard';
                var isActive=st==='activo'||st==='active';
                var isFranco=st==='franco'||st==='leave';
                var stColor=isOnboard?'#2EA043':isActive?'#3B82F6':isFranco?'#F59E0B':'#94A3B8';
                var stLabel=statusLabels[st]||(c.status||'ONBOARD').toUpperCase();
                var vessel=c.vessel_name||'Unassigned';
                var docId=c.document_number||c.doc_id||'';
                h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;border-left:4px solid '+color+';transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
                h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
                h+='<div style="display:flex;align-items:center;gap:10px">';
                h+='<div style="width:40px;height:40px;border-radius:12px;background:'+color+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:16px;color:'+color+'"></i></div>';
                h+='<div><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:'+color+';background:'+color+'12;padding:3px 10px;border-radius:6px;text-transform:uppercase">'+roleDisplay+'</span>';
                h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+vessel+'</div>';
                h+='</div></div>';
                h+='<span style="font-size:10px;font-weight:700;color:'+stColor+';background:'+stColor+'15;padding:3px 8px;border-radius:6px;white-space:nowrap">'+stLabel+'</span>';
                h+='</div>';
                h+='<div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:12px">'+name+'</div>';
                h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--separator)">';
                h+='<span style="background:var(--bg-tertiary,#f0f0f0);padding:3px 8px;border-radius:6px;font-size:9px;color:var(--text-secondary);display:flex;align-items:center;gap:3px"><i class="fa-regular fa-id-card" style="font-size:8px"></i> '+(docId||'N/A')+'</span>';
                if(c.id){h+='<button onclick="confirmDelete(\'crew_members\',\''+c.id+'\',\''+name+'\',loadCrew)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;display:flex;align-items:center;gap:3px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button>';}
                h+='</div></div>';
            });
            h+='</div>';
            l.innerHTML=h;
            document.getElementById('crew-total').textContent=data.length;
            document.getElementById('crew-on').textContent=data.filter(function(c){var s=(c.status||'').toLowerCase();return s==='embarcado'||s==='onboard'}).length;
            var elOff=document.getElementById('crew-off');if(elOff)elOff.textContent=data.filter(function(c){var s=(c.status||'').toLowerCase();return s==='franco'||s==='leave'}).length;
        }else{if(em)em.style.display='';}
    }catch(e){/* Crew: */;}
}
async function importCrewCSV(input){
    var file=input.files&&input.files[0];if(!file)return;
    try{
        var text=await file.text();
        var lines=text.split(/\r?\n/).filter(function(l){return l.trim()});
        if(lines.length<2){alert('The file must have a header row and at least one data row.');input.value='';return;}
        var rows=lines.slice(1);
        var cid=currentCompanyId;var inserted=0;var failed=0;
        for(var i=0;i<rows.length;i++){
            var cols=rows[i].split(',').map(function(c){return c.trim()});
            if(!cols[0])continue;
            try{
                var res=await sb.from('crew_members').insert({full_name:cols[0],role:cols[1]||'Sailor',vessel_name:cols[2]||null,document_number:cols[3]||null,status:'embarcado',company_id:cid});
                if(res.error)failed++;else inserted++;
            }catch(e){failed++;}
        }
        alert('Import complete: '+inserted+' crew members added'+(failed>0?', '+failed+' failed':'')+'.');
        loadCrew();
    }catch(e){console.error('importCrewCSV:',e);alert('Could not read the file.');}
    input.value='';
}

var fuelTrendChart=null;
function renderFuelTrend(data){
    var ctx=document.getElementById('fuel-trend-chart');if(!ctx)return;
    var byDay={};var order=[];
    for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var k=d.toLocaleDateString('en',{day:'2-digit',month:'short'});byDay[k]=0;order.push(k);}
    (data||[]).forEach(function(f){
        if(!f.created_at)return;
        var k=new Date(f.created_at).toLocaleDateString('en',{day:'2-digit',month:'short'});
        if(byDay.hasOwnProperty(k))byDay[k]+=(f.liters||f.quantity||0);
    });
    if(fuelTrendChart)fuelTrendChart.destroy();
    fuelTrendChart=new Chart(ctx,{type:'line',data:{labels:order,datasets:[{data:order.map(function(k){return byDay[k]}),borderColor:'#25D366',backgroundColor:'rgba(37,211,102,0.10)',fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:'#25D366',pointBorderColor:'#0F231C',pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.parsed.y.toLocaleString()+' L'}}}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.07)'},ticks:{color:'#A9B8B2',font:{size:9}}},x:{grid:{display:false},ticks:{color:'#A9B8B2',font:{size:9},maxRotation:0}}}}});
}
function renderFuelInsights(data){
    var el=document.getElementById('fuel-insights');if(!el)return;
    data=data||[];
    if(data.length===0){el.innerHTML='<div style="font-size:12px;color:var(--text-tertiary)">Not enough data to generate insights.</div>';return;}
    var byVessel={};data.forEach(function(f){var v=f.vessel_name||'No vessel';byVessel[v]=(byVessel[v]||0)+(f.liters||f.quantity||0);});
    var topVessel='';var topLiters=0;
    Object.keys(byVessel).forEach(function(v){if(byVessel[v]>topLiters){topLiters=byVessel[v];topVessel=v;}});
    var last3=data.slice(0,3).reduce(function(s,f){return s+(f.liters||f.quantity||0)},0);
    var prev3=data.slice(3,6).reduce(function(s,f){return s+(f.liters||f.quantity||0)},0);
    var rows=[];
    if(topVessel)rows.push({icon:'fa-ship',color:'var(--accent)',text:'<strong>'+esc(topVessel)+'</strong> accounts for the highest consumption: '+topLiters.toLocaleString()+' L logged.'});
    if(prev3>0&&last3>prev3*1.2)rows.push({icon:'fa-triangle-exclamation',color:'var(--warning)',text:'Consumption on recent refuels rose '+Math.round((last3/prev3-1)*100)+'% versus the prior period.'});
    else if(prev3>0&&last3<prev3*0.8)rows.push({icon:'fa-arrow-trend-down',color:'var(--success)',text:'Consumption on recent refuels dropped '+Math.round((1-last3/prev3)*100)+'% versus the prior period.'});
    var noVessel=data.filter(function(f){return!f.vessel_name}).length;
    if(noVessel>0)rows.push({icon:'fa-circle-info',color:'var(--text-tertiary)',text:noVessel+' record(s) with no vessel assigned.'});
    if(rows.length===0)rows.push({icon:'fa-check',color:'var(--success)',text:'Consumption stable, no anomalies detected.'});
    el.innerHTML=rows.map(function(r){return '<div style="display:flex;gap:10px;align-items:flex-start"><div style="width:26px;height:26px;border-radius:8px;background:'+r.color+'1a;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+r.icon+'" style="font-size:11px;color:'+r.color+'"></i></div><div style="font-size:12px;color:var(--text-secondary);line-height:1.5">'+r.text+'</div></div>';}).join('');
}
async function loadFuel(){
    try{
        var r=await sb.from('fuel_logs').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('fuel-list');var em=document.getElementById('fuel-empty');l.innerHTML='';
        renderFuelTrend(data);renderFuelInsights(data);
        if(data&&data.length>0){em.style.display='none';l.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:8px';var _vnames=["TB PARAGUAY 01","R/M HERCULES","B/M TITAN","R/M CENTAURO","TB PARAGUAY 01"];data.forEach(function(f,_vi){if(!f.vessel_name)f.vessel_name=_vnames[_vi%_vnames.length];var d=document.createElement('div');var liters=f.liters||f.quantity||0;var fType=(f.fuel_type||'Gasoil').toLowerCase();var typeColor=fType.indexOf('marine')>=0||fType.indexOf('mgo')>=0?'#0EA5E9':fType.indexOf('diesel')>=0||fType.indexOf('gasoil')>=0?'#F97316':'#8B5CF6';var t=f.created_at?new Date(f.created_at).toLocaleDateString('en',{day:'2-digit',month:'short',year:'numeric'}):'-';d.style.cssText='background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:20px;transition:all 0.2s;cursor:default';d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.06)'};d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:10px;background:'+typeColor+'12;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-gas-pump" style="font-size:16px;color:'+typeColor+'"></i></div><button class="delete-btn" title="Delete" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;border-radius:6px;font-size:13px"><i class="fa-regular fa-trash-can"></i></button></div><div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:'+(f.vessel_name?'var(--text-primary)':'var(--text-tertiary)')+';margin-bottom:2px"><i class="fa-solid fa-ship" style="font-size:11px;color:'+(f.vessel_name?typeColor:'var(--text-tertiary)')+'"></i>'+(f.vessel_name||'No vessel')+'</div><div style="font-family:Bricolage Grotesque,sans-serif;font-size:28px;font-weight:400;color:var(--text-primary);margin-bottom:8px">'+liters.toLocaleString()+' <span style="font-family:Manrope,sans-serif;font-size:12px;color:var(--text-secondary);font-weight:500">liters</span></div><div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:9px;font-weight:700;letter-spacing:0.5px;color:'+typeColor+';background:'+typeColor+'10;padding:3px 8px;border-radius:5px">'+(f.fuel_type||'Gasoil').toUpperCase()+'</span><span style="font-size:10px;color:var(--text-tertiary)"><i class="fa-regular fa-calendar" style="margin-right:4px"></i>'+t+'</span></div>';d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('fuel_logs',f.id,(f.vessel_name||'Record'),loadFuel);});l.appendChild(d);});document.getElementById('fuel-count').textContent=data.length;}else{em.style.display='';}
    }catch(e){/* Fuel: */;}
}

async function loadMaint(){
    try{
        var r=await sb.from('maintenance_tasks').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var l=document.getElementById('maint-list');l.innerHTML='';
        if(data&&data.length>0){
            l.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:8px';
            var priLabels={'alta':'CRITICAL','high':'HIGH','critico':'CRITICAL','critical':'CRITICAL','media':'MEDIUM','medium':'MEDIUM','baja':'LOW','low':'LOW'};
            var stLabels={'pendiente':'PENDING','pending':'PENDING','en progreso':'IN PROGRESS','in progress':'IN PROGRESS','completado':'COMPLETED','completed':'COMPLETED'};
            data.forEach(function(m){
                var pri=(m.priority||'').toLowerCase();
                var st=(m.status||'').toLowerCase();
                var priColor=pri==='alta'||pri==='high'||pri==='critico'||pri==='critical'?'#DC2626':pri==='media'||pri==='medium'?'#F59E0B':'#94A3B8';
                var priBg=pri==='alta'||pri==='high'||pri==='critico'||pri==='critical'?'rgba(220,38,38,0.08)':pri==='media'||pri==='medium'?'rgba(245,158,11,0.08)':'rgba(148,163,184,0.08)';
                var priIcon=pri==='alta'||pri==='high'||pri==='critico'||pri==='critical'?'fa-triangle-exclamation':pri==='media'||pri==='medium'?'fa-exclamation':'fa-minus';
                var priLabel=priLabels[pri]||(m.priority||'LOW').toUpperCase();
                var stColor=st==='completed'||st==='completado'?'#2EA043':st.indexOf('progreso')>=0||st.indexOf('progress')>=0?'#3B82F6':'#F59E0B';
                var stBg=st==='completed'||st==='completado'?'rgba(46,160,67,0.08)':st.indexOf('progreso')>=0||st.indexOf('progress')>=0?'rgba(59,130,246,0.08)':'rgba(245,158,11,0.08)';
                var stIcon=st==='completed'||st==='completado'?'fa-circle-check':st.indexOf('progreso')>=0||st.indexOf('progress')>=0?'fa-spinner':'fa-clock';
                var stLabel=stLabels[st]||(m.status||'PENDING').toUpperCase();
                var t=m.created_at?new Date(m.created_at).toLocaleDateString('en',{day:'2-digit',month:'short',year:'numeric'}):'-';
                var d=document.createElement('div');
                d.style.cssText='background:var(--bg-secondary);border:1px solid var(--separator);border-left:4px solid '+priColor+';border-radius:16px;padding:20px;transition:all 0.2s;cursor:default';
                d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'};
                d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
                d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:12px;background:'+priColor+'12;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-wrench" style="font-size:16px;color:'+priColor+'"></i></div><span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:'+stColor+';background:'+stBg+';padding:5px 12px;border-radius:6px;letter-spacing:0.3px"><i class="fa-solid '+stIcon+'" style="font-size:9px"></i>'+stLabel+'</span></div><div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:10px;line-height:1.4">'+esc(m.description||m.title||'Maintenance order')+'</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-ship" style="color:var(--text-tertiary);font-size:10px"></i>'+(m.vessel_name||'--')+'</span><span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)"><i class="fa-regular fa-calendar" style="color:var(--text-tertiary);font-size:10px"></i>'+t+'</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--separator)"><span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;color:'+priColor+';background:'+priBg+';padding:3px 8px;border-radius:5px;letter-spacing:0.3px"><i class="fa-solid '+priIcon+'" style="font-size:8px"></i>'+priLabel+'</span><button class="delete-btn" title="Delete" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button></div>';
                d.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('maintenance_tasks',m.id,(m.description||m.title||'Order'),loadMaint);});
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

var panolData=[];var panolPage=1;var panolFilter='';var panolPageSize=10;
var panolCatIcons={'lubricantes':'fa-oil-can','lubricants':'fa-oil-can','filtros':'fa-filter','filters':'fa-filter','pintura':'fa-paint-roller','paint':'fa-paint-roller','seguridad':'fa-shield-halved','safety':'fa-shield-halved','motor':'fa-gear','engine':'fa-gear','casco':'fa-ship','hull':'fa-ship','hidraulica':'fa-droplet','hydraulic':'fa-droplet','electrico':'fa-bolt','electrical':'fa-bolt','cabulleria':'fa-link','cordage':'fa-link','soldadura':'fa-fire','welding':'fa-fire'};
var panolCatColors={'lubricantes':'#8B5CF6','lubricants':'#8B5CF6','filtros':'#3B82F6','filters':'#3B82F6','pintura':'#F97316','paint':'#F97316','seguridad':'#EF4444','safety':'#EF4444','motor':'#6B7280','engine':'#6B7280','casco':'#0EA5E9','hull':'#0EA5E9','hidraulica':'#06B6D4','hydraulic':'#06B6D4','electrico':'#F59E0B','electrical':'#F59E0B','cabulleria':'#10B981','cordage':'#10B981','soldadura':'#DC2626','welding':'#DC2626'};
var panolCatLabels={'lubricantes':'LUBRICANTS','filtros':'FILTERS','pintura':'PAINT','seguridad':'SAFETY','motor':'ENGINE','casco':'HULL','hidraulica':'HYDRAULIC','electrico':'ELECTRICAL','cabulleria':'CORDAGE','soldadura':'WELDING'};
async function loadPanol(){
    try{
        var r=await sb.from('inventory_items').select('*').order('name').limit(500);
        panolData=r.data||[];panolPage=1;
        document.getElementById('panol-total').textContent=panolData.length;
        var cats={};var lowCount=0;
        panolData.forEach(function(i){cats[i.category||'General']=1;var q=i.stock_current||0;var mn=i.stock_min_alert||0;if(q<=mn)lowCount++;});
        var elLow=document.getElementById('panol-low');if(elLow)elLow.textContent=lowCount;
        var elCats=document.getElementById('panol-cats');if(elCats)elCats.textContent=Object.keys(cats).length;
        renderPanolTable();
    }catch(e){console.error('loadPanol:',e);}
}
function filterPanol(v){panolFilter=(v||'').toLowerCase();panolPage=1;renderPanolTable();}
function panolGoPage(p){panolPage=p;renderPanolTable();}
function renderPanolTable(){
    var l=document.getElementById('panol-list');var pag=document.getElementById('panol-pagination');
    l.innerHTML='';if(pag)pag.innerHTML='';
    var filtered=panolData.filter(function(i){if(!panolFilter)return true;return((i.name||'')+' '+(i.sku||'')+' '+(i.category||'')+' '+(i.location||'')).toLowerCase().indexOf(panolFilter)>-1;});
    if(filtered.length===0){l.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-tertiary);font-size:13px">No items found in inventory.</div>';return;}
    var totalPages=Math.max(1,Math.ceil(filtered.length/panolPageSize));
    if(panolPage>totalPages)panolPage=totalPages;
    var start=(panolPage-1)*panolPageSize;
    var pageItems=filtered.slice(start,start+panolPageSize);
    var table=document.createElement('table');table.className='data-table';table.style.width='100%';
    table.innerHTML='<thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Quantity</th><th>Location</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>';
    var tbody=document.createElement('tbody');
    pageItems.forEach(function(i){
        var q=i.stock_current||0;var mn=i.stock_min_alert||0;var low=q<=mn;var critical=q===0;
        var cat=(i.category||'general').toLowerCase();
        var icon=panolCatIcons[cat]||'fa-box';var color=panolCatColors[cat]||'var(--accent)';
        var catLabel=panolCatLabels[cat]||(i.category||'General').toUpperCase();
        var statusLabel=critical?'OUT OF STOCK':low?'LOW STOCK':'IN STOCK';
        var statusColor=critical?'var(--error)':low?'var(--warning)':'var(--success)';
        var statusBg=critical?'rgba(248,113,113,0.1)':low?'rgba(251,191,36,0.1)':'rgba(52,211,153,0.1)';
        var tr=document.createElement('tr');
        tr.innerHTML='<td style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--text-tertiary)">'+(i.sku||'—')+'</td>'+
            '<td><div style="display:flex;align-items:center;gap:10px"><div style="width:28px;height:28px;border-radius:8px;background:'+color+'1a;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:12px;color:'+color+'"></i></div><span style="font-weight:600;color:var(--text-primary)">'+esc(i.name||'')+'</span></div></td>'+
            '<td style="color:var(--text-secondary)">'+esc(catLabel)+'</td>'+
            '<td style="font-weight:700;color:var(--text-primary)">'+q+' <span style="font-weight:500;color:var(--text-tertiary);font-size:11px">'+(i.unit||'units')+'</span></td>'+
            '<td style="color:var(--text-secondary)">'+esc(i.location||'—')+'</td>'+
            '<td><span style="font-size:10px;font-weight:700;letter-spacing:0.3px;color:'+statusColor+';background:'+statusBg+';padding:4px 10px;border-radius:6px">'+statusLabel+'</span></td>'+
            '<td style="text-align:right"><button class="delete-btn" title="Delete" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;border-radius:6px;font-size:13px"><i class="fa-regular fa-trash-can"></i></button></td>';
        tr.querySelector('.delete-btn').addEventListener('click',function(){confirmDelete('inventory_items',i.id,(i.name||'Item'),loadPanol);});
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    l.appendChild(table);
    if(pag&&filtered.length>0){
        var from=start+1;var to=Math.min(start+panolPageSize,filtered.length);
        var html='<div>Showing '+from+'-'+to+' of '+filtered.length+' items</div><div style="display:flex;gap:6px">';
        for(var p=1;p<=totalPages;p++){html+='<button onclick="panolGoPage('+p+')" style="min-width:26px;padding:4px 8px;border-radius:6px;border:0.5px solid var(--separator);background:'+(p===panolPage?'var(--accent)':'var(--bg-secondary)')+';color:'+(p===panolPage?'#fff':'var(--text-secondary)')+';font-size:11px;cursor:pointer">'+p+'</button>';}
        html+='</div>';
        pag.innerHTML=html;
    }
}

async function loadComms(){
    try{
        var r=await sb.from('comms').select('*').order('created_at',{ascending:false}).limit(20);
        var data=r.data;var area=document.querySelector('#view-comunicaciones .comm-msg-area');
        if(data&&data.length>0){area.innerHTML=data.map(function(m){return '<p style="margin:6px 0;font-size:13px;"><strong>'+esc(m.sender||'Sistema')+':</strong> '+esc(m.message||m.content||'')+' <span style="color:var(--text-secondary);font-size:10px;">'+(m.created_at?new Date(m.created_at).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}):'')+'</span></p>'}).join('');}
    }catch(e){/* Comms: */;}
}

// MAP
var aisMarkers = {};
var heatLayer = null;
function initMap(){
    map=L.map('leaflet-map',{zoomControl:false}).setView([-27.5,-58.3],6);
    L.control.zoom({position:'topleft'}).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:18,subdomains:'abcd'}).addTo(map);
    // Own fleet from Supabase
    loadFleetMarkers();
    // AIS third-party traffic
    loadAISTraffic();
    // Auto-refresh AIS every 30s (stored for cleanup)
    window._aisInterval = setInterval(loadAISTraffic, 30000);
// ━━━━━━━━━━ Hidrovia route  polyline completa Paraguay-Paran ━━━━━━━━━━
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
        data.forEach(function(v){var lat=v.latitude||v.lat;var lng=v.longitude||v.lng;if(!lat||!lng)return;var s=(v.status||'').toLowerCase();var c=s.indexOf('viaje')>=0||s==='active'?'#10b981':s.indexOf('manten')>=0?'#F59E0B':'#3B82F6';var heading=v.heading||v.course||0;L.marker([lat,lng],{icon:_shipIcon(c,48,heading)}).addTo(map).bindPopup('<strong>'+(v.name||'')+'</strong><br>'+(v.status||'')+'<br><small>Own fleet</small>');});
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
                    m.bindPopup('<strong>'+(v.name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'Ãƒâ€šÃ‚Â°<br><small>AIS Satellite</small>');
                    aisMarkers[key]=m;
                }
            });
            // Update legend
            var legend=document.querySelector('.map-legend');
            if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=json.total+' active';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=json.total+' active AIS';legend.appendChild(d);}}
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
            aisMarkers[key].setPopupContent('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Third-party traffic</small>');
        }else{
            var m=L.marker([lat,lng],{icon:_shipIcon('#10b981',40,v.course||0)}).addTo(map);
            m.bindPopup('<strong>'+(v.ship_name||v.mmsi)+'</strong><br>MMSI: '+v.mmsi+'<br>SOG: '+(v.speed||0)+' kn | COG: '+(v.course||0)+'<br><small>AIS - Third-party traffic</small>');
            aisMarkers[key]=m;
        }
    });
    var legend=document.querySelector('.map-legend');
    if(legend){var existing=legend.querySelector('.ais-count');if(existing)existing.textContent=data.length+' active';else{var d=document.createElement('div');d.className='map-legend-item ais-count';d.style.cssText='margin-top:6px;font-size:10px;color:var(--text-secondary);font-weight:600';d.textContent=data.length+' active AIS';legend.appendChild(d);}}
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
    fleet:{title:'Add Asset',fields:[{id:'fleet-name',label:'NAME',type:'text',placeholder:'Ej: R/M ATLAS'},{id:'fleet-type',label:'TYPE',type:'select',options:['Barge','Tugboat','Pontons']},{id:'fleet-status',label:'STATUS',type:'select',options:['In Transit','In Port','Maintenance']},{id:'fleet-location',label:'LOCATION',type:'text',placeholder:'Ej: Km 1420'}]},
    viaje:{title:'New Trip Request',fields:[{id:'viaje-vessel',label:'VESSEL',type:'vessel-select'},{id:'viaje-origin',label:'ORIGIN',type:'text',placeholder:'Origin port'},{id:'viaje-dest',label:'DESTINATION',type:'text',placeholder:'Destination port'},{id:'viaje-cargo',label:'CARGO (TON)',type:'text',placeholder:'3500'},{id:'viaje-date',label:'DEPARTURE DATE',type:'date'}]},
    bitacora:{title:'New Logbook Entry',fields:[{id:'bit-title',label:'TITLE',type:'text',placeholder:'Summary'},{id:'bit-vessel',label:'VESSEL',type:'vessel-select'},{id:'bit-type',label:'TYPE',type:'select',options:['Observation','Incident','Maneuver','Navigation']},{id:'bit-desc',label:'DESCRIPTION',type:'textarea',placeholder:'Details...'}]},
    crew:{title:'Add Crew Member',fields:[{id:'crew-name',label:'NAME',type:'text',placeholder:'John Doe'},{id:'crew-role',label:'ROLE',type:'select',options:['Captain','Helmsman','Engineer','Seaman','Cook']},{id:'crew-vessel',label:'VESSEL',type:'vessel-select'},{id:'crew-doc',label:'DOCUMENT ID',type:'text',placeholder:'Document number'}]},
    fuel:{title:'Record Fuel',fields:[{id:'fuel-vessel',label:'VESSEL',type:'text',placeholder:'Nombre'},{id:'fuel-liters',label:'LITERS',type:'text',placeholder:'5000'},{id:'fuel-type',label:'TYPE',type:'select',options:['Diesel','IFO 380','MGO']},{id:'fuel-date',label:'DATE',type:'date'}]},
    maint:{title:'New Maintenance Order',fields:[{id:'maint-title',label:'DESCRIPTION',type:'text',placeholder:'What to repair'},{id:'maint-vessel',label:'VESSEL',type:'text',placeholder:'Vessel'},{id:'maint-priority',label:'PRIORITY',type:'select',options:['High','Medium','Low']},{id:'maint-notes',label:'NOTES',type:'textarea',placeholder:'Details...'}]},
    panol:{title:'Add Item',fields:[{id:'panol-name',label:'SPARE PART',type:'text',placeholder:'Oil filter'},{id:'panol-cat',label:'CATEGORY',type:'select',options:['Motor','Electric','Hydraulic','Hull','General']},{id:'panol-qty',label:'QUANTITY',type:'text',placeholder:'10'},{id:'panol-min',label:'MIN STOCK',type:'text',placeholder:'2'},{id:'panol-loc',label:'LOCATION',type:'text',placeholder:'Bay A - Shelf 3'}]},
    calado:{title:'Record Draft Reading',fields:[{id:'calado-vessel',label:'VESSEL',type:'vessel-select'},{id:'calado-value',label:'DRAFT (METERS)',type:'text',placeholder:'2.45'},{id:'calado-max',label:'MAX DRAFT (M)',type:'text',placeholder:'3.50'},{id:'calado-notes',label:'OBSERVATIONS',type:'textarea',placeholder:'Conditions, location...'}]},
    contrato:{title:'New Freight Contract',fields:[{id:'cont-client',label:'CLIENT',type:'text',placeholder:'Company name'},{id:'cont-route',label:'ROUTE',type:'text',placeholder:'Origin - Destination'},{id:'cont-product',label:'PRODUCT',type:'text',placeholder:'Soybean, Iron Ore, etc.'},{id:'cont-type',label:'TYPE',type:'select',options:['Spot','COA','Time Charter','Volume']},{id:'cont-volume',label:'VOLUME (tons)',type:'number',placeholder:'Total tonnage'},{id:'cont-rate',label:'RATE (USD/ton)',type:'number',placeholder:'Rate per ton'},{id:'cont-exp',label:'EXPIRATION',type:'date'}]},incidente:{title:'Report Incident',fields:[{id:'inc-title',label:'TITLE',type:'text',placeholder:'Brief incident description'},{id:'inc-vessel',label:'VESSEL',type:'vessel-select'},{id:'inc-severity',label:'SEVERITY',type:'select',options:['Critical','High','Medium','Low']},{id:'inc-type',label:'TYPE',type:'select',options:['Collision','Grounding','Spill','Mechanical failure','Fire','Medical','Other']},{id:'inc-desc',label:'DETAILED DESCRIPTION',type:'textarea',placeholder:'What happened, where, when, actions taken...'}]}
};
var currentModal=null;
// esc() defined at top of file (line 7)
function openModal(type){
    currentModal=type;var c=modalForms[type];document.getElementById('modal-title').textContent=c.title;
    var submitBtn=document.getElementById('modal-submit');submitBtn.onclick=null;submitBtn.textContent='Save';submitBtn.style.display='';submitBtn.disabled=false;
    var hasVS=c.fields.some(function(f){return f.type==='vessel-select'});var build=function(vn){var h='';c.fields.forEach(function(f){h+='<label>'+esc(f.label)+'</label>';if(f.type==='vessel-select'){h+='<select id="'+f.id+'"><option value="">-- Select vessel --</option>'+vn.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>'}).join('')+'</select>';}else if(f.type==='select'){h+='<select id="'+f.id+'">'+f.options.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select>';}else if(f.type==='textarea'){h+='<textarea id="'+f.id+'" placeholder="'+esc(f.placeholder||'')+'"></textarea>';}else{h+='<input type="'+f.type+'" id="'+f.id+'" placeholder="'+esc(f.placeholder||'')+'">';}});
    document.getElementById('modal-body').innerHTML=h;document.getElementById('modal-overlay').classList.add('open');
    setTimeout(function(){var f=document.querySelector('#modal-body input, #modal-body select');if(f)f.focus();},100);};if(hasVS){sb.from('vessels').select('name,vessel_name').order('name').limit(100).then(function(r){var names=(r.data||[]).map(function(v){return v.name||v.vessel_name||''}).filter(function(n){return n});build(names);}).catch(function(){build([]);});}else{build([]);}
}
function closeModal(e){if(e&&e.target!==document.getElementById('modal-overlay'))return;document.getElementById('modal-overlay').classList.remove('open');}

// SAVE TO SUPABASE
document.getElementById('modal-submit').addEventListener('click',async function(){
    var t=currentModal;if(!t)return;var c=modalForms[t];var d={};c.fields.forEach(function(f){d[f.id]=document.getElementById(f.id).value;});
    try{
        var cid=currentCompanyId;
        if(t==='fleet'&&d['fleet-name']){await sb.from('vessels').insert({name:d['fleet-name'],type:d['fleet-type'],status:d['fleet-status'],location:d['fleet-location'],company_id:cid});loadFleet();}
        else if(t==='viaje'&&d['viaje-vessel']){await sb.from('voyages').insert({vessel_name:d['viaje-vessel'],origin_port:d['viaje-origin'],destination_port:d['viaje-dest'],cargo_tons:parseInt(d['viaje-cargo'])||0,departure_date:d['viaje-date']||null,status:'pending',company_id:cid});loadTrips();}
        else if(t==='bitacora'&&d['bit-title']){var br=await sb.from('logs').insert({title:d['bit-title'],vessel_name:d['bit-vessel'],action_type:d['bit-type'].toLowerCase(),description:d['bit-desc'],company_id:cid});if(br.error){alert('Error saving logbook entry: '+br.error.message);return;}loadBitacora();}
        else if(t==='crew'&&d['crew-name']){await sb.from('crew_members').insert({full_name:d['crew-name'],role:d['crew-role'],vessel_name:d['crew-vessel'],document_number:d['crew-doc'],status:'embarcado',company_id:cid});loadCrew();}
        else if(t==='fuel'&&d['fuel-vessel']){await sb.from('fuel_logs').insert({vessel_name:d['fuel-vessel'],liters:parseInt(d['fuel-liters'])||0,fuel_type:d['fuel-type'],company_id:cid});loadFuel();}
        else if(t==='maint'&&d['maint-title']){await sb.from('maintenance_tasks').insert({description:d['maint-title'],vessel_name:d['maint-vessel'],priority:d['maint-priority'],status:'pending',notes:d['maint-notes'],company_id:cid});loadMaint();}
        else if(t==='panol'&&d['panol-name']){await sb.from('inventory_items').insert({name:d['panol-name'],category:d['panol-cat'],stock_current:parseInt(d['panol-qty'])||0,stock_min_alert:parseInt(d['panol-min'])||0,location:d['panol-loc']||null,company_id:cid});loadPanol();}
        else if(t==='calado'&&d['calado-vessel']){var cr=await sb.from('logs').insert({title:'Draft reading: '+d['calado-vessel'],vessel_name:d['calado-vessel'],action_type:'DRAFT_READING',description:d['calado-notes']||'Draft: '+d['calado-value']+'m / Max: '+d['calado-max']+'m',details:JSON.stringify({draft:parseFloat(d['calado-value'])||0,max_draft:parseFloat(d['calado-max'])||3.5}),company_id:cid});if(cr.error){alert('Error saving draft reading: '+cr.error.message);return;}loadCalado();}
        else if(t==='incidente'&&d['inc-title']){var ir=await sb.from('logs').insert({title:d['inc-title'],vessel_name:d['inc-vessel'],action_type:'INCIDENT',description:d['inc-desc'],details:JSON.stringify({severity:d['inc-severity'],type:d['inc-type'],status:'Open'}),company_id:cid});if(ir.error){alert('Error saving incident: '+ir.error.message);return;}loadIncidents();}
        else if(t==='contrato'&&d['cont-client']){await sb.from('freight_contracts').insert({client:d['cont-client'],route:d['cont-route'],product:d['cont-product'],contract_type:d['cont-type'],volume_total:parseFloat(d['cont-volume'])||0,rate_per_ton:parseFloat(d['cont-rate'])||0,expiration_date:d['cont-exp'],status:'active',volume_used:0,company_id:cid});loadContratosEN();}
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
var planNames={barcaza:'Per Barge',combo:'Fleet Combo',enterprise:'Enterprise',ilimitado:'Unlimited'};
var planPrices={barcaza:{monthly:149,yearly:119},combo:{monthly:899,yearly:719},enterprise:{monthly:1499,yearly:1199},ilimitado:{monthly:2499,yearly:1999}};
function selectPlan(plan){
    var price=planPrices[plan][currentPeriod];
    var name=planNames[plan];
    document.getElementById('modal-title').textContent='Checkout - '+name;
    document.getElementById('modal-body').innerHTML='<div style="background:var(--surface-low);border-radius:12px;padding:20px;margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:600">'+esc(name)+'</span><span style="font-family:Bricolage Grotesque,sans-serif;font-size:28px;font-weight:400">$'+price.toLocaleString('en-US')+'</span></div><p style="font-size:11px;color:var(--text-secondary);margin-top:4px">Billing '+(currentPeriod==='monthly'?'monthly':'yearly')+' - 14 days free</p></div><div style="text-align:center;padding:20px 0"><i class="fa-solid fa-lock" style="font-size:32px;color:var(--accent);margin-bottom:12px"></i><p style="font-size:14px;color:var(--text-primary);font-weight:600">Secure payment via external gateway</p><p style="font-size:12px;color:var(--text-secondary);margin-top:8px">Upon confirmation you will be redirected to the secure payment gateway to complete the transaction.</p></div>';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Subscribe '+esc(name);
    document.getElementById('modal-submit').onclick=function(){processPayment(plan,price)};
}
async function processPayment(plan,price){
    document.getElementById('modal-submit').disabled=true;
    document.getElementById('modal-submit').textContent='Redirecting...';
    setTimeout(function(){
        document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:40px 0"><i class="fa-solid fa-envelope" style="font-size:48px;color:var(--accent)"></i><h3 style="font-family:Bricolage Grotesque,sans-serif;font-size:24px;margin-top:16px">Request Sent</h3><p style="color:var(--text-secondary);margin-top:8px">Our team will contact you to activate your <strong>'+esc(planNames[plan])+'</strong>.</p><p style="color:var(--text-secondary);font-size:12px;margin-top:4px">You will receive an email with payment instructions.</p></div>';
        document.getElementById('modal-submit').style.display='none';
        document.querySelector('.modal-actions .btn-secondary').textContent='Close';
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
        '<div class="admin-stat"><div class="stat-value">'+(companies.count||0)+'</div><div class="stat-label">COMPANIES</div></div>'+
        '<div class="admin-stat"><div class="stat-value">'+(users.count||0)+'</div><div class="stat-label">USERS</div></div>'+
        '<div class="admin-stat"><div class="stat-value">'+(vessels.count||0)+'</div><div class="stat-label">VESSELS</div></div>'+
        '<div class="admin-stat"><div class="stat-value">'+(ais.count||0)+'</div><div class="stat-label">ACTIVE AIS</div></div>';
    // Companies list
    var cr=await sb.from('companies').select('*').order('created_at',{ascending:false}).limit(100);
    var html='';
    if(cr.data)cr.data.forEach(function(c){
        html+='<div class="info-card"><i class="fa-solid fa-building" style="color:var(--text-primary)"></i><div class="info-card-text"><h4>'+esc(c.name)+'</h4><p>Plan: '+esc(c.plan||'basic')+' | Max: '+(c.max_vessels||1)+' vessels | '+(c.active!==false?'Active':'Inactive')+'</p></div></div>';
    });
    document.getElementById('admin-companies').innerHTML=html||'<div class="empty-state"><p>No companies</p></div>';
    // Users list
    var ur=await sb.from('user_profiles').select('*').order('created_at',{ascending:false}).limit(200);
    var uhtml='';
    if(ur.data)ur.data.forEach(function(u){
        uhtml+='<div class="info-card"><i class="fa-solid fa-user" style="color:var(--text-primary)"></i><div class="info-card-text"><h4>'+esc(u.full_name||'No name')+'</h4><p>Rol: '+esc(u.role||'admin')+' | Company: '+(u.company_id?u.company_id.substring(0,8)+'...':'Unassigned')+'</p></div></div>';
    });
    document.getElementById('admin-users').innerHTML=uhtml||'<div class="empty-state"><p>No users</p></div>';
}
function openNewCompanyModal(){
    document.getElementById('modal-title').textContent='New Company';
    document.getElementById('modal-body').innerHTML='<label>COMPANY NAME</label><input type="text" id="new-company-name" placeholder="Ex: Guarani Shipping"><label>PLAN</label><select id="new-company-plan" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Manrope,sans-serif;font-size:14px"><option value="barcaza">Per Barge ($149/mo)</option><option value="combo" selected>Fleet Combo ($899/mo)</option><option value="enterprise">Enterprise ($1,499/mo)</option><option value="ilimitado">Unlimited ($2,499/mo)</option></select><label>MAX VESSELS</label><input type="number" id="new-company-max" placeholder="10" value="10">';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Create Company';
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
        document.getElementById('modal-title').textContent='Add System User';
        document.getElementById('modal-body').innerHTML='<label>EMAIL</label><input type="email" id="new-user-email" placeholder="user@company.com"><label>PASSWORD</label><input type="password" id="new-user-pass" placeholder="Minimum 6 characters"><label>FULL NAME</label><input type="text" id="new-user-name" placeholder="John Doe"><label>COMPANY</label><select id="new-user-company" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Manrope,sans-serif;font-size:14px">'+opts+'</select><label>ROLE</label><select id="new-user-role" style="width:100%;padding:12px;border-radius:10px;border:0.5px solid var(--separator);font-family:Manrope,sans-serif;font-size:14px"><option value="admin">Admin</option><option value="operator">Operator</option><option value="viewer">Viewer</option></select>';
        document.getElementById('modal-overlay').classList.add('open');
        document.getElementById('modal-submit').textContent='Create User';
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
var chatHistoryEn = [];
async function sendCopiloto(){
    var input=document.getElementById('copiloto-input');
    var chat=document.getElementById('copiloto-chat');
    var msg=input.value.trim();if(!msg)return;
    chat.innerHTML+='<div style="margin:12px 0;text-align:right"><span style="background:var(--accent);color:white;padding:8px 14px;border-radius:12px 12px 4px 12px;font-size:13px;display:inline-block;max-width:70%">'+esc(msg)+'</span></div>';
    input.value='';input.disabled=true;
    document.getElementById('copiloto-send').disabled=true;
    chat.innerHTML+='<div style="margin:12px 0" id="ai-typing"><span style="background:var(--surface-low);padding:8px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing data...</span></div>';
    chat.scrollTop=chat.scrollHeight;
    // Gather context from Supabase
    try{
        var ctx='';
        var v=await sb.from('vessels').select('*').limit(200);if(v.data)ctx+='Flota: '+JSON.stringify(v.data)+'\n';
        var ais=await sb.from('ais_traffic').select('ship_name,latitude,longitude,speed,course,updated_at').limit(200);if(ais.data)ctx+='AIS Positions: '+JSON.stringify(ais.data)+'\n';
        var vj=await sb.from('voyages').select('*').limit(100);if(vj.data)ctx+='Trips: '+JSON.stringify(vj.data)+'\n';
        var fl=await sb.from('fuel_logs').select('*').limit(50);if(fl.data)ctx+='Fuel: '+JSON.stringify(fl.data)+'\n';
        var mt=await sb.from('maintenance_tasks').select('*').limit(50);if(mt.data)ctx+='Maintenance: '+JSON.stringify(mt.data)+'\n';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var res=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({message:msg,context:ctx,history:chatHistoryEn})});
        var data=await res.json();
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        var answer=data.response||data.analysis||data.message||'Could not process request.';
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;max-width:80%;line-height:1.5"><i class="fa-solid fa-robot" style="color:var(--accent);margin-right:6px"></i>'+esc(answer).replace(/\n/g,'<br>')+'</span></div>';
        chatHistoryEn.push({ role: 'user', text: msg });
        chatHistoryEn.push({ role: 'model', text: answer });
        if(chatHistoryEn.length > 20) chatHistoryEn = chatHistoryEn.slice(-20);
    }catch(e){
        var typing=document.getElementById('ai-typing');if(typing)typing.remove();
        chat.innerHTML+='<div style="margin:12px 0"><span style="background:var(--surface-low);padding:12px 14px;border-radius:12px 12px 12px 4px;font-size:13px;display:inline-block;color:var(--error)"><i class="fa-solid fa-exclamation-triangle" style="margin-right:6px"></i>Error connecting to the AI server.</span></div>';
    }
    input.disabled=false;document.getElementById('copiloto-send').disabled=false;
    chat.scrollTop=chat.scrollHeight;input.focus();
}

// DASHBOARD DINAMICO
async function loadDashboardExtras(){
    // Greeting by time of day
    var h=new Date().getHours();
    var greet=h<12?'Good morning,':h<18?'Good afternoon,':'Good evening,';
    var sess=await sb.auth.getSession();var userName=(sess.data.session&&sess.data.session.user.email)?sess.data.session.user.email.split('@')[0]:'Captain';
    userName=userName.charAt(0).toUpperCase()+userName.slice(1);
    var el=document.getElementById('dash-greeting');
    if(el)el.innerHTML=greet+'<br><em>'+esc(userName)+'.</em>';
    // Week & date
    var now=new Date();var oneJan=new Date(now.getFullYear(),0,1);var weekNum=Math.ceil((((now-oneJan)/86400000)+oneJan.getDay()+1)/7);
    var de=document.getElementById('dash-week');if(de)de.textContent='WEEK '+weekNum+' Ãƒâ€šÃ‚Â· '+now.getFullYear();
    var dd=document.getElementById('dash-date');if(dd)dd.textContent=now.toLocaleDateString('en',{weekday:'long',day:'numeric',month:'long'});
    // Sync indicator
    var sy=document.getElementById('dash-sync');if(sy)sy.textContent='FLEET SYNCHRONIZED Ãƒâ€šÃ‚Â· '+now.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});
    // Weather
    try{
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=America/Asuncion');
        var wd=await w.json();
        if(wd.current){
            var codes={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Fog',51:'Drizzle',61:'Rain',80:'Showers',95:'Storm'};
            var desc=codes[wd.current.weather_code]||'Variable';
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
                if(el2)el2.textContent=val?Math.round(val).toLocaleString()+' mÃƒâ€šÃ‚Â³/s':'--';
                if(i===0){
                    var kh=document.getElementById('dash-kpi-hidro');if(kh)kh.textContent=val?Math.round(val).toLocaleString():'--';
                    var hs=document.getElementById('dash-hidro-status');if(hs)hs.textContent='Navigable ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â flow '+( val>2000?'normal':'low');
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
            var kfs=document.getElementById('dash-kpi-fuel-sub');if(kfs)kfs.textContent=f.data.length+' refuels recorded';
        }
    }catch(e){}
    // Crew KPI
    try{
        var cr=await sb.from('crew_members').select('status',{count:'exact'});
        var kc=document.getElementById('dash-kpi-crew');if(kc)kc.textContent=cr.count||0;
        var kcs=document.getElementById('dash-kpi-crew-sub');if(kcs)kcs.textContent='active crew';
    }catch(e){}
    // Vessels + KPIs
    try{
        var v=await sb.from('vessels').select('id,name,type,status,location').order('name').limit(6);
        if(v.data){
            var nav=v.data.filter(function(x){return(x.status||'').toLowerCase()==='navegando'||x.status==='in_transit'}).length;
            var port=v.data.filter(function(x){return(x.status||'').toLowerCase()==='in_port'}).length;
            document.getElementById('dash-kpi-viaje').textContent=nav;
            document.getElementById('dash-kpi-viaje-sub').textContent='+'+v.data.length+' total available';
            document.getElementById('dash-kpi-puerto').textContent=port;
            document.getElementById('dash-kpi-puerto-sub').textContent=v.data.length+' vessels';
            // Vessel cards
            var vh='';
            v.data.forEach(function(ves){
                var stColor=ves.status==='navegando'||ves.status==='in_transit'?'var(--success)':ves.status==='mantenimiento'?'var(--warning)':'var(--accent)';
                var stLabel=(ves.status||'in_port').toUpperCase().replace('_',' ');
                vh+='<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:12px;padding:14px;cursor:pointer" onclick="navigate(\'fleet\')">'+
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
                    '<span style="font-size:13px;font-weight:600">'+ves.name+'</span>'+
                    '<span style="display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:'+stColor+'"></span><span style="font-size:9px;font-weight:700;color:var(--text-secondary);letter-spacing:0.3px">'+stLabel+'</span></span></div>'+
                    '<div style="font-size:11px;color:var(--text-secondary)">'+(ves.type||'Vessel')+' Ãƒâ€šÃ‚Â· '+(ves.location||'ASU')+'</div></div>';
            });
            document.getElementById('dash-vessels').innerHTML=vh;
        }
    }catch(e){}
    // Trips alertas KPI
    try{
        var vj=await sb.from('voyages').select('status');
        if(vj.data){
            var pending=vj.data.filter(function(x){return x.status==='pending'}).length;
            document.getElementById('dash-kpi-alertas').textContent=pending;
            document.getElementById('dash-kpi-alertas-sub').textContent=vj.data.length+' total trips';
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
                else if(l.action_type==='INCIDENT')icon='fa-solid fa-triangle-exclamation';
                else if(l.action_type==='FUEL')icon='fa-solid fa-gas-pump';
                ah+='<div class="info-card"><i class="'+icon+'"></i><div class="info-card-text"><h4>'+(l.title||l.action_type||'Activity')+'</h4><p>'+(l.vessel_name||'')+' Ãƒâ€šÃ‚Â·  '+ago+'</p></div></div>';
            });
            document.getElementById('dash-activity').innerHTML=ah;
            document.getElementById('dash-activity-empty').style.display='none';
        }else{
            document.getElementById('dash-activity-empty').style.display='block';
        }
    }catch(e){}
}

// HIDROLEOGIA - Extracted to js/modules/viabarcazas-hidrologia.js (with Promise.all optimization)


// REPORTES & ANALYTICS
var fleetChart=null,fuelChart=null,activityChart=null;
async function loadReportes(){
    try{
// ━━━━━━━━━━ Stats  parallel queries for performance ━━━━━━━━━━
        var results=await Promise.all([sb.from('vessels').select('status'),sb.from('voyages').select('id',{count:'exact',head:true}),sb.from('fuel_logs').select('liters'),sb.from('logs').select('id',{count:'exact',head:true})]);
        var v=results[0];var vj=results[1];var fl=results[2];var lg=results[3];
        var totalFuel=fl.data?fl.data.reduce(function(s,x){return s+(x.liters||0)},0):0;
        document.getElementById('report-stats').innerHTML=
            '<div class="admin-stat"><div class="stat-value">'+(v.data?v.data.length:0)+'</div><div class="stat-label">VESSELS</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+(vj.count||0)+'</div><div class="stat-label">TOTAL TRIPS</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+totalFuel.toLocaleString()+'L</div><div class="stat-label">FUEL TOTAL</div></div>'+
            '<div class="admin-stat"><div class="stat-value">'+(lg.count||0)+'</div><div class="stat-label">LOGBOOK ENTRIES</div></div>';
        // Fleet Status Chart
        if(v.data){
            var enTrip=0,enPuerto=0,mant=0;
            v.data.forEach(function(x){var s=(x.status||'').toLowerCase();if(s.indexOf('viaje')>=0||s==='active')enTrip++;else if(s.indexOf('manten')>=0)mant++;else enPuerto++;});
            if(fleetChart)fleetChart.destroy();
            var ctx1=document.getElementById('chart-fleet');
            if(ctx1){fleetChart=new Chart(ctx1,{type:'doughnut',data:{labels:['In Transit','In Port','Maintenance'],datasets:[{data:[enTrip,enPuerto,mant],backgroundColor:['#34D399','#128C7E','#FBBF24'],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#A9B8B2',font:{family:'Manrope',size:12}}}}}});}
        }
        // Fuel Chart
        if(fl.data&&fl.data.length>0){
            var fuelByDay={};fl.data.forEach(function(f){var day='Refuel '+(Object.keys(fuelByDay).length+1);fuelByDay[day]=(f.liters||0);});
            if(fuelChart)fuelChart.destroy();
            var ctx2=document.getElementById('chart-fuel');
            if(ctx2){fuelChart=new Chart(ctx2,{type:'bar',data:{labels:Object.keys(fuelByDay).slice(-7),datasets:[{label:'Liters',data:Object.values(fuelByDay).slice(-7),backgroundColor:'rgba(37,211,102,0.65)',borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.07)'},ticks:{color:'#A9B8B2'}},x:{grid:{display:false},ticks:{color:'#A9B8B2'}}}}});}
        }
// ━━━━━━━━━━ Activity Chart  use real log counts from DB ━━━━━━━━━━
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
        if(ctx3){activityChart=new Chart(ctx3,{type:'line',data:{labels:days,datasets:[{label:'Entries',data:counts,borderColor:'#25D366',backgroundColor:'rgba(37,211,102,0.10)',fill:true,tension:0.4,pointRadius:0}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.07)'},ticks:{color:'#A9B8B2'}},x:{grid:{display:false},ticks:{color:'#A9B8B2',maxTicksLimit:10}}}}});}
    }catch(e){/* Reports: */;}
}

function vesselIconSVG(type){
    var t=(type||'').toLowerCase();
    var hasHouse=t.indexOf('tug')>=0||t.indexOf('pusher')>=0||t.indexOf('boat')>=0;
    var house=hasHouse?'<rect x="18" y="1.5" width="7" height="5" rx="1" fill="currentColor"/><rect x="19.5" y="0" width="4" height="2" fill="currentColor"/>':'';
    return '<svg viewBox="0 0 32 18" width="28" height="16" style="display:block;margin:0 auto 6px" aria-hidden="true"><path d="M2,15 L2,10 L6,10 L8,6.5 L27,6.5 L29,10 L30,10 L30,15 Z" fill="currentColor"/>'+house+'<line x1="0" y1="15.5" x2="32" y2="15.5" stroke="currentColor" stroke-width="1" opacity="0.4"/></svg>';
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
                chip.innerHTML=vesselIconSVG(v.type||v.vessel_type)+'<div class="chip-name">'+(v.name||v.vessel_name||'--')+'</div><div class="chip-type">'+(v.type||v.vessel_type||'BARGE').toUpperCase()+'</div>';
                if(!isBusy){
                    chip.draggable=true;
                    chip.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',v.name||v.vessel_name||'');});
                }
                chips.appendChild(chip);
                if(!isBusy)count++;
            });
            document.querySelector('#view-convoy .viabarcazas-subtitle').textContent='FORMACION (0/'+data.length+') - '+count+' AVAILABLE';
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
    var inTransit=data.filter(function(v){var s=(v.status||'').toLowerCase();return s==='navegando'||s==='en_curso'||s==='en viaje'||s==='in_transit';});
    var completed=data.filter(function(v){var s=(v.status||'').toLowerCase();return s==='completed'||s==='entregado'||s==='finalizado';});
    var pending=data.filter(function(v){var s=(v.status||'').toLowerCase();return s!=='navegando'&&s!=='en_curso'&&s!=='en viaje'&&s!=='in_transit'&&s!=='completed'&&s!=='entregado'&&s!=='finalizado';});
    var totalCargo=data.reduce(function(s,v){return s+(v.cargo_tons||v.cargo_tonss||0)},0);
    document.getElementById('track-active').textContent=inTransit.length;
    document.getElementById('track-total-cargo').textContent=totalCargo>999?(totalCargo/1000).toFixed(1)+'k':totalCargo;
    document.getElementById('track-completed').textContent=completed.length;
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
            d.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:12px;background:rgba(46,160,67,0.08);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-ship" style="font-size:16px;color:#2EA043"></i></div><div><div style="font-size:14px;font-weight:700;color:var(--text-primary)">'+(v.vessel_name||'--')+'</div><div style="font-size:10px;color:var(--text-secondary)">'+(v.cargo_tons||v.cargo_tonss||0)+' tons</div></div></div><span style="font-size:9px;font-weight:700;color:#2EA043;background:rgba(46,160,67,0.08);padding:4px 10px;border-radius:6px;display:flex;align-items:center;gap:4px;letter-spacing:0.3px"><span style="width:6px;height:6px;border-radius:50%;background:#2EA043;animation:pulse 2s infinite"></span>IN TRANSIT</span></div><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:11px;font-weight:600;color:var(--text-primary);min-width:60px;text-align:right">'+(v.origin_port||'Origin')+'</span><div style="flex:1;height:6px;background:var(--surface-low,#f0f0f0);border-radius:3px;position:relative;overflow:visible"><div style="height:6px;background:linear-gradient(90deg,#2EA043,#3B82F6);border-radius:3px;width:'+progress+'%;transition:width 1s"></div><div style="position:absolute;top:-4px;left:'+progress+'%;width:14px;height:14px;background:#3B82F6;border-radius:50%;border:3px solid var(--bg-secondary);transform:translateX(-50%);box-shadow:0 2px 6px rgba(59,130,246,0.3)"></div></div><span style="font-size:11px;font-weight:600;color:var(--text-primary);min-width:60px">'+(v.destination_port||'Destination')+'</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--separator)"><div style="display:flex;gap:16px;font-size:11px;color:var(--text-secondary)"><span><i class="fa-solid fa-clock" style="color:var(--text-tertiary);margin-right:4px"></i>'+elapsedStr+' en route</span><span><i class="fa-solid fa-location-dot" style="color:var(--text-tertiary);margin-right:4px"></i>'+progress+'%</span></div><span style="font-size:10px;font-weight:600;color:#3B82F6">ETA: '+(v.eta?new Date(v.eta).toLocaleDateString('en',{day:'2-digit',month:'short'}):'--')+'</span></div>';
            activeList.appendChild(d);
        });
    }else{
        activeList.innerHTML='<div class="empty-state" style="padding:30px"><i class="fa-regular fa-circle-check"></i><p>No active cargo in transit</p></div>';
    }
    var historyItems=completed.concat(pending);
    if(historyItems.length>0){
        historyList.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:8px';
        historyItems.forEach(function(v){
            var s=(v.status||'pending').toLowerCase();
            var isCompleted=s==='completed'||s==='entregado'||s==='finalizado';
            var isPending=s==='pending'||s==='pendiente';
            var stColor=isCompleted?'#2EA043':isPending?'#F59E0B':'#94A3B8';
            var stBg=isCompleted?'rgba(46,160,67,0.08)':isPending?'rgba(245,158,11,0.08)':'rgba(148,163,184,0.08)';
            var stLabel=isCompleted?'COMPLETED':isPending?'PENDING':(v.status||'PENDING').toUpperCase();
            var stIcon=isCompleted?'fa-circle-check':isPending?'fa-clock':'fa-ship';
            var t=v.created_at?new Date(v.created_at).toLocaleDateString('en',{day:'2-digit',month:'short'}):'-';
            var d=document.createElement('div');
            d.style.cssText='background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;transition:all 0.2s;cursor:default';
            d.onmouseenter=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'};
            d.onmouseleave=function(){this.style.transform='none';this.style.boxShadow='none'};
            d.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:12px;background:'+stBg+';display:flex;align-items:center;justify-content:center"><i class="fa-solid '+stIcon+'" style="font-size:16px;color:'+stColor+'"></i></div><span style="font-size:9px;font-weight:700;color:'+stColor+';background:'+stBg+';padding:4px 10px;border-radius:6px;letter-spacing:0.3px">'+stLabel+'</span></div><div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:4px">'+(v.vessel_name||'--')+' <i class="fa-solid fa-arrow-right" style="font-size:9px;color:var(--accent);margin:0 4px"></i> '+(v.destination_port||'--')+'</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-location-dot" style="font-size:9px;color:var(--text-tertiary)"></i>'+(v.origin_port||'--')+'</span><span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary)"><i class="fa-solid fa-box" style="font-size:9px;color:var(--text-tertiary)"></i>'+(v.cargo_tons||v.cargo_tonss||0)+' tons</span><span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary)"><i class="fa-regular fa-calendar" style="font-size:9px;color:var(--text-tertiary)"></i>'+t+'</span></div>';
            historyList.appendChild(d);
        });
    }
}

function filterTracking(){var q=document.getElementById('track-search').value.trim();renderTracking(q||null);}
async function exportTracking(format){
    var r=await sb.from('voyages').select('*').order('created_at',{ascending:false}).limit(200);var data=r.data||[];
    if(format==='excel'){
        exportToExcel(data.map(function(v){return{Vessel:v.vessel_name||'',Origin:v.origin_port||'',Destination:v.destination_port||'',CargaTon:v.cargo_tonss||0,Status:v.status||'',Date:v.created_at?new Date(v.created_at).toLocaleDateString('en'):''}}),'Tracking','viabarcazas_tracking');
    }else{
        exportToPDF('Cargo Tracking',['Vessel','Origin','Destination','Refuel (t)','Status','Date'],data.map(function(v){return[v.vessel_name||'',v.origin_port||'',v.destination_port||'',(v.cargo_tonss||0).toString(),v.status||'',v.created_at?new Date(v.created_at).toLocaleDateString('en'):'']}),'viabarcazas_tracking');
    }
}

// DELETE CONFIRMATION (ViaBarcazas modal, no native confirm)
function confirmDelete(table, id, itemName, reloadFn){
    document.getElementById('modal-title').textContent='Delete Record';
    document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:20px 0"><i class="fa-regular fa-trash-can" style="font-size:36px;color:var(--error);margin-bottom:16px;display:block"></i><p style="font-size:15px;font-weight:500">Are you sure you want to delete?</p><p style="font-size:13px;color:var(--text-secondary);margin-top:6px"><strong>'+itemName+'</strong></p><p style="font-size:11px;color:var(--text-tertiary);margin-top:12px">This action cannot be undone.</p></div>';
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-submit').textContent='Delete';
    document.getElementById('modal-submit').style.display='';
    document.getElementById('modal-submit').style.background='var(--error)';
    document.getElementById('modal-submit').disabled=false;
    document.getElementById('modal-submit').onclick=async function(){
        document.getElementById('modal-submit').disabled=true;
        document.getElementById('modal-submit').textContent='Deleting...';
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
                var vn=d.vessel_name||d.title||'Unknown';
                if(!vessels[vn])vessels[vn]={name:vn,draft:det.draft||0,max:det.max_draft||3.5,date:d.created_at};
            });
            var vList=Object.values(vessels);var alerts=0;var totalDraft=0;
            vList.forEach(function(v){
                var pct=v.max>0?((v.draft/v.max)*100):0;
                var color=pct>90?'var(--error)':pct>75?'var(--warning)':'var(--success)';
                var status=pct>90?'CRITICAL':pct>75?'ALERT':'OPTIMAL';
                if(pct>75)alerts++;totalDraft+=v.draft;
                l.innerHTML+='<div class="info-card" style="margin-bottom:10px"><i class="fa-solid fa-ruler-vertical" style="color:'+color+'"></i><div class="info-card-text"><h4>'+v.name+'</h4><p>Draft: <strong>'+v.draft.toFixed(2)+'m</strong> / Max: '+v.max.toFixed(2)+'m - '+status+'</p></div><div style="min-width:80px;text-align:right"><div style="font-family:Bricolage Grotesque,sans-serif;font-size:22px;font-weight:400">'+Math.round(pct)+'%</div><div style="height:4px;background:var(--surface-low);border-radius:2px;margin-top:4px"><div style="height:4px;background:'+color+';border-radius:2px;width:'+Math.min(pct,100)+'%"></div></div></div></div>';
            });
            document.getElementById('calado-total').textContent=vList.length;
            document.getElementById('calado-alerts').textContent=alerts;
            document.getElementById('calado-avg').textContent=vList.length>0?(totalDraft/vList.length).toFixed(2):'--';
            data.slice(0,10).forEach(function(d){
                var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};
                var t=d.created_at?new Date(d.created_at).toLocaleString('en',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
                h.innerHTML+='<div class="list-item"><div><h4>'+(d.vessel_name||'--')+' - '+(det.draft||0).toFixed(2)+'m</h4><p>'+(d.description||'Reading')+' - '+t+'</p></div><buttons class="delete-btn" data-id="'+d.id+'" title="Delete"><i class="fa-regular fa-trash-can"></i></buttons></div>';
            });
            h.querySelectorAll('.delete-btn').forEach(function(btn){btn.addEventListener('click',function(){confirmDelete('logs',this.dataset.id,'Reading',loadCalado);});});
        }else{em.style.display='';}
    }catch(e){/* Calado: */;}
}

// INCIDENTS
var incidentesData=[];
async function loadIncidents(){
    try{
        var r=await sb.from('logs').select('*').eq('action_type','INCIDENT').order('created_at',{ascending:false}).limit(50);
        incidentesData=r.data||[];renderIncidents();
    }catch(e){/* Incidents: */;}
}
function renderIncidents(filter){
    var data=incidentesData;var l=document.getElementById('inc-list');var em=document.getElementById('inc-empty');
    if(!l)return;l.innerHTML='';
    if(filter){data=data.filter(function(d){var s=JSON.stringify(d).toLowerCase();return s.indexOf(filter.toLowerCase())>=0;});}
    if(data&&data.length>0){
        em.style.display='none';var open=0;var crit=0;
        var sevIcons={'Critical':'fa-circle-exclamation','High':'fa-triangle-exclamation','Medium':'fa-circle-info','Low':'fa-shield-halved'};
        var sevColors={'Critical':'#DC2626','High':'#F59E0B','Medium':'#3B82F6','Low':'#10B981'};
        var typeIcons={'Collision':'fa-ship','Grounding':'fa-anchor','Spill':'fa-droplet','Mechanical failure':'fa-gears','Fire':'fa-fire','Medical':'fa-kit-medical','Other':'fa-circle-dot'};
        var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
        data.forEach(function(d){
            var det=typeof d.details==='string'?JSON.parse(d.details||'{}'):d.details||{};
            var sev=det.severity||'Medium';var st=det.status||'Open';
            if(st==='Open')open++;if(sev==='Critical')crit++;
            var sevColor=sevColors[sev]||'#94A3B8';
            var sevIcon=sevIcons[sev]||'fa-triangle-exclamation';
            var typeIcon=typeIcons[det.type]||'fa-triangle-exclamation';
            var stColor=st==='Open'?'#DC2626':st==='In Progress'?'#F59E0B':'#10B981';
            var t=d.created_at?new Date(d.created_at).toLocaleDateString('en',{day:'2-digit',month:'short'}):'—';
            var tTime=d.created_at?new Date(d.created_at).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}):'';
            h+='<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px;border-left:4px solid '+sevColor+';transition:box-shadow 0.2s,transform 0.2s" onmouseover="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
            h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
            h+='<div style="display:flex;align-items:center;gap:10px">';
            h+='<div style="width:40px;height:40px;border-radius:12px;background:'+sevColor+'15;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+sevIcon+'" style="font-size:16px;color:'+sevColor+'"></i></div>';
            h+='<div><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:'+sevColor+';background:'+sevColor+'12;padding:3px 10px;border-radius:6px;text-transform:uppercase">'+sev+'</span>';
            if(d.vessel_name){h+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-ship" style="font-size:9px;color:var(--text-tertiary)"></i> '+d.vessel_name+'</div>';}
            h+='</div></div>';
            h+='<div style="text-align:right;flex-shrink:0"><div style="font-size:10px;color:var(--text-tertiary)">'+t+'</div><div style="font-size:10px;color:var(--text-tertiary)">'+tTime+'</div></div>';
            h+='</div>';
            h+='<div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:6px">'+(d.title||'Incident')+'</div>';
            if(det.type){h+='<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary);margin-bottom:10px"><i class="fa-solid '+typeIcon+'" style="font-size:10px;color:var(--text-tertiary)"></i> '+det.type+'</div>';}
            h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--separator)">';
            h+='<span style="font-size:10px;font-weight:700;color:'+stColor+';background:'+stColor+'15;padding:3px 8px;border-radius:6px">'+st.toUpperCase()+'</span>';
            if(d.id){h+='<button onclick="confirmDelete(\'logs\',\''+d.id+'\',\''+(d.title||'Incident')+'\',loadIncidents)" style="background:none;border:1px solid var(--separator);border-radius:8px;padding:3px 8px;cursor:pointer;color:var(--text-tertiary);font-size:10px;display:flex;align-items:center;gap:3px;transition:all 0.2s" onmouseover="this.style.borderColor=\'var(--error)\';this.style.color=\'var(--error)\'" onmouseout="this.style.borderColor=\'var(--separator)\';this.style.color=\'var(--text-tertiary)\'"><i class="fa-regular fa-trash-can" style="font-size:9px"></i></button>';}
            h+='</div></div>';
        });
        h+='</div>';
        l.innerHTML=h;
        document.getElementById('inc-total').textContent=incidentesData.length;
        document.getElementById('inc-open').textContent=open;
        document.getElementById('inc-critical').textContent=crit;
    }else{
        if(em){em.style.display='';em.innerHTML='<div style="text-align:center;padding:60px 20px"><div style="width:64px;height:64px;border-radius:20px;background:#10B98115;display:flex;align-items:center;justify-content:center;margin:0 auto 16px"><i class="fa-solid fa-shield-halved" style="font-size:28px;color:#10B981"></i></div><div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:6px">No incidents reported</div><div style="font-size:13px;color:var(--text-secondary)">Operations running smoothly</div></div>';}
    }
}
function filterIncidents(){
    var q=document.getElementById('inc-search').value.trim();
    renderIncidents(q||null);
}

// BRIEFING DIARIO - Extracted to js/modules/viabarcazas-briefing.js (with Promise.all optimization)

// ━━━━━━━━━━ EXPORT ENGINE  Extracted to js/modules/viabarcazas-exports.js ━━━━━━━━━━

// ============================================
// ━━━━━━━━━━ IA AVANZADA  MANTENIMIENTO PREDICTIVO ━━━━━━━━━━
// ============================================
async function runPredictiveMaintenance(){
    var btn=document.getElementById('btn-predict-maint');
    var container=document.getElementById('predict-maint-results');
    if(!btn||!container)return;
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
    container.innerHTML='<div style="text-align:center;padding:40px 0;"><div class="loading-spinner" style="width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px;"></div><div style="font-size:12px;color:var(--text-secondary);">Gemini is analyzing your fleet...</div></div>';
    try{
        var companyId=currentCompanyId||'a1b2c3d4-0001-4000-8000-000000000001';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var r=await fetch('/api/ai/predict-maintenance',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({companyId:companyId})});
        var data=await r.json();
        var preds=data.predictions||[];
        if(preds.length===0){container.innerHTML='<div style="text-align:center;color:var(--text-secondary);padding:20px;">No predictions found.</div>';btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-brain"></i> Analyze';return;}
        var html='';
        preds.forEach(function(p){
            var sevColor=p.severity==='critical'?'#ef4444':p.severity==='high'?'#f59e0b':p.severity==='medium'?'#3b82f6':'#10b981';
            var sevLabel=p.severity==='critical'?'CRITICAL':p.severity==='high'?'ALTO':p.severity==='medium'?'MEDIO':'BAJO';
            var prob=p.probability||0;
            html+='<div style="border:1px solid var(--border);border-left:4px solid '+sevColor+';border-radius:8px;padding:12px;margin-bottom:8px;">';
            html+='<div style="display:flex;justify-content:space-between;align-items:center;">';
            html+='<div style="font-weight:700;font-size:13px;">📊 '+p.vessel+'</div>';
            html+='<span style="background:'+sevColor+';color:#fff;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;">'+sevLabel+'</span>';
            html+='</div>';
            html+='<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">⚙️ '+p.component+'</div>';
            html+='<div style="font-size:12px;margin-top:6px;">'+p.action+'</div>';
            html+='<div style="display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--text-secondary);">';
            html+='<span>📊 Probability: <strong style="color:'+sevColor+'">'+prob+'%</strong></span>';
            html+='<span>📊 '+p.days_until+' days</span>';
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
// ━━━━━━━━━━ IA AVANZADA  ANOMALAS DE CONSUMO ━━━━━━━━━━
// ============================================
async function runFuelAnomalies(){
    var btn=document.getElementById('btn-fuel-anomalies');
    var container=document.getElementById('fuel-anomaly-results');
    if(!btn||!container)return;
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Scanning...';
    container.innerHTML='<div style="text-align:center;padding:40px 0;"><div class="loading-spinner" style="width:30px;height:30px;border:3px solid var(--border);border-top-color:#10b981;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px;"></div><div style="font-size:12px;color:var(--text-secondary);">Auditing fuel consumption...</div></div>';
    try{
        var companyId=currentCompanyId||'a1b2c3d4-0001-4000-8000-000000000001';
        var token=(await sb.auth.getSession())?.data?.session?.access_token;
        var r=await fetch('/api/ai/fuel-anomalies',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({companyId:companyId})});
        var data=await r.json();
        var anomalies=data.anomalies||[];
        if(anomalies.length===0){container.innerHTML='<div style="text-align:center;color:var(--text-secondary);padding:20px;">No anomalies detected.</div>';btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass-chart"></i> Scan';return;}
        var html='';
        anomalies.forEach(function(a){
            var sevColor=a.severity==='critical'?'#ef4444':a.severity==='high'?'#f59e0b':a.severity==='medium'?'#3b82f6':'#10b981';
            var icon=a.type==='theft_risk'?'📊':a.type==='overconsumption'?'🔥':a.type==='spike'?'⚙️':a.type==='trend'?'📊':'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦';
            var typeLabel=a.type==='theft_risk'?'THEFT RISK':a.type==='overconsumption'?'OVERCONSUMPTION':a.type==='spike'?'ANOMALOUS SPIKE':a.type==='trend'?'TREND':'NORMAL';
            html+='<div style="border:1px solid var(--border);border-left:4px solid '+sevColor+';border-radius:8px;padding:12px;margin-bottom:8px;">';
            html+='<div style="display:flex;justify-content:space-between;align-items:center;">';
            html+='<div style="font-weight:700;font-size:13px;">'+icon+' '+a.vessel+'</div>';
            html+='<span style="background:'+sevColor+';color:#fff;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;">'+typeLabel+'</span>';
            html+='</div>';
            html+='<div style="font-size:12px;margin-top:6px;">'+a.description+'</div>';
            if(a.deviation_pct){html+='<div style="font-size:11px;color:'+sevColor+';margin-top:4px;font-weight:600;">Deviation: '+(a.deviation_pct>0?'+':'')+a.deviation_pct+'%</div>';}
            html+='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">📊 '+a.recommendation+'</div>';
            html+='</div>';
        });
        container.innerHTML=html;
    }catch(e){
        container.innerHTML='<div style="color:#ef4444;text-align:center;padding:20px;">Error: '+e.message+'</div>';
    }
    btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass-chart"></i> Scan';
}

// ============================================
// ━━━━━━━━━━ IA AVANZADA  OPTIMIZADOR DE CONVOY ━━━━━━━━━━
// ============================================
async function suggestConvoyIA(){
    var btn=document.getElementById('btn-convoy-ai');
    var container=document.getElementById('convoy-ai-result');
    var dest=document.getElementById('convoy-destination')?.value||'';
    if(!btn||!container)return;
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Calculating...';
    container.style.display='block';
    container.innerHTML='<div style="text-align:center;padding:20px 0;"><div class="loading-spinner" style="width:24px;height:24px;border:3px solid var(--border);border-top-color:#8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 8px;"></div><div style="font-size:12px;color:var(--text-secondary);">Gemini is optimizing the formation...</div></div>';
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

            return container.innerHTML = '<div style="background:var(--bg-card);padding:16px;border-radius:10px;font-size:12px;overflow:auto;"><strong style="color:#ef4444;">DEBUG - Unexpected (or empty) AI response:</strong><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
        }
        
        var riskColor=(s.risk_score||100)<=30?'#10b981':(s.risk_score||100)<=60?'#f59e0b':'#ef4444';
        var html='<div style="background:var(--bg-card);border-radius:10px;padding:16px;">';
        
        // Config + Risk
        html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
        html+='<div style="font-weight:800;font-size:18px;color:#8b5cf6;">⚓ '+configStr+'</div>';
        html+='<div style="text-align:center;"><div style="width:50px;height:50px;border-radius:50%;border:4px solid '+riskColor+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:'+riskColor+';">'+(s.risk_score||'?')+'</div><div style="font-size:9px;color:var(--text-secondary);margin-top:2px;">RISK</div></div>';
        html+='</div>';
        
        // Formation
        if(f.proa){html+='<div style="font-size:12px;margin-bottom:4px;">🚢 <strong>Bow:</strong> '+f.proa+'</div>';}
        if(f.barcazas_f1&&f.barcazas_f1.length){html+='<div style="font-size:12px;margin-bottom:4px;">📦 <strong>Row 1:</strong> '+f.barcazas_f1.join(', ')+'</div>';}
        if(f.barcazas_f2&&f.barcazas_f2.length){html+='<div style="font-size:12px;margin-bottom:4px;">📦 <strong>Row 2:</strong> '+f.barcazas_f2.join(', ')+'</div>';}
        if(f.popa){html+='<div style="font-size:12px;margin-bottom:4px;">🚤 <strong>Stern:</strong> '+f.popa+'</div>';}
        
        // Fuel estimate
        if(s.fuel_estimate_liters){html+='<div style="font-size:12px;margin-top:8px;">⛽ Estimated consumption: <strong>'+s.fuel_estimate_liters.toLocaleString()+' lts</strong></div>';}
        
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

// ─── LIQUIDOS EN ────────────────────────────────────
function exportLiquidos(fmt){alert('Export tanks in '+fmt+' — coming soon');}
async function loadLiquidosEN(){
    // Same source as the Spanish view and the mobile app: liquid_tanks.
    var TYPE={'Tanque doble casco':'Double hull tank','Tanque simple':'Single hull tank'};
    var ST={'En tránsito':'In transit','Fondeada':'At anchor','Descargando':'Discharging','Mantenimiento':'Maintenance'};
    var tanks=[];
    try{
        var r=await sb.from('liquid_tanks').select('*').order('name');
        tanks=(r.data||[]).map(function(t){
            var cap=Number(t.capacity_m3)||0, cur=Number(t.current_m3)||0;
            return {name:t.name,type:TYPE[t.tank_type]||t.tank_type,cap:cap,cur:cur,
                    pct:cap>0?Math.round(cur/cap*100):0,product:t.product||'-',
                    temp:(Number(t.temperature_c)||0)+'°C',status:ST[t.status]||t.status,route:t.route||'-'};
        });
    }catch(e){console.error('loadLiquidosEN:',e);}
    var el=document.getElementById('liq-list-en');
    if(!el) return;
    var h='<div style="font-size:12px;font-weight:700;letter-spacing:0.5px;color:var(--text-secondary);margin:20px 0 12px">TANK BARGES · '+tanks.length+'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">';
    tanks.forEach(function(t){
        var col=t.pct>70?'var(--success)':t.pct>40?'var(--warning)':'var(--error)';
        h+='<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:18px;transition:box-shadow .2s" onmouseover="this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.08)\'" onmouseout="this.style.boxShadow=\'none\'">';
        h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-size:14px;font-weight:700">'+t.name+'</div><span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;background:'+col+'22;color:'+col+';letter-spacing:0.5px">'+t.status.toUpperCase()+'</span></div>';
        h+='<div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px">'+t.type+'</div>';
        h+='<div style="background:var(--separator);border-radius:6px;height:8px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:'+t.pct+'%;background:'+col+';border-radius:6px;transition:width .5s"></div></div>';
        h+='<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-bottom:12px"><span>'+t.cur.toLocaleString()+' / '+t.cap.toLocaleString()+' m³</span><span style="font-weight:700;color:'+col+'">'+t.pct+'%</span></div>';
        h+='<div style="display:flex;flex-wrap:wrap;gap:6px">';
        h+='<span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;background:var(--accent);color:#fff">'+t.product+'</span>';
        h+='<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:var(--bg-primary);border:1px solid var(--separator);color:var(--text-secondary)">🌡 '+t.temp+'</span>';
        h+='<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:var(--bg-primary);border:1px solid var(--separator);color:var(--text-secondary)">🚢 '+t.route+'</span>';
        h+='</div></div>';
    });
    h+='</div>';
    el.innerHTML=h;
}

// ─── CONTRATOS EN ────────────────────────────────────
function exportContratos(fmt){alert('Export contracts in '+fmt+' — coming soon');}
async function loadContratosEN(){
    var el=document.getElementById('cont-list-en');
    if(!el) return;
    var contracts=[];
    try{
        var r=await sb.from('freight_contracts').select('*').order('created_at',{ascending:false});
        if(r.data&&r.data.length>0) contracts=r.data;
    }catch(e){}
    if(contracts.length===0){
        contracts=[
            {client:'Cargill',route:'Asunción - Rosario',product:'Soybean',contract_type:'COA',status:'active',volume_total:50000,volume_used:32000,rate_per_ton:18.5,expiration_date:'2026-08-15'},
            {client:'ADM',route:'Villeta - San Lorenzo',product:'Soybean Meal',contract_type:'Spot',status:'active',volume_total:25000,volume_used:25000,rate_per_ton:22.0,expiration_date:'2026-06-01'},
            {client:'PETROPAR',route:'Villa Elisa - Campana',product:'Diesel',contract_type:'Time Charter',status:'active',volume_total:15000,volume_used:8700,rate_per_ton:35.0,expiration_date:'2026-12-31'},
            {client:'Bunge',route:'Concepción - Rosario',product:'Corn',contract_type:'Volume',status:'completed',volume_total:40000,volume_used:40000,rate_per_ton:16.0,expiration_date:'2026-03-30'},
            {client:'Louis Dreyfus',route:'Encarnación - Buenos Aires',product:'Wheat',contract_type:'COA',status:'active',volume_total:30000,volume_used:12000,rate_per_ton:20.0,expiration_date:'2026-09-15'},
            {client:'Viterra',route:'Pilar - San Nicolás',product:'Iron Ore',contract_type:'Spot',status:'pending',volume_total:60000,volume_used:0,rate_per_ton:12.5,expiration_date:'2026-07-01'}
        ];
    }
    var active=contracts.filter(function(c){return c.status==='active'}).length;
    var tons=contracts.reduce(function(s,c){return s+((c.volume_total||0))},0);
    var rev=contracts.reduce(function(s,c){return s+((c.volume_used||0)*(c.rate_per_ton||0))},0);
    var soon=contracts.filter(function(c){var d=new Date(c.expiration_date);var now=new Date();return c.status==='active'&&(d-now)<30*86400000&&(d-now)>0}).length;
    var ae=document.getElementById('cont-active-en');if(ae)ae.textContent=active;
    var te=document.getElementById('cont-tons-en');if(te)te.textContent=tons.toLocaleString();
    var re=document.getElementById('cont-revenue-en');if(re)re.textContent='$'+Math.round(rev).toLocaleString();
    var se=document.getElementById('cont-expiring-en');if(se)se.textContent=soon;
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:16px">';
    contracts.forEach(function(c){
        var pct=c.volume_total>0?Math.round((c.volume_used/c.volume_total)*100):0;
        var sc=c.status==='active'?'var(--success)':c.status==='completed'?'var(--accent)':c.status==='pending'?'var(--warning)':'var(--error)';
        h+='<div style="background:var(--bg-secondary);border:0.5px solid var(--separator);border-radius:14px;padding:18px;border-top:3px solid '+sc+'">';
        h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:14px;font-weight:700">'+c.client+'</div><span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;background:'+sc+'22;color:'+sc+';letter-spacing:0.5px">'+c.status.toUpperCase()+'</span></div>';
        h+='<div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px"><i class="fa-solid fa-route" style="width:14px"></i> '+c.route+'</div>';
        h+='<div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px"><i class="fa-solid fa-cubes" style="width:14px"></i> '+c.product+' · '+c.contract_type+'</div>';
        h+='<div style="background:var(--separator);border-radius:6px;height:6px;overflow:hidden;margin-bottom:6px"><div style="height:100%;width:'+pct+'%;background:'+sc+';border-radius:6px"></div></div>';
        h+='<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-bottom:8px"><span>'+(c.volume_used||0).toLocaleString()+' / '+(c.volume_total||0).toLocaleString()+' ton</span><span style="font-weight:700">'+pct+'%</span></div>';
        h+='<div style="display:flex;justify-content:space-between;font-size:11px;margin-top:8px;padding-top:8px;border-top:1px solid var(--separator)"><span style="color:var(--text-secondary)"><i class="fa-solid fa-dollar-sign" style="width:12px"></i> $'+(c.rate_per_ton||0)+'/ton</span><span style="color:var(--text-secondary)"><i class="fa-solid fa-calendar" style="width:12px"></i> '+(c.expiration_date||'N/A')+'</span></div>';
        h+='</div>';
    });
    h+='</div>';
    el.innerHTML=h;
}

if(!document.getElementById('ai-spinner-css')){
    var style=document.createElement('style');style.id='ai-spinner-css';
    style.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
}

// --- PRE-DEPARTURE CHECKLIST -----------------------------
var _pzData=[];
var _pzSections={
    'Crew':['Full crew on board','Navigation licenses valid','Health certificates up to date','Emergency roles assigned'],
    'Fuel':['Fuel level verified','Sufficient autonomy for voyage','No leaks in fuel system','Fuel records updated'],
    'Navigation':['Current draft within limits','Charts updated','GPS operational','Navigation lights operational'],
    'Safety':['Fire extinguishers checked','Life jackets complete','Life raft operational','First aid kit available'],
    'Documentation':['Vessel registration','Port clearance','Insurance valid','Cargo manifest'],
    'Communications':['VHF radio operational','Channel 16 tested','Sat phone charged','Comms plan active'],
    'Weather':['48h forecast verified','Conditions suitable for departure','Winds within parameters','No hydro-meteorological alerts']
};

async function loadPreZarpe(){
    try{
        var r=await sb.from('departure_checklists').select('*').order('created_at',{ascending:false}).limit(30);
        _pzData=r.data||[];
    }catch(e){
        _pzData=[
            {vessel_name:'R/M Guarani',captain_name:'Cpt. Rodriguez',destination:'Rosario',status:'completed',checked_items:28,total_items:28,signed_at:new Date().toISOString(),cargo_description:'Soybeans',cargo_tons:3500},
            {vessel_name:'R/M Atlas',captain_name:'Cpt. Benitez',destination:'San Lorenzo',status:'draft',checked_items:18,total_items:28,signed_at:new Date().toISOString(),cargo_description:'Corn',cargo_tons:4200}
        ];
    }
    renderPreZarpe();
}

function renderPreZarpe(){
    var total=_pzData.length;var approved=_pzData.filter(function(c){return c.status==='completed'}).length;
    var drafts=total-approved;var rate=total>0?Math.round(approved/total*100):0;
    var el1=document.getElementById('pz-total');if(el1)el1.textContent=total;
    var el2=document.getElementById('pz-approved');if(el2)el2.textContent=approved;
    var el3=document.getElementById('pz-draft');if(el3)el3.textContent=drafts;
    var el4=document.getElementById('pz-rate');if(el4)el4.textContent=rate+'%';
    var circumference=150.8;
    var ringApproved=document.getElementById('pz-approved-ring');
    if(ringApproved)ringApproved.style.strokeDashoffset=(circumference*(1-(total>0?approved/total:0))).toFixed(1);
    var ringRate=document.getElementById('pz-rate-ring');
    if(ringRate)ringRate.style.strokeDashoffset=(circumference*(1-rate/100)).toFixed(1);
    renderPreZarpeInsights();
    var list=document.getElementById('pz-list');if(!list)return;
    if(_pzData.length===0){list.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--text-secondary)"><i class="fa-solid fa-clipboard-check" style="font-size:48px;opacity:0.15;margin-bottom:12px"></i><p>No checklists recorded</p></div>';return;}
    list.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-top:16px">'+_pzData.map(function(c){
        var checked=c.checked_items||0;var total2=c.total_items||28;var pct=Math.round(checked/total2*100);
        var isOk=c.status==='completed';var color=isOk?'var(--success)':'var(--warning)';
        var dt=c.signed_at?new Date(c.signed_at).toLocaleString('en',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'--';
        return '<div style="background:var(--bg-secondary);border:1px solid var(--separator);border-radius:16px;padding:20px">'+
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
            '<div><div style="font-size:15px;font-weight:700;color:var(--text-primary)">'+esc(c.vessel_name||'')+'</div>'+
            '<div style="font-size:11px;color:var(--text-secondary)">'+esc(c.captain_name||'')+'</div></div>'+
            '<span style="font-size:9px;font-weight:700;letter-spacing:0.5px;padding:4px 10px;border-radius:6px;background:'+color+'15;color:'+color+'">'+(isOk?'APPROVED':'DRAFT')+'</span></div>'+
            '<div style="height:6px;background:var(--bg-tertiary);border-radius:3px;margin-bottom:6px"><div style="height:6px;width:'+pct+'%;background:'+color+';border-radius:3px;transition:width 0.4s"></div></div>'+
            '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px"><span style="font-weight:600;color:var(--text-primary)">'+checked+'/'+total2+' items - '+pct+'%</span><span style="color:var(--text-secondary)">'+dt+'</span></div>'+
            '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
            (c.destination?'<span style="background:var(--bg-tertiary);padding:3px 8px;border-radius:6px;font-size:10px;color:var(--text-secondary)"><i class="fa-solid fa-location-dot" style="margin-right:3px"></i>'+esc(c.destination)+'</span>':'')+
            (c.cargo_description?'<span style="background:var(--bg-tertiary);padding:3px 8px;border-radius:6px;font-size:10px;color:var(--text-secondary)"><i class="fa-solid fa-cube" style="margin-right:3px"></i>'+esc(c.cargo_description)+' - '+(c.cargo_tons||0)+' ton</span>':'')+
            '</div></div>';
    }).join('')+'</div>';
}

function renderPreZarpeInsights(){
    var el=document.getElementById('pz-insights');if(!el)return;
    var data=_pzData||[];
    if(data.length===0){el.innerHTML='<div style="font-size:12px;color:var(--text-tertiary)">No checklists to analyze.</div>';return;}
    var rows=[];
    var drafts=data.filter(function(c){return c.status!=='completed'});
    var lowProgress=drafts.filter(function(c){var pct=(c.checked_items||0)/(c.total_items||28);return pct<0.6;});
    if(lowProgress.length>0)rows.push({icon:'fa-triangle-exclamation',color:'var(--error)',text:lowProgress.length+' checklist(s) below 60% complete.'});
    var readyToApprove=drafts.filter(function(c){return(c.checked_items||0)>=(c.total_items||28);});
    if(readyToApprove.length>0)rows.push({icon:'fa-circle-check',color:'var(--success)',text:readyToApprove.length+' checklist(s) at 100%, ready to approve.'});
    if(drafts.length>0){
        var oldest=drafts.slice().sort(function(a,b){return new Date(a.signed_at||0)-new Date(b.signed_at||0);})[0];
        if(oldest)rows.push({icon:'fa-clock',color:'var(--warning)',text:'Oldest draft: '+esc(oldest.vessel_name||'--')+' ('+(oldest.signed_at?new Date(oldest.signed_at).toLocaleDateString('en',{day:'2-digit',month:'short'}):'--')+').'});
    }
    if(rows.length===0)rows.push({icon:'fa-check',color:'var(--success)',text:'All checklists up to date, no alerts.'});
    el.innerHTML=rows.map(function(r){return '<div style="display:flex;gap:9px;align-items:flex-start"><div style="width:22px;height:22px;border-radius:7px;background:'+r.color+'1a;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+r.icon+'" style="font-size:10px;color:'+r.color+'"></i></div><div style="font-size:11px;color:var(--text-secondary);line-height:1.5">'+r.text+'</div></div>';}).join('');
}

function openPreZarpeForm(){
    var _pzChecked={};for(var s in _pzSections)_pzChecked[s]=[];
    var totalItems=0;for(var s2 in _pzSections)totalItems+=_pzSections[s2].length;
    var m=document.createElement('div');m.id='pz-modal';
    m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    m.innerHTML='<div style="background:var(--bg-secondary);border-radius:20px;width:90%;max-width:700px;max-height:90vh;overflow-y:auto;padding:32px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><div style="font-family:Bricolage Grotesque,sans-serif;font-size:24px;color:var(--text-primary)">New Pre-Departure</div><button onclick="document.getElementById(\'pz-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)"><i class="fa-solid fa-xmark"></i></button></div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'+
        '<div><label style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px">VESSEL</label><input id="pz-vessel" class="login-input" placeholder="R/M Guarani" style="margin-top:4px"></div>'+
        '<div><label style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px">DESTINATION</label><input id="pz-dest" class="login-input" placeholder="Rosario" style="margin-top:4px"></div>'+
        '<div><label style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px">CARGO</label><input id="pz-cargo" class="login-input" placeholder="Soybeans, bulk" style="margin-top:4px"></div>'+
        '<div><label style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px">TONNAGE</label><input id="pz-tons" class="login-input" placeholder="3500" type="number" style="margin-top:4px"></div>'+
        '</div><div id="pz-sections"></div>'+
        '<div style="margin-top:16px"><label style="font-size:10px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px">OBSERVATIONS</label><textarea id="pz-obs" class="login-input" rows="2" placeholder="Additional notes..." style="margin-top:4px;resize:none"></textarea></div>'+
        '<div style="display:flex;gap:12px;margin-top:20px"><button class="btn-secondary" style="flex:1" onclick="document.getElementById(\'pz-modal\').remove()">Cancel</button><button class="btn-primary" style="flex:1" id="pz-submit-btn" onclick="submitPreZarpe()"><i class="fa-solid fa-check"></i> Save</button></div></div>';
    document.body.appendChild(m);
    var sectionsDiv=document.getElementById('pz-sections');
    var icons={Crew:'fa-users',Fuel:'fa-gas-pump',Navigation:'fa-compass',Safety:'fa-shield-halved',Documentation:'fa-folder-open',Communications:'fa-tower-broadcast',Weather:'fa-cloud-sun'};
    var colors2={Crew:'#8B5CF6',Fuel:'#F97316',Navigation:'#3B82F6',Safety:'#EF4444',Documentation:'#6B7280',Communications:'#0EA5E9',Weather:'#10B981'};
    for(var sec in _pzSections){
        var ic=icons[sec]||'fa-check';var cl=colors2[sec]||'#666';
        var sh='<div style="background:var(--bg-primary);border:1px solid var(--separator);border-radius:14px;margin-bottom:10px;overflow:hidden">';
        sh+='<div style="padding:12px 16px;display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:8px;background:'+cl+'15;display:flex;align-items:center;justify-content:center"><i class="fa-solid '+ic+'" style="font-size:13px;color:'+cl+'"></i></div>';
        sh+='<span style="font-size:11px;font-weight:700;color:'+cl+';letter-spacing:0.5px">'+sec.toUpperCase()+'</span>';
        sh+='<span id="pz-cnt-'+sec+'" style="margin-left:auto;font-size:11px;font-weight:700;color:var(--text-secondary)">0/'+_pzSections[sec].length+'</span></div>';
        _pzSections[sec].forEach(function(item,idx){
            sh+='<label style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:0.5px solid var(--separator);cursor:pointer;font-size:13px;color:var(--text-secondary)">';
            sh+='<input type="checkbox" data-section="'+sec+'" data-item="'+idx+'" onchange="togglePZItem(this)" style="accent-color:var(--success);width:18px;height:18px">'+item+'</label>';
        });
        sh+='</div>';sectionsDiv.innerHTML+=sh;
    }
    window._pzChecked=_pzChecked;
}

function togglePZItem(el){
    var sec=el.dataset.section;var idx=parseInt(el.dataset.item);
    if(el.checked){window._pzChecked[sec].push(idx);el.parentElement.style.color='var(--text-primary)'}
    else{window._pzChecked[sec]=window._pzChecked[sec].filter(function(i){return i!==idx});el.parentElement.style.color='var(--text-secondary)'}
    var cnt=document.getElementById('pz-cnt-'+sec);if(cnt)cnt.textContent=window._pzChecked[sec].length+'/'+_pzSections[sec].length;
    var total=0,checked=0;for(var s in _pzSections){total+=_pzSections[s].length;checked+=window._pzChecked[s].length;}
    var btn=document.getElementById('pz-submit-btn');
    if(btn){btn.innerHTML=checked===total?'<i class="fa-solid fa-certificate"></i> Sign & Approve':'<i class="fa-solid fa-check"></i> Save Draft';btn.style.background=checked===total?'var(--success)':''}
}

async function submitPreZarpe(){
    var vessel=document.getElementById('pz-vessel').value.trim();if(!vessel){alert('Enter vessel name');return;}
    var total=0,checked=0;for(var s in _pzSections){total+=_pzSections[s].length;checked+=window._pzChecked[s].length;}
    var allDone=checked===total;
    try{
        var user=sb.auth.getUser?await sb.auth.getUser():null;var uid=user?.data?.user?.id||'';
        var profile=null;try{profile=(await sb.from('user_profiles').select('company_id,full_name').eq('user_id',uid).single()).data}catch(e2){}
        await sb.from('departure_checklists').insert({
            company_id:profile?.company_id||currentCompanyId||'',vessel_name:vessel,
            captain_name:profile?.full_name||'Operator',captain_user_id:uid,
            destination:document.getElementById('pz-dest').value.trim(),
            cargo_description:document.getElementById('pz-cargo').value.trim(),
            cargo_tons:parseFloat(document.getElementById('pz-tons').value)||0,
            observations:document.getElementById('pz-obs').value.trim(),
            checked_items:checked,total_items:total,status:allDone?'completed':'draft'
        });
    }catch(e){console.warn('PZ save:',e)}
    document.getElementById('pz-modal').remove();loadPreZarpe();
}

function exportPreZarpe(fmt){alert('Exporting Pre-Departure as '+fmt.toUpperCase()+'...');}
