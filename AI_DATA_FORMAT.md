# AI-Ready Data Format

## Overview

The **AI-Ready Data** export provides a comprehensive, structured format optimized for AI code generation. This format includes everything an AI model needs to recreate a website design.

## File Format

**Filename:** `ai-ready-{domain}-{date}.json`

**Example:** `ai-ready-example-com-2026-01-12.json`

## Data Structure

```json
{
  "metadata": {
    "url": "https://example.com",
    "title": "Example Website",
    "extractedAt": "2026-01-12T13:00:00.000Z",
    "analysisVersion": "2.0",
    "extractionMethod": "visual-analysis"
  },
  "visual": {
    "screenshot": "data:image/png;base64,...",
    "screenshotFormat": "base64-png"
  },
  "designSystem": {
    "colors": [
      {
        "hex": "#3B82F6",
        "usage": "primary",
        "name": null,
        "description": "Use this primary color (#3B82F6) for primary actions, buttons, and key UI elements"
      }
    ],
    "typography": [
      {
        "fontFamily": "Inter",
        "fontSize": "2.25rem",
        "fontWeight": 700,
        "lineHeight": "1.5",
        "usage": "heading",
        "description": "Use this typography for heading text: Inter at 2.25rem with weight 700"
      }
    ],
    "spacing": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem",
      "2xl": "3rem"
    },
    "borderRadii": {
      "none": "0",
      "sm": "0.125rem",
      "base": "0.25rem",
      "md": "0.375rem",
      "lg": "0.5rem",
      "xl": "0.75rem"
    },
    "breakpoints": {
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px",
      "2xl": "1536px"
    }
  },
  "layout": {
    "type": "multi-column",
    "sections": ["header", "nav", "main", "footer"],
    "instructions": "Create a multi-column layout with the following sections: header, nav, main, footer"
  },
  "aiInstructions": {
    "framework": "Next.js with React and TypeScript",
    "styling": "Tailwind CSS",
    "requirements": [
      "Use the extracted color palette for all UI elements",
      "Apply typography styles according to usage (heading, body, caption)",
      "Implement multi-column layout structure",
      "Ensure responsive design using the provided breakpoints",
      "Follow modern web best practices",
      "Use semantic HTML elements",
      "Ensure accessibility (ARIA labels, alt text)"
    ],
    "components": [
      "Create reusable components for common UI elements",
      "Use the design tokens consistently",
      "Implement proper spacing using the spacing scale"
    ]
  },
  "tokensSummary": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "headingFont": "Inter",
    "bodyFont": "Inter"
  }
}
```

## Key Features

### 1. **Metadata**
- Source URL and title
- Extraction timestamp
- Analysis version
- Method used (visual-analysis)

### 2. **Visual Reference**
- Base64-encoded screenshot
- Format specification
- Can be used for AI vision analysis

### 3. **Design System**
- **Colors**: With usage descriptions for AI context
- **Typography**: With usage descriptions
- **Spacing**: Complete spacing scale
- **Border Radii**: Border radius values
- **Breakpoints**: Responsive breakpoints

### 4. **Layout Structure**
- Layout type (single-column, multi-column, grid)
- Section list
- AI instructions for layout creation

### 5. **AI Instructions**
- Framework specification (Next.js)
- Styling approach (Tailwind CSS)
- Requirements list
- Component guidelines

### 6. **Quick Reference**
- Primary/secondary colors
- Heading/body fonts
- Fast access to key tokens

## How AI Uses This Data

### Example AI Prompt Generation:

```javascript
const prompt = `
Create a ${aiData.layout.type} layout for ${aiData.metadata.title}.

Design System:
- Primary Color: ${aiData.tokensSummary.primaryColor}
- Secondary Color: ${aiData.tokensSummary.secondaryColor}
- Heading Font: ${aiData.tokensSummary.headingFont}
- Body Font: ${aiData.tokensSummary.bodyFont}

Colors:
${aiData.designSystem.colors.map(c => `- ${c.usage}: ${c.hex} (${c.description})`).join('\n')}

Typography:
${aiData.designSystem.typography.map(t => `- ${t.usage}: ${t.description}`).join('\n')}

Layout: ${aiData.layout.instructions}

Requirements:
${aiData.aiInstructions.requirements.join('\n')}

Framework: ${aiData.aiInstructions.framework}
Styling: ${aiData.aiInstructions.styling}
`
```

## Use Cases

1. **AI Code Generation**
   - Feed to GPT-4, Claude, or other AI models
   - Generate React/Next.js components
   - Create Tailwind CSS configurations

2. **Design System Documentation**
   - Complete design token reference
   - Visual documentation
   - Design handoff

3. **Automated Testing**
   - Verify design implementation
   - Compare extracted vs. implemented
   - Regression testing

4. **Design System Migration**
   - Extract from old site
   - Apply to new site
   - Maintain consistency

## Integration Examples

### With OpenAI GPT-4:

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are a web developer expert in Next.js and Tailwind CSS."
    },
    {
      role: "user",
      content: `Generate a Next.js page component based on this design data: ${JSON.stringify(aiData)}`
    }
  ]
})
```

### With Anthropic Claude:

```javascript
const response = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 4000,
  messages: [{
    role: "user",
    content: `Create a React component using this design system: ${JSON.stringify(aiData)}`
  }]
})
```

## File Size Considerations

- **Typical size**: 50-200 KB
- **Screenshot impact**: Base64 encoding increases size by ~33%
- **Optimization**: Screenshot can be excluded if not needed

## Best Practices

1. **Always include screenshot** for visual reference
2. **Use AI-Ready format** for code generation
3. **Keep file for reference** - don't regenerate unnecessarily
4. **Version control** - track changes to design system
5. **Share with team** - use as design handoff document

## Future Enhancements

- Add component patterns
- Include animation/transition data
- Add accessibility guidelines
- Include performance metrics
- Add responsive behavior patterns
