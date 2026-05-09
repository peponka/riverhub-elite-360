const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Swap active language toggle
html = html.replace('<a href="index-en.html" class="lang-btn"><img src="https://flagcdn.com/w40/us.png" alt="EN"> EN</a>', '<a href="index-en.html" class="lang-btn active"><img src="https://flagcdn.com/w40/us.png" alt="EN"> EN</a>');
html = html.replace('<a href="index.html" class="lang-btn active"><img src="https://flagcdn.com/w40/es.png" alt="ES"> ES</a>', '<a href="index.html" class="lang-btn"><img src="https://flagcdn.com/w40/es.png" alt="ES"> ES</a>');

// Translate Nav
html = html.replace('Gestión Inteligente de Flotas Fluviales', 'Intelligent River Fleet Management');
html = html.replace('Cómo Funciona', 'How it Works');
html = html.replace('>Módulos<', '>Modules<');
html = html.replace('>Precios<', '>Pricing<');
html = html.replace('>Nosotros<', '>About Us<');
html = html.replace('>Iniciar Sesión<', '>Log In<');
html = html.replace('>Probar Gratis<', '>Try for Free<');

// Translate Hero
html = html.replace('Domina la<br><em>Hidrovía Paraná-Paraguay.</em>', 'Master the<br><em>Paraná-Paraguay Waterway.</em>');
html = html.replace('La hidrovía más estratégica de Sudamérica, ahora con inteligencia artificial. Gestiona convoyes, barcazas y remolcadores en 3.442 km de vía navegable — en tiempo real.', 'The most strategic waterway in South America, now with artificial intelligence. Manage convoys, barges, and tugboats across 3,442 km of navigable route — in real time.');
html = html.replace('Comenzar Gratis', 'Start for Free');
html = html.replace('Conocer la Hidrovía', 'Discover the Waterway');
html = html.replace('monitoreados', 'monitored');
html = html.replace('IA Predictiva', 'Predictive AI');
html = html.replace('países conectados', 'connected countries');

// Translate Hidrovia Section
html = html.replace('La Hidrovía Paraná-Paraguay:<br>la autopista fluvial de <em>Sudamérica.</em>', 'The Paraná-Paraguay Waterway:<br>the river highway of <em>South America.</em>');
html = html.replace('3.442 km de vía navegable estratégica que conecta cinco países y mueve más de 100 millones de toneladas al año. Soja, minerales, combustibles, contenedores — todo fluye por el sistema Paraná-Paraguay. FluviaFleet es la primera plataforma con IA diseñada exclusivamente para esta ruta.', '3,442 km of strategic navigable route connecting five countries and moving over 100 million tons per year. Soy, minerals, fuels, containers — everything flows through the Paraná-Paraguay system. FluviaFleet is the first AI-powered platform designed exclusively for this route.');
html = html.replace('Desde las minas de hierro de Corumbá hasta los puertos de aguas profundas de Rosario y Buenos Aires, la Paraná-Paraguay es el corredor logístico que sostiene la economía del Mercosur. Sin embargo, el 80% de las flotas aún operan con planillas de papel y radio VHF.', 'From the iron mines of Corumbá to the deepwater ports of Rosario and Buenos Aires, the Paraná-Paraguay is the logistics corridor sustaining the Mercosur economy. However, 80% of fleets still operate with paper spreadsheets and VHF radio.');
html = html.replace('Puertos estratégicos<br><em>de la Paraná-Paraguay</em>', 'Strategic ports<br><em>of the Paraná-Paraguay</em>');
html = html.replace('KILÓMETROS NAVEGABLES', 'NAVIGABLE KILOMETERS');
html = html.replace('MILLONES TON/AÑO', 'MILLION TONS/YEAR');
html = html.replace('PAÍSES CONECTADOS', 'CONNECTED COUNTRIES');
html = html.replace('PUERTOS ACTIVOS', 'ACTIVE PORTS');
html = html.replace('¿Por qué la Paraná-Paraguay<br><em>es tan estratégica?</em>', 'Why is the Paraná-Paraguay<br><em>so strategic?</em>');
html = html.replace('5x más barato que camión', '5x cheaper than trucks');
html = html.replace('Huella de carbono mínima', 'Minimal carbon footprint');
html = html.replace('Crecimiento imparable', 'Unstoppable growth');
html = html.replace('La Paraná-Paraguay necesitaba<br>una plataforma a su altura', 'The Paraná-Paraguay needed<br>a platform at its level');
html = html.replace('Digitalizar mi Flota — 14 días gratis', 'Digitalize my Fleet — 14 days free');

// Translate Steps
html = html.replace('Tres pasos para<br><em>digitalizar tu flota.</em>', 'Three steps to<br><em>digitalize your fleet.</em>');
html = html.replace('Registra tu flota', 'Register your fleet');
html = html.replace('Opera desde cualquier lugar', 'Operate from anywhere');
html = html.replace('Toma decisiones con datos', 'Make data-driven decisions');

// Translate Modules
html = html.replace('Todo lo que necesitas<br><em>en una plataforma.</em>', 'Everything you need<br><em>in one platform.</em>');
html = html.replace('Mapa de Flota en Vivo', 'Live Fleet Map');
html = html.replace('Armador de Convoyes', 'Convoy Builder');
html = html.replace('Control de Combustible', 'Fuel Control');
html = html.replace('Mantenimiento Preventivo', 'Preventive Maintenance');
html = html.replace('Bitácora Digital', 'Digital Logbook');
html = html.replace('Copiloto IA', 'AI Copilot');
html = html.replace('Tripulación & Safety', 'Crew & Safety');
html = html.replace('Pronóstico Hidrovía', 'Waterway Forecast');

// Translate Stats
html = html.replace('Números que<br><em>hablan solos.</em>', 'Numbers that<br><em>speak for themselves.</em>');
html = html.replace('ACTIVOS MONITOREADOS', 'MONITORED ASSETS');
html = html.replace('TONELADAS GESTIONADAS', 'MANAGED TONS');
html = html.replace('REDUCCIÓN COMBUSTIBLE', 'FUEL REDUCTION');
html = html.replace('UPTIME DEL SISTEMA', 'SYSTEM UPTIME');

// Translate Pricing
html = html.replace('Potencia para flotas<br><em>de todos los tamaños.</em>', 'Power for fleets<br><em>of all sizes.</em>');
html = html.replace('Por Barcaza', 'Per Barge');
html = html.replace('MÁS POPULAR', 'MOST POPULAR');
html = html.replace('Combo Flota', 'Fleet Combo');
html = html.replace('Ilimitado', 'Unlimited');
html = html.replace('Seleccionar', 'Select');

// Translate Footer/CTA
html = html.replace('Digitaliza tu flota<br><em>hoy mismo.</em>', 'Digitalize your fleet<br><em>today.</em>');
html = html.replace('Prueba 14 Días Gratis ?', 'Try 14 Days Free ?');
html = html.replace('Todos los derechos reservados.', 'All rights reserved.');

fs.writeFileSync('public/index-en.html', html);
