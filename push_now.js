const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fcmToken = "dLw7J8_aTiWD--fhL04h40:APA91bEbcRKTPag2zHkcuolrhBZGeVIatrWao0u1jIyOGnToNCERRd7yaIe4DMIWIqqvz9zjBCtDj-CUz3CnQ_rMjEXi7wDZKhcM3qvXsEOpdpH-W763k4o";

const message = {
  notification: {
    title: '🚢 RiverHub Alerta de IA',
    body: '¡Cerebro Gemini conectado! El buque CENTAURO presenta nivel crítico de combustible. Favor coordinar recarga.'
  },
  data: {
    type: 'system_alert',
    priority: 'high'
  },
  token: fcmToken,
};

async function sendPush() {
  try {
    const response = await admin.messaging().send(message);
    console.log('✅ EXITO GIGANTESCO! Mensaje enviado al celular:', response);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
  } finally {
    process.exit(0); // <-- THIS IS CRITICAL TO CLOSE NODE GRACEFULLY
  }
}

sendPush();
