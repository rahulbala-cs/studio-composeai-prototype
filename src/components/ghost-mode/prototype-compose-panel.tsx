'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGhostMode } from '@/contexts/ghost-mode-context'

interface PrototypeMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isProcessing?: boolean
}

const quickActions = [
  { id: 'change-background', label: 'Change background', icon: '🎨' },
  { id: 'improve-headline', label: 'Improve headline', icon: '✨' }
]

export function PrototypeComposePanel() {
  const { state, processCommand } = useGhostMode()
  const [messages, setMessages] = useState<PrototypeMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: PrototypeMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    // Add processing message
    const processingMessage: PrototypeMessage = {
      id: `processing_${Date.now()}`,
      type: 'assistant',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      isProcessing: true
    }

    setMessages(prev => [...prev, processingMessage])

    // Process the command through ghost mode
    processCommand(inputValue)
    
    setInputValue('')

    // Simulate AI response after processing
    setTimeout(() => {
      setMessages(prev => 
        prev.filter(msg => msg.id !== processingMessage.id).concat([
          {
            id: `response_${Date.now()}`,
            type: 'assistant',
            content: generateScriptedResponse(inputValue),
            timestamp: new Date()
          }
        ])
      )
    }, 1500)
  }

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInputValue(action.label)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const getContextBarContent = () => {
    if (state.selectedComponentId) {
      const elementName = state.selectedComponentId === 'hero-banner' ? 'Hero Banner' : state.selectedComponentId
      return `Selected: ${elementName} • Landing Page`
    }
    return 'Page: Landing Page'
  }

  const getPlaceholderText = () => {
    if (state.isProcessing) {
      return 'Processing your request...'
    }
    if (state.selectedComponentId) {
      return `Editing ${state.selectedComponentId === 'hero-banner' ? 'hero banner' : state.selectedComponentId}. What would you like to change?`
    }
    return 'What would you like to build? Try selecting a component first...'
  }

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Compose AI</h2>
        </div>
        
        {/* Context Bar */}
        <div className="text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
          {getContextBarContent()}
        </div>
      </div>

      {/* Quick Actions */}
      {state.selectedComponentId && (
        <div className="p-4 border-b border-slate-100">
          <div className="text-xs font-medium text-slate-700 mb-2">Quick Actions</div>
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="text-xs"
                disabled={state.isProcessing}
              >
                <span className="mr-1">{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      <AnimatePresence>
        {state.isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-blue-50 border-b border-blue-100"
          >
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              <span>AI is analyzing your request...</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              This may take a moment while I process your command.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost Mode Active Status */}
      <AnimatePresence>
        {state.isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-green-50 border-b border-green-100"
          >
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preview ready! Check the canvas and use the action buttons.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {state.selectedComponentId 
                  ? `Ready to help you edit the ${state.selectedComponentId.replace('-', ' ')}.`
                  : 'Select a component on the canvas to get started!'
                }
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {message.isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-3 h-3 text-blue-600" />
                    </motion.div>
                  ) : (
                    <Bot className="w-3 h-3 text-blue-600" />
                  )}
                </div>
              )}
              
              <div className={`max-w-[280px] rounded-lg px-3 py-2 text-sm ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                {message.content}
                {message.isProcessing && (
                  <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
              
              {message.type === 'user' && (
                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-slate-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholderText()}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={state.isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || state.isProcessing}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!state.selectedComponentId && (
          <div className="text-xs text-slate-500 mt-2">
            💡 Tip: Hover over the hero section above to see the AI spark, then click to select it.
          </div>
        )}
      </div>
    </div>
  )
}

// Generate scripted responses for the prototype
function generateScriptedResponse(command: string): string {
  const normalizedCommand = command.toLowerCase()

  if (normalizedCommand.includes('dark gradient') && normalizedCommand.includes('shop now')) {
    return "Perfect! I've created a preview with a dark gradient background and updated the button text to 'Shop Now'. You can see the changes on the canvas - use the Accept button to apply them or Discard to revert."
  }
  
  if (normalizedCommand.includes('change background') || normalizedCommand.includes('background')) {
    return "I've prepared a background change for your hero section. Check out the preview on the canvas and let me know if you'd like to accept these changes!"
  }

  if (normalizedCommand.includes('improve headline') || normalizedCommand.includes('headline')) {
    return "Here's an improved version of your headline. The preview is now live on the canvas - what do you think?"
  }

  if (normalizedCommand.includes('button') || normalizedCommand.includes('cta')) {
    return "I've updated the call-to-action button as requested. You can see the changes in the preview overlay. Use the action buttons to accept or discard the changes."
  }

  return "I've processed your request and prepared a preview. Please check the canvas above and use the floating action bar to accept or discard the proposed changes."
}