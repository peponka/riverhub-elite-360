const fs = require('fs');
const path = require('path');

const MOJI_RE = /Ã[ƒ‚¡©­³ºÂ±‹…¢]|â€[œ™š]|ÃƒÆ'/g;

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full, results);
    } else if (/\.(js|html|json|sql)$/.test(e.name)) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        const matches = content.match(MOJI_RE) || [];
        if (matches.length > 0) {
          results.push({ file: full, count: matches.length });
        }
      } catch(e2) {}
    }
  }
  return results;
}

const results = scanDir('.');
if (results.length === 0) {
  console.log('✅ No mojibake found in any file.');
} else {
  console.log('Files with mojibake:');
  results.forEach(r => console.log(`  ${r.count}x  ${r.file}`));
}
