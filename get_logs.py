import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"CONSOLE {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
        
        print("Navigating to http://localhost:8000...")
        await page.goto("http://localhost:8000", wait_until="networkidle")
        await asyncio.sleep(2)
        await browser.close()

asyncio.run(main())
