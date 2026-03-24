const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./firebase-service-account.json');

const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function runPush() {
  try {
    const { data: tokens, error } = await supabase.rpc('get_all_fcm_tokens');
    if (error) throw error;
    if (!tokens || tokens.length === 0) throw new Error("No tokens found");

    const message = {
      notification: {
        title: '🚨 ALERTA DIRECTA',
        body: 'Testeando firebase admin SDK en el servidor'
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    let log = `Éxitos: ${response.successCount}, Fallos: ${response.failureCount}\n`;
    
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
         log += `[${idx}] Error: ${resp.error.message}\n`;
      }
    });

    fs.writeFileSync('fcm_debug.log', log);
  } catch (err) {
    fs.writeFileSync('fcm_debug.log', `Error general: ${err.message}`);
  }
}
runPush();
