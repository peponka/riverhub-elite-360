const fs = require('fs');

// Fix English
let en = fs.readFileSync('public/fluvia-en.js', 'utf8');

const oldSuccessEN = `var modal = document.querySelector('.modal-card');
        modal.innerHTML='<div style="padding:24px;text-align:center;"><i class="fa-solid fa-circle-check" style="font-size:48px;color:var(--success,#10b981);margin-bottom:16px;"></i><h3 style="font-family:Newsreader,serif;font-size:1.5rem;margin-bottom:8px;">Password Changed!</h3><p style="color:var(--text-secondary);font-size:13px;">Your password has been updated successfully.</p><button onclick="document.getElementById(\\'modal-overlay\\').style.display=\\'none\\';window.history.replaceState({},\\'\\',window.location.pathname);" class="btn-primary" style="margin-top:16px;padding:12px 32px;">Continue to Dashboard</button></div>';`;

const newSuccessEN = `var card = document.querySelector('.login-card');
        if(card) card.innerHTML='<div style="text-align:center;padding:40px 0;"><i class="fa-solid fa-circle-check" style="font-size:64px;color:var(--success,#10b981);margin-bottom:20px;display:block;"></i><h1 class="login-title" style="margin-bottom:8px;">Password<br><em>Changed!</em></h1><p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">Your password has been updated successfully.</p><button class="login-btn" onclick="window.location.href=window.location.pathname;">Continue to Dashboard</button></div>';`;

en = en.replace(oldSuccessEN, newSuccessEN);
fs.writeFileSync('public/fluvia-en.js', en);

// Fix Spanish
let es = fs.readFileSync('public/fluvia.js', 'utf8');

const oldSuccessES = `var modal = document.querySelector('.modal-card');
        modal.innerHTML='<div style="padding:24px;text-align:center;"><i class="fa-solid fa-circle-check" style="font-size:48px;color:var(--success,#10b981);margin-bottom:16px;"></i><h3 style="font-family:Newsreader,serif;font-size:1.5rem;margin-bottom:8px;">¡Contraseña Cambiada!</h3><p style="color:var(--text-secondary);font-size:13px;">Tu contraseña fue actualizada exitosamente.</p><button onclick="document.getElementById(\\'modal-overlay\\').style.display=\\'none\\';window.history.replaceState({},\\'\\',window.location.pathname);" class="btn-primary" style="margin-top:16px;padding:12px 32px;">Continuar al Dashboard</button></div>';`;

const newSuccessES = `var card = document.querySelector('.login-card');
        if(card) card.innerHTML='<div style="text-align:center;padding:40px 0;"><i class="fa-solid fa-circle-check" style="font-size:64px;color:var(--success,#10b981);margin-bottom:20px;display:block;"></i><h1 class="login-title" style="margin-bottom:8px;">Contraseña<br><em>Cambiada!</em></h1><p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">Tu contraseña fue actualizada exitosamente.</p><button class="login-btn" onclick="window.location.href=window.location.pathname;">Continuar al Dashboard</button></div>';`;

es = es.replace(oldSuccessES, newSuccessES);
fs.writeFileSync('public/fluvia.js', es);

try {
    require('child_process').execSync('node --check public/fluvia-en.js', {stdio:'pipe'});
    require('child_process').execSync('node --check public/fluvia.js', {stdio:'pipe'});
    console.log('Both files SYNTAX OK');
} catch(e) {
    console.log('ERROR:', e.stderr.toString().substring(0,300));
}