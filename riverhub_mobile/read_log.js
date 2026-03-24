const fs = require("fs");
const buffer = fs.readFileSync("flutter_log.txt");
console.log(buffer.toString("utf8").replace(/\x00/g, ""));
