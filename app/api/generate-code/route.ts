import { type NextRequest, NextResponse } from "next/server"
import { generateCode } from "@/lib/ai-generator"
import type { CodeGenerationRequest } from "@/lib/types"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const payload: CodeGenerationRequest = await request.json()

    if (!payload.analysis) {
      return NextResponse.json({ error: "Analysis data required" }, { status: 400 })
    }

    const result = await generateCode(payload)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Code generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Code generation failed" },
      { status: 500 },
    )
  }
}
