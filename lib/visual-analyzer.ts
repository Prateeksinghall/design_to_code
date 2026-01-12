// IMPORTANT: On Vercel, we MUST use puppeteer-core + @sparticuz/chromium
// Regular puppeteer will NOT work on Vercel (tries to install full Chromium binary)
import type { Browser, Page } from "puppeteer-core"
import type { WebsiteAnalysis, Color, DesignSystem } from "./types"

// Dynamic imports for different environments
let puppeteer: typeof import("puppeteer") | null = null // Only for local dev
let puppeteerCore: typeof import("puppeteer-core") | null = null // For serverless (Vercel) - REQUIRED
let chromium: typeof import("@sparticuz/chromium") | null = null // For serverless (Vercel) - REQUIRED

/**
 * Check if running on Vercel serverless environment
 */
function isVercelServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL_ENV
  )
}

/**
 * Visual analyzer using headless browser to capture and analyze rendered pages
 */
export class VisualAnalyzer {
  private browser: Browser | null = null

  /**
   * Initialize browser instance
   */
  async init(): Promise<void> {
    if (!this.browser) {
      try {
        const isServerless = isVercelServerless()
        
        // CRITICAL: On Vercel/serverless, ONLY use puppeteer-core + @sparticuz/chromium
        // NEVER use regular puppeteer in serverless environments
        if (isServerless) {
          // Load @sparticuz/chromium - REQUIRED for Vercel
          if (!chromium) {
            const chromiumModule = await import("@sparticuz/chromium" as any).catch(() => null)
            chromium = (chromiumModule?.default || chromiumModule) as typeof chromium
          }
          
          if (!chromium) {
            throw new Error(
              "@sparticuz/chromium is required for serverless environments like Vercel. " +
              "Regular puppeteer will NOT work on Vercel. " +
              "Please install: npm install @sparticuz/chromium puppeteer-core"
            )
          }
          
          // Load puppeteer-core - REQUIRED for Vercel
          if (!puppeteerCore) {
            puppeteerCore = await import("puppeteer-core")
          }
          
          if (!puppeteerCore) {
            throw new Error("Failed to load puppeteer-core")
          }
          
          const executablePath = await chromium.executablePath()
          const chromiumArgs = chromium.args || []
          const chromiumHeadless = chromium.headless
          
          // Configure launch options for serverless - MUST use @sparticuz/chromium
          const launchOptions = {
            args: chromiumArgs,
            defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
            executablePath,
            headless: typeof chromiumHeadless === 'boolean' ? chromiumHeadless : true,
          }
          
          // Use puppeteer-core for serverless - this is the ONLY way it works on Vercel
          this.browser = (await puppeteerCore.launch(launchOptions)) as unknown as Browser
        } else {
          // Local development - use regular puppeteer (includes Chromium)
          if (!puppeteer) {
            puppeteer = await import("puppeteer")
          }
          
          this.browser = (await puppeteer.launch({
            headless: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-accelerated-2d-canvas",
              "--disable-gpu",
              "--disable-blink-features=AutomationControlled",
              "--disable-features=IsolateOrigins,site-per-process",
            ],
          })) as unknown as Browser
        }
      } catch (error: any) {
        console.error("Failed to launch Puppeteer browser:", error)
        const isServerless = isVercelServerless()
        if (isServerless) {
          const errorMsg = error?.message || "Unknown error"
          throw new Error(
            `Browser initialization failed on serverless: ${errorMsg}. ` +
            `Vercel requires puppeteer-core with @sparticuz/chromium. ` +
            `Regular puppeteer will NOT work on Vercel.`
          )
        }
        throw new Error(`Browser initialization failed: ${error?.message || "Make sure Puppeteer is properly installed."}`)
      }
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Capture screenshot of the website
   */
  async captureScreenshot(url: string): Promise<string> {
    if (!this.browser) {
      await this.init()
    }

    const page = await this.browser!.newPage()
    try {
      // Set viewport size
      await page.setViewport({ width: 1920, height: 1080 })

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      )

      // Navigate to URL with timeout and error handling
      // Use faster wait strategy first, fallback to networkidle2 if needed
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded", // Faster - waits for DOM, not all resources
          timeout: 20000, // Reduced from 30s to 20s
        })
        // Wait a bit for critical resources
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (navError) {
        console.warn(`Fast navigation failed for ${url}, trying networkidle2:`, navError)
        // Fallback to networkidle2 if domcontentloaded fails
        try {
          await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          })
        } catch (fallbackError) {
          console.warn(`Navigation failed for ${url}:`, fallbackError)
          throw fallbackError
        }
      }

      // Wait for page to render (reduced from 2000ms to 1000ms)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Handle potential bot detection or blocking
      const pageContent = await page.content()
      if (pageContent.includes("bot") || pageContent.includes("blocked") || pageContent.length < 1000) {
        console.warn(`Possible bot detection or blocking for ${url}`)
      }

      // Take screenshot
      // On Vercel with @sparticuz/chromium, screenshot might return Buffer or string
      const screenshot: string | Buffer = await page.screenshot({
        type: "png",
        fullPage: false, // Only capture viewport
        encoding: "base64",
      }) as string | Buffer

      if (!screenshot) {
        throw new Error("Screenshot capture returned null or undefined")
      }

      // Ensure screenshot is a string (base64 encoded)
      let screenshotString: string
      if (typeof screenshot === "string") {
        screenshotString = screenshot
      } else {
        // Convert Buffer to base64 string
        screenshotString = screenshot.toString("base64")
      }

      if (!screenshotString || screenshotString.length === 0) {
        throw new Error("Screenshot capture returned empty data after conversion")
      }

      return `data:image/png;base64,${screenshotString}`
    } catch (error) {
      console.error(`Screenshot capture failed for ${url}:`, error)
      throw error // Re-throw to be caught by caller
    } finally {
      await page.close()
    }
  }

  /**
   * Extract colors from rendered page using computed styles
   */
  async extractVisualColors(url: string): Promise<Color[]> {
    if (!this.browser) {
      await this.init()
    }

    const page = await this.browser!.newPage()
    const colors: Color[] = []
    const colorSet = new Set<string>()

    try {
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Extract colors from computed styles of all elements
      const extractedColors = await page.evaluate(() => {
        const colors: string[] = []
        const colorSet = new Set<string>()

        // Helper to convert any color format to hex
        const rgbToHex = (r: number, g: number, b: number): string => {
          return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()
        }

        // Get all elements
        const allElements = document.querySelectorAll("*")

        allElements.forEach((element) => {
          const styles = window.getComputedStyle(element)

          // Extract background color
          const bgColor = styles.backgroundColor
          if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
            const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (match) {
              const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
              if (hex !== "#000000" && hex !== "#FFFFFF") {
                colorSet.add(hex)
              }
            }
          }

          // Extract text color
          const textColor = styles.color
          if (textColor && textColor !== "rgba(0, 0, 0, 0)") {
            const match = textColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (match) {
              const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
              if (hex !== "#000000" && hex !== "#FFFFFF") {
                colorSet.add(hex)
              }
            }
          }

          // Extract border color
          const borderColor = styles.borderColor
          if (borderColor && borderColor !== "rgba(0, 0, 0, 0)") {
            const match = borderColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (match) {
              const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
              if (hex !== "#000000" && hex !== "#FFFFFF") {
                colorSet.add(hex)
              }
            }
          }
        })

        return Array.from(colorSet)
      })

      // Convert to Color objects
      extractedColors.forEach((hex, idx) => {
        const usage = categorizeColorUsage(hex, idx) as
          | "primary"
          | "secondary"
          | "accent"
          | "neutral"
          | "background"
        colors.push({ hex, usage })
      })

      return colors.slice(0, 15) // Return top 15 colors
    } finally {
      await page.close()
    }
  }

  /**
   * Extract typography from rendered page
   */
  async extractVisualTypography(url: string) {
    if (!this.browser) {
      await this.init()
    }

    const page = await this.browser!.newPage()

    try {
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const typography = await page.evaluate(() => {
        const fontData: Array<{
          fontFamily: string
          fontSize: string
          fontWeight: number
          lineHeight: string
          usage: string
        }> = []

        // Get typography from headings
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
        headings.forEach((heading) => {
          const styles = window.getComputedStyle(heading)
          fontData.push({
            fontFamily: styles.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
            fontSize: styles.fontSize,
            fontWeight: parseInt(styles.fontWeight) || 700,
            lineHeight: styles.lineHeight,
            usage: "heading",
          })
        })

        // Get typography from body text
        const bodyElements = document.querySelectorAll("p, span, div, li")
        if (bodyElements.length > 0) {
          const styles = window.getComputedStyle(bodyElements[0])
          fontData.push({
            fontFamily: styles.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
            fontSize: styles.fontSize,
            fontWeight: parseInt(styles.fontWeight) || 400,
            lineHeight: styles.lineHeight,
            usage: "body",
          })
        }

        // Get typography from small text
        const smallElements = document.querySelectorAll("small, .text-sm, .caption")
        if (smallElements.length > 0) {
          const styles = window.getComputedStyle(smallElements[0])
          fontData.push({
            fontFamily: styles.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
            fontSize: styles.fontSize,
            fontWeight: parseInt(styles.fontWeight) || 400,
            lineHeight: styles.lineHeight,
            usage: "caption",
          })
        }

        return fontData
      })

      // Deduplicate and return
      const uniqueTypography = Array.from(
        new Map(typography.map((t) => [`${t.fontFamily}-${t.usage}`, t])).values(),
      )

      return uniqueTypography.slice(0, 5)
    } finally {
      await page.close()
    }
  }

  /**
   * Analyze layout structure from rendered page
   */
  async analyzeVisualLayout(url: string) {
    if (!this.browser) {
      await this.init()
    }

    const page = await this.browser!.newPage()

    try {
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const layout = await page.evaluate(() => {
        const sections: string[] = []

        // Find semantic sections
        const semanticTags = ["header", "nav", "main", "section", "article", "footer", "aside"]
        semanticTags.forEach((tag) => {
          if (document.querySelector(tag)) {
            sections.push(tag)
          }
        })

        // Detect layout type based on structure
        const mainContent = document.querySelector("main") || document.body
        const children = Array.from(mainContent?.children || [])
        const hasMultipleColumns = children.some((child) => {
          const styles = window.getComputedStyle(child)
          return (
            styles.display === "grid" ||
            styles.display === "flex" ||
            child.classList.toString().includes("grid") ||
            child.classList.toString().includes("flex")
          )
        })

        return {
          type: hasMultipleColumns ? ("multi-column" as const) : ("single-column" as const),
          sections: sections.length > 0 ? sections : ["header", "main", "footer"],
        }
      })

      return layout
    } finally {
      await page.close()
    }
  }

  /**
   * Analyze website with visual analysis
   * Optimized: Reuses single page for all operations to reduce time
   */
  async analyzeWebsite(url: string): Promise<{
    screenshot: string
    colors: Color[]
    typography: Array<{
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: string
      usage: string
    }>
    layout: {
      type: "single-column" | "multi-column" | "grid"
      sections: string[]
    }
  }> {
    await this.init()

    const page = await this.browser!.newPage()
    let screenshot = ""
    let colors: Color[] = []
    let typography: Array<{
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: string
      usage: string
    }> = []
    let layout: {
      type: "single-column" | "multi-column" | "grid"
      sections: string[]
    } = { type: "multi-column", sections: [] }

    try {
      // Set viewport and user agent once
      await page.setViewport({ width: 1920, height: 1080 })
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      )

      // Navigate with better wait strategy to ensure CSS is loaded
      try {
        // Try fast navigation first
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        })
        
        // Wait for stylesheets and resources to load
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            if (document.readyState === 'complete') {
              resolve()
            } else {
              window.addEventListener('load', () => resolve(), { once: true })
              setTimeout(() => resolve(), 3000) // Max 3s wait
            }
          })
        }).catch(() => {
          // If wait fails, continue anyway
        })
        
        // Wait for computed styles to be ready (critical for color extraction)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        
        // Force style recalculation
        await page.evaluate(() => {
          // Trigger reflow to ensure computed styles are ready
          document.body.offsetHeight
          // Check if stylesheets are loaded
          const stylesheets = Array.from(document.styleSheets)
          return stylesheets.length > 0
        })
        
      } catch (navError) {
        console.warn(`Fast navigation failed for ${url}, trying networkidle2:`, navError)
        // Fallback to networkidle2 for better CSS loading
        try {
          await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          })
          await new Promise((resolve) => setTimeout(resolve, 1500))
        } catch (fallbackError) {
          console.warn(`Navigation failed for ${url}:`, fallbackError)
          throw fallbackError
        }
      }

      // Now run all extractions on the same page (much faster!)
      const [screenshotResult, colorsResult, typographyResult, layoutResult] = await Promise.allSettled([
        // Screenshot
        (async () => {
          const screenshotData = await page.screenshot({
            type: "png",
            fullPage: false,
            encoding: "base64",
          })
          return `data:image/png;base64,${screenshotData}`
        })(),
        // Colors - with better style computation wait
        page.evaluate(() => {
          // Force style recalculation to ensure computed styles are ready
          document.body.offsetHeight // Trigger reflow
          
          const colors: string[] = []
          const colorSet = new Set<string>()
          const rgbToHex = (r: number, g: number, b: number): string => {
            return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()
          }
          
          // Get all elements - prioritize visible ones
          const allElements = document.querySelectorAll("*")
          
          // Extract colors from all elements
          allElements.forEach((element) => {
            try {
              const styles = window.getComputedStyle(element)
              if (!styles) return
              
              // Helper to normalize color to hex
              const normalizeToHex = (colorStr: string): string | null => {
                if (!colorStr || colorStr === "rgba(0, 0, 0, 0)" || colorStr === "transparent" || colorStr === "none") {
                  return null
                }
                
                // Already hex
                if (colorStr.startsWith("#")) {
                  const hexMatch = colorStr.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
                  if (hexMatch) {
                    const hex = hexMatch[0]
                    // Expand short hex (#FFF -> #FFFFFF)
                    if (hex.length === 4) {
                      return "#" + hex.slice(1).split("").map(c => c + c).join("").toUpperCase()
                    }
                    return hex.toUpperCase()
                  }
                }
                
                // RGB/RGBA
                const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
                if (rgbMatch) {
                  return rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]))
                }
                
                return null
              }
              
              // Extract background color
              const bgHex = normalizeToHex(styles.backgroundColor)
              if (bgHex && bgHex !== "#000000" && bgHex !== "#FFFFFF") {
                colorSet.add(bgHex)
              }
              
              // Extract text color
              const textHex = normalizeToHex(styles.color)
              if (textHex && textHex !== "#000000" && textHex !== "#FFFFFF") {
                colorSet.add(textHex)
              }
              
              // Extract border color
              const borderHex = normalizeToHex(styles.borderColor)
              if (borderHex && borderHex !== "#000000" && borderHex !== "#FFFFFF") {
                colorSet.add(borderHex)
              }
              
              // Also check outline color for more variety
              const outlineHex = normalizeToHex(styles.outlineColor)
              if (outlineHex && outlineHex !== "#000000" && outlineHex !== "#FFFFFF") {
                colorSet.add(outlineHex)
              }
            } catch (e) {
              // Skip elements that cause errors
            }
          })
          
          return Array.from(colorSet)
        }),
        // Typography
        page.evaluate(() => {
          const fontData: Array<{
            fontFamily: string
            fontSize: string
            fontWeight: number
            lineHeight: string
            usage: string
          }> = []
          const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
          headings.forEach((heading) => {
            const styles = window.getComputedStyle(heading)
            fontData.push({
              fontFamily: styles.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
              fontSize: styles.fontSize,
              fontWeight: parseInt(styles.fontWeight) || 700,
              lineHeight: styles.lineHeight,
              usage: "heading",
            })
          })
          const bodyElements = document.querySelectorAll("p, span, div, li")
          if (bodyElements.length > 0) {
            const styles = window.getComputedStyle(bodyElements[0])
            fontData.push({
              fontFamily: styles.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
              fontSize: styles.fontSize,
              fontWeight: parseInt(styles.fontWeight) || 400,
              lineHeight: styles.lineHeight,
              usage: "body",
            })
          }
          const smallElements = document.querySelectorAll("small, .text-sm, .caption")
          if (smallElements.length > 0) {
            const styles = window.getComputedStyle(smallElements[0])
            fontData.push({
              fontFamily: styles.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
              fontSize: styles.fontSize,
              fontWeight: parseInt(styles.fontWeight) || 400,
              lineHeight: styles.lineHeight,
              usage: "caption",
            })
          }
          return fontData
        }),
        // Layout
        page.evaluate(() => {
          const sections: string[] = []
          const semanticTags = ["header", "nav", "main", "section", "article", "footer", "aside"]
          semanticTags.forEach((tag) => {
            if (document.querySelector(tag)) {
              sections.push(tag)
            }
          })
          const mainContent = document.querySelector("main") || document.body
          const children = Array.from(mainContent?.children || [])
          const hasMultipleColumns = children.some((child) => {
            const styles = window.getComputedStyle(child)
            return (
              styles.display === "grid" ||
              styles.display === "flex" ||
              child.classList.toString().includes("grid") ||
              child.classList.toString().includes("flex")
            )
          })
          return {
            type: hasMultipleColumns ? ("multi-column" as const) : ("single-column" as const),
            sections: sections.length > 0 ? sections : ["header", "main", "footer"],
          }
        }),
      ])

      // Process results
      if (screenshotResult.status === "fulfilled") {
        screenshot = screenshotResult.value
      } else {
        console.warn(`Screenshot capture failed for ${url}:`, screenshotResult.reason)
      }

      if (colorsResult.status === "fulfilled") {
        const extractedColors = colorsResult.value
        extractedColors.forEach((hex, idx) => {
          // Categorize color usage (helper function is outside browser context)
          const usageOptions = ["primary", "secondary", "accent", "neutral", "background"]
          const usage = usageOptions[idx % usageOptions.length] as
            | "primary"
            | "secondary"
            | "accent"
            | "neutral"
            | "background"
          colors.push({ hex, usage })
        })
        colors = colors.slice(0, 15)
      } else {
        console.warn(`Color extraction failed for ${url}:`, colorsResult.reason)
      }

      if (typographyResult.status === "fulfilled") {
        const typoData = typographyResult.value
        const uniqueTypography = Array.from(
          new Map(typoData.map((t) => [`${t.fontFamily}-${t.usage}`, t])).values(),
        )
        typography = uniqueTypography.slice(0, 5)
      } else {
        console.warn(`Typography extraction failed for ${url}:`, typographyResult.reason)
      }

      if (layoutResult.status === "fulfilled") {
        layout = layoutResult.value
      } else {
        console.warn(`Layout analysis failed for ${url}:`, layoutResult.reason)
      }
    } catch (error) {
      console.error(`Visual analysis failed for ${url}:`, error)
      // Return empty results instead of throwing
    } finally {
      await page.close()
    }

    return {
      screenshot,
      colors,
      typography,
      layout,
    }
  }
}

/**
 * Helper: Categorize color by index
 */
function categorizeColorUsage(hex: string, index: number): string {
  const usage = ["primary", "secondary", "accent", "neutral", "background"]
  return usage[index % usage.length]
}

/**
 * Singleton instance
 */
let visualAnalyzerInstance: VisualAnalyzer | null = null

export function getVisualAnalyzer(): VisualAnalyzer {
  if (!visualAnalyzerInstance) {
    visualAnalyzerInstance = new VisualAnalyzer()
  }
  return visualAnalyzerInstance
}
