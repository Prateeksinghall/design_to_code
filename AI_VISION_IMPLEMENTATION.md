# AI Vision Implementation Guide

## Overview

This document explains how to use screenshots with AI vision models to generate more accurate code.

## Current Implementation Status

### ✅ What's Added

1. **Vision Prompt Function** (`createVisionPrompt()`)
   - Creates detailed prompts for AI vision models
   - Includes screenshot analysis instructions
   - Combines visual + design token data

2. **Vision Generation Function** (`generateWithAIVision()`)
   - Detects if screenshot is available
   - Uses vision-capable AI models
   - Falls back to text-only if needed

3. **Request Parameter** (`useVision`)
   - Allows enabling/disabling vision mode
   - Defaults to `true` if screenshot exists

### ⚠️ Current Limitation

The current implementation uses the **Vercel AI SDK** which may need additional configuration for image inputs. The actual image sending depends on the AI provider's API.

## How to Use AI Vision Models

### Option 1: OpenAI GPT-4 Vision

```typescript
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const { text } = await generateText({
  model: openai("gpt-4o"), // Vision-capable model
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this screenshot and generate React code..."
        },
        {
          type: "image",
          image: base64Image, // Base64 string (without data URI prefix)
        }
      ]
    }
  ],
  maxTokens: 4000,
})
```

### Option 2: Anthropic Claude 3 Vision

```typescript
import { anthropic } from "@ai-sdk/anthropic"

const { text } = await generateText({
  model: anthropic("claude-3-opus-20240229"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this screenshot..."
        },
        {
          type: "image",
          image: base64Image,
          mimeType: "image/png"
        }
      ]
    }
  ],
})
```

### Option 3: Google Gemini Vision

```typescript
import { google } from "@ai-sdk/google"

const { text } = await generateText({
  model: google("gemini-pro-vision"),
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze..." },
        { type: "image", image: base64Image }
      ]
    }
  ],
})
```

## Complete Implementation Example

Here's how to fully implement vision-based generation:

```typescript
// lib/ai-generator-vision.ts
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { WebsiteAnalysis } from "./types"
import { createVisionPrompt } from "./code-generator-prompts"

export async function generateCodeWithVision(analysis: WebsiteAnalysis): Promise<string> {
  if (!analysis.screenshot) {
    throw new Error("Screenshot required for vision-based generation")
  }

  // Extract base64 image (remove data URI prefix)
  const base64Image = analysis.screenshot.replace(/^data:image\/\w+;base64,/, "")
  
  const prompt = createVisionPrompt(analysis)

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"), // Vision-capable model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: base64Image,
            },
          ],
        },
      ],
      maxTokens: 4000,
      temperature: 0.7,
    })

    return text
  } catch (error) {
    console.error("Vision generation failed:", error)
    throw error
  }
}
```

## Benefits of Vision-Based Generation

### 1. **Visual Understanding**
- AI can see the actual layout
- Understands component relationships
- Sees spacing and alignment

### 2. **Component Identification**
- Identifies buttons, cards, forms visually
- Understands navigation structure
- Recognizes content sections

### 3. **Accurate Recreation**
- Matches visual design more closely
- Better spacing and alignment
- More accurate component structure

### 4. **Design Patterns**
- Recognizes common UI patterns
- Understands visual hierarchy
- Identifies design trends

## Comparison: Text vs Vision

| Aspect | Text-Only | Vision-Enhanced |
|--------|-----------|----------------|
| **Layout Understanding** | ⚠️ Limited | ✅ Excellent |
| **Component Detection** | ⚠️ Guessed | ✅ Visual |
| **Spacing Accuracy** | ⚠️ Estimated | ✅ Precise |
| **Visual Hierarchy** | ⚠️ Inferred | ✅ Observed |
| **Code Accuracy** | ⚠️ Good | ✅ Excellent |
| **Cost** | ✅ Lower | ⚠️ Higher |
| **Speed** | ✅ Faster | ⚠️ Slower |

## Cost Considerations

### Vision Model Pricing (Approximate)

- **GPT-4 Vision**: ~$0.01-0.03 per image
- **Claude 3 Opus**: ~$0.015 per image
- **Claude 3 Sonnet**: ~$0.003 per image
- **Gemini Pro Vision**: ~$0.001 per image

### Optimization Tips

1. **Use smaller screenshots**: Compress images before sending
2. **Cache results**: Don't regenerate for same screenshot
3. **Hybrid approach**: Use vision for complex layouts, text for simple ones
4. **Selective vision**: Only use vision when screenshot quality is good

## Implementation Steps

### Step 1: Install Vision SDK

```bash
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

### Step 2: Update AI Generator

Replace `generateWithAIVision()` with proper image handling:

```typescript
async function generateWithAIVision(analysis: WebsiteAnalysis): Promise<string> {
  const base64Image = analysis.screenshot!.replace(/^data:image\/\w+;base64,/, "")
  const prompt = createVisionPrompt(analysis)

  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: base64Image },
        ],
      },
    ],
    maxTokens: 4000,
  })

  return text
}
```

### Step 3: Update API Route

```typescript
// app/api/generate-code/route.ts
export async function POST(request: NextRequest) {
  const payload: CodeGenerationRequest = await request.json()
  
  // Enable vision if screenshot exists
  if (payload.analysis.screenshot && !payload.useVision === false) {
    payload.useVision = true
  }
  
  const result = await generateCode(payload)
  return NextResponse.json(result)
}
```

## Testing Vision Generation

### Test Cases

1. **Simple Landing Page**
   - Hero section
   - Features grid
   - Footer
   - Expected: Accurate layout recreation

2. **Complex Dashboard**
   - Multiple sections
   - Cards and widgets
   - Navigation
   - Expected: Component identification

3. **E-commerce Page**
   - Product grid
   - Filters
   - Cart
   - Expected: Visual pattern recognition

## Future Enhancements

1. **Multi-Screenshot Support**
   - Desktop + mobile screenshots
   - Different viewport sizes
   - Responsive design analysis

2. **Component Extraction**
   - Identify reusable components
   - Generate component library
   - Extract design patterns

3. **Design System Generation**
   - Extract spacing system from visuals
   - Identify color usage patterns
   - Generate comprehensive design tokens

4. **Iterative Refinement**
   - Compare generated vs original
   - Refine based on differences
   - Improve accuracy over iterations

## Summary

**Current State:**
- ✅ Screenshots are captured and stored
- ✅ Vision prompts are created
- ⚠️ Image sending needs SDK configuration
- ✅ Fallback to text-only works

**Next Steps:**
1. Configure AI SDK for image inputs
2. Test with actual vision models
3. Optimize for cost and performance
4. Add UI toggle for vision mode

The foundation is in place - just needs the vision model integration to be fully functional!
