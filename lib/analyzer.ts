import type { WebsiteAnalysis, DesignSystem, Color, Typography } from "./types"
import { getVisualAnalyzer } from "./visual-analyzer"

/**
 * Analyzes a website and extracts its design system
 * Uses HTML extraction for colors/typography (primary method)
 * Screenshot is optional for AI vision use
 */
export async function analyzeWebsite(
  url: string,
  captureScreenshot: boolean = false
): Promise<WebsiteAnalysis> {
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    throw new Error("Invalid URL provided")
  }

  // Always fetch HTML for title and basic structure
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status}`)
  }

  const html = await response.text()
  const title = extractPageTitle(html) || urlObj.hostname

  // Extract design system from HTML (primary method - reliable)
  const designSystem = extractDesignSystem(html, url)
  const layout = extractLayoutStructure(html)

  // Screenshot is optional - only capture if requested (for AI vision)
  let screenshot: string | undefined
  if (captureScreenshot) {
    try {
      const visualAnalyzer = getVisualAnalyzer()
      screenshot = await visualAnalyzer.captureScreenshot(url)
      
      if (!screenshot) {
        console.warn(`Screenshot not captured for ${url}. Possible reasons: bot detection, timeout, or website blocking.`)
      }
    } catch (screenshotError) {
      console.warn("Screenshot capture failed, continuing without screenshot:", screenshotError)
      // Continue without screenshot - not critical for design extraction
    }
  }

  return {
    url,
    title,
    screenshot,
    designSystem,
    layout,
    extractedAt: new Date().toISOString(),
  }
}

// Removed mergeColors and mergeTypography - now using HTML extraction only

/**
 * Extracts design system (colors, typography, spacing) from HTML
 */
function extractDesignSystem(html: string, url: string): DesignSystem {
  const colors = extractColors(html, url)

  const typography = extractTypography(html)

  return {
    colors,
    typography,
    components: [],
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
    },
    borderRadii: {
      none: "0",
      sm: "0.125rem",
      base: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
    },
    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  }
}

/**
 * Extracts color palette from CSS and HTML
 */
function extractColors(html: string, baseUrl: string): Color[] {
  const colors: Color[] = []
  const colorSet = new Set<string>()

  // Extract from style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let styleMatch
  const colorValueRegex = /#(?:[0-9a-fA-F]{3}){1,2}|rgb\([^)]*\)|rgba\([^)]*\)|hsl\([^)]*\)/gi

  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const styles = styleMatch[1]
    let colorMatch
    while ((colorMatch = colorValueRegex.exec(styles)) !== null) {
      const hex = normalizeColor(colorMatch[0])
      if (hex && !colorSet.has(hex) && isValidColor(hex)) {
        colorSet.add(hex)
      }
    }
  }

  // Extract from inline styles
  const inlineStyleRegex = /style\s*=\s*["']([^"']*)["']/gi
  while ((styleMatch = inlineStyleRegex.exec(html)) !== null) {
    const styles = styleMatch[1]
    let colorMatch
    const inlineColorRegex = /(?:color|background|border)[^;]*:\s*([^;]+)/gi
    while ((colorMatch = inlineColorRegex.exec(styles)) !== null) {
      const hex = normalizeColor(colorMatch[1])
      if (hex && !colorSet.has(hex) && isValidColor(hex)) {
        colorSet.add(hex)
      }
    }
  }

  // Convert to Color objects with usage categorization
  Array.from(colorSet).forEach((hex, idx) => {
    const usage = categorizeColorUsage(hex, idx) as "primary" | "secondary" | "accent" | "neutral" | "background"
    colors.push({
      hex,
      usage,
    })
  })

  // Ensure we have at least some colors
  if (colors.length === 0) {
    colors.push(
      { hex: "#000000", usage: "neutral" },
      { hex: "#FFFFFF", usage: "background" },
      { hex: "#3B82F6", usage: "primary" },
      { hex: "#6366F1", usage: "accent" },
      { hex: "#8B5CF6", usage: "secondary" },
    )
  }

  return colors.slice(0, 10) // Return top 10 colors
}

/**
 * Extracts typography information from CSS
 */
function extractTypography(html: string): Typography[] {
  const typography: Typography[] = []
  const fontFamilies = new Set<string>()

  // Extract from style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let styleMatch
  const fontFamilyRegex = /font-family\s*:\s*([^;]+)/gi

  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const styles = styleMatch[1]
    let fontMatch
    while ((fontMatch = fontFamilyRegex.exec(styles)) !== null) {
      const family = fontMatch[1].trim().replace(/['"]/g, "").split(",")[0].trim()
      if (family && family.length > 0) {
        fontFamilies.add(family)
      }
    }
  }

  // Default typography if none found
  const families = Array.from(fontFamilies).slice(0, 2)
  if (families.length === 0) {
    families.push("system-ui", "sans-serif")
  }

  // Create typography entries
  const usages: Array<"heading" | "body" | "caption"> = ["heading", "body", "caption"]
  const fontWeights = [700, 400, 600]
  const fontSizes = ["2.25rem", "1rem", "0.875rem"]

  families.forEach((family, familyIdx) => {
    usages.forEach((usage, usageIdx) => {
      typography.push({
        fontFamily: family,
        fontWeight: fontWeights[usageIdx] || 400,
        fontSize: fontSizes[usageIdx] || "1rem",
        lineHeight: "1.5",
        usage,
      })
    })
  })

  return typography.slice(0, 5)
}

/**
 * Extracts page layout structure
 */
function extractLayoutStructure(html: string): { type: "single-column" | "multi-column" | "grid"; sections: string[] } {
  const sections: string[] = []

  // Look for common semantic sections
  const sectionTags = ["header", "nav", "main", "section", "article", "footer", '[role="main"]', '[role="navigation"]']

  sectionTags.forEach((tag) => {
    if (html.includes(`<${tag}`) || html.includes(tag)) {
      sections.push(tag.replace(/[<>[\]"]/g, "").split(" ")[0])
    }
  })

  // Default sections if none found
  if (sections.length === 0) {
    sections.push("header", "main", "footer")
  }

  return {
    type: "multi-column",
    sections: Array.from(new Set(sections)),
  }
}

/**
 * Extract page title from HTML
 */
function extractPageTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : null
}

/**
 * Helper: Normalize color to hex format
 */
function normalizeColor(color: string): string | null {
  color = color.trim()

  // Already hex
  if (color.startsWith("#")) {
    if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
      return color.length === 4 ? expandHex(color) : color.toUpperCase()
    }
    return null
  }

  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1]).toString(16).padStart(2, "0")
    const g = Number.parseInt(rgbMatch[2]).toString(16).padStart(2, "0")
    const b = Number.parseInt(rgbMatch[3]).toString(16).padStart(2, "0")
    return `#${r}${g}${b}`.toUpperCase()
  }

  return null
}

function expandHex(hex: string): string {
  return (
    "#" +
    hex
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")
  )
}

/**
 * Helper: Check if color is valid (not white/black filters)
 */
function isValidColor(hex: string): boolean {
  return hex !== "#000000" && hex !== "#FFFFFF" && hex.length === 7
}

/**
 * Helper: Categorize color by index and value
 */
function categorizeColorUsage(hex: string, index: number): string {
  const usage = ["primary", "secondary", "accent", "neutral", "background"]
  return usage[index % usage.length]
}
