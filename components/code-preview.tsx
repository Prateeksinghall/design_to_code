"use client"

import { useState } from "react"
import type { WebsiteAnalysis } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface CodePreviewProps {
  analysis: WebsiteAnalysis
}

export function CodePreview({ analysis }: CodePreviewProps) {
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [files, setFiles] = useState<Array<{ path: string; content: string }>>([])
  const [loading, setLoading] = useState(false)
  const [activeFile, setActiveFile] = useState<string>("")
  const [useVision, setUseVision] = useState<boolean>(!!analysis.screenshot)

  const handleGenerateCode = async () => {
    setLoading(true)
    setGeneratedCode("")
    setFiles([])
    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          outputFormat: "tsx",
          includePages: true,
          useVision: useVision && !!analysis.screenshot, // Only use vision if screenshot exists
        }),
      })

      if (!response.ok) throw new Error("Failed to generate code")
      const data = await response.json()
      setGeneratedCode(data.code)
      setFiles(data.files)
      if (data.files.length > 0) {
        setActiveFile(data.files[0].path)
      }
    } catch (error) {
      console.error("Code generation failed:", error)
      setGeneratedCode("Error generating code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const activeFileContent = files.find((f) => f.path === activeFile)?.content || generatedCode

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Generated Code</h2>
          <div className="flex items-center gap-4">
            {analysis.screenshot && (
              <div className="flex items-center gap-2">
                <Switch
                  id="vision-mode"
                  checked={useVision}
                  onCheckedChange={setUseVision}
                  disabled={loading}
                />
                <Label htmlFor="vision-mode" className="text-sm text-slate-300 cursor-pointer">
                  Use AI Vision
                </Label>
              </div>
            )}
            <Button onClick={handleGenerateCode} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Generating..." : "Generate Code"}
            </Button>
          </div>
        </div>
        {analysis.screenshot && useVision && (
          <div className="mb-4 rounded bg-blue-500/10 border border-blue-500/30 px-4 py-2">
            <p className="text-sm text-blue-300">
              🤖 AI Vision mode: The screenshot will be analyzed to generate more accurate code
            </p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-700 pb-4">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  activeFile === file.path ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {file.path.split("/").pop()}
              </button>
            ))}
          </div>
        )}

        {activeFileContent ? (
          <div className="rounded bg-slate-950 p-4">
            <pre className="overflow-x-auto text-xs text-slate-300">
              <code>{activeFileContent}</code>
            </pre>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(activeFileContent)
                }}
                variant="outline"
                className="flex-1"
              >
                Copy File
              </Button>
              {files.length > 0 && (
                <Button
                  onClick={() => {
                    const allCode = files.map((f) => `// File: ${f.path}\n${f.content}`).join("\n\n---\n\n")
                    navigator.clipboard.writeText(allCode)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Copy All Files
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded bg-slate-950 p-8 text-center">
            <p className="text-slate-500">Generate code to see the preview here</p>
          </div>
        )}
      </div>
    </div>
  )
}
