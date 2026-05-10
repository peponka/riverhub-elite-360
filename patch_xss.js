const fs = require('fs');
let code = fs.readFileSync('public/fluvia.js', 'utf8');

code = code.replace(
    /'<p><strong>' \+ \(m\.sender\|\|'Sistema'\) \+ ':<\/strong> ' \+ \(m\.message\|\|m\.content\|\|''\)/g,
    "'<p><strong>' + esc(m.sender||'Sistema') + ':</strong> ' + esc(m.message||m.content||'')"
);

fs.writeFileSync('public/fluvia.js', code, 'utf8');
console.log('XSS parcheado en fluvia.js');
