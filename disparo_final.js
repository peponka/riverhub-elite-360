const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fire() {
    console.log("🔍 Buscando el token de tu celular en Supabase...");
    const { data: profiles, error } = await supabase.from('profiles').select('fcm_token').not('fcm_token', 'is', null);
    
    if (error || !profiles || profiles.length === 0) {
        console.log("❌ No encontré ningún token. ¿Aseguraste darle a 'Allow' a las notificaciones en la app?");
        process.exit(1);
    }

    const tokens = profiles.map(p => p.fcm_token).filter(t => t);
    console.log(`✅ ¡Encontré ${tokens.length} token(s)! Apuntando misil...`);

    const message = {
        notification: {
            title: '📡 Cerebro Gemini AI',
            body: '¡Notificación Push Recibida Exitosamente en el Emulador Android! Fase 3 Completada.'
        },
        tokens: tokens
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(`💥 ¡IMPACTO CONFIRMADO! ${response.successCount} notificaciones llegaron a tu celular.`);
        process.exit(0);
    } catch(e) {
        console.log("❌ Error en el disparo Firebase:", e.message);
        process.exit(1);
    }
}
fire();
