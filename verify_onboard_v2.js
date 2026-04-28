import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Set cookies to bypass the (reg) layout gate
  await context.addCookies([
    { name: 'jwt', value: 'fake-jwt', domain: 'localhost', path: '/' },
    { name: 'tok', value: 'fake-tok', domain: 'localhost', path: '/' },
    { name: 'un', value: 'testuser', domain: 'localhost', path: '/' },
    { name: 'id', value: '123', domain: 'localhost', path: '/' },
    { name: 'email', value: 'test@example.com', domain: 'localhost', path: '/' },
    { name: 'when', value: Date.now().toString(), domain: 'localhost', path: '/' }
  ]);

  const page = await context.newPage();

  try {
    console.log('Testing /onboard route...');
    await page.goto('http://localhost:5173/onboard');
    await page.waitForLoadState('networkidle');

    // Check if Bein is in onboarding mode (should show "Step 1 of 4" or similar)
    // Based on the code, show_value defaults to 0 (Hello component)
    // We might need to set the show store to 1 to see the onboarding steps.

    await page.evaluate(() => {
        // Access the store and set it to 1
        // Since it's a Svelte store imported in the component, it might not be directly on window.
        // But we can check for the "Skip to profile" link which is mode-dependent.
    });

    const skipLink = await page.locator('.skip-link');
    const isSkipVisible = await skipLink.isVisible();
    console.log('Skip link visible:', isSkipVisible);

    await page.screenshot({ path: 'onboard_final.png' });

    console.log('Testing /hascama route (short registration)...');
    await page.goto('http://localhost:5173/hascama');
    await page.waitForLoadState('networkidle');

    // Check if Amana is present (Amana1 or Amanaen/Amanar)
    // We can't easily trigger the "Agree" button without knowing its text/id perfectly
    // but we can check the initial state.

    await page.screenshot({ path: 'hascama_final.png' });

  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await browser.close();
  }
})();
