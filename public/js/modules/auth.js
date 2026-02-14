// js/modules/auth.js

var AuthModule = (() => {

    let currentUser = null;

    const init = async () => {
        console.log("Auth System Initializing...");

        // ----------------------------------------------------
        // WAITING ROOM: Poll for window.sb availability
        // ----------------------------------------------------
        let attempts = 0;
        // Wait up to 4 seconds (20 * 200ms)
        while (!window.sb && attempts < 20) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }
        // ----------------------------------------------------

        try {
            if (!window.sb) throw new Error("Connection Timeout: Could not load Supabase Library.");

            // LISTEN FOR PASSWORD RECOVERY
            window.sb.auth.onAuthStateChange(async (event, session) => {
                console.log("AUTH EVENT:", event);
                if (event === "PASSWORD_RECOVERY") {
                    document.getElementById('modal-change-pass').style.display = 'flex';
                }
            });

            await checkSession();

            // Clear error if success
            const errEl = document.getElementById('login-error-msg');
            if (errEl) errEl.style.display = 'none';

        } catch (e) {
            console.error("Auth Init Failed:", e);
            // Force Login View
            document.querySelector('.app-container').style.display = 'none';
            document.getElementById('login-view').style.display = 'flex';

            // Show User-Friendly Error
            const errEl = document.getElementById('login-error-msg');
            if (errEl) {
                errEl.innerHTML = `<strong>Error de Conexión:</strong><br>${e.message}<br><small>Revisa tu internet y refresca (F5).</small>`;
                errEl.style.display = 'block';
            }
        }
        setupListeners();
    };

    const setupListeners = () => {
        const loginBtn = document.getElementById('btn-login-action');
        if (loginBtn) {
            loginBtn.addEventListener('click', attemptLogin);
        }

        document.querySelectorAll('.input-login-premium').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptLogin();
            });
        });
    };

    const attemptLogin = async () => {
        const email = document.getElementById('login-user').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        const errorMsg = document.getElementById('login-error-msg');
        const loginBtn = document.getElementById('btn-login-action');

        if (!email || !pass) return;

        // SECURITY: No bypasses. All logins go through Supabase Auth.

        const originalText = loginBtn.innerText;
        loginBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> VERIFICANDO...';

        try {
            if (!window.sb) throw new Error("No hay conexión con el servidor (Supabase no cargó).");

            // 1. Supabase Auth with Timeout Race
            const loginPromise = window.sb.auth.signInWithPassword({
                email: email,
                password: pass
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tiempo de espera agotado. Revisa tu conexión.")), 10000)
            );

            const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

            if (error) throw error;
            if (!data || !data.user) throw new Error("Respuesta vacía del servidor.");

            // 2. Fetch Profile
            const { data: profile, error: profileError } = await window.sb
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            // Handle missing profile gracefully
            if (profileError) {
                console.warn("Profile fetch error/missing:", profileError);
                // SECURITY: Fallback to minimal 'user' role, never superadmin
                await login({
                    id: data.user.id,
                    email: data.user.email,
                    role: 'user',
                    full_name: 'Usuario (Perfil Pendiente)'
                });
            } else {
                await login(profile);
            }

        } catch (err) {
            console.error("Login Error:", err);
            errorMsg.style.display = 'block';

            // Explicit Alert for User visibility
            // alert(`Error de Inicio de Sesión:\n${err.message}`);

            let friendlyMsg = `Error: ${err.message || 'Desconocido'}`;
            if (err.message && err.message.includes("Failed to fetch")) {
                friendlyMsg = "Error de Conexión: No se pudo contactar con la Base de Datos.";
            }

            errorMsg.innerHTML = `
                <div style="margin-bottom:10px;">${friendlyMsg}</div>
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:8px;">Verifica tu conexión a internet e intenta de nuevo.</div>
            `;

            shakeCard();
        } finally {
            loginBtn.innerText = originalText;
        }
    };

    const login = async (userProfile) => {
        currentUser = userProfile;

        document.getElementById('login-view').style.setProperty('display', 'none', 'important');
        document.querySelector('.app-container').style.setProperty('display', 'flex', 'important');

        updateUserProfile(userProfile);
        applyRolePermissions(userProfile.role);

        // Safe click
        const dashBtn = document.getElementById('nav-dashboard');
        if (dashBtn) dashBtn.click();
    };

    const logout = async () => {
        if (window.sb) await window.sb.auth.signOut();
        currentUser = null;
        window.location.href = '/'; // Go to Landing Page
    };

    const checkSession = async () => {
        if (!window.sb) return;

        const { data } = await window.sb.auth.getSession();

        if (data && data.session) {
            console.log("DEBUG: Session Found", data.session);
            try {
                const { data: profile } = await window.sb
                    .from('profiles')
                    .select('*')
                    .eq('id', data.session.user.id)
                    .single();

                if (profile) login(profile);
                else {
                    // SECURITY: Auth valid but no profile row — assign minimal role
                    login({ ...data.session.user, role: 'user', full_name: 'Usuario' });
                }
            } catch (e) {
                console.error("Restore session failed", e);
            }
        } else {
            // NO SESSION: Always show Login Screen instead of redirecting
            // This fixes the "refresh goes to landing" issue
            console.log("No session -> Showing Login View");
            document.querySelector('.app-container').style.display = 'none';
            document.getElementById('login-view').style.display = 'flex';

            // Optional: Update URL to reflect login mode without reloading
            const url = new URL(window.location);
            if (url.searchParams.get('mode') !== 'login') {
                url.searchParams.set('mode', 'login');
                window.history.replaceState({}, '', url.toString());
            }
        }
    };

    const updateUserProfile = (user) => {
        const nameEl = document.querySelector('.user-info strong');
        const roleEl = document.querySelector('.user-info span');
        const avatarEl = document.querySelector('.avatar-circle');

        const displayName = user.full_name || user.name || 'Usuario';

        if (nameEl) nameEl.innerText = displayName;
        if (roleEl) roleEl.innerText = (user.role || 'user').toUpperCase();
        if (avatarEl) avatarEl.innerText = displayName.substring(0, 2).toUpperCase();

        // 1. BACKOFFICE BUTTON (Global Fleet) - STRICTLY SUPERADMIN
        const backofficeBtn = document.getElementById('nav-backoffice');
        if (backofficeBtn) {
            backofficeBtn.style.display = (user.role === 'superadmin') ? 'flex' : 'none';
        }

        // 2. ADMIN CONSOLE BUTTON (Company or Global) - ADMIN OR SUPERADMIN
        // 2. ADMIN CONSOLE BUTTON - ADMIN ONLY (Superadmin uses Backoffice)
        if (user.role === 'admin') {
            const adminBtn = document.getElementById('nav-admin-console');
            const adminMenu = document.getElementById('menu-item-admin');

            if (adminBtn) {
                adminBtn.style.display = 'flex';
                // LABEL: 'Mi Consola' (Admin)
                const labelText = 'Mi Consola';
                const labelSpan = adminBtn.querySelector('span');
                if (labelSpan) labelSpan.textContent = labelText;
                else adminBtn.childNodes[adminBtn.childNodes.length - 1].textContent = " " + labelText;
            }
            if (adminMenu) adminMenu.style.display = 'flex';
        } else if (user.role === 'superadmin') {
            // Ensure it's hidden for superadmin to avoid duplication
            const adminBtn = document.getElementById('nav-admin-console');
            if (adminBtn) adminBtn.style.display = 'none';
        }
    };

    const applyRolePermissions = (role) => {
        const allNavs = document.querySelectorAll('.menu a');
        allNavs.forEach(el => {
            // Default display flex, EXCEPT explicit hidden ones
            if (el.id !== 'nav-backoffice') el.style.display = 'flex';
        });

        // HIDE GLOBAL BACKOFFICE FOR EVERYONE EXCEPT SUPERADMIN
        // Logic handled in updateUserProfile above, but enforced here too
        if (role !== 'superadmin') {
            hideNav(['nav-backoffice']);
        }

        if (role === 'crew') {
            hideNav(['nav-dashboard', 'nav-mapa', 'nav-comunicaciones', 'nav-cotizador', 'nav-docs', 'nav-integraciones', 'nav-backoffice']);
        }
    };

    const hideNav = (ids) => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    };

    const shakeCard = () => {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight;
            card.style.animation = 'shake 0.5s';
        }
    };

    const toggleUserMenu = () => {
        const menu = document.getElementById('user-menu');
        if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    };

    document.addEventListener('click', (e) => {
        const profile = document.querySelector('.user-profile');
        const menu = document.getElementById('user-menu');
        if (profile && menu && !profile.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    const switchTab = (mode) => {
        const tabs = document.querySelectorAll('.tab');
        const loginForm = document.getElementById('form-login');
        const regForm = document.getElementById('form-register');

        // Reset Tabs
        tabs.forEach(t => t.classList.remove('active'));

        // Toggle Views
        if (mode === 'login') {
            if (tabs[0]) tabs[0].classList.add('active');
            if (loginForm) loginForm.style.display = 'block';
            if (regForm) regForm.style.display = 'none';
        } else {
            if (tabs[1]) tabs[1].classList.add('active');
            if (loginForm) loginForm.style.display = 'none';
            if (regForm) regForm.style.display = 'block';
        }
    };

    const submitRegistration = async () => {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        // New Professional Fields
        const company = document.getElementById('reg-company').value;
        const roleTitle = document.getElementById('reg-role').value;
        const phone = document.getElementById('reg-phone').value;

        if (!name || !email || !pass || !company || !phone) {
            alert("Por favor completa todos los campos profesionales (Empresa, Teléfono, etc).");
            return;
        }

        const btn = document.querySelector('#form-register button');
        const originalText = btn.innerText;
        btn.innerText = "PROCESANDO SOLICITUD...";
        btn.disabled = true;

        try {
            // 1. Create Auth User
            const { data, error } = await window.sb.auth.signUp({
                email: email,
                password: pass,
                options: {
                    data: { full_name: name } // Meta data
                }
            });

            if (error) throw error;
            if (data.user) {
                // 2. Insert Extended Profile
                // Note: Triggers might create a basic profile, so we UPSERT
                const { error: profileError } = await window.sb
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: email,
                        full_name: name,
                        role: 'pending', // Security: Default to pending or user
                        // Extended Fields (Ensure these columns exist in Supabase 'profiles' table)
                        company: company,
                        job_title: roleTitle,
                        phone: phone,
                        created_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.warn("Profile save warning:", profileError);
                    // Continue anyway, auth is done
                }

                alert(`¡Solicitud recibida!\n\nBienvenido, ${name}.\nTu cuenta está en proceso de revisión.\nPuedes ingresar, pero algunas funciones pueden estar limitadas hasta la aprobación.`);
                switchTab('login');
            }

        } catch (e) {
            alert("Error en registro: " + e.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    const showForgotPassword = () => {
        const modal = document.getElementById('modal-forgot-pass');
        if (modal) modal.style.display = 'flex';
    };

    const sendPasswordReset = async () => {
        const email = document.getElementById('forgot-email').value;
        if (!email) return alert("Ingresa tu email.");

        const btn = document.querySelector('#modal-forgot-pass .btn-primary');
        const oldText = btn.innerText;
        btn.innerText = "ENVIANDO...";
        btn.disabled = true;

        try {
            const { error } = await window.sb.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Just send them to root, listener will pick up event
            });
            if (error) throw error;
            alert("¡Enlace enviado! Revisa tu correo (y spam).");
            document.getElementById('modal-forgot-pass').style.display = 'none';
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btn.innerText = oldText;
            btn.disabled = false;
        }
    };

    const confirmPasswordChange = async () => {
        const newPass = document.getElementById('new-password-final').value;
        if (!newPass || newPass.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");

        const btn = document.querySelector('#modal-change-pass .btn-primary');
        const oldText = btn.innerText;
        btn.innerText = "ACTUALIZANDO...";
        btn.disabled = true;

        try {
            const { data, error } = await window.sb.auth.updateUser({ password: newPass });
            if (error) throw error;

            alert("✅ ¡Contraseña actualizada con éxito!\nYa tienes acceso completo.");
            document.getElementById('modal-change-pass').style.display = 'none';

            // Refresh valid session
            if (data.user) {
                location.reload(); // Reload to ensure clean state
            }

        } catch (e) {
            alert("Error al actualizar: " + e.message);
            btn.innerText = oldText;
            btn.disabled = false;
        }
    };

    // SECURITY: bypassLogin REMOVED. All access must go through Supabase Auth.
    // If you need emergency access, use Supabase Dashboard directly.

    return {
        init,
        logout,
        toggleUserMenu,
        switchTab,
        attemptLogin,
        submitRegistration,
        showForgotPassword,
        sendPasswordReset,
        confirmPasswordChange,
        getCurrentUser: () => currentUser
    };

})();

// Re-inject styles if needed
if (!document.getElementById('auth-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.innerHTML = `
    @keyframes shake {
      0% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      50% { transform: translateX(10px); }
      75% { transform: translateX(-10px); }
      100% { transform: translateX(0); }
    }`;
    document.head.appendChild(style);
}

window.AuthModule = AuthModule;
