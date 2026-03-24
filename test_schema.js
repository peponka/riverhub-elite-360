const fs = require('fs');
async function test() {
    try {
        const resp = await fetch('https://nfybnnpdrvyxucgpqmmo.supabase.co/rest/v1/', {
            method: 'GET',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc'
            }
        });
        const text = await resp.text();
        fs.writeFileSync('schema.json', text);
    } catch(e) {
        console.error(e);
    }
}
test();
