import * as puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import type { Browser } from "puppeteer-core"
import type { Color } from "./types"

/**
 * Detect Vercel environment
 */
const isVercel = !!process.env.VERCEL

/**
 * Cache Chromium executable path
 */
let cachedChromiumPath: string | null = null

async function getChromiumExecutablePath(): Promise<string> {
  if (!cachedChromiumPath) {
    cachedChromiumPath = isVercel
      ? await chromium.executablePath()
      : getLocalChromePath()

    console.log("🧭 Chromium executable:", cachedChromiumPath)
  }
  return cachedChromiumPath
}

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

/**
 * Launch browser (Vercel-safe)
 */
async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    executablePath: await getChromiumExecutablePath(),
    headless: chromium.headless,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    ignoreHTTPSErrors: true,
  })
}

/**
 * Singleton accessor (important for serverless)
 */
let analyzer: VisualAnalyzer | null = null
export function getVisualAnalyzer(): VisualAnalyzer {
  if (!analyzer) analyzer = new VisualAnalyzer()
  return analyzer
}

export class VisualAnalyzer {
  /**
   * Capture screenshot
   */
  async captureScreenshot(url: string): Promise<string> {
    const browser = await launchBrowser()
    const page = await browser.newPage()

    try {
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

      const screenshot = await page.screenshot({
        type: "png",
        encoding: "base64",
      })

      return `data:image/png;base64,${screenshot}`
    } finally {
      await page.close()
      await browser.close()
    }
  }

  /**
   * Fetch rendered HTML
   */
  async fetchHTML(url: string): Promise<string> {
    const browser = await launchBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      })
      return await page.content()
    } finally {
      await page.close()
      await browser.close()
    }
  }

  /**
   * Extract dominant visual colors
   */
  async extractVisualColors(url: string): Promise<Color[]> {
    const browser = await launchBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

      const colors = await page.evaluate(() => {
        const set = new Set<string>()

        const rgbToHex = (r: number, g: number, b: number) =>
          "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")

        document.querySelectorAll("*").forEach(el => {
          const s = getComputedStyle(el)
          const extract = (v: string) => {
            const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
            if (m) set.add(rgbToHex(+m[1], +m[2], +m[3]))
          }

          extract(s.color)
          extract(s.backgroundColor)
          extract(s.borderColor)
        })

        return Array.from(set)
      })

      return colors.slice(0, 12).map((hex, i) => ({
        hex,
        usage: ["primary", "secondary", "accent", "neutral"][i % 4] as any,
      }))
    } finally {
      await page.close()
      await browser.close()
    }
  }
}
