"use client"

import { useState } from "react"
import { UrlInput } from "@/components/url-input"
import { AnalysisResult } from "@/components/analysis-result"
import { CodePreview } from "@/components/code-preview"
import type { WebsiteAnalysis } from "@/lib/types"

export default function Home() {
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (url: string, captureScreenshot: boolean) => {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, captureScreenshot }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze website")
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Design to Code</h1>
              <p className="mt-1 text-slate-400">Transform any website into production-ready code</p>
            </div>
            <div className="flex gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-800 px-3 py-1">AI-Powered</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">Real-time</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* URL Input Section */}
        <section className="mb-12">
          <UrlInput onAnalyze={handleAnalyze} loading={loading} />
        </section>

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Results Grid */}
        {analysis && !loading && (
          <div className="grid gap-8 lg:grid-cols-2">
            <AnalysisResult analysis={analysis} />
            <CodePreview analysis={analysis} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-slate-800 bg-slate-900/50 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500"></div>
            <p className="text-slate-400">Analyzing website design...</p>
            <p className="text-xs text-slate-500">Extracting colors and typography from HTML (fast)</p>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && !error && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 py-16 text-center">
            <div className="mb-4 text-4xl text-slate-600">✨</div>
            <h2 className="mb-2 text-xl font-semibold text-slate-200">Ready to transform a design</h2>
            <p className="text-slate-400">Enter a website URL above to get started</p>
          </div>
        )}
      </main>
    </div>
  )
}
