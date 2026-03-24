const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supaUrl = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

const sb = createClient(supaUrl, supaKey);

async function testSign() {
  const email = `test_crash_${Date.now()}@test.com`;
  const { data, error } = await sb.auth.signUp({
    email,
    password: 'Password123!',
  });
  console.log(JSON.stringify(error, null, 2));
}

testSign();
