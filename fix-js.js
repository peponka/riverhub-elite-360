const fs=require('fs'); let c=fs.readFileSync('public/fluvia-en.js','utf8'); c=c.replace(/admin-([a-zA-Z0-9-]+)\.html/g, 'admin--en.html'); fs.writeFileSync('public/fluvia-en.js',c);
