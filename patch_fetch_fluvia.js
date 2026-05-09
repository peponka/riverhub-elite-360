const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

const fetchPatch = `
// --- AUTOMATIC ENGLISH TRANSLATOR (FETCH INTERCEPTOR) ---
const EN_DICT = {
    'navegación': 'transit',
    'combustible': 'fuel',
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
    'tugboat': 'tugboat',
    'pusher': 'pusher',
    'barge': 'barge',
    'Remolcador': 'Tugboat',
    'Barcaza': 'Barge',
    'Activo': 'Active',
    'activo': 'active',
    'PENDIENTE': 'PENDING',
    'EN TRÁNSITO': 'IN TRANSIT',
    'COMPLETADO': 'COMPLETED',
    'En Servicio': 'In Service',
    'En Dique': 'Dry Dock',
    'embarcado': 'onboard',
    'descanso': 'leave'
};

function translateText(str) {
    if (!str || typeof str !== 'string') return str;
    let translated = str;
    for (const [es, en] of Object.entries(EN_DICT)) {
        const regex = new RegExp(es, 'gi');
        translated = translated.replace(regex, (match) => {
            if (match[0] === match[0].toUpperCase()) return en.charAt(0).toUpperCase() + en.slice(1);
            return en;
        });
    }
    return translated;
}

function translateData(data) {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(item => translateData(item));
    } else if (typeof data === 'object') {
        let newItem = { ...data };
        for (const key in newItem) {
            if (typeof newItem[key] === 'string') {
                newItem[key] = translateText(newItem[key]);
            } else if (newItem[key] !== null && typeof newItem[key] === 'object') {
                 newItem[key] = translateData(newItem[key]);
            }
        }
        return newItem;
    }
    return data;
}

// Intercept all fetch requests to Supabase REST API
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    
    // Only intercept successful GET requests to Supabase
    if (url.includes('.supabase.co/rest/v1') && response.ok) {
        const clonedResponse = response.clone();
        try {
            const data = await clonedResponse.json();
            const translatedData = translateData(data);
            
            return new Response(JSON.stringify(translatedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch (e) {
            // If it's not JSON or parsing fails, return original response
            console.error("Fetch interceptor translation error:", e);
        }
    }
    return response;
};
// --------------------------------------------------------
`;

if (!txt.includes('AUTOMATIC ENGLISH TRANSLATOR (FETCH INTERCEPTOR)')) {
    txt = txt.replace('const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);', 'const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);\n' + fetchPatch);
    fs.writeFileSync('public/fluvia-en.js', txt);
    console.log('Successfully injected fetch interceptor into fluvia-en.js');
} else {
    console.log('Fetch interceptor already present');
}