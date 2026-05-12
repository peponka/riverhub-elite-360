const fs = require('fs');
const c = fs.readFileSync('public/fluvia-en.js', 'utf8');

const patterns = ['Ãƒ','Ã‚','â€','Ã¢','Ã','Ã…','Ã¡','Ã©','Ã­','Ã³','Ãº','Ã±'];
for (const p of patterns) {
  const count = (c.split(p).length - 1);
  if (count > 0) console.log(count, 'x', JSON.stringify(p));
}

console.log('\n--- Sample contexts with remaining Ã patterns ---');
const lines = c.split('\n');
let shown = 0;
for (let i = 0; i < lines.length && shown < 20; i++) {
  if (lines[i].includes('Ã') && !lines[i].startsWith('//')) {
    console.log('Line', i+1, ':', JSON.stringify(lines[i].trim().substring(0,120)));
    shown++;
  }
}
