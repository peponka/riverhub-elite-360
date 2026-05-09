const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

// Find the dict boundaries precisely: starts with "const EN_DICT = {" and ends with the FIRST "};" after it
// But we need to be careful - find the closing }; that belongs to EN_DICT
const dictStart = txt.indexOf("const EN_DICT = {");
// Find the line with just "};" or "};\r" that closes the dict
let braceCount = 0;
let dictEnd = -1;
for (let i = dictStart + "const EN_DICT = ".length; i < txt.length; i++) {
    if (txt[i] === '{') braceCount++;
    if (txt[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
            dictEnd = i + 1; // include the }
            break;
        }
    }
}

console.log('Dict starts at char', dictStart, 'ends at char', dictEnd);
console.log('Before dict end:', JSON.stringify(txt.substring(dictEnd-20, dictEnd+10)));

const newDict = `const EN_DICT = {
    'navegación': 'navigation',
    'navegacion': 'navigation',
    'Navegación': 'Navigation',
    'combustible': 'fuel',
    'Combustible': 'Fuel',
    'Posición actual': 'Current position',
    'velocidad': 'speed',
    'nudos': 'knots',
    'días': 'days',
    'día': 'day',
    'Paso por': 'Passed by',
    'Nivel del río': 'River level',
    'normal': 'normal',
    'Consumo diario': 'Daily consumption',
    'lts': 'L',
    'Autonomía restante': 'Remaining autonomy',
    'Decisión actual': 'Current decision',
    'ETA Rosario:': 'ETA Rosario:',
    'Remolcador': 'Tugboat',
    'remolcador': 'tugboat',
    'Barcaza': 'Barge',
    'barcaza': 'barge',
    'Empujador': 'Pusher',
    'empujador': 'pusher',
    'Activo': 'Active',
    'activo': 'active',
    'PENDIENTE': 'PENDING',
    'pendiente': 'pending',
    'EN TRÁNSITO': 'IN TRANSIT',
    'COMPLETADO': 'COMPLETED',
    'completado': 'completed',
    'En Servicio': 'In Service',
    'En Dique': 'Dry Dock',
    'embarcado': 'onboard',
    'EMBARCADO': 'ONBOARD',
    'descanso': 'leave',
    'En viaje': 'In Transit',
    'en viaje': 'in transit',
    'navegando': 'in transit',
    'Navegando': 'In Transit',
    'en_viaje': 'in_transit',
    'en_puerto': 'in_port',
    'en_curso': 'in_progress',
    'entregado': 'delivered',
    'finalizado': 'completed',
    'mantenimiento': 'maintenance',
    'Mantenimiento': 'Maintenance',
    'Capitán': 'Captain',
    'capitán': 'captain',
    'CAPITÁN': 'CAPTAIN',
    'Timonel': 'Helmsman',
    'TIMONEL': 'HELMSMAN',
    'Maquinista': 'Engineer',
    'MAQUINISTA': 'ENGINEER',
    'Marinero': 'Seaman',
    'MARINERO': 'SEAMAN',
    'Primer Oficial': 'First Officer',
    'Jefe de Máquinas': 'Chief Engineer',
    'Cocinero': 'Cook',
    'maniobra': 'maneuver',
    'observación': 'observation',
    'observacion': 'observation',
    'incidente': 'incident',
    'Abierto': 'Open',
    'Cerrado': 'Closed',
    'VENCIDO': 'EXPIRED',
    'Vibración detectada a 1200 RPM': 'Vibration detected at 1200 RPM',
    'Vibración detectada': 'Vibration detected',
    'Calibración ecosonda': 'Echosounder calibration',
    'lectura errática': 'erratic reading',
    'Revisión sistema hidráulico timón trimestral': 'Quarterly rudder hydraulic system inspection',
    'Revisión sistema hidráulico': 'Hydraulic system inspection',
    'timón trimestral': 'quarterly rudder',
    'Sistema de navegación actualizado y calibrado. Todo nominal.': 'Navigation system updated and calibrated. All nominal.',
    'Condiciones normales de navegación': 'Normal navigation conditions',
    'Análisis de condiciones de navegación': 'Navigation conditions analysis',
    'Sistema Automático': 'Automatic System',
    'SIN ALERTAS': 'NO ALERTS',
    'Alta': 'High',
    'Media': 'Medium',
    'Baja': 'Low',
    'Crítico': 'Critical',
    'Aceite Motor CAT 15W-40': 'CAT 15W-40 Engine Oil',
    'Filtro aceite CAT 1R-0716': 'CAT 1R-0716 Oil Filter',
    'Cabo de amarre 32mm': '32mm Mooring Line',
    'Pintura antifouling roja': 'Red Antifouling Paint',
    'Chaleco salvavidas SOLAS': 'SOLAS Life Jacket',
    'Bengalas de emergencia': 'Emergency Flares',
    'Grasa marina Mobilgrease': 'Mobilgrease Marine Grease',
    'Electrodo soldadura 7018': '7018 Welding Electrode',
    'Manguera hidráulica': 'Hydraulic Hose',
    'Filtro fuel CAT': 'CAT Fuel Filter',
    'Cabullería': 'Cordage',
    'Lubricantes': 'Lubricants',
    'Filtros': 'Filters',
    'Pintura': 'Paint',
    'Seguridad': 'Safety',
    'Hidráulica': 'Hydraulics',
    'Motor': 'Engine',
    'Eléctrico': 'Electrical',
    'Casco': 'Hull',
    'inyector': 'injector',
    'Meteorología': 'Weather',
    'METEOROLOGÍA': 'WEATHER',
    'Condiciones óptimas': 'Optimal conditions',
    'Sistema': 'System',
    'Carga de combustible registrada exitosamente': 'Fuel refuel recorded successfully',
    'Carga Terminada': 'Refuel Complete',
    'Puerto de Asunción': 'Port of Asunción',
    'Gestión Inteligente de Flotas Fluviales': 'Intelligent River Fleet Management',
    'Guía completa': 'Complete guide',
    'PREFECTURA': 'Coast Guard',
    'Plataforma de gestión': 'Management platform'
}`;

txt = txt.substring(0, dictStart) + newDict + txt.substring(dictEnd);
fs.writeFileSync('public/fluvia-en.js', txt);

// Verify
try {
    require('child_process').execSync('node --check public/fluvia-en.js', {stdio:'pipe'});
    console.log('SYNTAX OK');
} catch(e) {
    console.log('SYNTAX ERROR:', e.stderr.toString().substring(0, 300));
}