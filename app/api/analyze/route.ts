import { type NextRequest, NextResponse } from "next/server"
import { analyzeWebsite } from "@/lib/analyzer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // Allow up to 60 seconds for visual analysis

export async function POST(request: NextRequest) {
  try {
    const { url, captureScreenshot = false } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid URL required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // HTML extraction is always used (primary method)
    // Screenshot is optional (for AI vision use)
    const analysis = await analyzeWebsite(url, captureScreenshot)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 })
  }
}
