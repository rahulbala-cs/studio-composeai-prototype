'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ExternalLink, 
  Copy, 
  FileText,
  Layers,
  Command,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FigmaImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (figmaUrl: string) => void
  disabled?: boolean
}

export function FigmaImportModal({ isOpen, onClose, onImport, disabled }: FigmaImportModalProps) {
  const [figmaUrl, setFigmaUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (figmaUrl.trim()) {
      onImport(figmaUrl.trim())
      setFigmaUrl('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Import from Figma</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-6 w-6 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Figma Screenshot Preview */}
            <div className="relative bg-slate-100 rounded-lg overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-slate-600 to-slate-800 relative">
                <div className="absolute top-2 left-2 text-white text-sm font-medium opacity-70">
                  Figma Design
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-10 bg-blue-600 rounded-sm opacity-80"></div>
                </div>
              </div>
              <div className="p-3 bg-slate-700 text-white text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>add a carousel of testimonials</span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Layers className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    Open Figma and run the <span className="text-blue-600 font-semibold">Contentstack Composo plugin</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">
                    Select a frame to import
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">
                    Select "Smart Export" option
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Copy className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-600">
                    Paste the design into the prompt box to use as a design reference
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Command className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">⌘V</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative URL Input */}
            <div className="border-t border-slate-200 pt-4">
              <div className="text-sm font-medium text-slate-800 mb-2">
                Or paste Figma URL directly:
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://figma.com/file/..."
                  className="text-sm"
                  disabled={disabled}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!figmaUrl.trim() || disabled}
                  className="px-3"
                >
                  Import
                </Button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.figma.com/community/plugin/contentstack-composo', '_blank')}
              className="text-sm"
            >
              Get Plugin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://docs.contentstack.com/developers/figma-plugin/', '_blank')}
              className="text-sm"
            >
              Docs
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}