const fs = require('fs');
const c = fs.readFileSync('public/fluvia-en.js', 'utf8');

console.log('File size (chars):', c.length);

// Find ANY character above U+00FF in a JS string literal context
let count = 0;
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Look for high-code chars inside string literals (non-emoji range, i.e. U+0100 to U+2FFF)
  const matches = [...line].filter(ch => {
    const cp = ch.codePointAt(0);
    return cp > 0xFF && cp < 0x3000 && cp !== 0x2014 && cp !== 0x2013 && cp !== 0x2019 && cp !== 0x201C && cp !== 0x201D;
  });
  if (matches.length > 0) {
    count++;
    const chars = matches.map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0') + '(' + ch + ')');
    console.log(`Line ${i+1}: ${chars.join(', ')}`);
    console.log('  ', JSON.stringify(line.trim().substring(0, 100)));
  }
}
console.log('\nTotal suspicious lines:', count);
