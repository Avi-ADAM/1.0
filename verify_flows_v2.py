
import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()

        # Test Onboarding
        await context.add_cookies([
            {'name': 'id', 'value': '123', 'domain': 'localhost', 'path': '/'},
            {'name': 'un', 'value': 'testuser', 'domain': 'localhost', 'path': '/'},
            {'name': 'jwt', 'value': 'fake-token', 'domain': 'localhost', 'path': '/'},
            {'name': 'when', 'value': '9999999999999', 'domain': 'localhost', 'path': '/'}
        ])
        page = await context.new_page()

        print("Navigating to /onboard...")
        try:
            await page.goto('http://localhost:5173/onboard', wait_until='networkidle')
            await page.wait_for_timeout(3000)
            await page.screenshot(path='onboard_final_check.png')

            content = await page.content()
            if "עבור לפרופיל" in content or "Skip to profile" in content:
                print("SUCCESS: Skip link visible on /onboard")
            else:
                print("FAILURE: Skip link NOT visible on /onboard")
                print(f"Page title: {await page.title()}")
        except Exception as e:
            print(f"Error on /onboard: {e}")

        # Test Registration Transition
        print("Navigating to /aitifaqia...")
        try:
            await page.goto('http://localhost:5173/aitifaqia', wait_until='networkidle')
            await page.wait_for_timeout(3000)

            # Look for ANY button to see what we have
            buttons = await page.locator('button').all_inner_texts()
            print(f"Found buttons: {buttons}")

            # Try to find the agree button in Arabic for /aitifaqia
            # The Arabic text for Agree in amanar.svelte is likely "أوافق" or "מסכים" if it's mixed
            agree_selectors = [
                "text=أوافق", "text=Agree", "text=I Agree", "text=מסכים",
                "button:has-text('أوافق')", "button:has-text('Agree')"
            ]

            clicked = False
            for selector in agree_selectors:
                try:
                    btn = page.locator(selector).first
                    if await btn.is_visible():
                        await btn.click()
                        clicked = True
                        print(f"Clicked agree using: {selector}")
                        break
                except:
                    continue

            if clicked:
                await page.wait_for_timeout(3000)
                await page.screenshot(path='after_agree.png')
                content_after = await page.content()
                if "סיסמה" in content_after or "Password" in content_after or "كلمة المرور" in content_after:
                    print("SUCCESS: Transitioned to Password step")
                else:
                    print("FAILURE: Did not transition to Password step")
            else:
                print("FAILURE: Could not find Agree button")
                await page.screenshot(path='aitifaqia_error.png')
        except Exception as e:
            print(f"Error on /aitifaqia: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
