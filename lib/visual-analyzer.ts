import puppeteer, { Browser } from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import type { Color } from "./types"

/**
 * Detect Vercel environment
 */
const isVercel = process.env.VERCEL === "1"

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

  return "/usr/bin/google-chrome"
}

export class VisualAnalyzer {
  private browser: Browser | null = null
  private launching = false

  /**
   * Ensure browser is healthy
   */
  private isBrowserHealthy(): boolean {
    return !!this.browser && this.browser.isConnected()
  }

  /**
   * Force close browser
   */
  private async resetBrowser() {
    try {
      if (this.browser) {
        await this.browser.close()
      }
    } catch {
      // ignore
    } finally {
      this.browser = null
    }
  }

  /**
   * Initialize or reinitialize browser
   */
  async init(): Promise<void> {
    if (this.isBrowserHealthy() || this.launching) return

    this.launching = true

    try {
      console.log("🚀 Launching browser...")
      console.log("🌍 Vercel:", isVercel)

      await this.resetBrowser()

      if (isVercel) {
        const executablePath = await chromium.executablePath()

        console.log("🧭 Chromium path:", executablePath)

        this.browser = await puppeteer.launch({
          executablePath,
          args: [
            ...chromium.args,
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process",
          ],
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
          ignoreHTTPSErrors: true,
        })
      } else {
        this.browser = await puppeteer.launch({
          executablePath: getLocalChromePath(),
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
        })
      }

      console.log("✅ Browser launched successfully")
    } catch (error: any) {
      console.error("❌ Browser launch failed:", error)
      await this.resetBrowser()
      throw new Error(
        `Browser initialization failed: ${error?.message || "Unknown error"}`
      )
    } finally {
      this.launching = false
    }
  }

  /**
   * Create a safe page (auto-heal)
   */
  private async newSafePage() {
    try {
      await this.init()
      return await this.browser!.newPage()
    } catch {
      console.warn("♻️ Browser unhealthy, retrying...")
      await this.resetBrowser()
      await this.init()
      return await this.browser!.newPage()
    }
  }

  async captureScreenshot(url: string): Promise<string> {
    const page = await this.newSafePage()

    try {
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

      const screenshot = await page.screenshot({
        type: "png",
        encoding: "base64",
        fullPage: true,
      })

      return `data:image/png;base64,${screenshot}`
    } finally {
      await page.close()
    }
  }

  async fetchHTML(url: string): Promise<string> {
    const page = await this.newSafePage()

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
      return await page.content()
    } finally {
      await page.close()
    }
  }

  async extractVisualColors(url: string): Promise<Color[]> {
    const page = await this.newSafePage()

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

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

  async extractVisualTypography(url: string) {
    const page = await this.newSafePage()

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

      return await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1,h2,h3,p,span"))
          .slice(0, 6)
          .map(el => {
            const s = getComputedStyle(el)
            return {
              fontFamily: s.fontFamily.split(",")[0],
              fontSize: s.fontSize,
              fontWeight: s.fontWeight,
              usage: el.tagName.startsWith("H") ? "heading" : "body",
            }
          })
      )
    } finally {
      await page.close()
    }
  }

  async analyzeVisualLayout(url: string) {
    const page = await this.newSafePage()

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

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
 * Singleton instance (SAFE)
 */
let instance: VisualAnalyzer | null = null

export function getVisualAnalyzer(): VisualAnalyzer {
  if (!instance) {
    instance = new VisualAnalyzer()
  }
  return instance
}
