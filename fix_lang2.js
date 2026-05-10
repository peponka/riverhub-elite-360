const fs = require('fs');
let content = fs.readFileSync('public/fluvia.js', 'utf8');

// Agregar al diccionario
content = content.replace(/'cargo': 'Carga',/g, "'cargo': 'Carga',\n        'captain': 'Capitán',\n        'engineer': 'Maquinista',\n        'deckhand': 'Marinero',\n        'cook': 'Cocinero',\n        'helmsman': 'Timonel',\n        'collision': 'Colisión',\n        'grounding': 'Encalladura',\n        'spill': 'Derrame',\n        'fire': 'Incendio',\n        'medical': 'Médico',");

// Chip type
content = content.replace(/\(v\.type\|\|v\.vessel_type\|\|'BARCAZA'\)\.toUpperCase\(\)/g, "trad(v.type||v.vessel_type||'BARCAZA').toUpperCase()");

// Role
content = content.replace(/\(c\.role\|\|''\)/g, "trad(c.role||'')");

// Incident severity & type
content = content.replace(/sev\.toUpperCase\(\)/g, "trad(sev).toUpperCase()");
content = content.replace(/\(det\.type\|\|''\)/g, "trad(det.type||'')");

fs.writeFileSync('public/fluvia.js', content, 'utf8');
console.log('fluvia.js actualizado de nuevo.');
