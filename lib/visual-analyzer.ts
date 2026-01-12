import puppeteer, { Browser } from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import type { Color } from "./types"

/**
 * Detect Vercel environment
 */
const isVercel = !!process.env.VERCEL

/**
 * Resolve local Chrome executable path
 */
function getLocalChromePath(): string {
  if (process.platform === "win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  }

  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  }

  // Linux
  return "/usr/bin/google-chrome"
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
    if (this.browser) return

    try {
      console.log("🚀 Launching browser...")

      if (isVercel) {
        console.log("🌐 Environment: Vercel")

        this.browser = await puppeteer.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
        })
      } else {
        const executablePath = getLocalChromePath()
        console.log("💻 Environment: Local")
        console.log("🧭 Chrome path:", executablePath)

        this.browser = await puppeteer.launch({
          executablePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        })
      }

      console.log("✅ Browser launched")
    } catch (error: any) {
      console.error("❌ Failed to launch browser:", error)
      throw new Error(
        `Browser initialization failed: ${error?.message || "Unknown error"}`
      )
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log("🛑 Browser closed")
    }
  }

  /**
   * Capture screenshot (Base64)
   */
  async captureScreenshot(url: string): Promise<string> {
    await this.init()
    const page = await this.browser!.newPage()

    try {
      console.log("🌍 Navigating to:", url)

      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, {
        waitUntil: "load",
        timeout: 30000,
      })

      console.log("📸 Taking screenshot...")

      const screenshot = await page.screenshot({
        type: "png",
        encoding: "base64",
        fullPage: true,
      })

      console.log("✅ Screenshot captured")

      return `data:image/png;base64,${screenshot}`
    } catch (error) {
      console.error("❌ Screenshot failed:", error)
      throw error
    } finally {
      await page.close()
    }
  }

  /**
   * Fetch rendered HTML
   */
  async fetchHTML(url: string): Promise<string> {
    await this.init()
    const page = await this.browser!.newPage()

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      })

      return await page.content()
    } finally {
      await page.close()
    }
  }

  /**
   * Extract visual colors
   */
  async extractVisualColors(url: string): Promise<Color[]> {
    await this.init()
    const page = await this.browser!.newPage()

    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 })

      const colors = await page.evaluate(() => {
        const set = new Set<string>()
        const rgbToHex = (r: number, g: number, b: number) =>
          "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")

        document.querySelectorAll("*").forEach(el => {
          const styles = getComputedStyle(el)
          const parse = (c: string) => {
            const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (m) set.add(rgbToHex(+m[1], +m[2], +m[3]))
          }
          parse(styles.color)
          parse(styles.backgroundColor)
        })

        return Array.from(set)
      })

      return colors.slice(0, 12).map((hex, i) => ({
        hex,
        usage: ["primary", "secondary", "accent", "neutral"][i % 4] as any,
      }))
    } finally {
      await page.close()
    }
  }

  /**
   * Extract typography
   */
  async extractVisualTypography(url: string) {
    await this.init()
    const page = await this.browser!.newPage()

    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 })

      return await page.evaluate(() => {
        const data: any[] = []
        document.querySelectorAll("h1,h2,h3,p,span").forEach(el => {
          const s = getComputedStyle(el)
          data.push({
            fontFamily: s.fontFamily.split(",")[0],
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            usage: el.tagName.startsWith("H") ? "heading" : "body",
          })
        })
        return data.slice(0, 6)
      })
    } finally {
      await page.close()
    }
  }

  /**
   * Analyze layout
   */
  async analyzeVisualLayout(url: string) {
    await this.init()
    const page = await this.browser!.newPage()

    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 })

      return await page.evaluate(() => {
        const sections = ["header", "nav", "main", "section", "footer"].filter(tag =>
          document.querySelector(tag)
        )

        return {
          type: sections.length > 2 ? "multi-section" : "single-section",
          sections,
        }
      })
    } finally {
      await page.close()
    }
  }
}

/**
 * Singleton instance
 */
let instance: VisualAnalyzer | null = null

export function getVisualAnalyzer(): VisualAnalyzer {
  if (!instance) {
    instance = new VisualAnalyzer()
  }
  return instance
}
