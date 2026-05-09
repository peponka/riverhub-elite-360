const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

// Replace the entire EN_DICT with a clean, correct Spanish->English dictionary
const dictStart = txt.indexOf("const EN_DICT = {");
const dictEnd = txt.indexOf("};", dictStart) + 2;

const newDict = `const EN_DICT = {
    // --- Crew Roles ---
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

    // --- Log/Activity types (from DB) ---
    'navegación': 'navigation',
    'navegacion': 'navigation',
    'Navegación': 'Navigation',
    'combustible': 'fuel',
    'Combustible': 'Fuel',
    'maniobra': 'maneuver',
    'Maniobra': 'Maneuver',
    'observación': 'observation',
    'observacion': 'observation',
    'incidente': 'incident',

    // --- Status labels ---
    'Activo': 'Active',
    'activo': 'active',
    'En viaje': 'In Transit',
    'en viaje': 'in transit',
    'En Viaje': 'In Transit',
    'EN VIAJE': 'IN TRANSIT',
    'navegando': 'in transit',
    'Navegando': 'In Transit',
    'en_viaje': 'in_transit',
    'en_puerto': 'in_port',
    'En puerto': 'In Port',
    'en puerto': 'in port',
    'mantenimiento': 'maintenance',
    'Mantenimiento': 'Maintenance',
    'en_curso': 'in_progress',
    'pendiente': 'pending',
    'Pendiente': 'Pending',
    'PENDIENTE': 'PENDING',
    'EN TRÁNSITO': 'IN TRANSIT',
    'COMPLETADO': 'COMPLETED',
    'completado': 'completed',
    'entregado': 'delivered',
    'finalizado': 'completed',
    'embarcado': 'onboard',
    'Embarcado': 'Onboard',
    'EMBARCADO': 'ONBOARD',
    'descanso': 'leave',
    'Abierto': 'Open',
    'Cerrado': 'Closed',
    'En Servicio': 'In Service',
    'En Dique': 'Dry Dock',
    'VENCIDO': 'EXPIRED',

    // --- Vessel types ---
    'Remolcador': 'Tugboat',
    'remolcador': 'tugboat',
    'Barcaza': 'Barge',
    'barcaza': 'barge',
    'Empujador': 'Pusher',
    'empujador': 'pusher',

    // --- Activity descriptions ---
    'Posición actual': 'Current position',
    'Posición actual:': 'Current position:',
    'velocidad': 'speed',
    'nudos': 'knots',
    'días': 'days',
    'día': 'day',
    'Paso por': 'Passed by',
    'Nivel del río': 'River level',
    'Nivel del río:': 'River level:',
    'normal': 'normal',
    'Consumo diario': 'Daily consumption',
    'Consumo diario:': 'Daily consumption:',
    'lts': 'L',
    'Autonomía restante': 'Remaining autonomy',
    'Autonomía restante:': 'Remaining autonomy:',
    'Decisión actual': 'Current decision',
    'Decisión actual:': 'Current decision:',
    'ETA Rosario:': 'ETA Rosario:',

    // --- Maintenance ---
    'Vibración detectada a 1200 RPM': 'Vibration detected at 1200 RPM',
    'Vibración detectada': 'Vibration detected',
    'Calibración ecosonda': 'Echosounder calibration',
    'Calibración ecosonda - lectura errática': 'Echosounder calibration - erratic reading',
    'lectura errática': 'erratic reading',
    'Revisión sistema hidráulico timón trimestral': 'Quarterly rudder hydraulic system inspection',
    'Revisión sistema hidráulico': 'Hydraulic system inspection',
    'timón trimestral': 'quarterly rudder',
    'Sistema de navegación actualizado y calibrado. Todo nominal.': 'Navigation system updated and calibrated. All nominal.',
    'Condiciones normales de navegación': 'Normal navigation conditions',
    'Análisis de condiciones de navegación': 'Navigation conditions analysis',
    'Sistema Automático': 'Automatic System',
    'SIN ALERTAS': 'NO ALERTS',
    'Prioridad': 'Priority',
    'Alta': 'High',
    'Media': 'Medium',
    'Baja': 'Low',
    'Crítico': 'Critical',

    // --- Inventory ---
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
    'General': 'General',
    'inyector': 'injector',

    // --- Weather ---
    'Meteorología': 'Weather',
    'METEOROLOGÍA': 'WEATHER',
    'Condiciones óptimas': 'Optimal conditions',

    // --- Misc ---
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
console.log('Dictionary rebuilt with correct Spanish->English entries');