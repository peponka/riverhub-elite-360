const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function disparoMortal() {
  try {
    console.log("1. Buscando tokens en Supabase...");
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('email, fcm_token')
      .not('fcm_token', 'is', null);

    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      console.log("❌ CRITICO: No se encontraron usuarios con fcm_token. El login no guardó el token.");
      return;
    }

    const tokens = profiles.map(p => p.fcm_token);
    console.log(`2. Disparando misil a ${tokens.length} dispositivos...`);

    const message = {
      notification: {
        title: '🚨 ALERTA ROJA (TEST DIRECTO)',
        body: 'Si recibes esto, el End-to-End funciona impecable via Firebase Admin.'
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Resultado del Bombardeo: ${response.successCount} impactos, ${response.failureCount} fallos.`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) console.error("Fallo:", resp.error.message);
      });
    }

    // Escribir a un archivo para confirmar que node se ejecutó bien
    require('fs').writeFileSync('disparo_directo.log', `Éxitos: ${response.successCount}, Fallos: ${response.failureCount}`);

  } catch (err) {
    console.error('❌ Error fatal:', err);
    require('fs').writeFileSync('disparo_directo.log', 'Error: ' + err.message);
  }
}

disparoMortal();
