const fetch = require('node-fetch') || globalThis.fetch;

async function shoot() {
    try {
        console.log("Apuntando misil a http://localhost:3000/api/n8n/send-alert ...");
        const res = await fetch('http://localhost:3000/api/n8n/send-alert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'riverhub_n8n_2026'
            },
            body: JSON.stringify({
                type: 'ai_system_alert',
                title: 'IA: Alerta Hidrovia',
                message: 'El satélite detectó anomalía en Barcaza Alpha-8. Motor detenido por 45 minutos. Favor verificar.',
                severity: 'critical'
            })
        });
        const data = await res.json();
        console.log("¡Misil impactado en el servidor! Resultado:", data);
    } catch(e) {
        console.log("❌ Fallo en el disparo:", e.message);
    }
}
shoot();
