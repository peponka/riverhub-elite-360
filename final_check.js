const fs = require('fs');
const c = fs.readFileSync('public/fluvia-en.js', 'utf8');

// Check specifically for mojibake indicators
// True mojibake: Ã followed by chars that indicate double-encoding
const mojiPatterns = [
  { re: /ÃƒÆ'/, name: '3-level prefix' },
  { re: /ÃƒÂ/, name: '2-level ÃƒÂ' },
  { re: /Ã‚Â/, name: '2-level Ã‚Â' },
  { re: /Ã¡/, name: 'á mojibake (1-level)' },
  { re: /Ã©/, name: 'é mojibake (1-level)' },
  { re: /Ã­/, name: 'í mojibake (1-level)' },
  { re: /Ã³/, name: 'ó mojibake (1-level)' },
  { re: /Ãº/, name: 'ú mojibake (1-level)' },
  { re: /Ã±/, name: 'ñ mojibake (1-level)' },
  { re: /Ã‹/, name: 'Ã‹ sequence' },
  { re: /ÃƒÂ°/, name: 'emoji mojibake ÃƒÂ°' },
  { re: /Ã¢â‚¬/, name: 'â€ mojibake' },
];

let total = 0;
for (const { re, name } of mojiPatterns) {
  const matches = c.match(new RegExp(re.source, 'g')) || [];
  if (matches.length > 0) {
    console.log(`${matches.length}x ${name}: ${JSON.stringify(re.source)}`);
    total += matches.length;
  }
}

if (total === 0) {
  console.log('✅ No mojibake patterns found! File is clean.');
} else {
  console.log(`\n❌ Total mojibake hits: ${total}`);

  // Show context for each
  const lines = c.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { re } of mojiPatterns) {
      if (re.test(line)) {
        const snippet = line.trim().substring(0, 120);
        console.log(`  Line ${i+1}: ${JSON.stringify(snippet)}`);
        break;
      }
    }
  }
}
