import type { DesignSystem, WebsiteAnalysis } from "./types"

/**
 * Generates Tailwind configuration from extracted design system
 */
export function generateTailwindConfig(designSystem: DesignSystem): string {
  const colors: Record<string, string> = {}

  // Organize colors by usage
  const colorsByUsage: Record<string, string[]> = {
    primary: [],
    secondary: [],
    accent: [],
    neutral: [],
    background: [],
  }

  designSystem.colors.forEach((color) => {
    colorsByUsage[color.usage].push(color.hex)
  })

  // Build color palette
  Object.entries(colorsByUsage).forEach(([usage, hexes]) => {
    hexes.forEach((hex, idx) => {
      const key = idx === 0 ? usage : `${usage}-${idx}`
      colors[key] = hex
    })
  })

  // Generate config as string
  const configContent = `
export const theme = {
  extend: {
    colors: ${JSON.stringify(colors, null, 2)},
    fontFamily: {
      sans: ['${designSystem.typography[0]?.fontFamily || "system-ui"}', 'sans-serif'],
      mono: ['Menlo', 'monospace'],
    },
    spacing: ${JSON.stringify(designSystem.spacing, null, 2)},
    borderRadius: ${JSON.stringify(designSystem.borderRadii, null, 2)},
  },
}
`

  return configContent
}

/**
 * Generates CSS variables from design system
 */
export function generateCSSVariables(designSystem: DesignSystem): string {
  let css = `:root {
`

  // Add colors
  designSystem.colors.forEach((color, idx) => {
    css += `  --color-${color.usage}${idx > 0 ? `-${idx}` : ""}: ${color.hex};\n`
  })

  // Add fonts
  const fonts = new Set(designSystem.typography.map((t) => t.fontFamily))
  fonts.forEach((font) => {
    const slug = font.toLowerCase().replace(/\s+/g, "-")
    css += `  --font-${slug}: "${font}", sans-serif;\n`
  })

  // Add spacing
  Object.entries(designSystem.spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`
  })

  // Add radius
  Object.entries(designSystem.borderRadii).forEach(([key, value]) => {
    css += `  --radius-${key}: ${value};\n`
  })

  css += `}
`

  return css
}

/**
 * Generates a component blueprint from design system
 */
export function generateComponentBlueprint(name: string, designSystem: DesignSystem): string {
  const primaryColor = designSystem.colors.find((c) => c.usage === "primary")?.hex || "#3B82F6"
  const textColor = designSystem.colors.find((c) => c.usage === "neutral")?.hex || "#000000"

  return `
import React from 'react'

interface ${name}Props {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export const ${name}: React.FC<${name}Props> = ({ 
  children, 
  variant = 'primary' 
}) => {
  const styles = {
    primary: {
      backgroundColor: '${primaryColor}',
      color: '${textColor}',
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '${textColor}',
    },
  }

  return (
    <div style={styles[variant]} className="px-6 py-4 rounded-lg">
      {children}
    </div>
  )
}
`
}

/**
 * Generates globals.css from design system
 */
export function generateGlobalStyles(designSystem: DesignSystem): string {
  const primaryColor = designSystem.colors.find((c) => c.usage === "primary") || designSystem.colors[0]
  const backgroundColor =
    designSystem.colors.find((c) => c.usage === "background") ||
    designSystem.colors.find((c) => c.hex === "#FFFFFF") ||
    designSystem.colors[designSystem.colors.length - 1]
  const neutralColor = designSystem.colors.find((c) => c.usage === "neutral") || designSystem.colors[0]

  const css = `@import 'tailwindcss';

:root {
  --primary: ${primaryColor.hex};
  --background: ${backgroundColor.hex};
  --foreground: ${neutralColor.hex};
  --border: #e5e7eb;
}

.dark {
  --primary: ${primaryColor.hex};
  --background: #000000;
  --foreground: #ffffff;
  --border: #374151;
}

@theme inline {
  --font-sans: '${designSystem.typography[0]?.fontFamily || "system-ui"}', sans-serif;
  --font-mono: 'Geist Mono', monospace;
  --color-primary: var(--primary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-border: var(--border);
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
`

  return css
}

/**
 * Analyzes design complexity and returns recommendations
 */
export function analyzeDesignComplexity(analysis: WebsiteAnalysis): {
  complexity: "simple" | "moderate" | "complex"
  recommendations: string[]
} {
  const colorCount = analysis.designSystem.colors.length
  const typographyCount = analysis.designSystem.typography.length
  const sectionCount = analysis.layout.sections.length

  let complexity: "simple" | "moderate" | "complex" = "simple"
  const recommendations: string[] = []

  if (colorCount > 8 || typographyCount > 4 || sectionCount > 5) {
    complexity = "complex"
    recommendations.push("Consider simplifying the color palette for better cohesion")
    recommendations.push("Use fewer font families to improve typography consistency")
  } else if (colorCount > 5 || typographyCount > 3) {
    complexity = "moderate"
    recommendations.push("The design is moderately complex")
  }

  if (colorCount < 3) {
    recommendations.push("Consider adding more color variety")
  }

  if (typographyCount < 2) {
    recommendations.push("Use at least 2 font families for better visual hierarchy")
  }

  return {
    complexity,
    recommendations: recommendations.length > 0 ? recommendations : ["Design looks good!"],
  }
}

/**
 * Generates a design tokens file
 */
export function generateDesignTokens(designSystem: DesignSystem): string {
  return `// Auto-generated design tokens from ${new Date().toLocaleString()}

export const tokens = {
  colors: {
${designSystem.colors.map((c) => `    ${c.usage}: '${c.hex}',`).join("\n")}
  },
  
  typography: {
${designSystem.typography
  .slice(0, 3)
  .map(
    (t) =>
      `    ${t.usage}: {
      fontFamily: '${t.fontFamily}',
      fontSize: '${t.fontSize}',
      fontWeight: ${t.fontWeight},
      lineHeight: '${t.lineHeight}',
    },`,
  )
  .join("\n")}
  },

  spacing: {
${Object.entries(designSystem.spacing)
  .map(([key, value]) => `    ${key}: '${value}',`)
  .join("\n")}
  },

  radius: {
${Object.entries(designSystem.borderRadii)
  .map(([key, value]) => `    ${key}: '${value}',`)
  .join("\n")}
  },
}

export type DesignTokens = typeof tokens
`
}
