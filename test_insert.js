const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supaUrl = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

const sb = createClient(supaUrl, supaKey);

async function test() {
    // Try doing an insert to profiles to see if it fails (using anon key it might be stopped by RLS or return schema error)
    const { data, error } = await sb.from('profiles').insert([
        { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@test.com', full_name: 'test', company: 'test', company_id: 'test', role: 'user' }
    ]);
    fs.writeFileSync('insert_error.json', JSON.stringify({error}, null, 2));
}
test();
