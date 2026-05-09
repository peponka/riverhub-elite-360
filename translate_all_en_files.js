const fs = require('fs');
const path = require('path');
const dir = 'public';

// Comprehensive Spanish-to-English dictionary
const dict = [
    // Navigation/Crew roles
    ["Navegación", "Navigation"],
    ["navegación", "navigation"],
    ["Capitán", "Captain"],
    ["Timonel", "Helmsman"],
    ["Maquinista", "Engineer"],
    ["Primer Oficial", "First Officer"],
    ["Jefe de Máquinas", "Chief Engineer"],
    ["Marinero", "Seaman"],
    ["Cocinero", "Cook"],
    ["Sistema Automático", "Automatic System"],
    
    // Inventory items
    ["Aceite Motor CAT 15W-40", "CAT 15W-40 Engine Oil"],
    ["Filtro aceite CAT 1R-0716", "CAT 1R-0716 Oil Filter"],
    ["Cabo de amarre 32mm", "32mm Mooring Line"],
    ["Pintura antifouling roja", "Red Antifouling Paint"],
    ["Chaleco salvavidas SOLAS", "SOLAS Life Jacket"],
    ["Bengalas de emergencia", "Emergency Flares"],
    ["Grasa marina Mobilgrease", "Mobilgrease Marine Grease"],
    ["Electrodo soldadura 7018", "7018 Welding Electrode"],
    ['Manguera hidráulica 1/2"', '1/2" Hydraulic Hose'],
    ["Filtro fuel CAT", "CAT Fuel Filter"],
    ["inyector", "injector"],
    ["Cabullería", "Cordage"],
    ["Lubricantes", "Lubricants"],
    ["Filtros", "Filters"],
    ["Pintura", "Paint"],
    ["Seguridad", "Safety"],
    ["Hidráulica", "Hydraulics"],
    
    // Maintenance
    ["Vibración detectada a 1200 RPM", "Vibration detected at 1200 RPM"],
    ["Calibración ecosonda - lectura errática", "Echosounder calibration - erratic reading"],
    ["Revisión sistema hidráulico timón trimestral", "Quarterly rudder hydraulic system inspection"],
    ["Sistema de navegación actualizado y calibrado. Todo nominal.", "Navigation system updated and calibrated. All nominal."],
    ["Condiciones normales de navegación", "Normal navigation conditions"],
    ["Análisis de condiciones de navegación", "Navigation conditions analysis"],
    
    // Status
    ["NAVEGACIÓN SEGURA", "SAFE NAVIGATION"],
    ["EN NAVEGACIÓN", "IN TRANSIT"],
    ["HISTORIAL DE NAVEGACIÓN", "NAVIGATION HISTORY"],
    ["SIN ALERTAS", "NO ALERTS"],
    ["PERMISO DE NAVEGACIÓN", "NAVIGATION PERMIT"],
    ["VENCIDO", "EXPIRED"],
    
    // Weather
    ["METEOROLOGÍA", "WEATHER"],
    ["Condiciones óptimas", "Optimal conditions"],
    
    // Communications
    ["Navegación Km", "Navigation Km"],
    
    // Blog
    ["Centro de Recursos", "Resource Center"],
    ["Navegación Fluvial, Logística e Hidrovía", "River Navigation, Logistics & Waterway"],
    ["Guía completa: Documentación requerida por PREFECTURA para navegación en convoy", "Complete Guide: Coast Guard Documentation Required for Convoy Navigation"],
    ["Plataforma de gestión para navegación fluvial", "River navigation management platform"],
    ["Hidrovía Paraguay-Paraná", "Paraguay-Parana Waterway"],
    
    // Copilot  
    ["Predicción de fallas con IA", "AI-powered failure prediction"],
    ["Detección de patrones anómalos", "Anomalous pattern detection"],
    
    // Misc
    ["Módulo", "Module"],
    ["módulo", "module"],
];

// Get all -en.html files
const files = fs.readdirSync(dir).filter(f => f.endsWith('-en.html') || f.endsWith('-en.js'));
let totalReplacements = 0;

files.forEach(file => {
    const filepath = path.join(dir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    let fileReplacements = 0;
    
    for (const [es, en] of dict) {
        if (content.includes(es)) {
            content = content.split(es).join(en);
            fileReplacements++;
        }
    }
    
    if (fileReplacements > 0) {
        fs.writeFileSync(filepath, content);
        console.log('  ' + file + ': ' + fileReplacements + ' replacements');
        totalReplacements += fileReplacements;
    }
});

console.log('Total: ' + totalReplacements + ' replacements across ' + files.length + ' files.');