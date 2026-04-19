/**
 * FLUVIA BUNDLE REBUILD — SAFE VERSION
 * Solo reemplaza la sección de MÓDULOS dentro del bundle existente
 * NO toca los globals (theme.css, global.css, etc.)
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = 'c:/Users/pepeq/OneDrive/Desktop/RIverhub/public';
const MODULES_DIR = path.join(PUBLIC, 'css', 'modules');
const BUNDLE_PATH = path.join(PUBLIC, 'css', 'elite-bundle.css');

// 1. Read the current bundle
let bundle = fs.readFileSync(BUNDLE_PATH, 'utf8');

// 2. Find where the first module starts in the bundle
// Modules are marked with /* ===== modules/xxx.css ===== */ or /* ===== css/modules/xxx.css ===== */
const moduleStartRegex = /\/\* =====\s+(css\/)?modules\//;
const firstModuleMatch = bundle.search(moduleStartRegex);

if (firstModuleMatch === -1) {
    console.log('⚠️ No se encontraron módulos en el bundle. Reconstruyendo SOLO módulos...');
    // Append modules at the end
} else {
    // Keep ONLY the global portion (everything before first module)
    bundle = bundle.substring(0, firstModuleMatch);
    console.log(`✅ Globals preservados (${(bundle.length / 1024).toFixed(1)} KB)`);
}

// 3. Read ALL module CSS files
const moduleFiles = fs.readdirSync(MODULES_DIR)
    .filter(f => f.endsWith('.css'))
    .sort();

console.log(`📦 Inyectando ${moduleFiles.length} módulos Fluvia...`);

let modulesCSS = '\n/* ============================== */\n';
modulesCSS += '/* FLUVIA MODULES (Auto-rebuilt)  */\n';
modulesCSS += '/* ============================== */\n';

for (const file of moduleFiles) {
    const full = path.join(MODULES_DIR, file);
    const content = fs.readFileSync(full, 'utf8');
    modulesCSS += `\n/* ===== modules/${file} ===== */\n${content}\n`;
    console.log(`  ✅ modules/${file}`);
}

// 4. Combine
const finalBundle = bundle + modulesCSS;

// 5. Write
fs.writeFileSync(BUNDLE_PATH, finalBundle, 'utf8');

const sizeKB = (Buffer.byteLength(finalBundle) / 1024).toFixed(1);
console.log(`\n🎉 Bundle actualizado: css/elite-bundle.css (${sizeKB} KB)`);
console.log(`   Globals preservados + ${moduleFiles.length} módulos Fluvia inyectados`);
