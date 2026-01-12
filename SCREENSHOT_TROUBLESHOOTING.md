# Screenshot Troubleshooting Guide

## Why Screenshot Might Be Null

### Common Reasons:

1. **Bot Detection / Anti-Scraping**
   - Website detects headless browser
   - Blocks automated access
   - Shows CAPTCHA or blocking page
   - **Example**: Ola Cabs likely has bot detection

2. **Timeout Issues**
   - Page takes too long to load (>30 seconds)
   - Network is slow
   - Website has heavy JavaScript

3. **Puppeteer Not Installed**
   - Chromium not downloaded
   - Missing system dependencies
   - Installation failed

4. **Website Blocks Headless Browsers**
   - Detects `navigator.webdriver`
   - Checks for headless browser signatures
   - Requires real browser

5. **JavaScript Errors**
   - Page has errors that prevent rendering
   - Third-party scripts fail
   - Content Security Policy blocks resources

6. **Authentication Required**
   - Website requires login
   - Geo-blocking
   - Age verification

## For https://www.olacabs.com/ Specifically

### Why It Might Fail:

1. **Bot Detection**: Ola likely has sophisticated bot detection
2. **Heavy JavaScript**: May take longer than 30 seconds
3. **Dynamic Content**: Requires specific user interactions
4. **Anti-Scraping**: Actively blocks automated browsers

### Solutions:

1. **Check Browser Console**: Look for errors in server logs
2. **Increase Timeout**: May need more than 30 seconds
3. **Use Different User Agent**: Already implemented
4. **Add Stealth Mode**: Use puppeteer-extra-plugin-stealth

## How to Debug

### Check Server Logs

Look for these messages:
```
Screenshot capture failed for https://www.olacabs.com/
Visual analysis failed, falling back to HTML parsing
```

### Check Browser Console

In the browser DevTools, check for:
- Network errors
- JavaScript errors
- Console warnings

### Test Puppeteer Directly

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto('https://www.olacabs.com/');
    await page.screenshot({ path: 'test.png' });
    console.log('Screenshot captured!');
  } catch (error) {
    console.error('Error:', error);
  }
  await browser.close();
})();
```

## Fixes Applied

### 1. Better Error Handling
- Screenshot capture can fail independently
- Other extractions continue even if screenshot fails
- Detailed error logging

### 2. Improved User Agent
- More realistic browser signature
- Reduces bot detection

### 3. Fallback Navigation
- If `networkidle2` fails, tries `domcontentloaded`
- Shorter timeout as fallback

### 4. Better Logging
- Warns when screenshot is missing
- Logs specific errors
- Helps identify the issue

## Advanced Solutions

### Option 1: Use Stealth Plugin

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

```typescript
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

this.browser = await puppeteer.launch({...})
```

### Option 2: Increase Timeout

```typescript
await page.goto(url, {
  waitUntil: "networkidle2",
  timeout: 60000, // 60 seconds instead of 30
})
```

### Option 3: Use Different Wait Strategy

```typescript
await page.goto(url, {
  waitUntil: "domcontentloaded", // Faster, less reliable
  timeout: 30000,
})
await page.waitForSelector('body', { timeout: 10000 })
```

### Option 4: Handle Bot Detection

```typescript
// Remove webdriver flag
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  })
})

// Override permissions
const context = browser.defaultBrowserContext()
await context.overridePermissions(url, ['geolocation'])
```

## Current Status

The system now:
- ✅ Continues even if screenshot fails
- ✅ Logs detailed error messages
- ✅ Uses better user agent
- ✅ Has fallback navigation strategy
- ⚠️ Still may fail on heavily protected sites

## Next Steps

If screenshot is still null:
1. Check server console for error messages
2. Try analyzing a simpler website first
3. Consider using stealth plugin
4. Increase timeout if needed
5. Check if Puppeteer is properly installed
