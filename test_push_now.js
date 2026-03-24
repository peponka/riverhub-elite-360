const http = require('http');

const data = JSON.stringify({
  type: 'ai_system_alert',
  title: 'ALERTA ROJA HIDROVIA',
  message: 'La barcaza Alpha-8 reporta derrame de crudo ligero. Gemini IA clasifica Nivel 4 Critico. Todos a sus puestos.',
  severity: 'critical'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/n8n/send-alert',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'riverhub_n8n_2026',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', error => console.error('Error enviando la alerta:', error));
req.write(data);
req.end();
