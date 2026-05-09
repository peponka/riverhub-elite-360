const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

// Add password reset detection after showApp function
const resetHandler = `
// PASSWORD RESET HANDLER - detect recovery token in URL
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
        var modal = document.querySelector('.modal-card');
        modal.innerHTML='<div style="padding:24px;text-align:center;"><i class="fa-solid fa-circle-check" style="font-size:48px;color:var(--success,#10b981);margin-bottom:16px;"></i><h3 style="font-family:Newsreader,serif;font-size:1.5rem;margin-bottom:8px;">Password Changed!</h3><p style="color:var(--text-secondary);font-size:13px;">Your password has been updated successfully.</p><button onclick="document.getElementById(\\'modal-overlay\\').style.display=\\'none\\';window.history.replaceState({},\\'\\',window.location.pathname);" class="btn-primary" style="margin-top:16px;padding:12px 32px;">Continue to Dashboard</button></div>';
    }catch(e){
        errDiv.textContent='Error updating password';errDiv.style.display='block';
    }
}
`;

// Insert after the checkSession IIFE
const insertPoint = txt.indexOf("let authMode = 'login';");
if(insertPoint > -1){
    txt = txt.substring(0, insertPoint) + resetHandler + '\n' + txt.substring(insertPoint);
    fs.writeFileSync('public/fluvia-en.js', txt);
    console.log('Password reset UI added');
} else {
    console.log('Insert point not found');
}

// Verify
try {
    require('child_process').execSync('node --check public/fluvia-en.js', {stdio:'pipe'});
    console.log('SYNTAX OK');
} catch(e) {
    console.log('SYNTAX ERROR:', e.stderr.toString().substring(0,300));
}