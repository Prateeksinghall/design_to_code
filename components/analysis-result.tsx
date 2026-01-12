"use client"

import { useState } from "react"
import { DownloadIcon } from "lucide-react"
import type { WebsiteAnalysis } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  exportAnalysisAsJSON,
  exportAIReadyData,
  exportDesignTokensAsJSON,
  exportDesignTokensAsCSS,
  exportDesignTokensAsTailwindConfig,
  exportDesignTokensAsPattern,
  downloadFile,
  generateFilename,
} from "@/lib/design-tokens-exporter"

interface AnalysisResultProps {
  analysis: WebsiteAnalysis
}

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = (format: string, content: string, extension: string, mimeType: string) => {
    setDownloading(true)
    try {
      const filename = generateFilename(analysis.url, extension)
      downloadFile(content, filename, mimeType)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Screenshot Preview */}
      {analysis.screenshot && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Website Screenshot</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Copy base64 string (without data URI prefix)
                  const base64Only = analysis.screenshot!.replace(/^data:image\/\w+;base64,/, "")
                  navigator.clipboard.writeText(base64Only)
                  alert("Base64 string copied to clipboard!")
                }}
                className="text-xs"
              >
                Copy Base64
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Copy full data URI
                  navigator.clipboard.writeText(analysis.screenshot!)
                  alert("Full data URI copied to clipboard!")
                }}
                className="text-xs"
              >
                Copy Data URI
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-700">
            <img
              src={analysis.screenshot}
              alt={`Screenshot of ${analysis.title}`}
              className="w-full h-auto"
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Format: data:image/png;base64,{analysis.screenshot.substring(22, 50)}...
          </div>
        </div>
      )}

      {/* Website Info */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Website Details</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={downloading}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                {downloading ? "Downloading..." : "Download"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer font-semibold"
                onClick={() => {
                  const content = exportAIReadyData(analysis)
                  const filename = generateFilename(analysis.url, "json", "ai-ready")
                  downloadFile(content, filename, "application/json")
                }}
              >
                🤖 AI-Ready Data (Recommended)
                <span className="ml-2 text-xs text-slate-500">For code generation</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                onClick={() =>
                  handleDownload(
                    "json",
                    exportAnalysisAsJSON(analysis),
                    "json",
                    "application/json",
                  )
                }
              >
                Complete Analysis (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                onClick={() =>
                  handleDownload(
                    "tokens-json",
                    exportDesignTokensAsJSON(analysis),
                    "json",
                    "application/json",
                  )
                }
              >
                Design Tokens (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                onClick={() =>
                  handleDownload(
                    "css",
                    exportDesignTokensAsCSS(analysis),
                    "css",
                    "text/css",
                  )
                }
              >
                CSS Variables
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                onClick={() =>
                  handleDownload(
                    "tailwind",
                    exportDesignTokensAsTailwindConfig(analysis),
                    "js",
                    "text/javascript",
                  )
                }
              >
                Tailwind Config
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                onClick={() =>
                  handleDownload(
                    "markdown",
                    exportDesignTokensAsPattern(analysis),
                    "md",
                    "text/markdown",
                  )
                }
              >
                Markdown Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">URL</p>
            <p className="break-all text-slate-200">{analysis.url}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Title</p>
            <p className="text-slate-200">{analysis.title}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Analyzed</p>
            <p className="text-slate-200">{new Date(analysis.extractedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Design System */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Design System</h2>

        {/* Colors */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Colors</h3>
          <div className="grid grid-cols-2 gap-3">
            {analysis.designSystem.colors.slice(0, 6).map((color, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-slate-700"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
                <div className="text-sm">
                  <p className="font-mono text-slate-300">{color.hex}</p>
                  <p className="text-xs text-slate-500">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-300">Typography</h3>
          <div className="space-y-2">
            {analysis.designSystem.typography.slice(0, 3).map((typo, idx) => (
              <div key={idx} className="rounded bg-slate-800/50 p-3">
                <p
                  className="font-medium text-slate-200"
                  style={{
                    fontFamily: typo.fontFamily,
                    fontSize: typo.fontSize,
                    fontWeight: typo.fontWeight,
                  }}
                >
                  {typo.usage}
                </p>
                <p className="text-xs text-slate-500">
                  {typo.fontFamily} • {typo.fontWeight} • {typo.fontSize}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layout Info */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Layout Structure</h2>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-slate-400">Type</p>
            <p className="capitalize text-slate-200">{analysis.layout.type}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Sections</p>
            <div className="flex flex-wrap gap-2">
              {analysis.layout.sections.map((section, idx) => (
                <span key={idx} className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                  {section}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
