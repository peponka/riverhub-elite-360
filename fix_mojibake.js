// fix_mojibake.js — SAFE version: ONLY character replacements, zero structural changes
const fs = require('fs');
let c = fs.readFileSync('public/fluvia-en.js', 'utf8');
const before = c.length;
const linesBefore = c.split('\n').length;

// Build the exact mojibake prefix from char codes discovered via byte scan:
// Ã(C3) ƒ(192) Æ(C6) '(2019) Ã(C3) ‚(201A) Â(C2)
const PFX = String.fromCharCode(0xC3, 0x192, 0xC6, 0x2019, 0xC3, 0x201A, 0xC2);

// ═══ Lowercase accents: PFX + char → accent ═══
const accents = [
  ['\u00B3', '\u00F3'],  // ³ → ó
  ['\u00AD', '\u00ED'],  // ­ → í
  ['\u00A1', '\u00E1'],  // ¡ → á
  ['\u00A9', '\u00E9'],  // © → é
  ['\u00BA', '\u00FA'],  // º → ú
  ['\u00B1', '\u00F1'],  // ± → ñ
];
accents.forEach(([from, to]) => {
  const p = PFX + from;
  const n = c.split(p).length - 1;
  if (n > 0) { c = c.split(p).join(to); console.log('  ' + to + ' x' + n); }
});

// ═══ Uppercase: shorter prefix + char ═══
const PFX_SHORT = String.fromCharCode(0xC3, 0x192, 0xC6, 0x2019, 0xC3, 0x201A);
// ÁN (for TRÁNSITO, CAPITÁN)
c = c.split(PFX_SHORT + '\u00C2N').join('\u00C1N');
// ÍA (for METEOROLOGÍA)
c = c.split(PFX_SHORT + '\u00C2A').join('\u00CDA');

// ═══ Middle dot / degree / superscript (dashboard separators) ═══
const PFX_D = String.fromCharCode(0xC3, 0x192, 0xC3, 0x201A, 0xE2, 0x201A, 0xAC, 0x0161, 0xC3, 0x192, 0xC2);
if (c.includes(PFX_D)) {
  c = c.split(PFX_D + '\u00B7').join('\u00B7');  // ·
  c = c.split(PFX_D + '\u00B0').join('\u00B0');  // °
  c = c.split(PFX_D + '\u00B3').join('\u00B3');  // ³
}

// ═══ Em dash ═══
const EM = String.fromCharCode(0xC3, 0x192, 0xC2, 0xA2, 0xC3, 0x201A, 0xAC, 0xE2, 0x201A, 0xAC);
if (c.includes(EM)) c = c.split(EM).join('\u2014');

// ═══ Emoji patterns ═══
// 📅 📊 🔥 etc. — find by prefix C3 192 C2 B0 C3 2026 C2 B8
const EMOJI_PFX = String.fromCharCode(0xC3, 0x192, 0xC2, 0xB0, 0xC3, 0x2026, 0xC2, 0xB8);
if (c.includes(EMOJI_PFX)) {
  // Replace each occurrence: consume until ASCII
  let idx;
  while ((idx = c.indexOf(EMOJI_PFX)) >= 0) {
    let end = idx + EMOJI_PFX.length;
    while (end < c.length && c.charCodeAt(end) > 127 && !' \'\"<>\n'.includes(c[end])) end++;
    // Determine which emoji based on context
    const ctx = c.substring(Math.max(0, idx - 30), idx).toLowerCase();
    let emoji = '📊';
    if (ctx.includes('consumption') || ctx.includes('fuel')) emoji = '🔥';
    else if (ctx.includes('days') || ctx.includes('date') || ctx.includes('calendar')) emoji = '📅';
    else if (ctx.includes('weather') || ctx.includes('clima')) emoji = '🌤️';
    c = c.substring(0, idx) + emoji + c.substring(end);
  }
  console.log('  Emojis fixed');
}

// Gear emoji prefix
const GEAR_PFX = String.fromCharCode(0xC3, 0x192, 0xC2, 0xA2, 0xC3, 0x2026, 0xC2, 0xA1);
if (c.includes(GEAR_PFX)) {
  let idx;
  while ((idx = c.indexOf(GEAR_PFX)) >= 0) {
    let end = idx + GEAR_PFX.length;
    while (end < c.length && c.charCodeAt(end) > 127 && !' \'\"<>\n'.includes(c[end])) end++;
    c = c.substring(0, idx) + '⚙️' + c.substring(end);
  }
  console.log('  Gear emoji fixed');
}

// ═══ Box drawing in comments ═══
// Replace entire mojibake comment lines with clean separators
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trimStart().startsWith('//') && lines[i].includes('\u00C3')) {
    // Extract only ASCII text
    let text = lines[i].replace(/[^\x20-\x7E]/g, '').replace(/^[\s/]+/, '').trim();
    if (text) {
      lines[i] = '// ━━━━━━━━━━ ' + text + ' ━━━━━━━━━━';
    }
  }
}
c = lines.join('\n');

// ═══ SAFETY CHECK ═══
const linesAfter = c.split('\n').length;
if (linesAfter !== linesBefore) {
  console.log('❌ ABORT! Line count changed:', linesBefore, '→', linesAfter);
  process.exit(1);
}

fs.writeFileSync('public/fluvia-en.js', c);
const mojibakeLeft = c.split('\n').filter(l => l.includes('\u00C3')).length;

try {
  require('child_process').execSync('node -c public/fluvia-en.js', { stdio: 'pipe' });
  console.log('\n✅ Syntax OK | Lines: ' + linesAfter + ' (unchanged) | Mojibake lines: ' + mojibakeLeft + ' | Saved: ' + (before - c.length) + ' bytes');
} catch (e) {
  console.log('❌ Syntax error:', e.stderr.toString().substring(0, 200));
}
