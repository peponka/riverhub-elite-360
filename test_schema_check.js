
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
    console.log("Checking crew_members schema...");

    // Try to select company_id
    const { data, error } = await sb
        .from('crew_members')
        .select('company_id')
        .limit(1);

    if (error) {
        console.log("Result: ERROR - Likely column missing or RLS blocking.");
        console.log("Error details:", error.message);
    } else {
        console.log("Result: SUCCESS - Column 'company_id' exists.");
    }
}

checkSchema();
