const fs = require('fs');
let content = fs.readFileSync('public/fluvia.js', 'utf8');

const tradFunc = `function trad(s) {
    if(!s) return '';
    var str = String(s).toLowerCase();
    var m = {
        'tugboat': 'Remolcador',
        'pusher': 'Empujador',
        'barge': 'Barcaza',
        'active': 'Activo',
        'inactive': 'Inactivo',
        'docked': 'En Puerto',
        'en viaje': 'En Viaje',
        'en_viaje': 'En Viaje',
        'maintenance': 'Mantenimiento',
        'completed': 'Completado',
        'pending': 'Pendiente',
        'high': 'Alta',
        'medium': 'Media',
        'low': 'Baja',
        'critical': 'Critico',
        'cargo': 'Carga',
        'passenger': 'Pasajeros'
    };
    return m[str] ? m[str] : s;
}
// Supabase Init`;

if (!content.includes('function trad(s)')) {
    content = content.replace('// Supabase Init', tradFunc);
}

content = content.replace(/v\.type\|\|v\.vessel_type\|\|''/g, "trad(v.type||v.vessel_type||'')");
content = content.replace(/v\.status\|\|''/g, "trad(v.status||'')");
content = content.replace(/v\.status\|\|'PENDIENTE'/g, "trad(v.status||'PENDIENTE')");
content = content.replace(/c\.status\|\|'EMBARCADO'/g, "trad(c.status||'EMBARCADO')");
content = content.replace(/m\.status\|\|m\.priority\|\|''/g, "trad(m.status||m.priority||'')");

fs.writeFileSync('public/fluvia.js', content, 'utf8');
console.log('fluvia.js actualizado exitosamente.');
