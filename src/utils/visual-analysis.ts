'use client'

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  dominant: string[]
  complementary: string[]
}

export interface DesignTokens {
  colors: ColorPalette
  typography?: {
    fontFamily?: string
    fontSize?: number[]
    fontWeight?: number[]
  }
  spacing?: number[]
  borderRadius?: number[]
}

export interface ImageAnalysisResult {
  id: string
  type: 'website' | 'ui_component' | 'design_mockup' | 'photo' | 'illustration' | 'logo' | 'icon' | 'unknown'
  confidence: number
  designTokens: DesignTokens
  suggestions: string[]
  description: string
  dominantElements: string[]
}

class VisualAnalysisEngine {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  constructor() {
    // Only initialize canvas on client side
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')!
    }
  }

  async analyzeImage(file: File, imageElement?: HTMLImageElement): Promise<ImageAnalysisResult> {
    // Check if running on client side
    if (!this.canvas || !this.ctx) {
      throw new Error('Visual analysis is only available on the client side')
    }

    const img = imageElement || await this.loadImage(file)
    
    // Set canvas size
    this.canvas.width = Math.min(img.width, 400)
    this.canvas.height = Math.min(img.height, 400)
    
    // Scale image to fit canvas while maintaining aspect ratio
    const scale = Math.min(this.canvas.width / img.width, this.canvas.height / img.height)
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    
    // Clear and draw image
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
    
    // Extract image data for analysis
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    
    // Perform various analyses
    const colorPalette = this.extractColorPalette(imageData)
    const imageType = this.classifyImageType(imageData, file.name)
    const designTokens = this.generateDesignTokens(colorPalette, imageData)
    const suggestions = this.generateSuggestions(imageType, designTokens)
    const description = this.generateDescription(imageType, colorPalette)
    const dominantElements = this.identifyDominantElements(imageData)

    return {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: imageType,
      confidence: this.calculateConfidence(imageType, colorPalette),
      designTokens,
      suggestions,
      description,
      dominantElements
    }
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  private extractColorPalette(imageData: ImageData): ColorPalette {
    const pixels = imageData.data
    const colorMap = new Map<string, number>()
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]
      
      // Skip transparent pixels
      if (a < 128) continue
      
      // Group similar colors (reduce granularity)
      const groupedR = Math.floor(r / 32) * 32
      const groupedG = Math.floor(g / 32) * 32
      const groupedB = Math.floor(b / 32) * 32
      
      const colorKey = `${groupedR},${groupedG},${groupedB}`
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
    }

    // Sort colors by frequency
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number)
        return this.rgbToHex(r, g, b)
      })

    // Analyze color relationships
    const dominant = sortedColors.slice(0, 5)
    const primary = this.findPrimaryColor(dominant)
    const secondary = this.findSecondaryColor(dominant, primary)
    const accent = this.findAccentColor(dominant, [primary, secondary])
    const complementary = this.findComplementaryColors(primary)

    return {
      primary,
      secondary,
      accent,
      dominant,
      complementary
    }
  }

  private classifyImageType(imageData: ImageData, filename: string): ImageAnalysisResult['type'] {
    const pixels = imageData.data
    let totalBrightness = 0
    let edgePixels = 0
    let colorVariance = 0
    
    // Basic image characteristics analysis
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      // Calculate brightness
      const brightness = (r + g + b) / 3
      totalBrightness += brightness
      
      // Simple edge detection (high contrast)
      if (i > 0) {
        const prevR = pixels[i - 16]
        const prevG = pixels[i - 15]
        const prevB = pixels[i - 14]
        
        const contrast = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB)
        if (contrast > 100) edgePixels++
      }
      
      // Color variance
      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
      colorVariance += variance
    }

    const avgBrightness = totalBrightness / (pixels.length / 4)
    const edgeRatio = edgePixels / (pixels.length / 16)
    const avgColorVariance = colorVariance / (pixels.length / 4)
    
    // Classification logic based on characteristics
    const extension = filename.toLowerCase().split('.').pop() || ''
    
    // Check for common design file patterns
    if (['sketch', 'fig', 'psd', 'ai'].includes(extension)) {
      return 'design_mockup'
    }
    
    // High edge ratio suggests UI/wireframes
    if (edgeRatio > 0.3 && avgBrightness > 200) {
      return 'ui_component'
    }
    
    // Low variance, high brightness suggests screenshots
    if (avgColorVariance < 50 && avgBrightness > 180 && edgeRatio > 0.2) {
      return 'website'
    }
    
    // High variance suggests photos
    if (avgColorVariance > 100) {
      return 'photo'
    }
    
    // Low complexity might be logo/icon
    if (edgeRatio < 0.1 && avgColorVariance < 30) {
      return avgBrightness < 100 ? 'logo' : 'icon'
    }

    return 'unknown'
  }

  private generateDesignTokens(colorPalette: ColorPalette, imageData: ImageData): DesignTokens {
    return {
      colors: colorPalette,
      spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
      borderRadius: [2, 4, 6, 8, 12, 16, 24],
      typography: {
        fontSize: [12, 14, 16, 18, 20, 24, 32, 48, 64],
        fontWeight: [300, 400, 500, 600, 700, 800, 900]
      }
    }
  }

  private generateSuggestions(type: ImageAnalysisResult['type'], tokens: DesignTokens): string[] {
    const suggestions: string[] = []

    switch (type) {
      case 'website':
        suggestions.push(
          'Extract layout structure and create matching components',
          'Apply color scheme to existing page elements',
          'Use as visual reference for responsive design'
        )
        break
      
      case 'ui_component':
        suggestions.push(
          'Create similar component with extracted design tokens',
          'Apply button styles and spacing patterns',
          'Extract interaction patterns and states'
        )
        break
      
      case 'design_mockup':
        suggestions.push(
          'Build page structure based on this design',
          'Apply typography and color system',
          'Extract spacing and layout grid'
        )
        break
      
      case 'photo':
        suggestions.push(
          'Use color palette for hero section themes',
          'Extract mood and apply to page atmosphere',
          'Use as background or featured image'
        )
        break
      
      case 'logo':
      case 'icon':
        suggestions.push(
          'Extract brand colors for consistent theming',
          'Apply visual style to page components',
          'Use colors for accent elements'
        )
        break

      default:
        suggestions.push(
          'Apply extracted color palette to page design',
          'Use visual elements as design inspiration',
          'Extract key colors for consistent branding'
        )
    }

    // Add color-specific suggestions
    if (tokens.colors.dominant.length > 0) {
      suggestions.push(`Apply ${tokens.colors.primary} as primary brand color`)
      if (tokens.colors.secondary !== tokens.colors.primary) {
        suggestions.push(`Use ${tokens.colors.secondary} for secondary elements`)
      }
    }

    return suggestions
  }

  private generateDescription(type: ImageAnalysisResult['type'], palette: ColorPalette): string {
    const colorCount = palette.dominant.length
    const primaryColor = this.getColorName(palette.primary)
    
    switch (type) {
      case 'website':
        return `Website screenshot with ${primaryColor} primary color and ${colorCount} main colors detected`
      
      case 'ui_component':
        return `UI component featuring ${primaryColor} styling with ${colorCount} color variations`
      
      case 'design_mockup':
        return `Design mockup with ${primaryColor}-based color scheme containing ${colorCount} primary colors`
      
      case 'photo':
        return `Photo with ${primaryColor} tones and ${colorCount} dominant color groups`
      
      case 'logo':
        return `Logo design featuring ${primaryColor} as primary brand color`
      
      case 'icon':
        return `Icon with ${primaryColor} styling and minimal color palette`
      
      default:
        return `Visual content with ${primaryColor} color theme and ${colorCount} detected colors`
    }
  }

  private identifyDominantElements(imageData: ImageData): string[] {
    const elements: string[] = []
    const pixels = imageData.data
    
    // Analyze brightness distribution
    let darkPixels = 0
    let lightPixels = 0
    let colorfulPixels = 0
    
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      const brightness = (r + g + b) / 3
      const saturation = Math.max(r, g, b) - Math.min(r, g, b)
      
      if (brightness < 85) darkPixels++
      else if (brightness > 170) lightPixels++
      
      if (saturation > 50) colorfulPixels++
    }
    
    const totalPixels = pixels.length / 16
    
    // Classify dominant elements
    if (darkPixels / totalPixels > 0.3) elements.push('Dark theme')
    if (lightPixels / totalPixels > 0.3) elements.push('Light theme')
    if (colorfulPixels / totalPixels > 0.2) elements.push('Colorful design')
    if (colorfulPixels / totalPixels < 0.1) elements.push('Minimal palette')
    
    return elements
  }

  // Helper methods
  private findPrimaryColor(colors: string[]): string {
    return colors[0] || '#3B82F6'
  }

  private findSecondaryColor(colors: string[], primary: string): string {
    return colors.find(c => c !== primary) || '#64748B'
  }

  private findAccentColor(colors: string[], exclude: string[]): string {
    return colors.find(c => !exclude.includes(c)) || '#F59E0B'
  }

  private findComplementaryColors(color: string): string[] {
    // Simple complementary color calculation
    const rgb = this.hexToRgb(color)
    if (!rgb) return []
    
    return [
      this.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b),
      this.rgbToHex(rgb.g, rgb.b, rgb.r),
      this.rgbToHex(rgb.b, rgb.r, rgb.g)
    ]
  }

  private calculateConfidence(type: string, palette: ColorPalette): number {
    let confidence = 0.5
    
    // Higher confidence for more colors detected
    confidence += (palette.dominant.length / 10) * 0.3
    
    // Higher confidence for non-unknown types
    if (type !== 'unknown') confidence += 0.2
    
    return Math.min(confidence, 1.0)
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')}`
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private getColorName(hex: string): string {
    const colorNames: Record<string, string> = {
      '#FF0000': 'red',
      '#00FF00': 'green', 
      '#0000FF': 'blue',
      '#FFFF00': 'yellow',
      '#FF00FF': 'magenta',
      '#00FFFF': 'cyan',
      '#000000': 'black',
      '#FFFFFF': 'white',
      '#808080': 'gray',
      '#FFA500': 'orange',
      '#800080': 'purple',
      '#FFC0CB': 'pink'
    }
    
    // Find closest color name (simple implementation)
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 'unknown'
    
    // Simple color classification based on RGB values
    const { r, g, b } = rgb
    
    if (r > 200 && g < 100 && b < 100) return 'red'
    if (g > 200 && r < 100 && b < 100) return 'green'
    if (b > 200 && r < 100 && g < 100) return 'blue'
    if (r > 200 && g > 200 && b < 100) return 'yellow'
    if (r > 200 && b > 200 && g < 100) return 'magenta'
    if (g > 200 && b > 200 && r < 100) return 'cyan'
    if (r > 150 && g > 100 && b < 50) return 'orange'
    if (r > 100 && g < 100 && b > 150) return 'purple'
    if (r > 200 && g > 150 && b > 150) return 'pink'
    if (r < 50 && g < 50 && b < 50) return 'black'
    if (r > 200 && g > 200 && b > 200) return 'white'
    
    return 'neutral'
  }
}

// Singleton instance - only create on client side
export const visualAnalysisEngine = typeof window !== 'undefined' ? new VisualAnalysisEngine() : null

// Utility functions for external use
export async function analyzeUploadedImage(file: File): Promise<ImageAnalysisResult> {
  if (!visualAnalysisEngine) {
    throw new Error('Visual analysis is only available on the client side')
  }
  return visualAnalysisEngine.analyzeImage(file)
}

export function generateDesignTokensFromPalette(colors: string[]): DesignTokens {
  const palette: ColorPalette = {
    primary: colors[0] || '#3B82F6',
    secondary: colors[1] || '#64748B', 
    accent: colors[2] || '#F59E0B',
    dominant: colors.slice(0, 5),
    complementary: []
  }
  
  return {
    colors: palette,
    spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
    borderRadius: [2, 4, 6, 8, 12, 16, 24],
    typography: {
      fontSize: [12, 14, 16, 18, 20, 24, 32, 48, 64],
      fontWeight: [300, 400, 500, 600, 700, 800, 900]
    }
  }
}