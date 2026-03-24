// Wrapper script para que PM2 pueda arrancar n8n
const { execSync } = require('child_process');
const path = require('path');

// Buscar n8n en la ruta global de npm
const n8nPath = path.join(process.env.APPDATA, 'npm', 'node_modules', 'n8n', 'bin', 'n8n');

require(n8nPath);
