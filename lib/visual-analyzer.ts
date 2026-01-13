import puppeteer from "puppeteer"
import puppeteerCore from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import type { Browser } from "puppeteer-core"
import type { Color } from "./types"

const isVercel = !!process.env.VERCEL

async function launchBrowser(): Promise<Browser | null> {
  try {
    if (!isVercel) {
      // ✅ LOCAL: bundled Chromium
      return await puppeteer.launch({
        headless: true,
      })
    }

    // ✅ VERCEL
    return await puppeteerCore.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    })
  } catch (err: any) {
    console.warn("⚠️ Browser launch failed", err.message)
    return null
  }
}

/* =========================================================
   🎨 Visual Analyzer (OPTIONAL ONLY)
   ========================================================= */

export class VisualAnalyzer {
  /**
   * Capture screenshot (NON-BLOCKING)
   */
  async captureScreenshot(url: string): Promise<string | null> {
    const browser = await launchBrowser()
    if (!browser) return null

    let page
    try {
      page = await browser.newPage()

      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 25_000,
      })

      const screenshot = await page.screenshot({
        type: "png",
        encoding: "base64",
      })

      return `data:image/png;base64,${screenshot}`
    } catch (err: any) {
      console.warn("⚠️ Screenshot failed", {
        url,
        message: err.message,
      })
      return null
    } finally {
      try {
        await page?.close()
        await browser.close()
      } catch { }
    }
  }

  /**
   * Extract dominant visual colors (NON-BLOCKING)
   */
  async extractVisualColors(url: string): Promise<Color[]> {
    const browser = await launchBrowser()
    if (!browser) return []

    let page
    try {
      page = await browser.newPage()

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 25_000,
      })

      const colors = await page.evaluate(() => {
        const set = new Set<string>()

        const toHex = (r: number, g: number, b: number) =>
          "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")

        document.querySelectorAll("*").forEach(el => {
          const s = getComputedStyle(el)

          const match = s.backgroundColor.match(
            /rgba?\((\d+),\s*(\d+),\s*(\d+)/
          )

          if (match) {
            set.add(toHex(+match[1], +match[2], +match[3]))
          }
        })

        return [...set]
      })

      return colors.slice(0, 8).map((hex, i) => ({
        hex,
        usage: ["primary", "secondary", "accent", "neutral"][i % 4] as any,
      }))
    } catch (err: any) {
      console.warn("⚠️ Visual color extraction failed", {
        url,
        message: err.message,
      })
      return []
    } finally {
      try {
        await page?.close()
        await browser.close()
      } catch { }
    }
  }
}
