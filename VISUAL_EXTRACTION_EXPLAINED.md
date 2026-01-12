# How Visual Design Extraction Works

## Overview

The visual design extraction system uses **Puppeteer** (headless Chrome) to render websites and extract design tokens from the **actual rendered page**, not just the HTML source code. This overcomes limitations of static HTML parsing.

---

## Complete Extraction Flow

```
User enters URL
    ↓
┌─────────────────────────────────────────┐
│ STEP 1: Fetch HTML (Quick Metadata)    │
│ - Get page title                        │
│ - Extract basic structure               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 2: Launch Headless Browser         │
│ - Puppeteer launches Chromium          │
│ - Creates new browser instance          │
│ - Sets viewport (1920x1080)            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 3: Navigate & Render              │
│ - Navigate to URL                      │
│ - Wait for "networkidle2" (no requests)│
│ - Wait 2 seconds for JS to execute     │
│ - Page is fully rendered               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 4: Capture Screenshot             │
│ - Take PNG screenshot                   │
│ - Encode as base64                      │
│ - Store as data URI                     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 5: Extract Colors (Computed)      │
│ - Get ALL elements: querySelectorAll("*")│
│ - For each element:                     │
│   • window.getComputedStyle(element)    │
│   • Extract backgroundColor             │
│   • Extract color (text)                │
│   • Extract borderColor                 │
│ - Convert RGB → Hex                      │
│ - Filter black/white                    │
│ - Deduplicate                           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 6: Extract Typography (Rendered)   │
│ - Find headings: h1-h6                  │
│ - Get computed styles for each          │
│ - Extract:                               │
│   • fontFamily                          │
│   • fontSize                            │
│   • fontWeight                          │
│   • lineHeight                          │
│ - Find body text: p, span, div, li      │
│ - Find small text: small, .text-sm       │
│ - Categorize: heading/body/caption      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 7: Analyze Layout (DOM Structure)  │
│ - Find semantic tags: header, nav, etc.│
│ - Check display properties:            │
│   • grid, flex, block                   │
│ - Detect layout type:                   │
│   • single-column                       │
│   • multi-column                        │
│   • grid                                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 8: Merge with HTML Analysis       │
│ - Combine visual + HTML colors          │
│ - Prioritize visual (more accurate)     │
│ - Merge typography                      │
│ - Use best layout data                  │
└─────────────────────────────────────────┘
    ↓
Return Complete Analysis
```

---

## Detailed Technical Explanation

### 1. Headless Browser Setup

```typescript
// lib/visual-analyzer.ts
this.browser = await puppeteer.launch({
  headless: true,  // No GUI, runs in background
  args: [
    "--no-sandbox",              // Security
    "--disable-setuid-sandbox",  // Security
    "--disable-dev-shm-usage",   // Memory
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
  ],
})
```

**Why?** Puppeteer controls a real Chrome browser, so it:
- Executes JavaScript
- Loads external CSS files
- Renders the page exactly as users see it
- Gets computed styles (final rendered values)

---

### 2. Color Extraction Process

#### The Problem with HTML-Only:
```html
<!-- HTML source might have: -->
<style>
  .button { background: var(--primary-color); }
</style>
```
- Can't see the actual color value
- CSS variables not resolved
- External stylesheets not parsed

#### Visual Analysis Solution:
```typescript
// In browser context (page.evaluate)
const allElements = document.querySelectorAll("*")

allElements.forEach((element) => {
  const styles = window.getComputedStyle(element)
  // styles.backgroundColor = "rgb(59, 130, 246)" ✅ Actual rendered color!
  // styles.color = "rgb(0, 0, 0)" ✅ Real text color!
})
```

**Key Functions:**
1. `window.getComputedStyle(element)` - Gets FINAL rendered styles
2. Converts RGB → Hex: `rgb(59, 130, 246)` → `#3B82F6`
3. Filters out transparent/black/white
4. Deduplicates colors

**Example:**
```javascript
// Element in page:
<div style="background: linear-gradient(...)">  // Complex CSS
  <button class="btn-primary">Click</button>   // CSS class
</div>

// Computed styles show:
// div: backgroundColor = "rgb(59, 130, 246)"  ← Actual gradient result
// button: backgroundColor = "rgb(99, 102, 241)"  ← From CSS file
```

---

### 3. Typography Extraction

#### HTML-Only Limitation:
```html
<!-- Only sees: -->
<style>
  h1 { font-family: 'Inter', sans-serif; }
</style>
```
- Doesn't know actual font size
- Can't see font-weight from CSS
- Missing line-height

#### Visual Analysis:
```typescript
// Get headings
const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
headings.forEach((heading) => {
  const styles = window.getComputedStyle(heading)
  // styles.fontFamily = "Inter, sans-serif" ✅
  // styles.fontSize = "2.25rem" ✅ Actual size!
  // styles.fontWeight = "700" ✅ Real weight!
  // styles.lineHeight = "1.2" ✅
})
```

**Why This Matters:**
- Gets actual font sizes (not just CSS declarations)
- Captures font-weight from computed styles
- Sees line-height values
- Works with CSS-in-JS, styled-components, etc.

---

### 4. Layout Detection

#### Visual Analysis Approach:
```typescript
// Check semantic HTML
const semanticTags = ["header", "nav", "main", "section", "article", "footer"]
semanticTags.forEach((tag) => {
  if (document.querySelector(tag)) {
    sections.push(tag)  // Found in rendered DOM
  }
})

// Detect layout type
const mainContent = document.querySelector("main")
const children = Array.from(mainContent?.children || [])
const hasMultipleColumns = children.some((child) => {
  const styles = window.getComputedStyle(child)
  return (
    styles.display === "grid" ||      // CSS Grid
    styles.display === "flex" ||       // Flexbox
    child.classList.contains("grid")  // Utility class
  )
})
```

**Benefits:**
- Detects actual layout (not just HTML structure)
- Sees CSS Grid/Flexbox usage
- Identifies responsive breakpoints
- Works with modern CSS frameworks

---

### 5. Screenshot Capture

```typescript
const screenshot = await page.screenshot({
  type: "png",
  fullPage: false,  // Only viewport (1920x1080)
  encoding: "base64",
})
return `data:image/png;base64,${screenshot}`
```

**Purpose:**
- Visual reference for AI code generation
- User can see what was analyzed
- Helps verify extraction accuracy
- Can be used for future AI vision analysis

---

## Why Visual Analysis is Better

| Feature | HTML-Only | Visual Analysis |
|---------|-----------|-----------------|
| **JavaScript Content** | ❌ Not executed | ✅ Fully rendered |
| **External CSS** | ❌ Not loaded | ✅ Fully loaded |
| **CSS Variables** | ❌ Not resolved | ✅ Resolved values |
| **Computed Styles** | ❌ Not available | ✅ Real values |
| **Dynamic Content** | ❌ Missing | ✅ Captured |
| **Screenshots** | ❌ No | ✅ Yes |
| **Framework Support** | ⚠️ Limited | ✅ Works with all |
| **Accuracy** | ⚠️ Medium | ✅ High |

---

## Code Flow Example

### Real-World Scenario:

**Website:** https://example.com

1. **HTML Source:**
   ```html
   <div class="hero" style="background: var(--primary)">
     <h1 class="title">Welcome</h1>
   </div>
   ```

2. **CSS File (external):**
   ```css
   :root { --primary: #3B82F6; }
   .title { font-size: 3rem; font-weight: 700; }
   ```

3. **Visual Analysis Process:**
   ```javascript
   // Puppeteer renders page
   // CSS variables resolved
   // JavaScript executed
   
   // Extract colors:
   const hero = document.querySelector('.hero')
   const styles = window.getComputedStyle(hero)
   // styles.backgroundColor = "rgb(59, 130, 246)" ✅
   // Convert: #3B82F6 ✅
   
   // Extract typography:
   const title = document.querySelector('.title')
   const titleStyles = window.getComputedStyle(title)
   // titleStyles.fontSize = "48px" ✅ (3rem computed)
   // titleStyles.fontWeight = "700" ✅
   ```

4. **Result:**
   ```json
   {
     "colors": [
       { "hex": "#3B82F6", "usage": "primary" }
     ],
     "typography": [
       {
         "fontFamily": "Inter",
         "fontSize": "48px",
         "fontWeight": 700,
         "usage": "heading"
       }
     ]
   }
   ```

---

## Performance Considerations

### Timing:
- **HTML fetch**: ~500ms
- **Browser launch**: ~2-3 seconds (first time)
- **Page navigation**: ~2-5 seconds (depends on site)
- **Extraction**: ~1-2 seconds
- **Total**: ~5-10 seconds

### Optimization:
- Browser instance reused (singleton pattern)
- Parallel extraction (colors + typography + layout)
- Automatic fallback to HTML-only if visual fails
- Timeout protection (30 seconds max)

---

## Error Handling

```typescript
try {
  // Visual analysis
  const visualAnalysis = await visualAnalyzer.analyzeWebsite(url)
} catch (visualError) {
  console.warn("Visual analysis failed, falling back to HTML parsing")
  // Automatically uses HTML-only analysis
  designSystem = extractDesignSystem(html, url)
}
```

**Fallback Strategy:**
1. Try visual analysis first
2. If fails → Use HTML parsing
3. Always return some result
4. User never sees error (graceful degradation)

---

## Future Enhancements

1. **AI Vision Analysis:**
   - Use GPT-4 Vision to analyze screenshots
   - Extract component patterns
   - Identify design trends

2. **Color Palette Extraction:**
   - Use image processing algorithms
   - Extract dominant colors from screenshot
   - Create color palettes automatically

3. **Component Detection:**
   - Identify buttons, cards, forms
   - Extract component patterns
   - Generate component library

4. **Responsive Analysis:**
   - Test multiple viewport sizes
   - Extract breakpoint values
   - Analyze mobile/tablet/desktop

---

## Summary

Visual design extraction works by:

1. **Rendering** the website in a real browser
2. **Executing** all JavaScript and loading all CSS
3. **Extracting** computed styles (final rendered values)
4. **Capturing** screenshots for reference
5. **Merging** with HTML analysis for completeness

This approach provides **accurate, real-world design tokens** that reflect what users actually see, not just what's in the source code.
