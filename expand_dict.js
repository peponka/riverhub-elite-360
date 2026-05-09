const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

// Expand the fetch interceptor dictionary with ALL database content terms
const newEntries = {
    // Crew roles from database
    'Capitán': 'Captain',
    'Timonel': 'Helmsman',
    'Maquinista': 'Engineer',
    'Primer Oficial': 'First Officer',
    'Jefe de Máquinas': 'Chief Engineer',
    'Marinero': 'Seaman',
    'Cocinero': 'Cook',
    'MARINERO': 'SEAMAN',
    'CAPITÁN': 'CAPTAIN',
    'TIMONEL': 'HELMSMAN',
    'MAQUINISTA': 'ENGINEER',
    
    // Maintenance tasks from database
    'Vibración detectada a 1200 RPM': 'Vibration detected at 1200 RPM',
    'Calibración ecosonda - lectura errática': 'Echosounder calibration - erratic reading',
    'Revisión sistema hidráulico timón trimestral': 'Quarterly rudder hydraulic system inspection',
    'Vibración detectada': 'Vibration detected',
    'Calibración ecosonda': 'Echosounder calibration',
    'lectura errática': 'erratic reading',
    'Revisión sistema hidráulico': 'Hydraulic system inspection',
    'timón trimestral': 'quarterly rudder',
    'Sistema de navegación actualizado y calibrado. Todo nominal.': 'Navigation system updated and calibrated. All nominal.',
    'Sistema Automático': 'Automatic System',
    'Condiciones normales de navegación': 'Normal navigation conditions',
    'SIN ALERTAS': 'NO ALERTS',
    'Análisis de condiciones de navegación': 'Navigation conditions analysis',
    
    // Inventory items from database
    'inyector': 'injector',
    'Aceite Motor CAT 15W-40': 'CAT 15W-40 Engine Oil',
    'Filtro aceite CAT 1R-0716': 'CAT 1R-0716 Oil Filter',
    'Cabo de amarre 32mm': '32mm Mooring Line',
    'Pintura antifouling roja': 'Red Antifouling Paint',
    'Chaleco salvavidas SOLAS': 'SOLAS Life Jacket',
    'Bengalas de emergencia': 'Emergency Flares',
    'Grasa marina Mobilgrease': 'Mobilgrease Marine Grease',
    'Electrodo soldadura 7018': '7018 Welding Electrode',
    'Manguera hidráulica 1/2"': '1/2" Hydraulic Hose',
    'Filtro fuel CAT': 'CAT Fuel Filter',
    'Cabullería': 'Cordage',
    'Lubricantes': 'Lubricants',
    'Filtros': 'Filters',
    'Pintura': 'Paint',
    'Seguridad': 'Safety',
    'Hidráulica': 'Hydraulics',
    'Motor': 'Engine',
    
    // Voyage/Activity descriptions from database
    'Posición actual:': 'Current position:',
    'velocidad': 'speed',
    'nudos': 'knots',
    'ETA Rosario:': 'ETA Rosario:',
    'Paso por Corrientes.': 'Passed by Corrientes.',
    'Paso por': 'Passed by',
    'Nivel del río:': 'River level:',
    'Consumo diario:': 'Daily consumption:',
    'Autonomía restante:': 'Remaining autonomy:',
    'Decisión actual:': 'Current decision:',
    'Puerto de Asunción': 'Port of Asunción',
    'Nueva Palmira': 'Nueva Palmira',
    'Concepción': 'Concepción',
    'San Lorenzo': 'San Lorenzo',
    'Corumbá': 'Corumbá',
    'navegación': 'navigation',
    'navegacion': 'navigation',
    'Navegación': 'Navigation',
    'Navegación Km': 'Navigation Km',
    'PERMISO DE NAVEGACIÓN': 'NAVIGATION PERMIT',
    'VENCIDO': 'EXPIRED',
    'NAVEGACIÓN SEGURA': 'SAFE NAVIGATION',
    'EN NAVEGACIÓN': 'IN TRANSIT',
    'HISTORIAL DE NAVEGACIÓN': 'NAVIGATION HISTORY',
    
    // Weather
    'Meteorología': 'Weather',
    'METEOROLOGÍA': 'WEATHER',
    
    // Status labels
    'Activo': 'Active',
    'activo': 'active',
    'En viaje': 'In Transit',
    'en viaje': 'in transit',
    'navegando': 'in transit',
    'mantenimiento': 'maintenance',
    'Mantenimiento': 'Maintenance',
    'en_curso': 'in_progress',
    'entregado': 'delivered',
    'finalizado': 'completed',
    'completado': 'completed',
    
    // Communications  
    'Navegación': 'Navigation',
    'Sistema': 'System',
    
    // Misc
    'Carga de combustible registrada exitosamente': 'Fuel refuel recorded successfully',
    'Carga Terminada': 'Refuel Complete',
    'Guía completa: Documentación requerida por PREFECTURA para navegación en convoy': 'Complete guide: Documentation required by Coast Guard for convoy navigation',
    'Plataforma de gestión para navegación fluvial': 'River navigation management platform',
    'Centro de Recursos': 'Resource Center',
    'Navegación Fluvial, Logística e Hidrovía': 'River Navigation, Logistics and Waterway',
    'Gestión Inteligente de Flotas Fluviales': 'Intelligent River Fleet Management',
    'Plataforma de gestión inteligente de flotas fluviales para la Hidrovía Paraguay-Paraná.': 'Intelligent river fleet management platform for the Paraguay-Parana Waterway.',
};

// Replace the EN_DICT in the fetch interceptor with the expanded version
const dictStart = txt.indexOf("const EN_DICT = {");
const dictEnd = txt.indexOf("};", dictStart) + 2;

if (dictStart > -1) {
    const entries = Object.entries(newEntries).map(([k, v]) => `    '${k}': '${v}'`).join(',\n');
    txt = txt.substring(0, dictStart) + 'const EN_DICT = {\n' + entries + '\n}' + txt.substring(dictEnd);
}

fs.writeFileSync('public/fluvia-en.js', txt);
console.log('Expanded fetch interceptor dictionary with ' + Object.keys(newEntries).length + ' entries.');