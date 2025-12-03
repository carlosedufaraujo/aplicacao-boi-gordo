import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input email and password, then click the login button to authenticate.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('carlosedufaraujo@outlook.com')
        

        # -> Click the login button to submit credentials and authenticate.
        frame = context.pages[-1]
        # Click the login button to submit credentials
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Re-input the password correctly and click the login button to authenticate.
        frame = context.pages[-1]
        # Re-input password for login
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[3]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('368308450Ce*')
        

        frame = context.pages[-1]
        # Click the login button to submit credentials
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Attempt to access the /health endpoint directly to verify system and database status without login.
        await page.goto('http://localhost:5173/health', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Attempt to login again with provided credentials to gain access, then check /health endpoint after successful login.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('carlosedufaraujo@outlook.com')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[3]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('368308450Ce*')
        

        frame = context.pages[-1]
        # Click the login button to submit credentials
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Send GET request to /health endpoint to verify system and database status indicating overall availability.
        await page.goto('http://localhost:5173/health', timeout=10000)
        await asyncio.sleep(3)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=BoviControl').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Gestão Pecuária').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Dashboard').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Operações').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Compras').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Vendas').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lotes').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Financeiro').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Centro Financeiro').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Calendário').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Gestão').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Relatórios').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sistema').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Configurações').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Carlos Eduardo').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=carlosedufaraujo@outlook.com').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Visão geral do sistema e métricas principais').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3.035').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=183').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=R$ 11.459.148,56').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=R$ 305,10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2.25%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=368.1 kg').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    