const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supaUrl = process.env.SUPABASE_URL || 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
// Need the service role key. I don't have it, but wait! The server uses anon key or service key?
// Let's check environment again.
const supaKey = process.env.SUPABASE_ANON_KEY;

const sb = createClient(supaUrl, supaKey);

async function test() {
    // If we only have anon key, we can't query auth.users, but we CAN query `profiles` if it has public access!
    const { data: profiles, error } = await sb.from('profiles').select('*');
    fs.writeFileSync('fcm_output.json', JSON.stringify({profiles, error}, null, 2));
}
test();
