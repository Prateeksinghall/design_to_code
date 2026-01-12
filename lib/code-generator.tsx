import { generateText } from "ai"
import type { CodeGenerationRequest, CodeGenerationResult } from "./types"
import { createLayoutPrompt } from "./code-generator-prompts"

/**
 * Generates production-ready React/Next.js code from design analysis
 */
export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
  const { analysis, outputFormat = "tsx", includePages = false } = request

  // Generate design system files first
  const designTokensCode = generateDesignTokens(analysis)
  const files = [
    {
      path: "lib/design-tokens.ts",
      content: designTokensCode,
    },
  ]

  // Generate main layout/component
  let componentCode = ""
  try {
    componentCode = await generateLayoutComponent(analysis)
    files.push({
      path: "components/layout.tsx",
      content: componentCode,
    })
  } catch (error) {
    console.error("Failed to generate layout component:", error)
    componentCode = generateFallbackComponent(analysis)
    files.push({
      path: "components/layout.tsx",
      content: componentCode,
    })
  }

  // Generate individual feature components if requested
  if (includePages) {
    const sections = analysis.layout.sections.slice(0, 3)
    for (const section of sections) {
      try {
        const sectionCode = await generateSectionComponent(analysis, section)
        files.push({
          path: `components/${section}.tsx`,
          content: sectionCode,
        })
      } catch (error) {
        console.error(`Failed to generate ${section} component:`, error)
      }
    }
  }

  // Combine code for preview
  const combinedCode = files.map((f) => `// File: ${f.path}\n${f.content}`).join("\n\n---\n\n")

  return {
    code: combinedCode,
    files,
    language: outputFormat,
  }
}

/**
 * Generate design tokens/CSS from the design system
 */
function generateDesignTokens(analysis) {
  const colors = analysis.designSystem.colors.map((c) => `'${c.hex.toLowerCase()}': '${c.hex}',`).join("\n    ")

  return `// Design tokens extracted from ${analysis.url}

export const designTokens = {
  colors: {
    ${colors}
  },
  typography: {
    heading: {
      fontFamily: '${analysis.designSystem.typography[0]?.fontFamily || "system-ui"}',
      fontSize: '${analysis.designSystem.typography[0]?.fontSize || "2.25rem"}',
      fontWeight: ${analysis.designSystem.typography[0]?.fontWeight || 700},
      lineHeight: '${analysis.designSystem.typography[0]?.lineHeight || "1.2"}',
    },
    body: {
      fontFamily: '${analysis.designSystem.typography[1]?.fontFamily || "system-ui"}',
      fontSize: '${analysis.designSystem.typography[1]?.fontSize || "1rem"}',
      fontWeight: ${analysis.designSystem.typography[1]?.fontWeight || 400},
      lineHeight: '${analysis.designSystem.typography[1]?.lineHeight || "1.6"}',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
}

export const colorPalette = {
  primary: '${analysis.designSystem.colors[0]?.hex || "#3B82F6"}',
  secondary: '${analysis.designSystem.colors[1]?.hex || "#8B5CF6"}',
  accent: '${analysis.designSystem.colors[2]?.hex || "#EC4899"}',
  background: '${analysis.designSystem.colors.find((c) => c.usage === "background")?.hex || "#FFFFFF"}',
  text: '${analysis.designSystem.colors.find((c) => c.usage === "neutral")?.hex || "#000000"}',
}`
}

/**
 * Generate the main layout component using AI
 */
async function generateLayoutComponent(analysis): Promise<string> {
  const prompt = createLayoutPrompt(analysis)

  try {
    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return formatGeneratedCode(text, "tsx")
  } catch (error) {
    console.error("AI generation failed:", error)
    return generateFallbackComponent(analysis)
  }
}

/**
 * Generate individual section components
 */
async function generateSectionComponent(analysis, sectionName: string): Promise<string> {
  const prompt = `Generate a React component for a ${sectionName} section based on this design system:
Colors: ${analysis.designSystem.colors.map((c) => c.hex).join(", ")}
Typography: ${analysis.designSystem.typography.map((t) => t.fontFamily).join(", ")}

Create a production-ready, accessible component with Tailwind CSS.`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt,
      temperature: 0.7,
      maxTokens: 1500,
    })

    return formatGeneratedCode(text, "tsx")
  } catch (error) {
    return `export function ${capitalize(sectionName)}() {
  return (
    <section className="py-12 px-6">
      <h2 className="text-3xl font-bold mb-4">${capitalize(sectionName)}</h2>
      <p className="text-gray-600">Add content for ${sectionName} section here</p>
    </section>
  )
}`
  }
}

/**
 * Generate fallback component if AI fails
 */
function generateFallbackComponent(analysis): string {
  const sections = analysis.layout.sections.slice(0, 3)
  const primaryColor = analysis.designSystem.colors[0]?.hex || "#3B82F6"

  return `"use client"

import React from 'react'

export default function Page() {
  return (
    <main className="min-h-screen">
      ${sections.map((section) => `<${capitalize(section)} />`).join("\n      ")}
    </main>
  )
}

${sections
  .map(
    (section) => `
function ${capitalize(section)}() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-4" style={{ color: '${primaryColor}' }}>
          ${capitalize(section)}
        </h2>
        <p className="text-gray-600 text-lg">
          Content for ${section} section extracted from design analysis
        </p>
      </div>
    </section>
  )
}
`,
  )
  .join("\n")}
`
}

/**
 * Format generated code (remove markdown, etc)
 */
function formatGeneratedCode(code: string, language: string): string {
  // Remove markdown code blocks if present
  let formatted = code
    .replace(/```tsx\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  // Remove common markdown artifacts
  formatted = formatted
    .split("\n")
    .filter((line) => !line.startsWith("//") || line.includes("import") || line.includes("export"))
    .join("\n")

  return formatted
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
