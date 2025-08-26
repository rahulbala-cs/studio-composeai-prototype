'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Palette, 
  Sparkles, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Zap,
  ExternalLink,
  Layers,
  Link,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MultiModalInput, AttachedFile, VoiceRecording } from './multimodal-input'
import { analyzeUploadedImage, ImageAnalysisResult } from '@/utils/visual-analysis'
import { analyzeFigmaUrl, isFigmaUrl, FigmaAnalysisResult } from '@/utils/figma-integration'
import { FigmaImportModal } from './figma-import-modal'
import { MessageAttachment } from '@/types'
import { Input } from '@/components/ui/input'

interface EnhancedAttachedFile extends AttachedFile {
  analysisResult?: ImageAnalysisResult
  isAnalyzing?: boolean
}

interface FigmaAttachment {
  id: string
  type: 'figma'
  url: string
  name: string
  analysisResult?: FigmaAnalysisResult
  isAnalyzing?: boolean
}

interface VisualAnalysisCardProps {
  analysis: ImageAnalysisResult
  file: AttachedFile
  onApplyDesignTokens?: (tokens: ImageAnalysisResult['designTokens']) => void
  onUseSuggestion?: (suggestion: string) => void
}

function VisualAnalysisCard({ 
  analysis, 
  file, 
  onApplyDesignTokens, 
  onUseSuggestion 
}: VisualAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyColorToClipboard = useCallback(async (color: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedColor(color)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (error) {
      console.error('Failed to copy color:', error)
    }
  }, [])

  const getTypeIcon = () => {
    switch (analysis.type) {
      case 'website':
        return <Eye className="w-4 h-4" />
      case 'ui_component':
        return <Zap className="w-4 h-4" />
      case 'design_mockup':
        return <Sparkles className="w-4 h-4" />
      case 'photo':
        return <Palette className="w-4 h-4" />
      default:
        return <Lightbulb className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch (analysis.type) {
      case 'website':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'ui_component':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'design_mockup':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'photo':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-3 bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border ${getTypeColor()}`}>
              {getTypeIcon()}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">Visual Analysis</div>
              <div className="text-xs text-slate-500">{analysis.description}</div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {Math.round(analysis.confidence * 100)}% confident
          </Badge>
        </div>
      </div>

      {/* Color Palette */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Extracted Colors</span>
          {onApplyDesignTokens && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApplyDesignTokens(analysis.designTokens)}
              className="text-xs h-6 px-2"
            >
              <Palette className="w-3 h-3 mr-1" />
              Apply
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {analysis.designTokens.colors.dominant.slice(0, 6).map((color, index) => (
            <motion.button
              key={color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => copyColorToClipboard(color)}
              className="relative w-8 h-8 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: color }}
              title={`${color} - Click to copy`}
            >
              <AnimatePresence>
                {copiedColor === color && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded border" 
              style={{ backgroundColor: analysis.designTokens.colors.primary }}
            />
            <span>Primary</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded border" 
              style={{ backgroundColor: analysis.designTokens.colors.secondary }}
            />
            <span>Secondary</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded border" 
              style={{ backgroundColor: analysis.designTokens.colors.accent }}
            />
            <span>Accent</span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">AI Suggestions</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-5 px-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          {analysis.suggestions.slice(0, isExpanded ? undefined : 2).map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 p-2 bg-slate-50 rounded text-sm hover:bg-slate-100 transition-colors cursor-pointer group"
              onClick={() => onUseSuggestion?.(suggestion)}
            >
              <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 group-hover:text-slate-900">{suggestion}</span>
            </motion.div>
          ))}
        </div>

        {/* Dominant Elements */}
        {isExpanded && analysis.dominantElements.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-slate-100"
          >
            <span className="text-sm font-medium text-slate-700 mb-2 block">Dominant Elements</span>
            <div className="flex flex-wrap gap-1">
              {analysis.dominantElements.map((element, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {element}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

interface FigmaAnalysisCardProps {
  analysis: FigmaAnalysisResult
  figmaUrl: string
  onApplyDesignTokens?: (tokens: FigmaAnalysisResult['designTokens']) => void
  onUseSuggestion?: (suggestion: string) => void
}

function FigmaAnalysisCard({ 
  analysis, 
  figmaUrl, 
  onApplyDesignTokens, 
  onUseSuggestion 
}: FigmaAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const copyTokenToClipboard = useCallback(async (token: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Failed to copy token:', error)
    }
  }, [])

  const getTypeIcon = () => {
    switch (analysis.type) {
      case 'component':
        return <Layers className="w-4 h-4" />
      case 'frame':
        return <Eye className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch (analysis.type) {
      case 'component':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'frame':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-3 bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border ${getTypeColor()}`}>
              {getTypeIcon()}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">Figma Analysis</div>
              <div className="text-xs text-slate-500">{analysis.fileName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {analysis.components.length} components
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(figmaUrl, '_blank')}
              className="text-xs h-6 px-2"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>

      {/* Design Tokens Preview */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Design Tokens</span>
          {onApplyDesignTokens && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApplyDesignTokens(analysis.designTokens)}
              className="text-xs h-6 px-2"
            >
              <Palette className="w-3 h-3 mr-1" />
              Apply All
            </Button>
          )}
        </div>
        
        {/* Color Tokens */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 min-w-16">Primary:</span>
            <div className="flex gap-1">
              {analysis.designTokens.colors.primary.slice(0, 4).map((color, index) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyTokenToClipboard(`primary-${index}`, color)}
                  className="relative w-6 h-6 rounded border border-white shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: color }}
                  title={`${color} - Click to copy`}
                >
                  <AnimatePresence>
                    {copiedToken === `primary-${index}` && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-1 py-0.5 rounded whitespace-nowrap"
                      >
                        Copied!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 min-w-16">Secondary:</span>
            <div className="flex gap-1">
              {analysis.designTokens.colors.secondary.slice(0, 4).map((color, index) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyTokenToClipboard(`secondary-${index}`, color)}
                  className="w-6 h-6 rounded border border-white shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: color }}
                  title={`${color} - Click to copy`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Components Preview */}
      {analysis.components.length > 0 && (
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Components ({analysis.components.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {analysis.components.slice(0, 4).map((component) => (
              <div
                key={component.id}
                className="p-2 bg-slate-50 rounded text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => onUseSuggestion?.(`Create a ${component.name} component`)}
              >
                <div className="font-medium text-slate-800">{component.name}</div>
                {component.variants && (
                  <div className="text-slate-500 mt-1">
                    {component.variants.length} variants
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">AI Suggestions</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-5 px-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          {analysis.suggestions.slice(0, isExpanded ? undefined : 2).map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 p-2 bg-slate-50 rounded text-sm hover:bg-slate-100 transition-colors cursor-pointer group"
              onClick={() => onUseSuggestion?.(suggestion)}
            >
              <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 group-hover:text-slate-900">{suggestion}</span>
            </motion.div>
          ))}
        </div>

        {/* Design System Info */}
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-slate-100"
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-slate-700">Typography:</span>
                <div className="text-slate-600">
                  {analysis.designTokens.typography.fontFamilies.length} families, 
                  {analysis.designTokens.typography.fontSizes.length} sizes
                </div>
              </div>
              <div>
                <span className="font-medium text-slate-700">Spacing:</span>
                <div className="text-slate-600">
                  {analysis.designTokens.spacing.values.length} tokens
                </div>
              </div>
              <div>
                <span className="font-medium text-slate-700">Colors:</span>
                <div className="text-slate-600">
                  {analysis.designTokens.colors.primary.length + analysis.designTokens.colors.secondary.length} colors
                </div>
              </div>
              <div>
                <span className="font-medium text-slate-700">Artboards:</span>
                <div className="text-slate-600">
                  {analysis.artboards.length} layouts
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

interface EnhancedMultiModalInputProps {
  onFilesAttached: (files: EnhancedAttachedFile[], analyses: ImageAnalysisResult[]) => void
  onVoiceRecording: (recording: VoiceRecording) => void
  onRemoveFile: (fileId: string) => void
  onFigmaAttached?: (figmaData: FigmaAttachment) => void
  onRemoveFigma?: (figmaId: string) => void
  onApplyDesignTokens?: (tokens: ImageAnalysisResult['designTokens'] | FigmaAnalysisResult['designTokens']) => void
  onUseSuggestion?: (suggestion: string) => void
  attachedFiles: EnhancedAttachedFile[]
  figmaAttachments?: FigmaAttachment[]
  disabled?: boolean
  maxFileSize?: number
  acceptedTypes?: string[]
  showPreview?: boolean
  enableVisualAnalysis?: boolean
  enableFigmaIntegration?: boolean
}

export function EnhancedMultiModalInput({
  onFilesAttached,
  onVoiceRecording,
  onRemoveFile,
  onFigmaAttached,
  onRemoveFigma,
  onApplyDesignTokens,
  onUseSuggestion,
  attachedFiles = [],
  figmaAttachments = [],
  disabled = false,
  maxFileSize = 10,
  acceptedTypes,
  showPreview = true,
  enableVisualAnalysis = true,
  enableFigmaIntegration = true
}: EnhancedMultiModalInputProps) {
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set())
  const [analyzingFigma, setAnalyzingFigma] = useState<Set<string>>(new Set())
  const [showFigmaModal, setShowFigmaModal] = useState(false)

  const handleFilesAttached = useCallback(async (files: AttachedFile[]) => {
    const enhancedFiles: EnhancedAttachedFile[] = files.map(file => ({
      ...file,
      isAnalyzing: file.type === 'image' && enableVisualAnalysis
    }))

    // Start analysis for image files
    const imageFiles = enableVisualAnalysis ? enhancedFiles.filter(f => f.type === 'image') : []
    const analyses: ImageAnalysisResult[] = []

    if (imageFiles.length > 0) {
      setAnalyzingFiles(new Set(imageFiles.map(f => f.id)))

      // Analyze images in parallel
      const analysisPromises = imageFiles.map(async (enhancedFile) => {
        try {
          const analysis = await analyzeUploadedImage(enhancedFile.file)
          enhancedFile.analysisResult = analysis
          enhancedFile.isAnalyzing = false
          analyses.push(analysis)
          return analysis
        } catch (error) {
          console.error(`Failed to analyze image ${enhancedFile.name}:`, error)
          enhancedFile.isAnalyzing = false
          return null
        } finally {
          setAnalyzingFiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(enhancedFile.id)
            return newSet
          })
        }
      })

      await Promise.all(analysisPromises)
    }

    onFilesAttached(enhancedFiles, analyses)
  }, [onFilesAttached, enableVisualAnalysis])

  // Handle Figma import from modal
  const handleFigmaImport = useCallback(async (figmaUrl: string) => {
    if (!enableFigmaIntegration || !onFigmaAttached) return

    if (!isFigmaUrl(figmaUrl)) {
      // Show error feedback
      console.error('Invalid Figma URL')
      return
    }

    const figmaId = `figma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const figmaAttachment: FigmaAttachment = {
      id: figmaId,
      type: 'figma',
      url: figmaUrl,
      name: 'Figma Design',
      isAnalyzing: true
    }

    onFigmaAttached(figmaAttachment)
    setAnalyzingFigma(new Set([figmaId]))

    try {
      const analysis = await analyzeFigmaUrl(figmaUrl)
      figmaAttachment.analysisResult = analysis
      figmaAttachment.isAnalyzing = false
      figmaAttachment.name = analysis.fileName

      // Update the attachment with analysis results
      onFigmaAttached({ ...figmaAttachment })
    } catch (error) {
      console.error('Failed to analyze Figma file:', error)
      figmaAttachment.isAnalyzing = false
      onFigmaAttached({ ...figmaAttachment })
    } finally {
      setAnalyzingFigma(new Set())
    }
  }, [enableFigmaIntegration, onFigmaAttached])

  return (
    <div className="space-y-3">
      <MultiModalInput
        onFilesAttached={handleFilesAttached}
        onVoiceRecording={onVoiceRecording}
        onRemoveFile={onRemoveFile}
        onFigmaClick={() => setShowFigmaModal(true)}
        attachedFiles={attachedFiles}
        disabled={disabled}
        maxFileSize={maxFileSize}
        acceptedTypes={acceptedTypes}
        showPreview={showPreview}
        showFigmaButton={enableFigmaIntegration}
      />

      {/* Figma Import Modal */}
      <FigmaImportModal
        isOpen={showFigmaModal}
        onClose={() => setShowFigmaModal(false)}
        onImport={handleFigmaImport}
        disabled={disabled}
      />

      {/* Figma Analysis Results */}
      <AnimatePresence>
        {enableFigmaIntegration && figmaAttachments
          .map(figma => (
            <div key={figma.id}>
              {/* Analysis Loading State */}
              {(figma.isAnalyzing || analyzingFigma.has(figma.id)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full"
                    />
                    <span className="text-sm text-orange-700">
                      Analyzing Figma design...
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Figma Analysis Results */}
              {figma.analysisResult && !figma.isAnalyzing && (
                <div className="relative">
                  <FigmaAnalysisCard
                    analysis={figma.analysisResult}
                    figmaUrl={figma.url}
                    onApplyDesignTokens={onApplyDesignTokens}
                    onUseSuggestion={onUseSuggestion}
                  />
                  {/* Remove Button */}
                  {onRemoveFigma && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFigma(figma.id)}
                      className="absolute top-2 right-2 p-1 h-6 w-6 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
      </AnimatePresence>

      {/* Visual Analysis Results */}
      <AnimatePresence>
        {enableVisualAnalysis && attachedFiles
          .filter(file => file.type === 'image')
          .map(file => (
            <div key={file.id}>
              {/* Analysis Loading State */}
              {(file.isAnalyzing || analyzingFiles.has(file.id)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                    />
                    <span className="text-sm text-blue-700">
                      Analyzing visual content...
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Analysis Results */}
              {file.analysisResult && !file.isAnalyzing && (
                <VisualAnalysisCard
                  analysis={file.analysisResult}
                  file={file}
                  onApplyDesignTokens={onApplyDesignTokens}
                  onUseSuggestion={onUseSuggestion}
                />
              )}
            </div>
          ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for using enhanced multimodal input with visual analysis
export function useEnhancedMultiModalInput() {
  const [attachedFiles, setAttachedFiles] = useState<EnhancedAttachedFile[]>([])
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([])
  const [visualAnalyses, setVisualAnalyses] = useState<ImageAnalysisResult[]>([])
  const [figmaAttachments, setFigmaAttachments] = useState<FigmaAttachment[]>([])

  const handleFilesAttached = useCallback((files: EnhancedAttachedFile[], analyses: ImageAnalysisResult[]) => {
    setAttachedFiles(prev => [...prev, ...files])
    setVisualAnalyses(prev => [...prev, ...analyses])
  }, [])

  const handleVoiceRecording = useCallback((recording: VoiceRecording) => {
    setVoiceRecordings(prev => [...prev, recording])
  }, [])

  const handleFigmaAttached = useCallback((figma: FigmaAttachment) => {
    setFigmaAttachments(prev => {
      // Update existing or add new
      const existing = prev.find(f => f.id === figma.id)
      if (existing) {
        return prev.map(f => f.id === figma.id ? figma : f)
      }
      return [...prev, figma]
    })
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setAttachedFiles(prev => {
      const removed = prev.find(f => f.id === fileId)
      if (removed?.analysisResult) {
        setVisualAnalyses(analyses => analyses.filter(a => a.id !== removed.analysisResult!.id))
      }
      return prev.filter(f => f.id !== fileId)
    })
  }, [])

  const removeFigma = useCallback((figmaId: string) => {
    setFigmaAttachments(prev => prev.filter(f => f.id !== figmaId))
  }, [])

  const removeVoiceRecording = useCallback((recordingId: string) => {
    setVoiceRecordings(prev => prev.filter(r => r.id !== recordingId))
  }, [])

  const clearAll = useCallback(() => {
    setAttachedFiles([])
    setVoiceRecordings([])
    setVisualAnalyses([])
    setFigmaAttachments([])
  }, [])

  return {
    attachedFiles,
    voiceRecordings,
    visualAnalyses,
    figmaAttachments,
    handleFilesAttached,
    handleVoiceRecording,
    handleFigmaAttached,
    removeFile,
    removeFigma,
    removeVoiceRecording,
    clearAll,
    hasAttachments: attachedFiles.length > 0 || voiceRecordings.length > 0 || figmaAttachments.length > 0,
    hasVisualContent: attachedFiles.some(f => f.type === 'image' && f.analysisResult),
    hasFigmaContent: figmaAttachments.some(f => f.analysisResult)
  }
}

export type { EnhancedAttachedFile, FigmaAttachment, ImageAnalysisResult, FigmaAnalysisResult }