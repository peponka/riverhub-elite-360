const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

const old = `(async function checkSession(){
    var session = await sb.auth.getSession();`;

const rep = `(async function checkSession(){
    if(window.location.search.includes('logout=true')){
        await sb.auth.signOut();
        window.history.replaceState({}, '', window.location.pathname);
        document.getElementById('login-screen').style.display='flex';
        document.getElementById('app-shell').style.display='none';
        return;
    }
    var session = await sb.auth.getSession();`;

txt = txt.replace(old, rep);
fs.writeFileSync('public/fluvia-en.js', txt);

// Verify syntax
try {
    require('child_process').execSync('node --check public/fluvia-en.js', {stdio:'pipe'});
    console.log('DONE - logout=true added, syntax OK');
} catch(e) {
    console.log('SYNTAX ERROR:', e.stderr.toString().substring(0,200));
}