import type { WebsiteAnalysis } from "./types"

/**
 * Advanced prompt templates for different component types
 */

export function createComponentPrompt(analysis: WebsiteAnalysis, componentType: string): string {
  const baseInfo = getBaseAnalysisInfo(analysis)

  const templates: Record<string, string> = {
    hero: `${baseInfo}
    
Generate a hero section component with:
- Large headline matching the typography style
- Subheadline or description
- Call-to-action button using primary color
- Optional background image or gradient
- Proper spacing and alignment`,

    navbar: `${baseInfo}
    
Generate a navigation bar component with:
- Logo/branding area
- Navigation links for: ${analysis.layout.sections.join(", ")}
- Responsive mobile menu
- Sticky or fixed positioning option
- Hover states with accent color`,

    features: `${baseInfo}
    
Generate a features section with:
- Feature grid (3-4 columns)
- Icons/illustrations for each feature
- Feature title and description
- Color-coded feature cards
- Responsive layout for mobile`,

    cta: `${baseInfo}
    
Generate a call-to-action section with:
- Compelling headline
- Brief description
- Primary button (${analysis.designSystem.colors[0]?.hex || "#3B82F6"})
- Secondary action (optional)
- Background color using secondary palette`,

    footer: `${baseInfo}
    
Generate a footer component with:
- Company info section
- Multiple columns for links
- Social media links
- Newsletter signup (optional)
- Copyright information`,
  }

  return templates[componentType] || templates.hero
}

function getBaseAnalysisInfo(analysis: WebsiteAnalysis): string {
  const colorPalette = analysis.designSystem.colors
    .slice(0, 5)
    .map((c) => `${c.hex} (${c.usage})`)
    .join(", ")

  const mainFont = analysis.designSystem.typography[0]

  return `DESIGN CONTEXT:
Website: ${analysis.title}
Color Palette: ${colorPalette}
Primary Font: ${mainFont?.fontFamily}
Sections: ${analysis.layout.sections.join(", ")}

Create a production-ready React/Next.js component using:
- Tailwind CSS for styling
- Semantic HTML
- Mobile-first responsive design
- Proper accessibility (ARIA labels, alt text)
- Clear component structure`
}

export function createLayoutPrompt(analysis: WebsiteAnalysis): string {
  return `Generate a complete page layout component that combines:

Sections: ${analysis.layout.sections.map((s) => `- ${s}`).join("\n")}

Use this design system:
- Colors: ${analysis.designSystem.colors.map((c) => c.hex).join(", ")}
- Typography: ${analysis.designSystem.typography.map((t) => `${t.usage} (${t.fontSize})`).join(", ")}
- Spacing grid based on Tailwind defaults

Requirements:
1. Semantic HTML structure
2. Responsive design (mobile, tablet, desktop)
3. Proper heading hierarchy
4. Accessible navigation
5. Clean, modern aesthetics
6. Follows web best practices

Output a complete, working Next.js page component.`
}

/**
 * Create prompt for AI Vision-based code generation
 * Includes screenshot reference and detailed visual instructions
 */
export function createVisionPrompt(analysis: WebsiteAnalysis): string {
  const colorPalette = analysis.designSystem.colors
    .slice(0, 10)
    .map((c) => `${c.hex} (${c.usage})`)
    .join(", ")

  const typography = analysis.designSystem.typography
    .map((t) => `${t.usage}: ${t.fontFamily} at ${t.fontSize}, weight ${t.fontWeight}`)
    .join("\n")

  return `You are analyzing a website screenshot and generating production-ready Next.js/React code.

SCREENSHOT ANALYSIS:
I'm providing you with a screenshot of the website. Please analyze the visual design and generate code that matches it exactly.

DESIGN SYSTEM (Extracted from the website):
- Colors: ${colorPalette}
- Typography:
${typography}
- Layout Type: ${analysis.layout.type}
- Sections: ${analysis.layout.sections.join(", ")}

VISUAL ANALYSIS INSTRUCTIONS:
1. Examine the screenshot carefully
2. Identify the layout structure (header, hero, features, footer, etc.)
3. Note the spacing and alignment between elements
4. Observe the visual hierarchy (what's emphasized)
5. Identify component patterns (buttons, cards, navigation, etc.)
6. Note the color usage (backgrounds, text, accents)
7. Observe typography hierarchy (headings vs body text)
8. Identify responsive patterns if visible

CODE GENERATION REQUIREMENTS:
1. Generate a complete Next.js page component that matches the screenshot
2. Use the extracted design tokens (colors, typography) exactly
3. Recreate the layout structure you see in the screenshot
4. Match spacing, alignment, and visual hierarchy
5. Use Tailwind CSS for styling
6. Ensure responsive design
7. Include proper semantic HTML
8. Add accessibility attributes (ARIA labels, alt text)
9. Use the exact colors from the design system
10. Apply typography styles according to usage

OUTPUT:
Generate a complete, working Next.js page component in TypeScript/TSX format.
The code should be production-ready and match the visual design in the screenshot as closely as possible.

Website URL: ${analysis.url}
Website Title: ${analysis.title}`
}
