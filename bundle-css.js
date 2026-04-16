const fs = require('fs');
const path = require('path');

const cssDir = 'c:/Users/pepeq/OneDrive/Desktop/RIverhub/public';
const appHtmlPath = path.join(cssDir, 'app.html');

let appHtml = fs.readFileSync(appHtmlPath, 'utf8');
// Matches local relative css links like: <link rel="stylesheet" href="css/global.css"> ...
const linkRegex = /<link\s+rel="stylesheet"\s+href="(css\/.*?\.css)[^"]*"\s*(?:\/|)>[ \t]*(?:<!--.*?-->)?\r?\n?/g;

let match;
const cssFiles = [];

// Encontrar todos
while ((match = linkRegex.exec(appHtml)) !== null) {
    cssFiles.push(match[1]);
}

console.log(`Recolectando ${cssFiles.length} modulos de CSS...`);

let bundledCss = '/* RIVERHUB ELITE 360 - BUNDLED CORE CSS */\n';
for (const relPath of cssFiles) {
    const fullPath = path.join(cssDir, relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // DESTROZA EL BLOAT: Quita todos los !important
        content = content.replace(/\s*!important/gi, '');
        
        bundledCss += `\n/* ===== ${relPath} ===== */\n${content}\n`;
    } else {
        console.warn(`Archivo no encontrado: ${fullPath}`);
    }
}

// Guardar el súper-archivo
fs.writeFileSync(path.join(cssDir, 'css', 'elite-bundle.css'), bundledCss, 'utf8');
console.log('Empaquetado y purgado escrito en css/elite-bundle.css!');

// Reemplazar todas las viejas llamadas en app.html
let first = true;
let newHtml = appHtml.replace(linkRegex, () => {
    if (first) {
        first = false;
        return '<link rel="stylesheet" href="css/elite-bundle.css?v=ELITE_PROX_GEN">\n';
    }
    return ''; 
});

fs.writeFileSync(appHtmlPath, newHtml, 'utf8');
console.log('APP.HTML Inyectado y limpiado!');
