
import { test, expect } from '@playwright/test';

test.setTimeout(60000);

const baseUrl = 'http://localhost:5173';

test('Registration flow: Agreement -> Password', async ({ page, context }) => {
    // Set cookies to simulate being "half-registered" or bypass initial checks if needed
    // But here we want to test the flow from /aitifaqia
    await page.goto(`${baseUrl}/aitifaqia`);

    // Check if we see the Agreement (Amana)
    // The button has a specific class or text. In amana.svelte it's often a button with "אני מסכים" or similar.
    // Based on the code, it's a button that calls 'סיימתי' or similar.
    const agreeButton = page.locator('button').filter({ hasText: /אני מסכים|מסכימה|Agree|I Agree/i });
    await expect(agreeButton.first()).toBeVisible();

    await agreeButton.first().click();

    // After clicking agree, it should show Bein in registration mode at step 5 (Password)
    // We can check for the Password component content
    await expect(page.locator('text=סיסמה|Password')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('Onboarding page: /onboard', async ({ page, context }) => {
    // We need to be logged in to see /onboard because of (reg) layout
    await context.addCookies([
        { name: 'id', value: '123', domain: 'localhost', path: '/' },
        { name: 'un', value: 'testuser', domain: 'localhost', path: '/' },
        { name: 'jwt', value: 'fake-token', domain: 'localhost', path: '/' },
        { name: 'when', value: Date.now().toString(), domain: 'localhost', path: '/' }
    ]);

    await page.goto(`${baseUrl}/onboard`);

    // Check if we see the Bein component in onboarding mode
    // It might start at step 0 (Hello) or step 1 (Values) if we changed it.
    // Let's check for the "Skip to profile" link which we added.
    const skipLink = page.locator('text=עבור לפרופיל|Skip to profile');
    await expect(skipLink).toBeVisible();

    // Check for tabs
    await expect(page.locator('text=ערכים|Values')).toBeVisible();
});
