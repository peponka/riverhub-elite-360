console.log("Hello from test_server.js");
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello World!');
});
server.listen(3002, () => {
    console.log('Test server running on 3002');
});
