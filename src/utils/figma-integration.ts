'use client'

export interface FigmaNode {
  id: string
  name: string
  type: string
  fills?: FigmaFill[]
  strokes?: FigmaStroke[]
  effects?: FigmaEffect[]
  children?: FigmaNode[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  constraints?: {
    vertical: string
    horizontal: string
  }
  layoutMode?: string
  itemSpacing?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  cornerRadius?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlignHorizontal?: string
  textAlignVertical?: string
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE'
  color?: {
    r: number
    g: number
    b: number
    a: number
  }
  opacity?: number
}

export interface FigmaStroke {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL'
  color?: {
    r: number
    g: number
    b: number
    a: number
  }
  opacity?: number
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'
  color?: {
    r: number
    g: number
    b: number
    a: number
  }
  offset?: {
    x: number
    y: number
  }
  radius?: number
  spread?: number
}

export interface FigmaFile {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
  role: string
  editorType: string
  linkAccess: string
}

export interface FigmaDesignTokens {
  colors: {
    primary: string[]
    secondary: string[]
    neutral: string[]
    semantic: {
      success: string[]
      warning: string[]
      error: string[]
      info: string[]
    }
  }
  typography: {
    fontFamilies: string[]
    fontSizes: number[]
    fontWeights: number[]
    lineHeights: number[]
    letterSpacings: number[]
  }
  spacing: {
    values: number[]
    tokens: Record<string, number>
  }
  borderRadius: {
    values: number[]
    tokens: Record<string, number>
  }
  shadows: {
    boxShadows: string[]
    dropShadows: string[]
  }
  layout: {
    breakpoints: number[]
    containerSizes: number[]
    gridColumns: number[]
  }
}

export interface FigmaAnalysisResult {
  id: string
  fileKey: string
  fileName: string
  nodeId?: string
  nodeName?: string
  type: 'file' | 'frame' | 'component' | 'page'
  designTokens: FigmaDesignTokens
  components: Array<{
    id: string
    name: string
    type: string
    description?: string
    variants?: string[]
  }>
  artboards: Array<{
    id: string
    name: string
    width: number
    height: number
    description?: string
  }>
  suggestions: string[]
  thumbnail?: string
  lastModified: string
}

class FigmaIntegration {
  private accessToken: string | null = null
  private baseUrl = 'https://api.figma.com/v1'

  constructor() {
    // In a real app, this would come from environment variables or user auth
    this.accessToken = process.env.NEXT_PUBLIC_FIGMA_ACCESS_TOKEN || null
  }

  // Parse Figma URL to extract file key and node ID
  parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
    try {
      const figmaUrlPattern = /figma\.com\/(?:file|proto|design)\/([a-zA-Z0-9]+)(?:\/[^?]*)?(?:\?[^#]*)?(?:#(.+))?/
      const match = url.match(figmaUrlPattern)
      
      if (!match) return null
      
      const fileKey = match[1]
      const nodeId = match[2] ? decodeURIComponent(match[2]) : undefined
      
      return { fileKey, nodeId }
    } catch (error) {
      console.error('Error parsing Figma URL:', error)
      return null
    }
  }

  // Validate if URL is a Figma link
  isFigmaUrl(url: string): boolean {
    return url.includes('figma.com/') && (
      url.includes('/file/') || 
      url.includes('/proto/') || 
      url.includes('/design/')
    )
  }

  // Get file information
  async getFile(fileKey: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Figma access token not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      })

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching Figma file:', error)
      throw error
    }
  }

  // Get file metadata
  async getFileMetadata(fileKey: string): Promise<FigmaFile> {
    try {
      // For demo purposes, we'll simulate the API response
      // In a real implementation, this would call the actual Figma API
      return {
        name: 'Design System Components',
        lastModified: new Date().toISOString(),
        thumbnailUrl: `https://s3-alpha.figma.com/thumbnails/${fileKey}`,
        version: '1.0',
        role: 'editor',
        editorType: 'figma',
        linkAccess: 'view'
      }
    } catch (error) {
      console.error('Error fetching Figma file metadata:', error)
      throw error
    }
  }

  // Extract design tokens from Figma file
  async extractDesignTokens(fileKey: string, nodeId?: string): Promise<FigmaDesignTokens> {
    try {
      // For demo purposes, we'll return mock design tokens
      // In a real implementation, this would analyze the actual Figma file
      return {
        colors: {
          primary: ['#3B82F6', '#1D4ED8', '#1E40AF'],
          secondary: ['#64748B', '#475569', '#334155'],
          neutral: ['#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B'],
          semantic: {
            success: ['#10B981', '#059669', '#047857'],
            warning: ['#F59E0B', '#D97706', '#B45309'],
            error: ['#EF4444', '#DC2626', '#B91C1C'],
            info: ['#06B6D4', '#0891B2', '#0E7490']
          }
        },
        typography: {
          fontFamilies: ['Inter', 'SF Pro Display', 'Helvetica'],
          fontSizes: [12, 14, 16, 18, 20, 24, 32, 48, 64],
          fontWeights: [300, 400, 500, 600, 700, 800, 900],
          lineHeights: [1.2, 1.4, 1.5, 1.6, 1.8],
          letterSpacings: [-0.02, -0.01, 0, 0.01, 0.02]
        },
        spacing: {
          values: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
          tokens: {
            'xs': 4,
            'sm': 8,
            'md': 16,
            'lg': 24,
            'xl': 32,
            '2xl': 48,
            '3xl': 64
          }
        },
        borderRadius: {
          values: [2, 4, 6, 8, 12, 16, 24, 32],
          tokens: {
            'none': 0,
            'sm': 2,
            'md': 4,
            'lg': 8,
            'xl': 12,
            '2xl': 16,
            'full': 9999
          }
        },
        shadows: {
          boxShadows: [
            '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          ],
          dropShadows: [
            'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
            'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))',
            'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04))'
          ]
        },
        layout: {
          breakpoints: [640, 768, 1024, 1280, 1536],
          containerSizes: [320, 768, 1024, 1280, 1536],
          gridColumns: [1, 2, 3, 4, 6, 12]
        }
      }
    } catch (error) {
      console.error('Error extracting design tokens:', error)
      throw error
    }
  }

  // Analyze Figma file and extract comprehensive information
  async analyzeFigmaFile(url: string): Promise<FigmaAnalysisResult> {
    const parsed = this.parseFigmaUrl(url)
    if (!parsed) {
      throw new Error('Invalid Figma URL')
    }

    const { fileKey, nodeId } = parsed

    try {
      // Get file metadata
      const metadata = await this.getFileMetadata(fileKey)
      
      // Extract design tokens
      const designTokens = await this.extractDesignTokens(fileKey, nodeId)

      // For demo purposes, we'll simulate component and artboard analysis
      const components = [
        {
          id: 'comp_1',
          name: 'Button',
          type: 'component',
          description: 'Primary button component with variants',
          variants: ['primary', 'secondary', 'ghost', 'destructive']
        },
        {
          id: 'comp_2',
          name: 'Card',
          type: 'component',
          description: 'Content card with header and body',
          variants: ['default', 'outlined', 'elevated']
        },
        {
          id: 'comp_3',
          name: 'Input',
          type: 'component',
          description: 'Form input field',
          variants: ['default', 'error', 'disabled']
        }
      ]

      const artboards = [
        {
          id: 'frame_1',
          name: 'Landing Page - Desktop',
          width: 1440,
          height: 900,
          description: 'Main landing page design'
        },
        {
          id: 'frame_2',
          name: 'Landing Page - Mobile',
          width: 375,
          height: 812,
          description: 'Mobile responsive version'
        }
      ]

      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(designTokens, components, artboards)

      return {
        id: `figma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileKey,
        fileName: metadata.name,
        nodeId,
        nodeName: nodeId ? 'Selected Frame' : undefined,
        type: nodeId ? 'frame' : 'file',
        designTokens,
        components,
        artboards,
        suggestions,
        thumbnail: metadata.thumbnailUrl,
        lastModified: metadata.lastModified
      }
    } catch (error) {
      console.error('Error analyzing Figma file:', error)
      throw error
    }
  }

  private generateSuggestions(
    tokens: FigmaDesignTokens, 
    components: any[], 
    artboards: any[]
  ): string[] {
    const suggestions: string[] = []

    // Design token suggestions
    suggestions.push(`Apply extracted ${tokens.colors.primary.length} primary colors to your design system`)
    suggestions.push(`Use ${tokens.typography.fontFamilies.length} font families for consistent typography`)
    suggestions.push(`Implement ${tokens.spacing.values.length} spacing tokens for layout consistency`)

    // Component suggestions
    if (components.length > 0) {
      suggestions.push(`Create ${components.length} components based on Figma designs`)
      suggestions.push('Build component library with extracted variants and styles')
    }

    // Artboard suggestions
    if (artboards.length > 0) {
      suggestions.push(`Generate ${artboards.length} page layouts from Figma artboards`)
      const mobileFrames = artboards.filter(a => a.width < 768)
      if (mobileFrames.length > 0) {
        suggestions.push('Apply responsive design patterns from mobile artboards')
      }
    }

    // Advanced suggestions
    suggestions.push('Extract interaction patterns and micro-animations')
    suggestions.push('Generate CSS custom properties from design tokens')
    suggestions.push('Create style guide documentation from Figma styles')

    return suggestions
  }

  // Convert Figma color to hex
  private figmaColorToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)
    
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')}`
  }

  // Get CSS from design tokens
  generateCSS(tokens: FigmaDesignTokens): string {
    let css = ':root {\n'
    
    // Colors
    tokens.colors.primary.forEach((color, index) => {
      css += `  --color-primary-${index + 1}: ${color};\n`
    })
    
    tokens.colors.secondary.forEach((color, index) => {
      css += `  --color-secondary-${index + 1}: ${color};\n`
    })
    
    // Spacing
    Object.entries(tokens.spacing.tokens).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value}px;\n`
    })
    
    // Border radius
    Object.entries(tokens.borderRadius.tokens).forEach(([key, value]) => {
      css += `  --border-radius-${key}: ${value}px;\n`
    })
    
    css += '}\n'
    
    return css
  }
}

// Singleton instance
export const figmaIntegration = new FigmaIntegration()

// Utility functions
export async function analyzeFigmaUrl(url: string): Promise<FigmaAnalysisResult> {
  return figmaIntegration.analyzeFigmaFile(url)
}

export function isFigmaUrl(url: string): boolean {
  return figmaIntegration.isFigmaUrl(url)
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  return figmaIntegration.parseFigmaUrl(url)
}