# Screenshot Usage & AI Vision Integration

## Current State: What Screenshots Are Used For

### 1. **Visual Reference in UI**
- Screenshots are displayed in the analysis results
- Users can see what was analyzed
- Helps verify extraction accuracy

### 2. **Included in AI-Ready Data Export**
- Screenshots are base64-encoded in JSON
- Stored for future reference
- Can be shared with team

### 3. **NOT Currently Used by AI**
- AI code generation only uses text prompts
- Screenshots are not sent to AI models
- Only design tokens (colors, typography) are used

## The Opportunity: AI Vision for Code Generation

### Why Use Screenshots with AI?

**Current Approach (Text Only):**
```
AI receives:
- Design tokens (colors, typography)
- Layout structure
- Text descriptions

Limitations:
- ❌ Can't see visual layout
- ❌ Can't see component structure
- ❌ Can't see spacing/alignment
- ❌ Can't see visual hierarchy
```

**Vision-Enhanced Approach:**
```
AI receives:
- Screenshot (visual reference)
- Design tokens (colors, typography)
- Layout structure
- Text descriptions

Benefits:
- ✅ Can see actual layout
- ✅ Can identify components visually
- ✅ Can see spacing/alignment
- ✅ Can understand visual hierarchy
- ✅ More accurate code generation
```

## Implementation: Adding AI Vision Support

### Supported AI Vision Models

1. **OpenAI GPT-4 Vision (gpt-4o, gpt-4-turbo)**
2. **Anthropic Claude 3 (claude-3-opus, claude-3-sonnet)**
3. **Google Gemini Vision (gemini-pro-vision)**

### How It Works

```
1. Screenshot is captured (base64 PNG)
   ↓
2. Screenshot is sent to AI vision model
   ↓
3. AI analyzes the visual design:
   - Identifies components
   - Understands layout
   - Sees spacing/alignment
   - Recognizes visual patterns
   ↓
4. AI generates code based on:
   - Visual analysis (from screenshot)
   - Design tokens (from extraction)
   - Layout structure (from DOM)
   ↓
5. Returns more accurate code
```
