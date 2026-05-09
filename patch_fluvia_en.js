const fs = require('fs');
let txt = fs.readFileSync('public/fluvia-en.js', 'utf8');

const translator = `
// --- AUTOMATIC ENGLISH TRANSLATOR ---
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

function translateData(dataArray) {
    if (!dataArray || !Array.isArray(dataArray)) return dataArray;
    return dataArray.map(item => {
        let newItem = { ...item };
        for (const key in newItem) {
            if (typeof newItem[key] === 'string') {
                newItem[key] = translateText(newItem[key]);
            } else if (newItem[key] && typeof newItem[key] === 'object') {
                 for (const nestedKey in newItem[key]) {
                     if (typeof newItem[key][nestedKey] === 'string') {
                         newItem[key][nestedKey] = translateText(newItem[key][nestedKey]);
                     }
                 }
            }
        }
        return newItem;
    });
}
// ------------------------------------
`;

if (!txt.includes('translateData')) {
    txt = txt.replace('const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);', 'const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);\n' + translator);
}

const monkeyPatch = `
// MONKEY PATCH SUPABASE TO TRANSLATE EVERYTHING AUTOMATICALLY
const originalFrom = sb.from.bind(sb);
sb.from = function(table) {
    const queryBuilder = originalFrom(table);
    const originalSelect = queryBuilder.select.bind(queryBuilder);
    queryBuilder.select = function(...args) {
        const promise = originalSelect(...args);
        return promise.then(res => {
            if (res && res.data) {
                res.data = translateData(res.data);
            }
            return res;
        });
    };
    return queryBuilder;
};
`;

if (!txt.includes('MONKEY PATCH SUPABASE')) {
    txt = txt.replace('// ═══════════════════════════════════════════', monkeyPatch + '\n// ═══════════════════════════════════════════');
}

fs.writeFileSync('public/fluvia-en.js', txt);
console.log('Successfully monkey-patched fluvia-en.js');