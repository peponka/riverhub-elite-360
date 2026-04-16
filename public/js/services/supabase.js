// js/services/supabase.js

// CONFIGURATION
// CONFIGURATION
var SB_URL = 'https://nfybnnpdrvyxucgpqmmo.supabase.co';
var SB_KEY = 'REDACTED_SUPABASE_ANON_KEY';

// Global holder
window.sb = null;

// --- TENANT HELPERS (SAAS ISOLATION) ---
// Retrieves the current user's Company Name/ID to use as Tenant Filter
var getTenantId = () => {
    if (window.AuthModule) {
        const user = window.AuthModule.getCurrentUser();

        // SAAS FIX: Support company_id (UUID) or company (Legacy Name)
        const tenantVal = user && (user.company_id || user.company);

        if (tenantVal) {
            // Normalize just in case, though UUIDs are safe string-wise
            return tenantVal.toString().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
        }
    }
    return 'DEMO_TENANT'; // Fallback for testing
};

var tryConnect = () => {
    if (window.supabase) {
        try {
            // Configured for Production SaaS (Persist Session = TRUE)
            window.sb = window.supabase.createClient(SB_URL, SB_KEY, {
                auth: {
                    persistSession: true, // Keep user logged in
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });

            console.log("🟢 Supabase Client Connected (SaaS Mode Active)");

            // --- INJECT CUSTOM TENANT FUNCTIONS ---

            // 1. FETCH MINE (Read only MY company's data)
            window.sb.fetchMine = async (table, select = '*') => {
                const tenant = getTenantId();
                // If user is SUPERADMIN, they might want to see everything? 
                // For now, strict isolation: even Admins see filtered unless using raw calls.

                // Temporary console log to verify logic
                // console.log(`🔒 SaaS Read: [${table}] for Tenant [${tenant}]`);

                return await window.sb
                    .from(table)
                    .select(select)
                    .eq('company_id', tenant); // AUTOMATIC FILTER
            };

            // 2. INSERT MINE (Write data stamped with MY company ID)
            window.sb.insertMine = async (table, dataObj) => {
                const tenant = getTenantId();
                const record = { ...dataObj, company_id: tenant }; // INJECT TENANT ID

                return await window.sb
                    .from(table)
                    .insert([record]);
            };

        } catch (e) {
            console.error("SB Config Error", e);
        }
        return true;
    }
    return false;
};

// Start trying immediately
if (!tryConnect()) {
    console.warn("🟡 Supabase Lib not ready, starting retry loop...");
    let attempts = 0;
    const check = setInterval(() => {
        attempts++;
        if (tryConnect()) {
            clearInterval(check);
        } else if (attempts > 25) { // 5 seconds
            clearInterval(check);
            console.error("🔴 CRITICAL: Supabase Library failed to load. Check internet/firewall.");
        }
    }, 200);
}
