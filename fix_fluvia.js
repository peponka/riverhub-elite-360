const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

// remove translator block
const transStart = txt.indexOf('// --- AUTOMATIC ENGLISH TRANSLATOR ---');
const transEnd = txt.indexOf('// ------------------------------------') + 39;
if (transStart > -1) {
    txt = txt.substring(0, transStart) + txt.substring(transEnd);
}

// remove monkey patch block
const mpStart = txt.indexOf('// MONKEY PATCH SUPABASE');
const mpEnd = txt.indexOf('return queryBuilder;\n};') + 23;
if (mpStart > -1) {
    txt = txt.substring(0, mpStart) + txt.substring(mpEnd);
}

fs.writeFileSync('public/fluvia-en.js', txt);
console.log('Fixed fluvia-en.js by removing bad monkey patch');
