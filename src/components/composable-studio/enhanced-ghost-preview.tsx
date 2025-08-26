'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Eye, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Layout, Palette, Zap, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGhostMode } from '@/contexts/ghost-mode-context'

interface EnhancedGhostPreviewProps {
  componentId: string
  beforeState: any
  afterState: any
  onApprove: () => void
  onReject: () => void
}

export function EnhancedGhostPreview({ 
  componentId, 
  beforeState, 
  afterState, 
  onApprove, 
  onReject 
}: EnhancedGhostPreviewProps) {
  const { state, togglePreview } = useGhostMode()
  const [currentView, setCurrentView] = useState<'before' | 'after' | 'side-by-side'>('side-by-side')

  if (!state.showPreview || !state.proposedChange) return null

  const changes = state.proposedChange.changes
  const changeType = state.proposedChange.changeType || 'styling'
  
  // Generate preview cards for before and after states
  const renderPreviewCard = (data: any, label: 'before' | 'after') => {
    const isAfter = label === 'after'
    const cardData = isAfter ? { ...beforeState, ...changes } : beforeState

    return (
      <div className={`border-2 rounded-lg p-4 transition-all ${
        isAfter ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <Badge variant={isAfter ? "default" : "secondary"} className="text-xs">
            {isAfter ? 'After' : 'Before'}
          </Badge>
          {isAfter && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Sparkles className="w-3 h-3" />
              AI Enhanced
            </div>
          )}
        </div>
        
        {/* Render component preview */}
        <div className="bg-white rounded border p-3 text-sm">
          {cardData?.title && (
            <h3 className="font-medium mb-1" style={isAfter ? changes.styles : {}}>
              {isAfter ? (changes.title || cardData.title) : cardData.title}
            </h3>
          )}
          {cardData?.description && (
            <p className="text-slate-600 text-xs mb-2">
              {isAfter ? (changes.description || cardData.description) : cardData.description}
            </p>
          )}
          {changes.buttonText && (
            <Button 
              size="sm" 
              className="text-xs"
              style={isAfter ? { backgroundColor: changes.backgroundColor } : {}}
            >
              {isAfter ? changes.buttonText : (beforeState.buttonText || 'Button')}
            </Button>
          )}
          {changes.features && isAfter && (
            <div className="space-y-1 mt-2">
              {changes.features.slice(0, 2).map((feature, i) => (
                <div key={i} className="text-xs text-slate-700 flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  {feature}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMultiOptionPreviews = () => {
    if (!state.multiOptionPreviews) return null

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-800 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Choose your preferred option:
        </h4>
        <div className="grid gap-3">
          {state.multiOptionPreviews.map((option) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-all"
              onClick={() => {
                // Apply this option
                const syntheticChange = {
                  componentId,
                  changes: option.changes,
                  command: `Apply option: ${option.label}`,
                  timestamp: Date.now(),
                  changeType: 'styling' as const,
                  reasoning: option.reasoning
                }
                onApprove()
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="text-sm font-medium text-slate-800">{option.label}</h5>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-slate-600 mb-2">{option.reasoning}</p>
              
              {/* Mini preview */}
              <div className="bg-slate-50 rounded p-2 text-xs">
                <div style={option.changes.styles}>
                  {option.changes.title && <div className="font-medium">{option.changes.title}</div>}
                  {option.changes.buttonText && (
                    <div className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs inline-block">
                      {option.changes.buttonText}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onReject()
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  {changeType === 'styling' && <Palette className="w-4 h-4 text-blue-600" />}
                  {changeType === 'content' && <RefreshCw className="w-4 h-4 text-blue-600" />}
                  {changeType === 'layout' && <Layout className="w-4 h-4 text-blue-600" />}
                  {changeType === 'structure' && <Zap className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    AI Preview Ready
                  </h3>
                  <p className="text-sm text-slate-600">
                    {state.proposedChange.reasoning || 'Review the changes and choose to apply or discard them.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={currentView === 'before' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('before')}
                    className="h-7 px-2 text-xs"
                  >
                    Before
                  </Button>
                  <Button
                    size="sm"
                    variant={currentView === 'side-by-side' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('side-by-side')}
                    className="h-7 px-2 text-xs"
                  >
                    Compare
                  </Button>
                  <Button
                    size="sm"
                    variant={currentView === 'after' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('after')}
                    className="h-7 px-2 text-xs"
                  >
                    After
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onReject}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {state.multiOptionPreviews ? (
              renderMultiOptionPreviews()
            ) : (
              <div className="space-y-6">
                {/* Preview */}
                <div className={`grid gap-4 ${
                  currentView === 'side-by-side' ? 'grid-cols-2' : 'grid-cols-1'
                }`}>
                  {(currentView === 'before' || currentView === 'side-by-side') && 
                    renderPreviewCard(beforeState, 'before')
                  }
                  {(currentView === 'after' || currentView === 'side-by-side') && 
                    renderPreviewCard(afterState, 'after')
                  }
                </div>

                {/* Changes Summary */}
                {currentView !== 'before' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      What's changing:
                    </h4>
                    <div className="space-y-1">
                      {changes.backgroundColor && (
                        <div className="text-sm text-slate-700">
                          • Background updated with {changes.backgroundColor.includes('gradient') ? 'gradient' : 'new color'}
                        </div>
                      )}
                      {changes.buttonText && (
                        <div className="text-sm text-slate-700">
                          • Button text changed to "{changes.buttonText}"
                        </div>
                      )}
                      {changes.title && (
                        <div className="text-sm text-slate-700">
                          • Title updated to "{changes.title}"
                        </div>
                      )}
                      {changes.features && (
                        <div className="text-sm text-slate-700">
                          • {changes.features.length} features updated
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                AI suggestions ready
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReject}
                  className="flex items-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={onApprove}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-3 h-3" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to easily show enhanced previews
export function useEnhancedGhostPreview() {
  const { state, togglePreview, setMultiOptionPreviews, captureBeforeState } = useGhostMode()

  const showMultiOptionPreview = (options: Array<{
    id: string
    label: string
    changes: any
    reasoning: string
  }>) => {
    setMultiOptionPreviews(options)
  }

  const showBeforeAfterPreview = (beforeState: any) => {
    captureBeforeState(beforeState)
    togglePreview('side-by-side')
  }

  return {
    showMultiOptionPreview,
    showBeforeAfterPreview,
    togglePreview,
    isPreviewVisible: state.showPreview
  }
}