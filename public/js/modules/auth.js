// js/modules/auth.js

var AuthModule = (() => {

    let currentUser = null;

    const init = async () => {
        void("Auth System Initializing...");

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
                void("AUTH EVENT:", event);
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
            RiverToast.error(`Error de Inicio de Sesión:\\n${err.message}`, "Fallo Auth");

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
            void("DEBUG: Session Found", data.session);
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
            void("No session -> Showing Login View");
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
        // 1. Mostrar todo por defecto
        const allNavs = document.querySelectorAll('.menu a');
        allNavs.forEach(el => {
            el.style.display = 'flex';
        });

        // HIDE GLOBAL BACKOFFICE FOR EVERYONE EXCEPT SUPERADMIN
        if (role !== 'superadmin') {
            hideNav(['nav-backoffice']);
        }

        // 2. Reglas por Rol
        if (role === 'superadmin') {
            // Ve todo absoluto
        } else if (role === 'admin') {
            // Admin de Empresa: Ve todo menos el backoffice global de ViaBarcazas
            hideNav(['nav-backoffice']);
        } else if (role === 'operator') {
            // Personal Operativo (Capitanes, Armadores): NO ven facturación ni consolas admin
            hideNav(['nav-backoffice', 'nav-admin-console', 'nav-billing', 'nav-auditoria', 'nav-integraciones']);
        } else if (role === 'viewer' || role === 'user') {
            // Invitado/Visor: Solo dashboards y tracking. Nada operativo ni administrativo.
            hideNav([
                'nav-backoffice', 'nav-admin-console', 'nav-billing', 'nav-auditoria', 'nav-integraciones',
                'nav-convoys', 'nav-mantenimiento', 'nav-incidentes', 'nav-bitacora', 'nav-comunicaciones',
                'nav-loadmaster'
            ]);
        } else if (role === 'crew') { // Legacy role
            hideNav(['nav-dashboard', 'nav-mapa', 'nav-comunicaciones', 'nav-cotizador', 'nav-docs', 'nav-integraciones', 'nav-backoffice', 'nav-admin-console', 'nav-billing']);
        }

        // Apply Flutter sidebar icon colors after permissions are set
        if (window._applyFlutterSidebarColors) {
            setTimeout(window._applyFlutterSidebarColors, 100);
        }
    };

    const hideNav = (ids) => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.setProperty('display', 'none', 'important');
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
        const card = document.querySelector('.login-card');

        // Reset Tabs
        tabs.forEach(t => t.classList.remove('active'));

        // Toggle Views
        if (mode === 'login') {
            if (card) card.classList.remove('register-mode');
            if (tabs[0]) tabs[0].classList.add('active');
            if (loginForm) loginForm.style.display = 'block';
            if (regForm) regForm.style.display = 'none';
        } else {
            if (card) card.classList.add('register-mode');
            if (tabs[1]) tabs[1].classList.add('active');
            if (loginForm) loginForm.style.display = 'none';
            if (regForm) regForm.style.display = 'grid';
        }
    };

    const submitRegistration = async () => {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        // New Professional Fields
        const company = document.getElementById('reg-company').value;
        const roleTitle = document.getElementById('reg-role')?.value || '';
        const phone = document.getElementById('reg-phone').value;
        const operation = document.getElementById('reg-operation')?.value || '';
        const country = document.getElementById('reg-country')?.value.trim() || '';
        const fleet = {
            tugs: Number(document.getElementById('reg-tugs')?.value || 0),
            barges: Number(document.getElementById('reg-barges')?.value || 0),
            tankers: Number(document.getElementById('reg-tankers')?.value || 0)
        };

        if (!name || !email || !pass || !company || !phone || !operation) {
            RiverToast.warning("Completá nombre, empresa, teléfono, operación, email y contraseña.", "Registro Incompleto");
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
                    data: {
                        full_name: name,
                        company,
                        job_title: roleTitle,
                        phone,
                        operation,
                        country,
                        fleet
                    }
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

                RiverToast.success(`Tu cuenta está en proceso de revisión.\\nPuedes ingresar, pero algunas funciones pueden estar limitadas hasta la aprobación.`, `¡Bienvenido, ${name}!`);
                switchTab('login');
            }

        } catch (e) {
            RiverToast.error("Error en registro: " + e.message, "Fallo al Registrar");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    const updatePlanEstimate = () => {
        const estimate = document.getElementById('registration-estimate');
        if (!estimate) return;
        const total = ['reg-tugs', 'reg-barges', 'reg-tankers']
            .map(id => Number(document.getElementById(id)?.value || 0))
            .reduce((sum, value) => sum + Math.max(0, value), 0);
        const plan = total <= 5
            ? ['Amarre', 'Hasta 5 embarcaciones · 14 días de prueba']
            : total <= 20
                ? ['Convoy', 'Hasta 20 embarcaciones · 14 días de prueba']
                : ['Armador', 'Flota completa · cotización personalizada'];
        estimate.innerHTML = `<strong>Plan sugerido: ${plan[0]}</strong><span>${plan[1]}</span>`;
    };

    const showForgotPassword = (event) => {
        if (event) event.preventDefault();
        const modal = document.getElementById('modal-forgot-pass');
        const loginError = document.getElementById('login-error-msg');
        const emailInput = document.getElementById('forgot-email');
        if (loginError) loginError.style.display = 'none';
        if (modal) modal.style.display = 'flex';
        if (emailInput) {
            emailInput.value = '';
            setTimeout(() => emailInput.focus(), 50);
        }
        return false;
    };

    const sendPasswordReset = async () => {
        const email = document.getElementById('forgot-email').value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return RiverToast.warning("Ingresá tu email para continuar.", "Email requerido");
        if (!emailPattern.test(email)) return RiverToast.warning("Ingresá un email válido.", "Email inválido");

        const btn = document.querySelector('#modal-forgot-pass .btn-primary');
        const oldText = btn.innerText;
        btn.innerText = "ENVIANDO...";
        btn.disabled = true;

        try {
            const { error } = await window.sb.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`,
            });
            if (error) throw error;
            RiverToast.success("Listo. Revisá tu correo para restablecer tu contraseña.", "Recuperación iniciada");
            document.getElementById('modal-forgot-pass').style.display = 'none';
        } catch (e) {
            RiverToast.error("Error al enviar enlace: " + e.message, "Fallo de Sistema");
        } finally {
            btn.innerText = oldText;
            btn.disabled = false;
        }
    };

    const confirmPasswordChange = async () => {
        const newPass = document.getElementById('new-password-final').value;
        if (!newPass || newPass.length < 6) return RiverToast.warning("La contraseña debe tener al menos 6 caracteres por seguridad.", "Contraseña Insegura");

        const btn = document.querySelector('#modal-change-pass .btn-primary');
        const oldText = btn.innerText;
        btn.innerText = "ACTUALIZANDO...";
        btn.disabled = true;

        try {
            const { data, error } = await window.sb.auth.updateUser({ password: newPass });
            if (error) throw error;

            RiverToast.success("¡Contraseña actualizada con éxito! Ya tienes acceso completo.", "Seguridad Restablecida");
            document.getElementById('modal-change-pass').style.display = 'none';

            // Refresh valid session
            if (data.user) {
                location.reload(); // Reload to ensure clean state
            }

        } catch (e) {
            RiverToast.error("Error al actualizar contraseña: " + e.message, "Fallo en Cambio");
            btn.innerText = oldText;
            btn.disabled = false;
        }
    };

    // OFFLINE SIMULATOR MODE: STRICTLY localhost only
    const bypassLogin = () => {
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isLocal) {
            console.error('🔒 SECURITY: bypassLogin blocked in production.');
            if (typeof RiverToast !== 'undefined') RiverToast.error('Acceso denegado. Modo simulador solo disponible en desarrollo local.', 'Seguridad');
            return;
        }
        void("🔓 MODO SIMULADOR ACTIVADO (localhost only)");
        const simulatedUser = {
            id: 'sim-user-001',
            email: 'simulador@viabarcazas.local',
            full_name: 'Capitán Simulador',
            role: 'operator',
            company: 'ViaBarcazas Demo'
        };
        login(simulatedUser);
    };

    const togglePasswordVisibility = (inputId, btnEl) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        const icon = btnEl.querySelector('i');
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        if (icon) {
            icon.classList.toggle('fa-eye', !isHidden);
            icon.classList.toggle('fa-eye-slash', isHidden);
        }
    };

    return {
        init,
        logout,
        toggleUserMenu,
        switchTab,
        attemptLogin,
        bypassLogin,
        submitRegistration,
        updatePlanEstimate,
        showForgotPassword,
        sendPasswordReset,
        confirmPasswordChange,
        togglePasswordVisibility,
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
