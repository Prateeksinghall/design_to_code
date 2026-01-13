import type { WebsiteAnalysis, DesignSystem, Color, Typography } from "./types"
import { VisualAnalyzer } from "./visual-analyzer"

/**
 * Analyzes a website and extracts its design system
 * HTML extraction is MANDATORY
 * Visual extraction is OPTIONAL
 */
export async function analyzeWebsite(
  url: string,
  captureScreenshot: boolean = false
): Promise<WebsiteAnalysis> {
  const startedAt = Date.now()
  logInfo("analysis:start", { url, captureScreenshot })

  /* ──────────────────────────────
     1️⃣ Validate URL
     ────────────────────────────── */
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    logError("analysis:invalid_url", { url })
    throw new Error("Invalid URL provided")
  }

  /* ──────────────────────────────
     2️⃣ Mandatory HTML fetch
     ────────────────────────────── */
  let html: string
  try {
    html = await fetchHTMLStrict(url)
    logInfo("analysis:html_fetched", {
      domain: urlObj.hostname,
      size: html.length,
    })
  } catch (err: any) {
    logError("analysis:html_failed", { message: err.message })
    throw err
  }

  /* ──────────────────────────────
     3️⃣ Extract metadata
     ────────────────────────────── */
  const title = extractPageTitle(html) || urlObj.hostname
  const designSystem = extractDesignSystem(html)
  const layout = extractLayoutStructure(html)

  /* ──────────────────────────────
     4️⃣ Optional screenshot (NON-BLOCKING)
     ────────────────────────────── */
  let screenshot: string | undefined

  if (captureScreenshot) {
    try {
      const visual = new VisualAnalyzer()
      screenshot = (await visual.captureScreenshot(url)) || undefined
      logInfo("analysis:screenshot", { success: Boolean(screenshot) })
    } catch (err: any) {
      logWarn("analysis:screenshot_failed", { message: err.message })
    }
  }

  /* ──────────────────────────────
     5️⃣ Final result
     ────────────────────────────── */
  logInfo("analysis:completed", { durationMs: Date.now() - startedAt })

  return {
    url,
    title,
    screenshot,
    designSystem,
    layout,
    extractedAt: new Date().toISOString(),
  }
}

/* =========================================================
   🔒 STRICT HTML FETCH (NO BROWSER EVER)
   ========================================================= */

async function fetchHTMLStrict(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }

    return await res.text()
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("HTML fetch timeout (30s)")
    }
    throw new Error(`HTML fetch failed: ${err.message}`)
  } finally {
    clearTimeout(timeout)
  }
}

/* =========================================================
   🎨 DESIGN SYSTEM EXTRACTION
   ========================================================= */

function extractDesignSystem(html: string): DesignSystem {
  return {
    colors: extractColors(html),
    typography: extractTypography(html),
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

/* =========================================================
   🎨 COLOR EXTRACTION
   ========================================================= */

function extractColors(html: string): Color[] {
  const set = new Set<string>()
  const regex =
    /#(?:[0-9a-fA-F]{3}){1,2}|rgba?\(\d+,\s*\d+,\s*\d+/gi

  let match
  while ((match = regex.exec(html)) !== null) {
    const hex = normalizeColor(match[0])
    if (hex && isValidColor(hex)) set.add(hex)
  }

  const colors = [...set].slice(0, 10).map((hex, i) => ({
    hex,
    usage: ["primary", "secondary", "accent", "neutral"][i % 4] as any,
  }))

  return colors.length
    ? colors
    : [
      { hex: "#000000", usage: "neutral" },
      { hex: "#FFFFFF", usage: "background" },
    ]
}

/* =========================================================
   🔤 TYPOGRAPHY (SEMANTIC + CSS HYBRID)
   ========================================================= */

function extractTypography(html: string): Typography[] {
  const typography: Typography[] = []

  /* ---------------------------------------------
     1️⃣ Detect font-family (best effort)
     --------------------------------------------- */
  let fontFamily = "system-ui"
  const fontMatch = /font-family\s*:\s*([^;]+)/i.exec(html)
  if (fontMatch) {
    fontFamily = fontMatch[1]
      .replace(/['"]/g, "")
      .split(",")[0]
      .trim()
  }

  /* ---------------------------------------------
     2️⃣ Detect largest heading level
     --------------------------------------------- */
  const headingLevels = [
    { tag: "h1", size: "2.25rem", weight: 700 },
    { tag: "h2", size: "1.875rem", weight: 600 },
    { tag: "h3", size: "1.5rem", weight: 600 },
    { tag: "h4", size: "1.25rem", weight: 600 },
  ]

  const primaryHeading = headingLevels.find(({ tag }) =>
    new RegExp(`<${tag}[\\s>]`, "i").test(html)
  )

  if (primaryHeading) {
    typography.push({
      fontFamily,
      fontWeight: primaryHeading.weight,
      fontSize: primaryHeading.size,
      lineHeight: "1.2",
      usage: "heading",
    })
  }

  /* ---------------------------------------------
     3️⃣ Body text
     --------------------------------------------- */
  if (/<p[\s>]|<div[\s>]/i.test(html)) {
    typography.push({
      fontFamily,
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: "1.5",
      usage: "body",
    })
  }

  /* ---------------------------------------------
     4️⃣ Caption / UI text
     --------------------------------------------- */
  if (/<button[\s>]|<a[\s>]|<label[\s>]/i.test(html)) {
    typography.push({
      fontFamily,
      fontWeight: 500,
      fontSize: "0.875rem",
      lineHeight: "1.4",
      usage: "caption",
    })
  }

  /* ---------------------------------------------
     5️⃣ Guaranteed fallback
     --------------------------------------------- */
  if (typography.length === 0) {
    typography.push({
      fontFamily: "system-ui",
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: "1.5",
      usage: "body",
    })
  }

  return typography
}


/* =========================================================
   📐 LAYOUT EXTRACTION
   ========================================================= */

function extractLayoutStructure(html: string) {
  const sections: string[] = []

    ;["header", "nav", "main", "section", "article", "footer"].forEach((tag) => {
      if (html.includes(`<${tag}`)) sections.push(tag)
    })

  return {
    type: sections.length > 2 ? "multi-column" : "single-column",
    sections: sections.length ? [...new Set(sections)] : ["main"],
  }
}

/* =========================================================
   🧰 HELPERS
   ========================================================= */

function extractPageTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i)
  return match ? match[1].trim() : null
}

function normalizeColor(color: string): string | null {
  if (color.startsWith("#")) {
    return color.length === 4
      ? "#" +
      color
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
        .toUpperCase()
      : color.toUpperCase()
  }

  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null

  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((v) => Number(v).toString(16).padStart(2, "0"))
      .join("")
  ).toUpperCase()
}

function isValidColor(hex: string) {
  return hex.length === 7 && hex !== "#000000" && hex !== "#FFFFFF"
}

/* =========================================================
   📊 LOGGING (VERCEL SAFE)
   ========================================================= */

function logInfo(event: string, data: Record<string, any>) {
  console.log(`ℹ️ ${event}`, data)
}

function logWarn(event: string, data: Record<string, any>) {
  console.warn(`⚠️ ${event}`, data)
}

function logError(event: string, data: Record<string, any>) {
  console.error(`❌ ${event}`, data)
}
