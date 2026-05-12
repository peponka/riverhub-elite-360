const fs = require('fs');
const c = fs.readFileSync('public/fluvia-en.js', 'utf8');
const lines = c.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check for any Ã followed by non-ASCII or high unicode
  if (/Ã[-￿]/.test(line) || /â€/.test(line)) {
    console.log(`Line ${i+1}:`);
    // Print segments containing the mojibake
    const matches = line.match(/.{0,20}(Ã[-￿]|â€).{0,20}/g) || [];
    matches.forEach(m => {
      const codes = Array.from(m).map(c => 'U+'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')+c).join(' ');
      console.log('  text:', JSON.stringify(m));
      console.log('  codes:', codes);
    });
    console.log();
  }
}
