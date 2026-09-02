// tests/e2e/smoke.spec.js — ViaBarcazas E2E Smoke Tests
const { test, expect } = require('@playwright/test');

// ═══════════════════════════════════════════
// 1. SERVER HEALTH
// ═══════════════════════════════════════════
test.describe('Server Health', () => {
    test('GET / returns 200 and serves the main app', async ({ request }) => {
        const res = await request.get('/');
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).toContain('ViaBarcazas');
    });

    test('GET /viabarcazas.html returns 200', async ({ request }) => {
        const res = await request.get('/viabarcazas.html');
        expect(res.status()).toBe(200);
    });

    test('API rate limiter headers are present', async ({ request }) => {
        const res = await request.get('/api/ais-positions');
        // Rate limit headers from express-rate-limit
        const headers = res.headers();
        expect(headers['ratelimit-limit'] || headers['x-ratelimit-limit']).toBeTruthy();
    });
});

// ═══════════════════════════════════════════
// 2. VIABARCAZAS SPA — LOGIN & NAVIGATION
// ═══════════════════════════════════════════
test.describe('ViaBarcazas SPA', () => {
    test('Login page renders protected access controls', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        await expect(page.locator('#login-screen')).toBeVisible({ timeout: 10000 });
        await expect(page.getByPlaceholder('usuario@empresa.com')).toBeVisible();
        await expect(page.getByRole('button', { name: /Iniciar Sesi[oó]n/ })).toBeVisible();
    });

    test('Unauthenticated users remain on the login screen', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        await expect(page.locator('#login-screen')).toBeVisible();
        await expect(page.getByPlaceholder('usuario@empresa.com')).toBeVisible();
    });

    test('Navigation shell includes operational sections', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        const navItems = page.locator('.menu-item, .nav-item');
        await expect(navItems).not.toHaveCount(0);
        await expect(page.locator('[data-view="liquidos"]')).toHaveCount(1);
    });

    test('Liquids view is included in the protected application shell', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        await expect(page.locator('[data-view="liquidos"]')).toHaveCount(1);
        await expect(page.locator('#view-liquidos')).toHaveCount(1);
        await expect(page.locator('#liq-count')).toHaveCount(1);
        await expect(page.locator('#liq-list')).toHaveCount(1);
    });

    test('No console errors on load', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        await page.goto('/viabarcazas.html');
        await page.waitForTimeout(2000);
        // Filter out expected Supabase auth noise
        const realErrors = errors.filter(e =>
            !e.includes('refresh_token') &&
            !e.includes('AuthApiException') &&
            !e.includes('Failed to fetch') &&
            !e.includes('NetworkError')
        );
        expect(realErrors).toHaveLength(0);
    });
});

// ═══════════════════════════════════════════
// 3. MAIN APP — ADMIN DASHBOARD
// ═══════════════════════════════════════════
test.describe('Main App', () => {
    test('App.html loads without crashing', async ({ request }) => {
        const res = await request.get('/app.html');
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).toContain('ViaBarcazas');
        expect(body.length).toBeGreaterThan(10000); // 5000-line file
    });

    test('Static assets load (CSS/JS)', async ({ page }) => {
        const failedRequests = [];
        page.on('response', res => {
            if (res.status() >= 400 && res.url().match(/\.(js|css)$/)) {
                failedRequests.push(`${res.status()} ${res.url()}`);
            }
        });
        await page.goto('/app.html');
        await page.waitForTimeout(3000);
        expect(failedRequests).toHaveLength(0);
    });
});

// ═══════════════════════════════════════════
// 4. SECURITY — Commercial flow & Rate Limiting
// ═══════════════════════════════════════════
test.describe('Security', () => {
    test('old checkout is retired and price catalog is public', async ({ request }) => {
        const checkout = await request.post('/api/create-checkout', { data: {} });
        expect(checkout.status()).toBe(410);
        const catalog = await request.get('/api/pricing');
        expect(catalog.status()).toBe(200);
        expect((await catalog.json()).plans).toHaveLength(5);
    });

    test('Security headers are present', async ({ request }) => {
        const res = await request.get('/');
        const headers = res.headers();
        // HSTS or X-Content-Type-Options should be set
        expect(
            headers['strict-transport-security'] ||
            headers['x-content-type-options'] ||
            headers['permissions-policy']
        ).toBeTruthy();
    });
});

// ═══════════════════════════════════════════
// 5. MODULE INTEGRITY — Extracted modules load
// ═══════════════════════════════════════════
test.describe('Module Integrity', () => {
    test('Extracted viabarcazas modules are accessible', async ({ request }) => {
        const modules = [
            '/js/modules/viabarcazas-exports.js',
            '/js/modules/viabarcazas-hidrologia.js',
            '/js/modules/viabarcazas-briefing.js',
            '/js/modules/liquidos-viabarcazas.js',
        ];
        for (const mod of modules) {
            const res = await request.get(mod);
            expect(res.status(), `Module ${mod} should return 200`).toBe(200);
        }
    });

    test('Liquids admin pages are accessible in both languages', async ({ request }) => {
        const pages = [
            '/admin-liquidos-viabarcazas.html',
            '/admin-liquidos-viabarcazas-en.html',
        ];
        for (const path of pages) {
            const res = await request.get(path);
            expect(res.status(), `${path} should return 200`).toBe(200);
            const body = await res.text();
            expect(body).toContain('liquidos-viabarcazas.js');
        }
    });

    test('Extracted admin modules are accessible', async ({ request }) => {
        const modules = [
            '/js/modules/admin-dashboard.js',
            '/js/modules/admin-views-clients.js',
            '/js/modules/admin-views-ops.js',
        ];
        for (const mod of modules) {
            const res = await request.get(mod);
            expect(res.status(), `Module ${mod} should return 200`).toBe(200);
        }
    });
});
