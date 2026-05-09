const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.html', 'utf8');

const dict = [
    // Pricing page
    ["MAS POPULAR", "MOST POPULAR"],
    ["Combo Flota", "Fleet Combo"],
    ["/mes (hasta 50 barcazas)", "/mo (up to 50 barges)"],
    ["/mes (hasta 150 barcazas)", "/mo (up to 150 barges)"],
    ["/mes</span>", "/mo</span>"],
    ["Todo de Per Barge", "Everything in Per Barge"],
    ["Armador de convoyes", "Convoy builder"],
    ["Gestion de tripulacion", "Crew management"],
    ["AI Copilot basico", "AI Copilot basic"],
    ["API Integraciones", "API Integrations"],
    ["API integraciones", "API integrations"],
    ["AI Copilot avanzado", "AI Copilot advanced"],
    ["Soporte prioritario 24/7", "Priority support 24/7"],
    ["Vessels ilimitadas", "Unlimited vessels"],
    ["Tracking GPS en tiempo real", "Real-time GPS tracking"],
    ["Bitacora digital", "Digital logbook"],
    ["Control de combustible", "Fuel management"],
    ["Maintenance preventivo", "Preventive maintenance"],
    
    // Support FAQ
    ["Todos los planes incluyen soporte por email. Enterprise e Unlimited tienen soporte 24/7 con tiempo de respuesta garantizado.", "All plans include email support. Enterprise and Unlimited plans include 24/7 support with guaranteed response time."],
    
    // Copilot subtitles
    ["Predicción de fallas con IA", "AI-powered failure prediction"],
    ["Detección de patrones anómalos", "Anomalous pattern detection"],
    ["Anomalías de Consumption", "Consumption Anomalies"],
    
    // Weather
    ["METEOROLOGÍA · ASU", "WEATHER · ASU"],
    ["METEOROLOGÍA", "WEATHER"],
    ["Condiciones óptimas", "Optimal conditions"],
    
    // Dashboard KPIs
    ["Mejor mes del", "Best month of"],
    ["Atención requerida", "Attention required"],
    ["últimas 24h", "last 24h"],
    [" registros", " logs"],
    ["Abrir bitácora", "Open logbook"],
    
    // Copilot hints
    ["Ej: ¿Cuantas embarcaciones tengo en viaje?", "E.g.: How many vessels are in transit?"],
    ["Hacé click en \"Analyze\" para que la IA escanee tu flota", "Click \"Analyze\" to scan your fleet with AI"],
    ["Hacé click en \"Scan\" para auditar el consumo", "Click \"Scan\" to audit consumption"],
    
    // Sidebar / module titles kept in Spanish
    ["HIDROVÍA · NIVEL", "WATERWAY · LEVEL"],
    ["Normal level", "Normal level"],
    ["Nivel normal", "Normal level"],
    
    // Misc remaining
    ["Prediccion de fallas con IA", "AI-powered failure prediction"],
    ["Deteccion de patrones anomalos", "Anomalous pattern detection"],
];

for (const [es, en] of dict) {
    if (txt.includes(es)) {
        txt = txt.split(es).join(en);
        console.log('  Replaced: ' + es.substring(0, 40));
    }
}

fs.writeFileSync('public/fluvia-en.html', txt);
console.log('HTML translation complete. ' + dict.length + ' patterns checked.');