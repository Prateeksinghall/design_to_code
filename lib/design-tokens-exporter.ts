// Export design tokens in multiple formats (JSON, CSS, Tailwind config)
import type { WebsiteAnalysis } from "@/lib/types"

/**
 * Export complete analysis data as JSON (includes all metadata)
 */
export function exportAnalysisAsJSON(analysis: WebsiteAnalysis): string {
  return JSON.stringify(analysis, null, 2)
}

/**
 * Export AI-ready data format - optimized for AI code generation
 * Includes all data needed for AI to create a new page
 */
export function exportAIReadyData(analysis: WebsiteAnalysis): string {
  // Ensure screenshot is included (even if undefined, it will be null in JSON)
  const screenshot = analysis.screenshot || null
  
  // Debug: Log screenshot status
  if (!screenshot) {
    console.warn("Screenshot is missing in analysis data. Visual analysis may have failed or was disabled.")
  }
  
  const aiData = {
    // Metadata
    metadata: {
      url: analysis.url,
      title: analysis.title,
      extractedAt: analysis.extractedAt,
      analysisVersion: "2.0",
      extractionMethod: "visual-analysis",
    },

    // Visual reference - ensure screenshot is always included
    visual: (() => {
      const visualObj: {
        screenshot: string | null
        screenshotFormat: string
        screenshotLength?: number
        screenshotPreview?: string
      } = {
        screenshot: screenshot ? screenshot : null, // Explicitly set to null if missing
        screenshotFormat: "base64-png",
      }
      
      // Add debug info if screenshot exists
      if (screenshot) {
        visualObj.screenshotLength = screenshot.length
        visualObj.screenshotPreview = screenshot.substring(0, 100) + "..."
      }
      
      return visualObj
    })(),

    // Design system (what AI needs to recreate)
    designSystem: {
      colors: analysis.designSystem.colors.map((color) => ({
        hex: color.hex,
        usage: color.usage,
        name: color.name,
        // AI context
        description: `Use this ${color.usage} color (${color.hex}) for ${getColorUsageDescription(color.usage)}`,
      })),
      typography: analysis.designSystem.typography.map((typo) => ({
        fontFamily: typo.fontFamily,
        fontSize: typo.fontSize,
        fontWeight: typo.fontWeight,
        lineHeight: typo.lineHeight,
        usage: typo.usage,
        // AI context
        description: `Use this typography for ${typo.usage} text: ${typo.fontFamily} at ${typo.fontSize} with weight ${typo.fontWeight}`,
      })),
      spacing: analysis.designSystem.spacing,
      borderRadii: analysis.designSystem.borderRadii,
      breakpoints: analysis.designSystem.breakpoints,
    },

    // Layout structure
    layout: {
      type: analysis.layout.type,
      sections: analysis.layout.sections,
      // AI instructions
      instructions: `Create a ${analysis.layout.type} layout with the following sections: ${analysis.layout.sections.join(", ")}`,
    },

    // AI generation instructions
    aiInstructions: {
      framework: "Next.js with React and TypeScript",
      styling: "Tailwind CSS",
      requirements: [
        "Use the extracted color palette for all UI elements",
        "Apply typography styles according to usage (heading, body, caption)",
        `Implement ${analysis.layout.type} layout structure`,
        "Ensure responsive design using the provided breakpoints",
        "Follow modern web best practices",
        "Use semantic HTML elements",
        "Ensure accessibility (ARIA labels, alt text)",
      ],
      components: [
        "Create reusable components for common UI elements",
        "Use the design tokens consistently",
        "Implement proper spacing using the spacing scale",
      ],
    },

    // Design tokens summary (quick reference)
    tokensSummary: {
      primaryColor: analysis.designSystem.colors.find((c) => c.usage === "primary")?.hex || analysis.designSystem.colors[0]?.hex,
      secondaryColor: analysis.designSystem.colors.find((c) => c.usage === "secondary")?.hex || analysis.designSystem.colors[1]?.hex,
      headingFont: analysis.designSystem.typography.find((t) => t.usage === "heading")?.fontFamily || analysis.designSystem.typography[0]?.fontFamily,
      bodyFont: analysis.designSystem.typography.find((t) => t.usage === "body")?.fontFamily || analysis.designSystem.typography[0]?.fontFamily,
    },
  }

  // Use a replacer to ensure undefined values are included as null
  return JSON.stringify(aiData, (key, value) => {
    // Ensure screenshot is always included
    if (key === 'screenshot' && value === undefined) {
      return null
    }
    return value
  }, 2)
}

/**
 * Helper: Get color usage description for AI context
 */
function getColorUsageDescription(usage: string): string {
  const descriptions: Record<string, string> = {
    primary: "primary actions, buttons, and key UI elements",
    secondary: "secondary actions and supporting elements",
    accent: "accent colors for highlights and emphasis",
    neutral: "text colors and neutral UI elements",
    background: "background colors and page backgrounds",
  }
  return descriptions[usage] || "general UI elements"
}

/**
 * Generate a safe filename from URL
 */
export function generateFilename(url: string, extension: string, prefix?: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace(/^www\./, "")
    const sanitized = hostname.replace(/[^a-z0-9]/gi, "-").toLowerCase()
    const timestamp = new Date().toISOString().split("T")[0]
    const prefixPart = prefix ? `${prefix}-` : ""
    return `${prefixPart}${sanitized}-${timestamp}.${extension}`
  } catch {
    const timestamp = new Date().toISOString().split("T")[0]
    const prefixPart = prefix ? `${prefix}-` : ""
    return `${prefixPart}analysis-${timestamp}.${extension}`
  }
}

export function exportDesignTokensAsJSON(analysis: WebsiteAnalysis): string {
  const tokens = {
    colors: analysis.designSystem.colors.reduce(
      (acc, color) => {
        acc[color.name || color.hex.slice(1)] = color.hex
        return acc
      },
      {} as Record<string, string>,
    ),
    typography: analysis.designSystem.typography.map((t) => ({
      fontFamily: t.fontFamily,
      fontWeight: t.fontWeight,
      fontSize: t.fontSize,
      lineHeight: t.lineHeight,
      usage: t.usage,
    })),
    spacing: analysis.designSystem.spacing,
    borderRadii: analysis.designSystem.borderRadii,
    breakpoints: analysis.designSystem.breakpoints,
  }
  return JSON.stringify(tokens, null, 2)
}

export function exportDesignTokensAsCSS(analysis: WebsiteAnalysis): string {
  let css = ":root {\n"

  // Color tokens
  analysis.designSystem.colors.forEach((color) => {
    const varName = color.name || color.hex.slice(1)
    css += `  --color-${varName.toLowerCase()}: ${color.hex};\n`
  })

  // Spacing tokens
  Object.entries(analysis.designSystem.spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`
  })

  // Border radius tokens
  Object.entries(analysis.designSystem.borderRadii).forEach(([key, value]) => {
    css += `  --radius-${key}: ${value};\n`
  })

  css += "}\n\n"

  // Typography classes
  css += "/* Typography */\n"
  analysis.designSystem.typography.forEach((typo) => {
    const className = `.text-${typo.usage}`
    css += `${className} {\n`
    css += `  font-family: ${typo.fontFamily};\n`
    css += `  font-size: ${typo.fontSize};\n`
    css += `  font-weight: ${typo.fontWeight};\n`
    css += `  line-height: ${typo.lineHeight};\n`
    if (typo.letterSpacing) css += `  letter-spacing: ${typo.letterSpacing};\n`
    css += `}\n\n`
  })

  return css
}

export function exportDesignTokensAsTailwindConfig(analysis: WebsiteAnalysis): string {
  const colors = analysis.designSystem.colors.reduce(
    (acc, color) => {
      const colorName = color.name || color.hex.slice(1).toLowerCase()
      acc[colorName] = color.hex
      return acc
    },
    {} as Record<string, string>,
  )

  const fontFamilies = analysis.designSystem.typography.reduce(
    (acc, typo) => {
      if (!acc[typo.usage]) {
        acc[typo.usage] = typo.fontFamily
      }
      return acc
    },
    {} as Record<string, string>,
  )

  const config = `module.exports = {
  theme: {
    colors: ${JSON.stringify(colors, null, 6)},
    fontFamily: ${JSON.stringify(fontFamilies, null, 6)},
    spacing: ${JSON.stringify(analysis.designSystem.spacing, null, 6)},
    borderRadius: ${JSON.stringify(analysis.designSystem.borderRadii, null, 6)},
  },
  plugins: [],
}`

  return config
}

export function exportDesignTokensAsPattern(analysis: WebsiteAnalysis): string {
  let pattern = `# Design System Analysis\n\n`
  pattern += `**Website:** ${analysis.title}\n`
  pattern += `**URL:** ${analysis.url}\n`
  pattern += `**Extracted:** ${new Date(analysis.extractedAt).toLocaleString()}\n\n`
  pattern += `---\n\n`
  pattern += `## Colors\n\n`
  analysis.designSystem.colors.forEach((color) => {
    pattern += `- **${color.name || "Color"}** (${color.usage}): \`${color.hex}\`\n`
  })

  pattern += `\n## Typography\n\n`
  analysis.designSystem.typography.forEach((typo) => {
    pattern += `- **${typo.usage.charAt(0).toUpperCase() + typo.usage.slice(1)}**\n`
    pattern += `  - Font: ${typo.fontFamily}\n`
    pattern += `  - Size: ${typo.fontSize}\n`
    pattern += `  - Weight: ${typo.fontWeight}\n`
    pattern += `  - Line Height: ${typo.lineHeight}\n`
  })

  pattern += `\n## Components\n\n`
  analysis.designSystem.components.forEach((component) => {
    pattern += `### ${component.name}\n`
    pattern += `${component.description}\n`
    pattern += `- Colors: ${component.colors.map((c) => c.hex).join(", ")}\n`
    pattern += `- Padding: ${component.padding || "default"}\n`
    pattern += `- Border Radius: ${component.borderRadius || "default"}\n\n`
  })

  pattern += `\n## Spacing Scale\n\n`
  Object.entries(analysis.designSystem.spacing).forEach(([key, value]) => {
    pattern += `- ${key}: ${value}\n`
  })

  pattern += `\n## Layout\n\n`
  pattern += `- **Type**: ${analysis.layout.type}\n`
  pattern += `- **Sections**: ${analysis.layout.sections.join(", ")}\n`

  return pattern
}

export function downloadFile(content: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
