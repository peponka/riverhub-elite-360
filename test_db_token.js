const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTokens() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, fcm_token')
    .not('fcm_token', 'is', null);

  fs.writeFileSync('db_out.json', JSON.stringify({ data, error }, null, 2));
}

checkTokens();
