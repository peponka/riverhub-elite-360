const fs = require('fs');
const path = require('path');
const file = 'public/fluvia-en.html';
let content = fs.readFileSync(file, 'utf8');

// Regex replacements to catch everything regardless of slight differences
const replaces = [
    [/Gestion de<br><em>Flota.<\/em>/g, 'Fleet<br><em>Management.</em>'],
    [/Copiloto<br><em>IA.<\/em>/g, 'AI<br><em>Copilot.</em>'],
    [/Armador de<br><em>Convoyes.<\/em>/g, 'Convoy<br><em>Builder.</em>'],
    [/Gestion de<br><em>Viajes.<\/em>/g, 'Trip<br><em>Management.</em>'],
    [/Bitacora<br><em>Digital.<\/em>/g, 'Digital<br><em>Logbook.</em>'],
    [/Canal de<br><em>Communications.<\/em>/g, 'Communications<br><em>Channel.</em>'],
    [/Tripulacion<br><em>&amp; Safety.<\/em>/g, 'Crew<br><em>&amp; Safety.</em>'],
    [/Ordenes de<br><em>Maintenance.<\/em>/g, 'Maintenance<br><em>Orders.</em>'],
    [/Panol de<br><em>Inventario.<\/em>/g, 'Inventory<br><em>Store.</em>'],
    [/Pronostico<br><em>Hidrovia.<\/em>/g, 'Waterway<br><em>Forecast.</em>'],
    [/Reportes &amp;<br><em>Analytics.<\/em>/g, 'Reports &amp;<br><em>Analytics.</em>'],
    [/Calados &amp;<br><em>Hidrometria.<\/em>/g, 'Drafts &amp;<br><em>Hydrometry.</em>'],
    [/Registro de<br><em>Incidents.<\/em>/g, 'Incident<br><em>Log.</em>'],
    [/Briefing<br><em>Diario.<\/em>/g, 'Daily<br><em>Briefing.</em>'],
    [/Tracking de<br><em>Cargas.<\/em>/g, 'Cargo<br><em>Tracking.</em>'],
    [/Planes &amp;<br><em>Facturacion.<\/em>/g, 'Plans &amp;<br><em>Billing.</em>'],
    [/Panel<br><em>Admin.<\/em>/g, 'Admin<br><em>Panel.</em>'],
    
    // Other texts
    [/Add Active/g, 'Add Asset'],
    [/Total Actives/g, 'Total Assets'],
    [/Anomalias de Consumption/g, 'Consumption Anomalies'],
    [/Anomalías de Consumption/g, 'Consumption Anomalies'],
    [/Hacé click en "Analyze" para que la IA escanee tu flota/g, 'Click "Analyze" to scan your fleet'],
    [/Hacé click en "Scan" para auditar el consumo/g, 'Click "Scan" to audit consumption'],
    [/Ej: ¿Cuantas embarcaciones tengo en viaje\?/g, 'Ex: How many vessels are in transit?'],
    [/FORMACION/g, 'FORMATION'],
    [/DISPONIBLES/g, 'AVAILABLE'],
    [/New Solicitud/g, 'New Request'],
    [/Add Tripulante/g, 'Add Crew Member'],
    [/Registrar Carga/g, 'Record Refuel'],
    [/New Orden/g, 'New Order'],
    [/Add Item/g, 'Add Item'],
    [/Registrar Lectura/g, 'Record Reading'],
    [/Reportar Incidente/g, 'Report Incident'],
    
    // Dynamic JS texts are mostly in fluvia-en.js, but let's check for any hardcoded states
    [/PENDIENTE/g, 'PENDING'],
    [/EN TRÁNSITO/g, 'IN TRANSIT'],
    [/COMPLETADO/g, 'COMPLETED'],
    [/En Servicio/g, 'In Service'],
    [/En Dique/g, 'Dry Dock'],
    
    // Fix any mangled translations
    [/Conditions óptimas/g, 'Optimal conditions'],
    [/Nivel normal/g, 'Normal level'],
    [/Meteorologia/g, 'Weather'],
    [/WEATHER · ASU/g, 'WEATHER · ASU'], // already translated
];

replaces.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
});

fs.writeFileSync(file, content);

// Also process JS file for dynamic statuses
const jsFile = 'public/fluvia-en.js';
let jsContent = fs.readFileSync(jsFile, 'utf8');

const jsReplaces = [
    [/DISPONIBLES/g, 'AVAILABLE'],
    [/PENDIENTE/g, 'PENDING'],
    [/EN TRÁNSITO/g, 'IN TRANSIT'],
    [/COMPLETADO/g, 'COMPLETED'],
    [/Condiciones óptimas/g, 'Optimal conditions'],
    [/Nivel normal/g, 'Normal level'],
    [/Meteorología/g, 'Weather'],
    [/Activo/g, 'Active'],
    [/Remolcador/g, 'Tugboat'],
    [/Barcaza/g, 'Barge'],
    [/ton/g, 'tons'],
    [/PLANNED/g, 'PLANNED'], // Ensure planned
];

jsReplaces.forEach(([regex, replacement]) => {
    jsContent = jsContent.replace(regex, replacement);
});

fs.writeFileSync(jsFile, jsContent);
console.log('Deep translation complete on main dashboard files.');
