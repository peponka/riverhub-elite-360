const fs = require('fs');
try {
  require('./app.js');
} catch (e) {
  fs.writeFileSync('error_dump.txt', e.stack);
}
