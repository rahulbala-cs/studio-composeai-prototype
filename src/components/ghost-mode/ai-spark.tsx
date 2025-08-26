'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface AISparkProps {
  isVisible: boolean
  onClick?: () => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function AISpark({ 
  isVisible, 
  onClick,
  position = 'top-right'
}: AISparkProps) {
  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2', 
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={`absolute z-50 pointer-events-auto ${positionClasses[position]}`}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center group transition-all duration-200"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            
            {/* Pulsing ring effect */}
            <motion.div
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.7, 0, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 border-2 border-blue-400 rounded-full"
            />
          </motion.button>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: position.includes('top') ? -5 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute ${
              position.includes('top') 
                ? 'top-10' 
                : 'bottom-10'
            } left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50`}
          >
            Click to focus AI
            <div className={`absolute ${
              position.includes('top')
                ? '-top-1'
                : '-bottom-1'
            } left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45`} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}