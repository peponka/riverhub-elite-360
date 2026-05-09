const fs = require('fs');

// === Add eye toggle to fluvia-en.html ===
let enHtml = fs.readFileSync('public/fluvia-en.html', 'utf8');

// Replace the password input with a wrapper that has the eye icon
enHtml = enHtml.replace(
    '<input type="password" id="login-password" class="login-input" placeholder="Your password">',
    '<div style="position:relative"><input type="password" id="login-password" class="login-input" placeholder="Your password" style="padding-right:44px"><button type="button" onclick="togglePwVis(\'login-password\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'
);
fs.writeFileSync('public/fluvia-en.html', enHtml);
console.log('EN HTML: eye toggle added');

// === Add eye toggle to fluvia.html ===
let esHtml = fs.readFileSync('public/fluvia.html', 'utf8');
esHtml = esHtml.replace(
    '<input type="password" id="login-password" class="login-input" placeholder="Tu contraseña">',
    '<div style="position:relative"><input type="password" id="login-password" class="login-input" placeholder="Tu contraseña" style="padding-right:44px"><button type="button" onclick="togglePwVis(\'login-password\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'
);
fs.writeFileSync('public/fluvia.html', esHtml);
console.log('ES HTML: eye toggle added');

// === Add togglePwVis function to both JS files ===
const toggleFn = `
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
`;

// Add to EN JS
let enJs = fs.readFileSync('public/fluvia-en.js', 'utf8');
const enInsert = enJs.indexOf('let authMode =');
enJs = enJs.substring(0, enInsert) + toggleFn + '\n' + enJs.substring(enInsert);

// Also update the password reset form to include eye icons
enJs = enJs.replace(
    `'<input type="password" id="new-password-input" class="login-input" placeholder="Minimum 6 characters">'`,
    `'<div style="position:relative"><input type="password" id="new-password-input" class="login-input" placeholder="Minimum 6 characters" style="padding-right:44px"><button type="button" onclick="togglePwVis(\\'new-password-input\\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'`
);
enJs = enJs.replace(
    `'<input type="password" id="confirm-password-input" class="login-input" placeholder="Repeat password">'`,
    `'<div style="position:relative"><input type="password" id="confirm-password-input" class="login-input" placeholder="Repeat password" style="padding-right:44px"><button type="button" onclick="togglePwVis(\\'confirm-password-input\\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'`
);
fs.writeFileSync('public/fluvia-en.js', enJs);

// Add to ES JS
let esJs = fs.readFileSync('public/fluvia.js', 'utf8');
const esInsert = esJs.indexOf('let authMode =');
esJs = esJs.substring(0, esInsert) + toggleFn + '\n' + esJs.substring(esInsert);
esJs = esJs.replace(
    `'<input type="password" id="new-password-input" class="login-input" placeholder="Mínimo 6 caracteres">'`,
    `'<div style="position:relative"><input type="password" id="new-password-input" class="login-input" placeholder="Mínimo 6 caracteres" style="padding-right:44px"><button type="button" onclick="togglePwVis(\\'new-password-input\\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'`
);
esJs = esJs.replace(
    `'<input type="password" id="confirm-password-input" class="login-input" placeholder="Repetir contraseña">'`,
    `'<div style="position:relative"><input type="password" id="confirm-password-input" class="login-input" placeholder="Repetir contraseña" style="padding-right:44px"><button type="button" onclick="togglePwVis(\\'confirm-password-input\\',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:4px;" tabindex="-1"><i class="fa-solid fa-eye"></i></button></div>'`
);
fs.writeFileSync('public/fluvia.js', esJs);

// Verify
try {
    require('child_process').execSync('node --check public/fluvia-en.js', {stdio:'pipe'});
    require('child_process').execSync('node --check public/fluvia.js', {stdio:'pipe'});
    console.log('SYNTAX OK both files');
} catch(e) {
    console.log('SYNTAX ERROR:', e.stderr.toString().substring(0,300));
}