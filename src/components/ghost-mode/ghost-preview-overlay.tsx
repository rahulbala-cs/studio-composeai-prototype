'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageComponent } from '@/types'
import { useGhostMode } from '@/contexts/ghost-mode-context'

interface GhostPreviewOverlayProps {
  children: React.ReactNode
  components: PageComponent[]
}

export function GhostPreviewOverlay({
  children,
  components
}: GhostPreviewOverlayProps) {
  const { state, acceptChange, discardChange } = useGhostMode()

  const selectedComponent = components.find(c => c.id === state.selectedComponentId)

  return (
    <div className="relative">
      {/* Main content with conditional dimming */}
      <motion.div
        animate={{
          opacity: state.isActive ? 0.6 : 1,
          filter: state.isActive ? 'blur(0.5px)' : 'blur(0px)'
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`transition-all duration-300 ${
          state.isActive ? 'pointer-events-none' : ''
        }`}
      >
        {children}
      </motion.div>

      {/* Ghost Mode Shimmer Effect Overlay */}
      <AnimatePresence>
        {state.isActive && state.selectedComponentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            {/* Find the selected component and add shimmer effect */}
            <GhostModeShimmer 
              componentId={state.selectedComponentId}
              components={components}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {state.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 pointer-events-auto"
          >
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex items-center gap-2">
              <div className="text-xs text-slate-600 mr-2">Preview ready:</div>
              <Button
                size="sm"
                onClick={acceptChange}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 h-auto text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={discardChange}
                className="text-slate-600 hover:text-red-600 hover:border-red-300 px-3 py-1.5 h-auto text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Discard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes ghost-shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: 200px 0;
          }
        }
        
        @keyframes ghost-glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
          }
        }

        .ghost-shimmer-effect {
          position: relative;
          overflow: hidden;
        }

        .ghost-shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.3),
            transparent
          );
          background-size: 200px 100%;
          animation: ghost-shimmer 2s infinite;
          pointer-events: none;
          z-index: 1;
        }

        .ghost-outline {
          border: 3px solid rgba(59, 130, 246, 0.7) !important;
          border-radius: 8px !important;
          animation: ghost-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Component that adds shimmer effect to the selected component
function GhostModeShimmer({ 
  componentId, 
  components 
}: {
  componentId: string
  components: PageComponent[]
}) {
  const selectedComponent = components.find(c => c.id === componentId)

  React.useEffect(() => {
    if (!selectedComponent) return

    // Find the DOM element with the component ID and add shimmer classes
    const element = document.querySelector(`[data-component-id="${componentId}"]`)
    if (element) {
      element.classList.add('ghost-shimmer-effect', 'ghost-outline')
      
      return () => {
        element.classList.remove('ghost-shimmer-effect', 'ghost-outline')
      }
    }
  }, [componentId, selectedComponent])

  return null
}