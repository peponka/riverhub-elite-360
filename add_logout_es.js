const fs = require('fs');
let txt = fs.readFileSync('public/fluvia.js', 'utf8');

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

if (txt.includes(old)) {
    txt = txt.replace(old, rep);
    fs.writeFileSync('public/fluvia.js', txt);
    console.log('Added ?logout=true to fluvia.js (ES)');
} else {
    console.log('Pattern not found in fluvia.js');
}