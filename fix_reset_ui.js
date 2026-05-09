const fs = require('fs');

// Fix English version
let en = fs.readFileSync('public/fluvia-en.js', 'utf8');

const oldEN = `// PASSWORD RESET HANDLER - detect recovery token in URL
(function detectPasswordReset(){
    var hash = window.location.hash;
    if(hash && hash.includes('type=recovery')){
        // Wait for Supabase to process the token, then show change password modal
        setTimeout(function(){
            var overlay = document.getElementById('modal-overlay');
            var modal = document.querySelector('.modal-card');
            if(overlay && modal){
                modal.innerHTML = '<div style="padding:24px"><h3 style="font-family:Newsreader,serif;font-size:1.8rem;margin-bottom:8px;">Reset<br><em>Password.</em></h3>'+
                    '<p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">Enter your new password below.</p>'+
                    '<label style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:var(--text-secondary);display:block;margin-bottom:6px;">NEW PASSWORD</label>'+
                    '<input type="password" id="new-password-input" style="width:100%;padding:12px;border:1px solid var(--separator);border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;" placeholder="Minimum 6 characters">'+
                    '<label style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:var(--text-secondary);display:block;margin-bottom:6px;">CONFIRM PASSWORD</label>'+
                    '<input type="password" id="confirm-password-input" style="width:100%;padding:12px;border:1px solid var(--separator);border-radius:8px;font-size:14px;margin-bottom:16px;box-sizing:border-box;" placeholder="Repeat password">'+
                    '<div id="reset-pw-error" style="display:none;color:var(--error);font-size:12px;margin-bottom:12px;font-weight:600;"></div>'+
                    '<button onclick="doChangePassword()" class="btn-primary" style="width:100%;padding:14px;font-size:14px;font-weight:700;">Change Password</button></div>';
                overlay.style.display='flex';
            }
        }, 1500);
    }
})();`;

const newEN = `// PASSWORD RESET HANDLER - detect recovery token in URL
(function detectPasswordReset(){
    var hash = window.location.hash;
    if(hash && hash.includes('type=recovery')){
        setTimeout(function(){
            // Hide dashboard, show full-screen reset form like login
            document.getElementById('app-shell').style.display='none';
            var screen = document.getElementById('login-screen');
            screen.style.display='flex';
            screen.querySelector('.login-card').innerHTML = '<div class="login-brand"><img src="img/fluvia-logo.jpg" alt="FluviaFleet" style="width:64px;height:64px;border-radius:50%;object-fit:cover"><span style="font-family:Newsreader,serif;font-size:3.2rem;font-weight:400;color:var(--text-primary);letter-spacing:-0.01em">FluviaFleet</span></div>'+
                '<h1 class="login-title">Reset<br><em>Password.</em></h1>'+
                '<p class="login-sub">ENTER YOUR NEW PASSWORD</p>'+
                '<div id="reset-pw-error" style="display:none;font-size:12px;margin:12px 0;font-weight:600;"></div>'+
                '<label class="login-label">NEW PASSWORD</label>'+
                '<input type="password" id="new-password-input" class="login-input" placeholder="Minimum 6 characters">'+
                '<label class="login-label">CONFIRM PASSWORD</label>'+
                '<input type="password" id="confirm-password-input" class="login-input" placeholder="Repeat password">'+
                '<button class="login-btn" onclick="doChangePassword()">Change Password</button>'+
                '<div style="margin-top:24px;border-top:0.5px solid var(--separator);padding-top:16px;"><p class="login-footer">Paraguay-Parana Waterway — FluviaFleet</p></div>';
        }, 1000);
    }
})();`;

en = en.replace(oldEN, newEN);
fs.writeFileSync('public/fluvia-en.js', en);

// Fix Spanish version
let es = fs.readFileSync('public/fluvia.js', 'utf8');

const oldES = `// PASSWORD RESET HANDLER
(function detectPasswordReset(){
    var hash = window.location.hash;
    if(hash && hash.includes('type=recovery')){
        setTimeout(function(){
            var overlay = document.getElementById('modal-overlay');
            var modal = document.querySelector('.modal-card');
            if(overlay && modal){
                modal.innerHTML = '<div style="padding:24px"><h3 style="font-family:Newsreader,serif;font-size:1.8rem;margin-bottom:8px;">Cambiar<br><em>Contraseña.</em></h3>'+
                    '<p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">Ingresá tu nueva contraseña.</p>'+
                    '<label style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:var(--text-secondary);display:block;margin-bottom:6px;">NUEVA CONTRASEÑA</label>'+
                    '<input type="password" id="new-password-input" style="width:100%;padding:12px;border:1px solid var(--separator);border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;" placeholder="Mínimo 6 caracteres">'+
                    '<label style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:var(--text-secondary);display:block;margin-bottom:6px;">CONFIRMAR CONTRASEÑA</label>'+
                    '<input type="password" id="confirm-password-input" style="width:100%;padding:12px;border:1px solid var(--separator);border-radius:8px;font-size:14px;margin-bottom:16px;box-sizing:border-box;" placeholder="Repetir contraseña">'+
                    '<div id="reset-pw-error" style="display:none;color:var(--error);font-size:12px;margin-bottom:12px;font-weight:600;"></div>'+
                    '<button onclick="doChangePassword()" class="btn-primary" style="width:100%;padding:14px;font-size:14px;font-weight:700;">Cambiar Contraseña</button></div>';
                overlay.style.display='flex';
            }
        }, 1500);
    }
})();`;

const newES = `// PASSWORD RESET HANDLER
(function detectPasswordReset(){
    var hash = window.location.hash;
    if(hash && hash.includes('type=recovery')){
        setTimeout(function(){
            document.getElementById('app-shell').style.display='none';
            var screen = document.getElementById('login-screen');
            screen.style.display='flex';
            screen.querySelector('.login-card').innerHTML = '<div class="login-brand"><img src="img/fluvia-logo.jpg" alt="FluviaFleet" style="width:64px;height:64px;border-radius:50%;object-fit:cover"><span style="font-family:Newsreader,serif;font-size:3.2rem;font-weight:400;color:var(--text-primary);letter-spacing:-0.01em">FluviaFleet</span></div>'+
                '<h1 class="login-title">Cambiar<br><em>Contraseña.</em></h1>'+
                '<p class="login-sub">INGRESÁ TU NUEVA CONTRASEÑA</p>'+
                '<div id="reset-pw-error" style="display:none;font-size:12px;margin:12px 0;font-weight:600;"></div>'+
                '<label class="login-label">NUEVA CONTRASEÑA</label>'+
                '<input type="password" id="new-password-input" class="login-input" placeholder="Mínimo 6 caracteres">'+
                '<label class="login-label">CONFIRMAR CONTRASEÑA</label>'+
                '<input type="password" id="confirm-password-input" class="login-input" placeholder="Repetir contraseña">'+
                '<button class="login-btn" onclick="doChangePassword()">Cambiar Contraseña</button>'+
                '<div style="margin-top:24px;border-top:0.5px solid var(--separator);padding-top:16px;"><p class="login-footer">Hidrovía Paraguay-Paraná — FluviaFleet</p></div>';
        }, 1000);
    }
})();`;

es = es.replace(oldES, newES);
fs.writeFileSync('public/fluvia.js', es);

// Verify both
try {
    require('child_process').execSync('node --check public/fluvia-en.js', {stdio:'pipe'});
    require('child_process').execSync('node --check public/fluvia.js', {stdio:'pipe'});
    console.log('Both files OK');
} catch(e) {
    console.log('SYNTAX ERROR:', e.stderr.toString().substring(0,300));
}