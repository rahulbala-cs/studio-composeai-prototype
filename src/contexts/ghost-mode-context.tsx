'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { PageComponent, DisambiguationOption } from '@/types'

// Types for the ghost mode system integrated with existing components
export interface ProposedChange {
  componentId: string
  changes: {
    backgroundColor?: string
    buttonText?: string
    textContent?: string
    title?: string
    subtitle?: string
    description?: string
    styles?: Record<string, any>
    // Enhanced structural and content changes
    features?: string[]
    image?: string
    layout?: string
    testimonials?: Array<{
      name: string
      role: string
      content: string
      rating?: number
    }>
    pricing?: {
      price: string
      originalPrice?: string
      currency?: string
      period?: string
    }
    stats?: Array<{
      value: string
      label: string
      description?: string
    }>
    // Content generation fields
    generatedContent?: {
      headlines?: string[]
      descriptions?: string[]
      bulletPoints?: string[]
      callsToAction?: string[]
    }
  }
  command: string
  timestamp: number
  // Enhanced metadata for complex changes
  changeType?: 'styling' | 'content' | 'structure' | 'layout'
  reasoning?: string
}

export interface GhostModeState {
  isActive: boolean
  selectedComponentId: string | null
  proposedChange: ProposedChange | null
  isProcessing: boolean
  // Enhanced disambiguation support
  disambiguationOptions: DisambiguationOption[] | null
  needsDisambiguation: boolean
  lastFailedCommand?: string
  // Enhanced preview functionality
  showPreview: boolean
  beforeState?: any
  previewMode: 'side-by-side' | 'overlay' | 'tabs'
  multiOptionPreviews?: Array<{
    id: string
    label: string
    changes: Partial<ProposedChange['changes']>
    reasoning: string
  }>
}

// Action types
type GhostModeAction = 
  | { type: 'START_PROCESSING'; payload: { componentId: string; command: string } }
  | { type: 'SET_PROPOSED_CHANGE'; payload: ProposedChange }
  | { type: 'ACCEPT_CHANGE' }
  | { type: 'DISCARD_CHANGE' }
  | { type: 'CLEAR_GHOST_MODE' }
  | { type: 'SET_SELECTED_COMPONENT'; payload: string | null }
  | { type: 'REQUEST_DISAMBIGUATION'; payload: { options: DisambiguationOption[]; command: string } }
  | { type: 'SELECT_DISAMBIGUATION'; payload: string }
  | { type: 'CANCEL_DISAMBIGUATION' }
  | { type: 'TOGGLE_PREVIEW'; payload?: { mode?: 'side-by-side' | 'overlay' | 'tabs' } }
  | { type: 'SET_MULTI_OPTION_PREVIEWS'; payload: Array<{ id: string; label: string; changes: any; reasoning: string }> }
  | { type: 'CAPTURE_BEFORE_STATE'; payload: any }

// Initial state
const initialState: GhostModeState = {
  isActive: false,
  selectedComponentId: null,
  proposedChange: null,
  isProcessing: false,
  disambiguationOptions: null,
  needsDisambiguation: false,
  lastFailedCommand: undefined,
  showPreview: false,
  beforeState: undefined,
  previewMode: 'side-by-side',
  multiOptionPreviews: undefined
}

// Reducer
function ghostModeReducer(state: GhostModeState, action: GhostModeAction): GhostModeState {
  switch (action.type) {
    case 'SET_SELECTED_COMPONENT':
      return {
        ...state,
        selectedComponentId: action.payload,
        // Clear ghost mode when switching components
        isActive: false,
        proposedChange: null,
        isProcessing: false
      }
    
    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        isActive: false,
        selectedComponentId: action.payload.componentId
      }
    
    case 'SET_PROPOSED_CHANGE':
      return {
        ...state,
        isProcessing: false,
        isActive: true,
        proposedChange: action.payload
      }
    
    case 'ACCEPT_CHANGE':
      return {
        ...state,
        isActive: false,
        proposedChange: null,
        isProcessing: false
      }
    
    case 'DISCARD_CHANGE':
      return {
        ...state,
        isActive: false,
        proposedChange: null,
        isProcessing: false
      }
    
    case 'CLEAR_GHOST_MODE':
      return {
        ...initialState,
        selectedComponentId: state.selectedComponentId // Keep selection
      }
    
    case 'REQUEST_DISAMBIGUATION':
      return {
        ...state,
        isProcessing: false,
        needsDisambiguation: true,
        disambiguationOptions: action.payload.options,
        lastFailedCommand: action.payload.command
      }
    
    case 'SELECT_DISAMBIGUATION':
      const selectedOption = state.disambiguationOptions?.find(opt => opt.id === action.payload)
      if (selectedOption) {
        return {
          ...state,
          needsDisambiguation: false,
          disambiguationOptions: null,
          isActive: true,
          proposedChange: {
            componentId: state.selectedComponentId!,
            command: state.lastFailedCommand || '',
            timestamp: Date.now(),
            changes: selectedOption.previewData,
            changeType: 'content',
            reasoning: `User selected: ${selectedOption.label}`
          }
        }
      }
      return state
    
    case 'CANCEL_DISAMBIGUATION':
      return {
        ...state,
        needsDisambiguation: false,
        disambiguationOptions: null,
        lastFailedCommand: undefined,
        isProcessing: false
      }
    
    case 'TOGGLE_PREVIEW':
      return {
        ...state,
        showPreview: !state.showPreview,
        previewMode: action.payload?.mode || state.previewMode
      }
    
    case 'SET_MULTI_OPTION_PREVIEWS':
      return {
        ...state,
        multiOptionPreviews: action.payload,
        showPreview: true
      }
    
    case 'CAPTURE_BEFORE_STATE':
      return {
        ...state,
        beforeState: action.payload
      }
    
    default:
      return state
  }
}

// Context
const GhostModeContext = createContext<{
  state: GhostModeState
  dispatch: React.Dispatch<GhostModeAction>
  // Helper functions
  processCommand: (command: string) => void
  acceptChange: () => void
  discardChange: () => void
  setSelectedComponent: (componentId: string | null) => void
  // Disambiguation functions
  selectDisambiguationOption: (optionId: string) => void
  cancelDisambiguation: () => void
  // Enhanced preview functions
  togglePreview: (mode?: 'side-by-side' | 'overlay' | 'tabs') => void
  setMultiOptionPreviews: (options: Array<{id: string; label: string; changes: any; reasoning: string}>) => void
  captureBeforeState: (state: any) => void
} | null>(null)

// Provider component
export function GhostModeProvider({ 
  children, 
  onComponentUpdate 
}: { 
  children: ReactNode
  onComponentUpdate?: (componentId: string, updates: Partial<PageComponent>) => void
}) {
  const [state, dispatch] = useReducer(ghostModeReducer, initialState)

  // Helper functions
  const processCommand = React.useCallback((command: string) => {
    if (!state.selectedComponentId) return

    dispatch({ 
      type: 'START_PROCESSING', 
      payload: { componentId: state.selectedComponentId, command } 
    })

    // Simulate AI processing with scripted responses
    setTimeout(() => {
      const result = generateScriptedResponse(state.selectedComponentId!, command)
      
      if ('disambiguationOptions' in result) {
        // Request disambiguation from user
        dispatch({ 
          type: 'REQUEST_DISAMBIGUATION', 
          payload: { options: result.disambiguationOptions, command } 
        })
      } else {
        // Apply the proposed change
        dispatch({ type: 'SET_PROPOSED_CHANGE', payload: result as ProposedChange })
      }
    }, 1500) // Simulate processing time
  }, [state.selectedComponentId])

  const acceptChange = React.useCallback(() => {
    if (state.proposedChange && onComponentUpdate) {
      // Apply the changes to the actual component
      onComponentUpdate(state.proposedChange.componentId, {
        data: state.proposedChange.changes
      })
    }
    dispatch({ type: 'ACCEPT_CHANGE' })
  }, [state.proposedChange, onComponentUpdate])

  const discardChange = React.useCallback(() => {
    dispatch({ type: 'DISCARD_CHANGE' })
  }, [])

  const setSelectedComponent = React.useCallback((componentId: string | null) => {
    dispatch({ type: 'SET_SELECTED_COMPONENT', payload: componentId })
  }, [])

  const selectDisambiguationOption = React.useCallback((optionId: string) => {
    dispatch({ type: 'SELECT_DISAMBIGUATION', payload: optionId })
  }, [])

  const cancelDisambiguation = React.useCallback(() => {
    dispatch({ type: 'CANCEL_DISAMBIGUATION' })
  }, [])

  // Enhanced preview functions
  const togglePreview = React.useCallback((mode?: 'side-by-side' | 'overlay' | 'tabs') => {
    dispatch({ type: 'TOGGLE_PREVIEW', payload: mode ? { mode } : undefined })
  }, [])

  const setMultiOptionPreviews = React.useCallback((options: Array<{id: string; label: string; changes: any; reasoning: string}>) => {
    dispatch({ type: 'SET_MULTI_OPTION_PREVIEWS', payload: options })
  }, [])

  const captureBeforeState = React.useCallback((beforeState: any) => {
    dispatch({ type: 'CAPTURE_BEFORE_STATE', payload: beforeState })
  }, [])

  const value = {
    state,
    dispatch,
    processCommand,
    acceptChange,
    discardChange,
    setSelectedComponent,
    selectDisambiguationOption,
    cancelDisambiguation,
    // Enhanced preview functions
    togglePreview,
    setMultiOptionPreviews,
    captureBeforeState
  }

  return (
    <GhostModeContext.Provider value={value}>
      {children}
    </GhostModeContext.Provider>
  )
}

// Hook to use the ghost mode context
export function useGhostMode() {
  const context = useContext(GhostModeContext)
  if (!context) {
    throw new Error('useGhostMode must be used within a GhostModeProvider')
  }
  return context
}

// Enhanced AI co-pilot responses with disambiguation support
function generateScriptedResponse(componentId: string, command: string): ProposedChange | { disambiguationOptions: DisambiguationOption[] } {
  const normalizedCommand = command.toLowerCase()

  // DISAMBIGUATION DETECTION: Handle ambiguous commands
  
  // Ambiguous: "change the color"
  if (normalizedCommand.includes('color') && !normalizedCommand.includes('background') && !normalizedCommand.includes('text')) {
    return {
      disambiguationOptions: [
        {
          id: 'background-color',
          label: 'Change Background Color',
          description: 'Update the background color to create visual impact',
          confidence: 0.7,
          previewData: {
            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        },
        {
          id: 'text-color',
          label: 'Change Text Color',
          description: 'Update text colors for better contrast and readability',
          confidence: 0.6,
          previewData: {
            title: 'Updated Title Color',
            styles: { color: '#1f2937' }
          }
        },
        {
          id: 'accent-color',
          label: 'Change Accent Colors',
          description: 'Update button and accent colors throughout',
          confidence: 0.5,
          previewData: {
            buttonText: 'Get Started',
            styles: { accentColor: '#3b82f6' }
          }
        }
      ]
    }
  }

  // Ambiguous: "make it better"
  if ((normalizedCommand.includes('better') || normalizedCommand.includes('improve')) && 
      !normalizedCommand.includes('copy') && !normalizedCommand.includes('text') && 
      !normalizedCommand.includes('color') && !normalizedCommand.includes('layout')) {
    return {
      disambiguationOptions: [
        {
          id: 'improve-content',
          label: 'Improve Content & Copy',
          description: 'Enhanced headlines and more compelling descriptions',
          confidence: 0.8,
          previewData: {
            title: 'Transform Your Experience Today',
            description: 'Join thousands who have discovered the difference. Our solution delivers results that exceed expectations.',
            buttonText: 'Start Your Transformation'
          }
        },
        {
          id: 'improve-design',
          label: 'Improve Visual Design',
          description: 'Better colors, spacing, and visual hierarchy',
          confidence: 0.7,
          previewData: {
            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            styles: { padding: '4rem 2rem' }
          }
        },
        {
          id: 'improve-conversion',
          label: 'Improve for Conversions',
          description: 'Optimize for better user engagement and action',
          confidence: 0.6,
          previewData: {
            buttonText: 'Get Started Free - No Credit Card',
            stats: [
              { value: '10,000+', label: 'Happy Users', description: 'Join them today' }
            ]
          }
        }
      ]
    }
  }

  // Ambiguous: "add more"
  if (normalizedCommand.includes('add more') || normalizedCommand.includes('add some')) {
    return {
      disambiguationOptions: [
        {
          id: 'add-features',
          label: 'Add More Features',
          description: 'Highlight additional product benefits and capabilities',
          confidence: 0.8,
          previewData: {
            features: [
              'Advanced security with end-to-end encryption',
              'Real-time collaboration tools',
              '24/7 premium customer support',
              'Mobile apps for iOS and Android',
              'Advanced analytics and reporting'
            ]
          }
        },
        {
          id: 'add-social-proof',
          label: 'Add Social Proof',
          description: 'Include testimonials and trust indicators',
          confidence: 0.7,
          previewData: {
            testimonials: [
              {
                name: 'Jennifer Walsh',
                role: 'Marketing Director',
                content: 'This solution transformed our workflow. We saw 40% improvement in efficiency within weeks.',
                rating: 5
              }
            ]
          }
        },
        {
          id: 'add-urgency',
          label: 'Add Urgency Elements',
          description: 'Create motivation with limited-time offers',
          confidence: 0.6,
          previewData: {
            title: 'Limited Time: 50% Off First Year',
            description: 'Join now and save. This exclusive offer ends soon.',
            buttonText: 'Claim Your Discount Now'
          }
        }
      ]
    }
  }

  // Handle the specific PRD test case with enhanced reasoning
  if (normalizedCommand.includes('dark gradient') && normalizedCommand.includes('shop now')) {
    return {
      componentId,
      command,
      timestamp: Date.now(),
      changes: {
        backgroundColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        buttonText: 'Shop Now',
        title: 'Aura Headphones',
        subtitle: 'Premium Audio Experience'
      }
    }
  }

  // Intelligent content creation for headphones/audio products
  if (normalizedCommand.includes('headphones') || normalizedCommand.includes('aura') || normalizedCommand.includes('audio')) {
    if (normalizedCommand.includes('more premium') || normalizedCommand.includes('luxury')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changeType: 'content',
        reasoning: 'Enhanced premium positioning with luxury materials and pricing',
        changes: {
          title: 'Aura Pro - Audiophile Edition',
          subtitle: 'Engineered for Perfection',
          description: 'Studio-grade audio drivers, aerospace-grade titanium frame, and hand-crafted leather cushions define the ultimate listening experience.',
          backgroundColor: 'linear-gradient(135deg, #0f0f23 0%, #2d1810 100%)',
          buttonText: 'Experience Excellence - $499',
          pricing: {
            price: '$499',
            originalPrice: '$699',
            currency: 'USD',
            period: 'one-time'
          },
          stats: [
            { value: '40mm', label: 'Premium Drivers', description: 'Studio-grade neodymium' },
            { value: '30hrs', label: 'Battery Life', description: 'Extended listening' },
            { value: '95%', label: 'Noise Reduction', description: 'Industry-leading ANC' }
          ]
        }
      }
    }
    
    if (normalizedCommand.includes('features') || normalizedCommand.includes('benefits')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changeType: 'content',
        reasoning: 'Converted technical specs to benefit-focused messaging',
        changes: {
          title: 'Why Choose Aura Headphones?',
          features: [
            'Crystal-clear audio with 40mm neodymium drivers (20Hz-40kHz range)',
            'Adaptive noise cancellation automatically adjusts to your environment', 
            '30-hour battery with 5-minute quick charge for 3 hours of playback',
            'Memory foam cushions with premium vegan leather for all-day comfort',
            'Hi-Res Audio certified with LDAC codec for pristine wireless sound'
          ],
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }
    }
    
    if (normalizedCommand.includes('testimonial') || normalizedCommand.includes('review')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changeType: 'content',
        reasoning: 'Added social proof with authentic customer testimonials',
        changes: {
          title: 'What Our Customers Say',
          testimonials: [
            {
              name: 'Sarah Chen',
              role: 'Music Producer',
              content: 'The Aura headphones completely changed my mixing workflow. The clarity and detail are incredible - I can hear subtleties I never noticed before.',
              rating: 5
            },
            {
              name: 'Marcus Johnson',
              role: 'Audio Engineer',
              content: 'After 15 years in the industry, these are the most comfortable headphones for long studio sessions. The noise cancellation is studio-quality.',
              rating: 5
            },
            {
              name: 'Lisa Rodriguez',
              role: 'Podcast Host',
              content: 'Perfect for both recording and listening. The battery life gets me through entire recording days, and the sound quality is broadcast-ready.',
              rating: 5
            }
          ]
        }
      }
    }
  }

  // Smart background suggestions with context awareness
  if (normalizedCommand.includes('background') || normalizedCommand.includes('gradient')) {
    const isDark = normalizedCommand.includes('dark') || normalizedCommand.includes('night') || normalizedCommand.includes('black')
    const isWarm = normalizedCommand.includes('warm') || normalizedCommand.includes('orange') || normalizedCommand.includes('sunset')
    const isCool = normalizedCommand.includes('cool') || normalizedCommand.includes('blue') || normalizedCommand.includes('ocean')
    const isPremium = normalizedCommand.includes('premium') || normalizedCommand.includes('luxury') || normalizedCommand.includes('elegant')
    
    if (isPremium && isDark) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          title: 'Premium Experience Awaits',
          subtitle: 'Luxury Redefined'
        }
      }
    } else if (isWarm) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          backgroundColor: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
        }
      }
    } else if (isCool) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }
    } else if (isDark) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          backgroundColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
        }
      }
    }
    
    return {
      componentId,
      command,
      timestamp: Date.now(),
      changes: {
        backgroundColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      }
    }
  }

  // Intelligent button text with context
  if (normalizedCommand.includes('button') || normalizedCommand.includes('cta')) {
    const extractedText = extractButtonText(command)
    if (extractedText) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          buttonText: extractedText
        }
      }
    }

    // Smart button suggestions based on context
    if (normalizedCommand.includes('buy') || normalizedCommand.includes('purchase') || normalizedCommand.includes('order')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          buttonText: 'Order Now - Free Shipping'
        }
      }
    }
    
    if (normalizedCommand.includes('demo') || normalizedCommand.includes('try')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          buttonText: 'Try for Free'
        }
      }
    }

    return {
      componentId,
      command,
      timestamp: Date.now(),
      changes: {
        buttonText: 'Get Started'
      }
    }
  }

  // Intelligent title/headline changes
  if (normalizedCommand.includes('title') || normalizedCommand.includes('headline')) {
    if (normalizedCommand.includes('compelling') || normalizedCommand.includes('engaging')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changes: {
          title: 'Transform Your World with Premium Audio',
          subtitle: 'Every Beat, Crystal Clear'
        }
      }
    }
    
    return {
      componentId,
      command,
      timestamp: Date.now(),
      changes: {
        title: 'Enhanced Headline Based on Your Request'
      }
    }
  }

  // Smart content suggestions
  if (normalizedCommand.includes('professional') || normalizedCommand.includes('business')) {
    return {
      componentId,
      command,
      timestamp: Date.now(),
      changeType: 'content',
      reasoning: 'Elevated content for professional B2B audience with trust indicators',
      changes: {
        title: 'Professional Solutions That Drive Results',
        subtitle: 'Trusted by Fortune 500 Companies',
        description: 'Our enterprise-grade solutions deliver measurable ROI and transform operational efficiency for industry leaders worldwide.',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        buttonText: 'Schedule Demo',
        stats: [
          { value: '500+', label: 'Enterprise Clients', description: 'Fortune 500 companies' },
          { value: '99.9%', label: 'Uptime SLA', description: 'Mission-critical reliability' },
          { value: '35%', label: 'Average ROI', description: 'Within first year' }
        ]
      }
    }
  }

  // Structural layout changes
  if (normalizedCommand.includes('layout') || normalizedCommand.includes('structure') || normalizedCommand.includes('rearrange')) {
    return {
      componentId,
      command,
      timestamp: Date.now(),
      changeType: 'structure',
      reasoning: 'Optimized layout for better user experience and conversion flow',
      changes: {
        layout: 'two-column',
        title: 'Optimized Layout Applied',
        description: 'Restructured for better visual hierarchy and user flow',
        generatedContent: {
          headlines: [
            'Transform Your Experience',
            'Next-Generation Innovation',
            'Built for Performance'
          ]
        }
      }
    }
  }

  // Content generation and improvement
  if (normalizedCommand.includes('improve') || normalizedCommand.includes('better') || normalizedCommand.includes('enhance')) {
    if (normalizedCommand.includes('copy') || normalizedCommand.includes('content') || normalizedCommand.includes('text')) {
      return {
        componentId,
        command,
        timestamp: Date.now(),
        changeType: 'content',
        reasoning: 'Enhanced content with psychological triggers and benefit-focused messaging',
        changes: {
          title: 'Experience the Difference',
          description: 'Join thousands of satisfied customers who have transformed their daily routine with our innovative solution.',
          generatedContent: {
            headlines: [
              'Experience the Difference',
              'Transform Your Daily Routine', 
              'Innovation That Works for You'
            ],
            descriptions: [
              'Discover how our solution can revolutionize your experience.',
              'Join the innovation revolution and see immediate results.',
              'Built for people who demand excellence in every detail.'
            ],
            callsToAction: [
              'Start Your Transformation',
              'Experience Innovation Today',
              'Join Thousands of Satisfied Users'
            ]
          }
        }
      }
    }
  }

  // Add social proof and testimonials
  if (normalizedCommand.includes('social proof') || normalizedCommand.includes('credibility') || normalizedCommand.includes('trust')) {
    return {
      componentId,
      command,
      timestamp: Date.now(),
      changeType: 'content',
      reasoning: 'Added social proof elements to build trust and credibility',
      changes: {
        title: 'Trusted by Thousands',
        testimonials: [
          {
            name: 'Alex Thompson',
            role: 'Technology Director',
            content: 'This solution exceeded our expectations. The implementation was smooth and the results were immediate.',
            rating: 5
          },
          {
            name: 'Maria Garcia',
            role: 'Operations Manager',
            content: 'Outstanding quality and support. Our team productivity increased by 40% in the first month.',
            rating: 5
          }
        ],
        stats: [
          { value: '10,000+', label: 'Happy Customers', description: 'Worldwide' },
          { value: '4.9/5', label: 'Customer Rating', description: 'Based on 2,000+ reviews' },
          { value: '24/7', label: 'Expert Support', description: 'Always here to help' }
        ]
      }
    }
  }

  // Default intelligent response with context
  return {
    componentId,
    command,
    timestamp: Date.now(),
    changes: {
      title: 'Smart Enhancement Applied',
      subtitle: 'Optimized Based on Your Input'
    }
  }
}

// Helper to extract button text from command
function extractButtonText(command: string): string | null {
  const match = command.match(/['"]([^'"]+)['"]/);
  if (match) return match[1];
  
  if (command.includes('shop now')) return 'Shop Now';
  if (command.includes('get started')) return 'Get Started';
  if (command.includes('learn more')) return 'Learn More';
  if (command.includes('try now')) return 'Try Now';
  
  return null;
}