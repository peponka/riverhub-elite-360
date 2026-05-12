const iconv = require('iconv-lite');
const fs = require('fs');

function decodeWin1252(str) {
  try {
    const bytes = iconv.encode(str, 'win1252');
    return iconv.decode(bytes, 'utf8');
  } catch(e) {
    return null;
  }
}

function fixMojibake(str, maxRounds = 3) {
  let s = str;
  for (let i = 0; i < maxRounds; i++) {
    const decoded = decodeWin1252(s);
    if (!decoded || decoded === s) break;
    s = decoded;
  }
  return s;
}

// Test on the remaining patterns
const samples = [
  'Ã‹â€ ',
  'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å"Ã¢â‚¬Â¦',
  'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å"Ã‹â€ ',
  'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å"Ã¢â‚¬Â°',
  'navegaciÃ³n',
  'Ã¡',
  'Ã­',
];

console.log('--- Decode test ---');
for (const s of samples) {
  console.log(JSON.stringify(s), '→', JSON.stringify(fixMojibake(s)));
}

// Show line 1445 context
const c = fs.readFileSync('public/fluvia-en.js', 'utf8');
const lines = c.split('\n');
const line1445 = lines[1444];
console.log('\n--- Line 1445 (raw) ---');
console.log(line1445.substring(0, 200));

// Apply fix to line and see
const fixed = fixMojibake(line1445);
console.log('\n--- Line 1445 (fixed) ---');
console.log(fixed.substring(0, 200));
