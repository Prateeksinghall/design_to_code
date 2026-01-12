# Visual Analysis Feature Guide

## Overview

The application now includes **visual analysis** capabilities that overcome previous limitations by:

1. **Taking screenshots** of the rendered website
2. **Extracting colors** from computed styles (not just CSS)
3. **Analyzing typography** from actual rendered text
4. **Detecting layout** structure from the DOM
5. **Combining HTML + Visual** analysis for maximum accuracy

## How It Works

### Architecture

```
User Request
    ↓
POST /api/analyze
    ↓
analyzeWebsite(url, useVisualAnalysis=true)
    ↓
┌─────────────────────────────────────┐
│ 1. Fetch HTML (for title/metadata) │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Visual Analysis (Puppeteer)     │
│    - Launch headless Chrome          │
│    - Navigate to URL                 │
│    - Wait for page load              │
│    - Capture screenshot              │
│    - Extract computed styles         │
│    - Analyze rendered DOM            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. HTML Analysis (Fallback)         │
│    - Parse <style> tags              │
│    - Extract inline styles           │
│    - Find semantic HTML tags         │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Merge Results                    │
│    - Combine visual + HTML data     │
│    - Prioritize visual analysis     │
│    - Fallback to HTML if needed     │
└─────────────────────────────────────┘
    ↓
Return Complete Analysis
```

## Features

### ✅ What Visual Analysis Solves

1. **JavaScript-rendered content**: Captures dynamically generated elements
2. **External CSS files**: Reads computed styles from rendered page
3. **Accurate colors**: Extracts actual rendered colors, not just CSS values
4. **Real typography**: Gets fonts from computed styles
5. **Layout detection**: Analyzes actual DOM structure
6. **Screenshots**: Provides visual reference of the website

### 📊 Comparison

| Feature | HTML-Only | Visual Analysis |
|---------|-----------|-----------------|
| Static HTML | ✅ | ✅ |
| JavaScript Content | ❌ | ✅ |
| External CSS | ❌ | ✅ |
| Computed Styles | ❌ | ✅ |
| Screenshots | ❌ | ✅ |
| Dynamic Content | ❌ | ✅ |
| Accuracy | Medium | High |

## Installation

### Dependencies

The following packages are required:

```json
{
  "puppeteer": "^23.11.1",
  "sharp": "^0.33.5"
}
```

Install them with:
```bash
npm install
```

### System Requirements

- **Node.js**: v18 or higher
- **Chrome/Chromium**: Puppeteer will download Chromium automatically
- **Memory**: At least 2GB RAM recommended for headless browser

## Usage

### Basic Usage

Visual analysis is **enabled by default**:

```typescript
// Automatically uses visual analysis
const analysis = await analyzeWebsite(url)
```

### Disable Visual Analysis

If you want to use HTML-only analysis:

```typescript
const analysis = await analyzeWebsite(url, false)
```

Or via API:

```javascript
fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://example.com',
    useVisualAnalysis: false
  })
})
```

## Configuration

### Timeout Settings

Visual analysis has a 30-second timeout per website. You can adjust this in:

- `lib/visual-analyzer.ts`: Change `timeout: 30000` in `page.goto()`
- `app/api/analyze/route.ts`: Change `maxDuration = 60` for API timeout

### Browser Settings

Modify browser launch options in `lib/visual-analyzer.ts`:

```typescript
this.browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    // Add more args as needed
  ],
})
```

### Viewport Size

Change screenshot dimensions:

```typescript
await page.setViewport({ width: 1920, height: 1080 })
```

## Performance

### Speed

- **HTML-only**: ~1-2 seconds
- **Visual analysis**: ~5-10 seconds (depends on page load time)

### Optimization Tips

1. **Parallel processing**: Visual analysis runs multiple extractions in parallel
2. **Caching**: Consider caching results for frequently analyzed URLs
3. **Timeout**: Adjust timeouts based on your needs

## Troubleshooting

### Common Issues

1. **Puppeteer fails to launch**
   - Ensure Chromium is downloaded: `npx puppeteer browsers install chrome`
   - Check system dependencies (varies by OS)

2. **Timeout errors**
   - Increase timeout in `visual-analyzer.ts`
   - Check if website is slow to load

3. **Memory issues**
   - Close browser after each analysis (already implemented)
   - Reduce viewport size

4. **CORS/Blocking**
   - Some sites block headless browsers
   - Falls back to HTML-only analysis automatically

### Fallback Behavior

If visual analysis fails, the system automatically falls back to HTML-only analysis:

```typescript
try {
  // Visual analysis
} catch (visualError) {
  console.warn("Visual analysis failed, falling back to HTML parsing")
  // HTML-only analysis
}
```

## API Reference

### `VisualAnalyzer` Class

```typescript
class VisualAnalyzer {
  async init(): Promise<void>
  async close(): Promise<void>
  async captureScreenshot(url: string): Promise<string>
  async extractVisualColors(url: string): Promise<Color[]>
  async extractVisualTypography(url: string): Promise<Typography[]>
  async analyzeVisualLayout(url: string): Promise<Layout>
  async analyzeWebsite(url: string): Promise<AnalysisResult>
}
```

### `analyzeWebsite()` Function

```typescript
analyzeWebsite(
  url: string,
  useVisualAnalysis: boolean = true
): Promise<WebsiteAnalysis>
```

## Future Enhancements

Potential improvements:

1. **AI Vision Analysis**: Use GPT-4 Vision or similar to analyze screenshots
2. **Color Palette Extraction**: Use image processing to extract dominant colors
3. **Component Detection**: Identify UI components from visual patterns
4. **Responsive Analysis**: Test multiple viewport sizes
5. **Performance Metrics**: Analyze page load times, etc.

## Security Considerations

- Puppeteer runs in a sandboxed environment
- Only analyzes publicly accessible URLs
- Screenshots are base64-encoded and stored in memory
- No persistent storage of screenshots (unless explicitly saved)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Puppeteer installation
3. Test with a simple website first
4. Check network connectivity
