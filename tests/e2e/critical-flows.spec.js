// ============================================
// ViaBarcazas — Critical Flows E2E Tests
// Tests para flujos críticos del producto
// Ejecutar: npx playwright test
// ============================================

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.TEST_URL || 'http://localhost:4001';

// ── HEALTH CHECK ─────────────────────────────
test.describe('API Health', () => {
    test('GET /api/health retorna 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/health`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('status');
    });

    test('GET /api/ais-positions retorna estructura correcta', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/ais-positions`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('total');
        expect(body).toHaveProperty('vessels');
        expect(Array.isArray(body.vessels)).toBe(true);
    });

    test('GET /api/ais-positions soporta paginación', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/ais-positions?page=1&limit=10`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('page', 1);
        expect(body).toHaveProperty('limit', 10);
        expect(body).toHaveProperty('pages');
    });
});

// ── LANDING PAGE ─────────────────────────────
test.describe('Landing Page', () => {
    test('Carga la landing en español', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await expect(page).toHaveTitle(/ViaBarcazas/i);
    });

    test('Pricing page carga correctamente', async ({ page }) => {
        await page.goto(`${BASE_URL}/pricing.html`);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('#plans .card')).toHaveCount(6);
        await expect(page.locator('#plans')).toContainText('Unidad Individual');
        await expect(page.locator('#plans')).toContainText('Combo Flota 25');
        await expect(page.locator('#plans')).toContainText('Combo Flota 150');
    });

    test('Calculadora recomienda un plan y prepara la solicitud comercial', async ({ page }) => {
        await page.goto(`${BASE_URL}/pricing.html`);
        await expect(page.locator('#plans .card')).toHaveCount(6);
        await page.locator('#barges').fill('22');
        await page.locator('#tugs').fill('3');
        await expect(page.locator('#result')).toContainText('Combo Flota 25');
        await expect(page.locator('#result')).toContainText('USD 2,500');
        await page.locator('#proposalButton').click();
        await expect(page.locator('#quoteSummary')).toContainText('22 barcazas y 3 remolcadores');
    });

    test('Calculadora solicita propuesta personalizada para una flota grande', async ({ page }) => {
        await page.goto(`${BASE_URL}/pricing.html`);
        await expect(page.locator('#plans .card')).toHaveCount(6);
        await page.locator('#barges').fill('151');
        await expect(page.locator('#result')).toContainText('Flota personalizada');
        await expect(page.locator('#proposalButton')).toContainText('Solicitar propuesta personalizada');
    });

    test('Onboarding page carga', async ({ page }) => {
        await page.goto(`${BASE_URL}/onboarding.html`);
        await expect(page).toHaveTitle(/ViaBarcazas/i);
    });
});

// ── AUTH ──────────────────────────────────────
test.describe('Autenticación', () => {
    test('Rutas protegidas sin token retornan 401/503', async ({ request }) => {
        // Sin token: debe rechazar
        const res = await request.post(`${BASE_URL}/api/onboarding/company`, {
            data: { name: 'Test Corp', country: 'PY' }
        });
        expect([401, 403, 503]).toContain(res.status());
    });

    test('POST /api/auth/superadmin-login con credenciales vacías retorna 400', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/auth/superadmin-login`, {
            data: {}
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty('error');
    });

    test('POST /api/auth/superadmin-login con credenciales inválidas retorna 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/auth/superadmin-login`, {
            data: { email: 'fake@test.com', password: 'wrongpass' }
        });
        expect([401, 503]).toContain(res.status());
    });
});

// ── ONBOARDING API ────────────────────────────
test.describe('Onboarding API', () => {
    test('GET /api/onboarding/status sin auth retorna error', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/onboarding/status`);
        expect([401, 403, 503]).toContain(res.status());
    });

    test('POST /api/onboarding/company sin auth retorna error', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/onboarding/company`, {
            data: { name: 'Test', country: 'PY' }
        });
        expect([401, 403, 503]).toContain(res.status());
    });
});

// ── AI ENDPOINTS ──────────────────────────────
test.describe('AI Endpoints', () => {
    test('POST /api/ai/chat sin auth retorna error', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/ai/chat`, {
            data: { message: 'Hola' }
        });
        expect([401, 403, 503]).toContain(res.status());
    });

    test('POST /api/ai/eta sin auth retorna error', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/ai/eta`, {
            data: { vessel_id: 'test', destination: 'Rosario' }
        });
        expect([401, 403, 503]).toContain(res.status());
    });
});

// ── SEGURIDAD BÁSICA ──────────────────────────
test.describe('Seguridad', () => {
    test('Headers de seguridad presentes', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/`);
        const headers = res.headers();
        // Helmet debe inyectar estos headers
        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['x-frame-options']).toBeDefined();
    });

    test('superadmin-viabarcazas.html NO contiene contraseñas hardcodeadas', async ({ page }) => {
        await page.goto(`${BASE_URL}/superadmin-viabarcazas.html`);
        const content = await page.content();
        expect(content).not.toContain('viabarcazas2026super');
        expect(content).not.toContain('SA_PASS=');
    });

    test('No hay API keys en archivos JS públicos', async ({ request }) => {
        // Verificar que billing.js no tiene la key de n8n
        const res = await request.get(`${BASE_URL}/js/modules/billing.js`);
        if (res.status() === 200) {
            const body = await res.text();
            expect(body).not.toContain('RH_Secure_n8n');
            expect(body).not.toContain('x-api-key.*riverhub');
        }
    });
});
