"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface UrlInputProps {
  onAnalyze: (url: string, captureScreenshot: boolean) => Promise<void>
  loading: boolean
}

export function UrlInput({ onAnalyze, loading }: UrlInputProps) {
  const [url, setUrl] = useState("")
  const [captureScreenshot, setCaptureScreenshot] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      await onAnalyze(url, captureScreenshot)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <label htmlFor="url" className="text-sm font-medium text-slate-300">
            Website URL
          </label>
          <div className="flex gap-2">
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !url.trim()} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
        
        {/* Screenshot Toggle */}
        <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800/50 px-4 py-3">
          <Switch
            id="screenshot"
            checked={captureScreenshot}
            onCheckedChange={setCaptureScreenshot}
            disabled={loading}
          />
          <div className="flex-1">
            <Label htmlFor="screenshot" className="text-sm font-medium text-slate-300 cursor-pointer">
              Capture Screenshot (for AI Vision)
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">
              Optional: Capture screenshot to enhance AI code generation. Slower but more accurate.
            </p>
          </div>
        </div>
        
        <div className="text-xs text-slate-500">
          Design extraction uses HTML parsing (fast & accurate). Screenshot is optional for AI vision.
        </div>
      </div>
    </form>
  )
}
