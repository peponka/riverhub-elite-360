const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9090;
const PUBLIC = 'c:\\Users\\pepeq\\OneDrive\\Desktop\\RIverhub\\public';

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';

    const filePath = path.join(PUBLIC, url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not found: ' + url);
            return;
        }
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(data);
    });
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log('Port ' + PORT + ' in use, trying ' + (PORT + 1));
        server.listen(PORT + 1);
    }
});

server.listen(PORT, () => {
    console.log('RiverHub NO-CACHE server: http://localhost:' + PORT);
});
