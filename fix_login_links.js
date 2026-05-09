const fs = require('fs');

// Fix index-en.html
let en = fs.readFileSync('public/index-en.html', 'utf8');
en = en.split('href="fluvia-en.html"').join('href="fluvia-en.html?logout=true"');
fs.writeFileSync('public/index-en.html', en);

// Fix index.html (Spanish)
let es = fs.readFileSync('public/index.html', 'utf8');
es = es.split('href="fluvia.html"').join('href="fluvia.html?logout=true"');
fs.writeFileSync('public/index.html', es);

console.log('Login links now include ?logout=true');