// Design extraction schema types
export interface Color {
  hex: string
  name?: string
  usage: "primary" | "secondary" | "accent" | "neutral" | "background"
}

export interface Typography {
  fontFamily: string
  fontWeight: number
  fontSize: string
  lineHeight: string
  letterSpacing?: string
  usage: "heading" | "body" | "caption"
}

export interface Component {
  name: string
  description: string
  colors: Color[]
  typography: Typography[]
  borderRadius?: string
  padding?: string
  spacing?: string
}

export interface DesignSystem {
  colors: Color[]
  typography: Typography[]
  components: Component[]
  spacing: Record<string, string>
  borderRadii: Record<string, string>
  breakpoints: Record<string, string>
}

export interface WebsiteAnalysis {
  url: string
  title: string
  screenshot?: string
  designSystem: DesignSystem
  layout: {
    type: "single-column" | "multi-column" | "grid"
    sections: string[]
  }
  extractedAt: string
}

export interface CodeGenerationRequest {
  analysis: WebsiteAnalysis
  componentName?: string
  includePages?: boolean
  outputFormat: "tsx" | "jsx" | "html"
  useVision?: boolean // Use AI vision if screenshot is available
}

export interface CodeGenerationResult {
  code: string
  files: Array<{
    path: string
    content: string
  }>
  language: string
}
