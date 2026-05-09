const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

const oldCheck = `(async function checkSession(){
    var session = await sb.auth.getSession();
    if(session.data.session){
        showApp(session.data.session.user);
    } else {
        document.getElementById('login-screen').style.display='flex';
        document.getElementById('app-shell').style.display='none';
    }
})();`;

const newCheck = `(async function checkSession(){
    // Support ?logout=true to force login screen
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
})();`;

if (txt.includes('async function checkSession()')) {
    txt = txt.replace(oldCheck, newCheck);
    fs.writeFileSync('public/fluvia-en.js', txt);
    console.log('Added ?logout=true support');
} else {
    console.log('checkSession not found');
}