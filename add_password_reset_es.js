const fs = require('fs');
let txt = fs.readFileSync('public/fluvia.js', 'utf8');

const resetHandler = `
// PASSWORD RESET HANDLER
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
        var modal = document.querySelector('.modal-card');
        modal.innerHTML='<div style="padding:24px;text-align:center;"><i class="fa-solid fa-circle-check" style="font-size:48px;color:var(--success,#10b981);margin-bottom:16px;"></i><h3 style="font-family:Newsreader,serif;font-size:1.5rem;margin-bottom:8px;">¡Contraseña Cambiada!</h3><p style="color:var(--text-secondary);font-size:13px;">Tu contraseña fue actualizada exitosamente.</p><button onclick="document.getElementById(\\'modal-overlay\\').style.display=\\'none\\';window.history.replaceState({},\\'\\',window.location.pathname);" class="btn-primary" style="margin-top:16px;padding:12px 32px;">Continuar al Dashboard</button></div>';
    }catch(e){
        errDiv.textContent='Error al actualizar contraseña';errDiv.style.display='block';
    }
}
`;

const insertPoint = txt.indexOf("let authMode = 'login';");
if(insertPoint > -1){
    txt = txt.substring(0, insertPoint) + resetHandler + '\n' + txt.substring(insertPoint);
    fs.writeFileSync('public/fluvia.js', txt);
    console.log('Password reset UI added (ES)');
}

try {
    require('child_process').execSync('node --check public/fluvia.js', {stdio:'pipe'});
    console.log('SYNTAX OK');
} catch(e) {
    console.log('SYNTAX ERROR');
}