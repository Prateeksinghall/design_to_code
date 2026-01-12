# Where to Find the Base64-Encoded Screenshot

## 📍 Location 1: In the Browser (UI Display)

### Visual Display
- **Location**: Analysis Results page, after analyzing a website
- **Component**: `components/analysis-result.tsx`
- **How to see**: The screenshot is displayed as an image in the UI
- **Format**: Already rendered as `<img src={analysis.screenshot} />`

### Access via Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type:
```javascript
// If you have the analysis object in scope
console.log(analysis.screenshot)

// Or access from React DevTools
// The screenshot is in the component state
```

---

## 📍 Location 2: In Downloaded JSON Files

### AI-Ready Data Export
When you download "AI-Ready Data", the screenshot is included:

**File**: `ai-ready-{domain}-{date}.json`

**Structure**:
```json
{
  "visual": {
    "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "screenshotFormat": "base64-png"
  }
}
```

**Path in JSON**: `visual.screenshot`

### Complete Analysis Export
When you download "Complete Analysis (JSON)":

**File**: `{domain}-{date}.json`

**Structure**:
```json
{
  "url": "https://example.com",
  "title": "Example",
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "designSystem": { ... }
}
```

**Path in JSON**: `screenshot` (root level)

---

## 📍 Location 3: In the Code/Data Structure

### TypeScript Interface
**File**: `lib/types.ts`

```typescript
export interface WebsiteAnalysis {
  url: string
  title: string
  screenshot?: string  // ← Base64-encoded screenshot here
  designSystem: DesignSystem
  layout: { ... }
  extractedAt: string
}
```

### Access in Code
```typescript
// In any component or function that receives WebsiteAnalysis
const screenshot = analysis.screenshot

// Format: "data:image/png;base64,{base64_string}"
// Example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
```

---

## 📍 Location 4: In API Response

### API Endpoint
**Endpoint**: `POST /api/analyze`

**Response Structure**:
```json
{
  "url": "https://example.com",
  "title": "Example",
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "designSystem": { ... },
  "layout": { ... },
  "extractedAt": "2026-01-12T13:00:00.000Z"
}
```

**How to access**:
```javascript
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://example.com' })
})
const data = await response.json()
const screenshot = data.screenshot  // ← Base64 screenshot here
```

---

## 📍 Location 5: Extract from Data URI

### Current Format
The screenshot is stored as a **Data URI**:
```
data:image/png;base64,{base64_string}
```

### Extract Base64 Only
If you need just the base64 string (without the data URI prefix):

```javascript
// From Data URI to Base64 string
const dataUri = analysis.screenshot  // "data:image/png;base64,iVBORw0KGgo..."
const base64String = dataUri.replace(/^data:image\/\w+;base64,/, "")
// Result: "iVBORw0KGgoAAAANSUhEUgAA..."
```

### Extract from Different Formats
```javascript
// Method 1: Regex
const base64 = screenshot.replace(/^data:image\/\w+;base64,/, "")

// Method 2: Split
const base64 = screenshot.split(',')[1]

// Method 3: Substring (if format is consistent)
const base64 = screenshot.substring(22)  // After "data:image/png;base64,"
```

---

## 📍 Location 6: In React Component State

### In Analysis Result Component
**File**: `components/analysis-result.tsx`

```typescript
// The screenshot is passed as prop
export function AnalysisResult({ analysis }: AnalysisResultProps) {
  // analysis.screenshot contains the base64 data URI
  const screenshot = analysis.screenshot
  
  // It's used directly in img tag
  <img src={analysis.screenshot} alt="..." />
}
```

### In Code Preview Component
**File**: `components/code-preview.tsx`

```typescript
export function CodePreview({ analysis }: CodePreviewProps) {
  // Check if screenshot exists
  const hasScreenshot = !!analysis.screenshot
  
  // Access screenshot
  const screenshot = analysis.screenshot
}
```

---

## 📍 Location 7: In Visual Analyzer

### Where It's Created
**File**: `lib/visual-analyzer.ts`

**Function**: `captureScreenshot()`

```typescript
async captureScreenshot(url: string): Promise<string> {
  // ... browser setup ...
  
  const screenshot = await page.screenshot({
    type: "png",
    fullPage: false,
    encoding: "base64",
  })
  
  // Returns as data URI
  return `data:image/png;base64,${screenshot}`
}
```

**Line**: ~67 in `lib/visual-analyzer.ts`

---

## 🔍 Quick Access Methods

### Method 1: Browser Console (Easiest)
```javascript
// After analyzing a website, open console and type:
// (Assuming the analysis is stored in a variable)
JSON.stringify(analysis.screenshot).substring(0, 100)
// Shows first 100 chars of base64 string
```

### Method 2: Download JSON File
1. Analyze website
2. Click "Download" button
3. Select "AI-Ready Data" or "Complete Analysis (JSON)"
4. Open JSON file
5. Find `screenshot` field
6. Copy the base64 string

### Method 3: Network Tab
1. Open DevTools → Network tab
2. Analyze a website
3. Find `/api/analyze` request
4. Click on it → Response tab
5. Find `screenshot` field in JSON
6. Copy the value

### Method 4: React DevTools
1. Install React DevTools extension
2. Inspect `AnalysisResult` component
3. Find `analysis` prop
4. Expand to see `screenshot` property
5. Copy the value

---

## 📋 Screenshot Format Details

### Full Format
```
data:image/png;base64,{base64_encoded_image_data}
```

### Breakdown
- **Prefix**: `data:image/png;base64,`
- **Format**: PNG image
- **Encoding**: Base64
- **Data**: Base64-encoded image bytes

### Example
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### Size
- **Typical size**: 2-5 MB (base64 encoded)
- **Original size**: ~1.5-3.5 MB (binary)
- **Base64 overhead**: ~33% larger than binary

---

## 💡 Usage Examples

### Example 1: Display in HTML
```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." alt="Screenshot" />
```

### Example 2: Use in JavaScript
```javascript
const screenshot = analysis.screenshot
const img = document.createElement('img')
img.src = screenshot
document.body.appendChild(img)
```

### Example 3: Send to AI API
```javascript
// Extract base64 (remove data URI prefix)
const base64Image = analysis.screenshot.replace(/^data:image\/\w+;base64,/, "")

// Send to AI vision API
await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this screenshot' },
        { type: 'image', image: base64Image }
      ]
    }]
  })
})
```

### Example 4: Save as File
```javascript
// Convert data URI to blob
const base64 = analysis.screenshot.split(',')[1]
const binary = atob(base64)
const bytes = new Uint8Array(binary.length)
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i)
}
const blob = new Blob([bytes], { type: 'image/png' })

// Download
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'screenshot.png'
a.click()
```

---

## 🎯 Summary

**Where to find base64 screenshot:**

1. ✅ **UI Display** - Visible in analysis results
2. ✅ **Downloaded JSON** - In AI-Ready Data or Complete Analysis exports
3. ✅ **API Response** - In `/api/analyze` response
4. ✅ **Component Props** - `analysis.screenshot` in React components
5. ✅ **TypeScript Interface** - `WebsiteAnalysis.screenshot`
6. ✅ **Visual Analyzer** - Created in `captureScreenshot()` function

**Format**: `data:image/png;base64,{base64_string}`

**Quickest way**: Download "AI-Ready Data" JSON file and look for `visual.screenshot` field!
