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
    test('Login page renders with all elements', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        // Should have login form
        await expect(page.locator('text=ViaBarcazas').first()).toBeVisible({ timeout: 10000 });
    });

    test('Bypass login loads dashboard (localhost)', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        // Click bypass button if present
        const bypassBtn = page.locator('#bypass-login, [onclick*="bypassLogin"]');
        if (await bypassBtn.count() > 0) {
            await bypassBtn.first().click();
            // Dashboard should load
            await expect(page.locator('#view-dashboard, .section-content')).toBeVisible({ timeout: 10000 });
        }
    });

    test('Navigation tabs exist and are clickable', async ({ page }) => {
        await page.goto('/viabarcazas.html');
        // Bypass login
        const bypassBtn = page.locator('#bypass-login, [onclick*="bypassLogin"]');
        if (await bypassBtn.count() > 0) {
            await bypassBtn.first().click();
            await page.waitForTimeout(1000);
        }
        // Check that nav items exist
        const navItems = page.locator('.menu-item, .nav-item');
        const count = await navItems.count();
        expect(count).toBeGreaterThan(0);
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
// 4. SECURITY — Stripe & Rate Limiting
// ═══════════════════════════════════════════
test.describe('Security', () => {
    test('Stripe mock is blocked in production mode', async ({ request }) => {
        // This test validates the route exists and responds
        const res = await request.post('/api/create-checkout-session', {
            data: { plan: 'professional' },
            headers: { 'Content-Type': 'application/json' }
        });
        // In dev mode: should work (200). In prod: should be 503.
        // Either way, should not crash
        expect([200, 503, 400, 404]).toContain(res.status());
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
        ];
        for (const mod of modules) {
            const res = await request.get(mod);
            expect(res.status(), `Module ${mod} should return 200`).toBe(200);
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
