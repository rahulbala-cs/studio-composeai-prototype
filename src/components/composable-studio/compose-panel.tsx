'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Wand2, Layout, FileText, Image, Video, ShoppingCart, Calendar, Mail, MessageSquare, Zap, Clock, MessageCircle, Plus, Palette, Type, Move, Eye, Undo, Settings, Paperclip, Mic, Smile, ArrowUp, Lightbulb, Target, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, ConversationState, MessageAction, ConversationHistory, ComposeState } from '@/types'

// Extended chat message interface for rich components
interface ExtendedChatMessage extends Omit<ChatMessage, 'content'> {
	content?: string
	richComponent?: {
		type: 'content-type-selection' | 'cms-entry' | 'processing-status' | 'alert'
		props: any
	}
}
import { generateId, delay } from '@/lib/utils'
import { ChangePreview, ChangePreviewProvider } from './change-preview'
import { useComponentContext, useSelectedComponent } from './component-context'
import { useGhostMode } from '@/contexts/ghost-mode-context'
import { EnhancedMultiModalInput, useEnhancedMultiModalInput, EnhancedAttachedFile, ImageAnalysisResult, FigmaAnalysisResult } from './enhanced-multimodal-input'
import { VoiceRecording } from './multimodal-input'
import { ContentGenerationEngine, ContentBrief, GeneratedContent } from './content-generation'
import { ContentTypeSelectionCard, CMSEntryCard, ProcessingStatusCard, AlertCard, ContentTypeOption, CMSEntry, ProcessingStep } from './rich-chat-components'
import { EnhancedGhostPreview, useEnhancedGhostPreview } from './enhanced-ghost-preview'
import { PageComponent } from '@/types'

interface ComposePanelProps {
	onPageComponentAdd: (componentType: string, data: any) => void
	onShowThought: (thought: string) => void
	currentComposition?: any
	hasComponents?: boolean
}

const quickActions = [
	{ id: 'landing-page', label: 'Landing Page', icon: Layout, description: 'Product or service landing page' },
	{ id: 'blog-post', label: 'Blog Post', icon: FileText, description: 'Article or blog content' },
	{ id: 'portfolio', label: 'Portfolio', icon: Image, description: 'Showcase your work' },
	{ id: 'product-catalog', label: 'Product Catalog', icon: ShoppingCart, description: 'E-commerce product listing' },
	{ id: 'event-page', label: 'Event Page', icon: Calendar, description: 'Event details and registration' },
	{ id: 'contact-form', label: 'Contact Form', icon: Mail, description: 'Get in touch page' }
]

// Enhanced real-world action scenarios
const actionScenarios = [
	// Component editing scenarios
	{ 
		category: 'editing', 
		text: "Change the hero background to a dark gradient and make the button say 'Shop Now'", 
		context: 'hero-selected',
		expectedAction: 'ghost-mode-preview'
	},
	{ 
		category: 'editing', 
		text: "Add pricing tiers: Basic $29/mo, Pro $49/mo, Enterprise $99/mo", 
		context: 'features-selected',
		expectedAction: 'content-update'
	},
	{ 
		category: 'editing', 
		text: "Make this testimonial from 'Sarah Johnson, Product Manager at TechCorp'", 
		context: 'testimonials-selected',
		expectedAction: 'content-personalization'
	},
	// Page creation scenarios  
	{ 
		category: 'creation', 
		text: "Create a SaaS landing page for an AI writing assistant tool", 
		context: 'empty-canvas',
		expectedAction: 'smart-scaffolding'
	},
	{ 
		category: 'creation', 
		text: "Build a product launch page for sustainable sneakers made from ocean plastic", 
		context: 'empty-canvas',
		expectedAction: 'content-generation'
	},
	// Advanced interaction scenarios
	{ 
		category: 'advanced', 
		text: "Show me 3 different color schemes for this page and let me preview them", 
		context: 'any',
		expectedAction: 'multi-option-preview'
	},
	{ 
		category: 'advanced', 
		text: "Convert this to a mobile-first design with stacked layout", 
		context: 'has-components',
		expectedAction: 'responsive-redesign'
	}
]

const examples = [
	"Create a landing page for our new Aura smart headphones launch",
	"Build a blog post about sustainable technology trends", 
	"Design a portfolio page for a graphic designer",
	"Make a product catalog for eco-friendly home goods",
	"Create an event registration page for our tech conference",
	"Build a contact form with location map"
]

// Enhanced intelligent quick actions with context awareness
const quickActionsConfig = [
	{ 
		id: 'add-component', 
		icon: Plus, 
		label: 'Add Component', 
		getPrompt: (context: any) => {
			if (context?.hasComponents) return 'Add a testimonials section below the features'
			if (context?.selectedComponent?.type === 'hero') return 'Add a features grid after this hero section'
			return 'Add a hero section to start the page'
		}
	},
	{ 
		id: 'change-colors', 
		icon: Palette, 
		label: 'Change Colors', 
		getPrompt: (context: any) => {
			if (context?.selectedComponent) return `Change the ${context.selectedComponent.type} colors to match our brand`
			return 'Update the page color scheme to be more modern and professional'
		}
	},
	{ 
		id: 'edit-text', 
		icon: Type, 
		label: 'Edit Text', 
		getPrompt: (context: any) => {
			if (context?.selectedComponent?.type === 'hero') return 'Make the headline more compelling and action-oriented'
			if (context?.selectedComponent?.type === 'cta') return 'Change the button text to create more urgency'
			return 'Update the text to be more engaging and clear'
		}
	},
	{ 
		id: 'show-variations', 
		icon: Eye, 
		label: 'Show Options', 
		getPrompt: (context: any) => {
			if (context?.selectedComponent) return `Show me 3 different versions of this ${context.selectedComponent.type}`
			return 'Show me different layout options for this page'
		}
	},
	{ 
		id: 'optimize-mobile', 
		icon: Move, 
		label: 'Mobile View', 
		getPrompt: () => 'Optimize this design for mobile devices with a stacked layout'
	},
	{ 
		id: 'undo-last', 
		icon: Undo, 
		label: 'Undo Last', 
		getPrompt: () => 'Undo the last change I made'
	}
]

export function ComposePanel({ onPageComponentAdd, onShowThought, currentComposition, hasComponents }: ComposePanelProps) {
	const { context, actions } = useComponentContext()
	const { selectedComponent, selectedComponentId, isComponentSelected } = useSelectedComponent()
	const ghostMode = useGhostMode()
	
	// Dynamic placeholder text based on context and ghost mode state
	const getDynamicPlaceholder = () => {
		// Ghost Mode states take priority
		if (ghostMode.state.isProcessing) {
			return 'Processing your request...'
		}
		
		// Component-specific context takes priority
		if (isComponentSelected && selectedComponent) {
			const componentName = selectedComponent.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
			const componentTitle = selectedComponent.data?.title || selectedComponent.data?.name || componentName
			
			const placeholders = {
				'hero': `Editing "${componentTitle}" hero section. Try "Change the background to a dark gradient and make the button text 'Shop Now'"`,
				'two-column-hero': `Editing "${componentTitle}" hero. Update content, image, or layout...`,
				'features': `Editing "${componentTitle}" features. Add, remove, or modify features...`,
				'cta': `Editing "${componentTitle}" button. Change text, link, or style...`,
				'text': `Editing "${componentTitle}" text. Modify content or formatting...`,
				'image': `Editing "${componentTitle}" image. Replace image or adjust settings...`,
				'testimonials': `Editing "${componentTitle}" testimonials. Add, edit, or remove reviews...`,
				'section': `Editing "${componentTitle}" section. Modify content or appearance...`,
				'grid': `Editing "${componentTitle}" grid. Update items or layout...`,
				'stats': `Editing "${componentTitle}" stats. Modify numbers, labels, or layout...`,
				'faq': `Editing "${componentTitle}" FAQ. Modify questions, answers, or add new items...`
			}
			
			return placeholders[selectedComponent.type] || `Editing the ${componentName}. What would you like to change?`
		}
		
		// Fallback to conversation state-based placeholders
		switch (conversationState.step) {
			case 'initial':
				return "What would you like to build? Try 'Create a landing page for...' or drag an image"
			case 'content-elicitation':
				return "Enter features as list..."
			case 'content-generated':
				return "Your content is ready! Ask me to modify anything or add new sections..."
			case 'content-persisted':
				return "Content saved! What would you like to create next?"
			default:
				return hasComponents 
					? "Select a component above to edit it, or ask me to add something new..."
					: "Describe what you want to create..."
		}
	}
	const [messages, setMessages] = useState<ExtendedChatMessage[]>([])
	const [currentInput, setCurrentInput] = useState('')
	const [isThinking, setIsThinking] = useState(false)
	const [showWelcome, setShowWelcome] = useState(true)
	const [conversationState, setConversationState] = useState<ConversationState>({
		step: 'initial',
		context: {},
		pendingActions: []
	})
	const [composeState, setComposeState] = useState<ComposeState>({
		activeView: 'chat',
		conversationHistory: [],
		currentMessages: []
	})
	const [showQuickActions, setShowQuickActions] = useState(true)
	const [pendingPreviews, setPendingPreviews] = useState<ChangePreview[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [inputSuggestions, setInputSuggestions] = useState<string[]>([])
	const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	
	// Enhanced multimodal input with visual analysis and Figma integration
	const {
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
		hasAttachments,
		hasVisualContent,
		hasFigmaContent
	} = useEnhancedMultiModalInput()
	
	// Enhanced Ghost Mode preview functionality
	const {
		showMultiOptionPreview,
		showBeforeAfterPreview,
		togglePreview,
		isPreviewVisible
	} = useEnhancedGhostPreview()
	
	// Intelligent suggestion generation based on context
	const generateIntelligentSuggestions = (input: string): string[] => {
		const lowerInput = input.toLowerCase().trim()
		if (lowerInput.length < 2) return []
		
		const suggestions: string[] = []
		
		// Context-aware suggestions based on selected component
		if (isComponentSelected && selectedComponent) {
			const componentType = selectedComponent.type
			
			// Component-specific suggestions
			if (componentType === 'hero') {
				if (lowerInput.includes('change') || lowerInput.includes('update')) {
					suggestions.push(
						'Change the background to a dark gradient',
						'Update the headline to be more compelling',
						'Change the button text to "Get Started Now"'
					)
				}
				if (lowerInput.includes('add')) {
					suggestions.push(
						'Add a subtitle below the main headline',
						'Add customer logos for social proof'
					)
				}
			} else if (componentType === 'features') {
				if (lowerInput.includes('add')) {
					suggestions.push(
						'Add icons to each feature',
						'Add a fourth feature about customer support',
						'Add pricing information to features'
					)
				}
			} else if (componentType === 'cta') {
				if (lowerInput.includes('button') || lowerInput.includes('change')) {
					suggestions.push(
						'Change button to "Start Free Trial"',
						'Make button larger and more prominent',
						'Change button color to green for urgency'
					)
				}
			}
		} else {
			// General page suggestions
			if (lowerInput.includes('create') || lowerInput.includes('add')) {
				suggestions.push(
					'Create a hero section with product showcase',
					'Add a features grid with 3 columns',
					'Create a testimonials section with customer reviews'
				)
			}
			if (lowerInput.includes('page') || lowerInput.includes('landing')) {
				suggestions.push(
					'Create a SaaS landing page',
					'Build a product launch page',
					'Design a conversion-focused page'
				)
			}
		}
		
		// Common action patterns
		if (lowerInput.includes('color') || lowerInput.includes('theme')) {
			suggestions.push(
				'Change to a professional blue theme',
				'Apply a dark mode color scheme',
				'Use warm colors for a friendly feel'
			)
		}
		
		return suggestions.slice(0, 5) // Limit to 5 suggestions
	}
	
	// Handle input changes with intelligent suggestions
	const handleInputChange = (value: string) => {
		setCurrentInput(value)
		
		// Generate suggestions
		const suggestions = generateIntelligentSuggestions(value)
		setInputSuggestions(suggestions)
		setShowSuggestions(suggestions.length > 0 && value.trim().length > 1)
		setActiveSuggestionIndex(-1)
	}
	
	// Handle keyboard navigation for suggestions
	const handleInputKeyDown = (e: React.KeyboardEvent) => {
		if (!showSuggestions || inputSuggestions.length === 0) return
		
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault()
				setActiveSuggestionIndex(prev => 
					prev < inputSuggestions.length - 1 ? prev + 1 : 0
				)
				break
			case 'ArrowUp':
				e.preventDefault()
				setActiveSuggestionIndex(prev => 
					prev > 0 ? prev - 1 : inputSuggestions.length - 1
				)
				break
			case 'Enter':
				if (activeSuggestionIndex >= 0) {
					e.preventDefault()
					const selectedSuggestion = inputSuggestions[activeSuggestionIndex]
					setCurrentInput(selectedSuggestion)
					setShowSuggestions(false)
				}
				break
			case 'Escape':
				e.preventDefault()
				setShowSuggestions(false)
				setActiveSuggestionIndex(-1)
				break
		}
	}
	
	// Handle suggestion click
	const handleSuggestionClick = (suggestion: string) => {
		setCurrentInput(suggestion)
		setShowSuggestions(false)
		setActiveSuggestionIndex(-1)
		// Focus back to input
		inputRef.current?.focus()
	}

	// Helper function to add history entry
	const addHistoryEntry = (action: ConversationHistory['action'], description: string, details?: ConversationHistory['details']) => {
		const historyEntry: ConversationHistory = {
			id: generateId(),
			compositionId: currentComposition?.id || 'unknown',
			timestamp: new Date(),
			action,
			description,
			details
		}
		
		setComposeState(prev => ({
			...prev,
			conversationHistory: [...prev.conversationHistory, historyEntry]
		}))
	}

	// Visual analysis handlers
	const handleApplyDesignTokens = (tokens: ImageAnalysisResult['designTokens'] | FigmaAnalysisResult['designTokens']) => {
		// Handle different token structures
		let colorMessage: string
		if ('primary' in tokens.colors && Array.isArray(tokens.colors.primary)) {
			// Figma tokens
			const figmaTokens = tokens as FigmaAnalysisResult['designTokens']
			colorMessage = `Apply these extracted Figma colors to the page: Primary: ${figmaTokens.colors.primary[0]}, Secondary: ${figmaTokens.colors.secondary[0]}`
		} else {
			// Image analysis tokens
			const imageTokens = tokens as ImageAnalysisResult['designTokens']
			colorMessage = `Apply these extracted colors to the page: Primary: ${imageTokens.colors.primary}, Secondary: ${imageTokens.colors.secondary}, Accent: ${imageTokens.colors.accent}`
		}
		
		addMessage({
			type: 'user',
			content: colorMessage
		})
		
		// Simulate AI response for applying design tokens
		setTimeout(() => {
			const primaryColor = 'primary' in tokens.colors && Array.isArray(tokens.colors.primary) 
				? (tokens as FigmaAnalysisResult['designTokens']).colors.primary[0] 
				: (tokens as ImageAnalysisResult['designTokens']).colors.primary
			
			const secondaryColor = 'primary' in tokens.colors && Array.isArray(tokens.colors.primary)
				? (tokens as FigmaAnalysisResult['designTokens']).colors.secondary[0]
				: (tokens as ImageAnalysisResult['designTokens']).colors.secondary
				
			addMessage({
				type: 'agent',
				content: `Perfect! I've extracted the color palette from your design. Let me apply these colors to your page components. The primary color ${primaryColor} will be used for headings and key elements, while ${secondaryColor} will be used for supporting text and backgrounds.`
			})
			
			onShowThought('Applying color tokens to page components...')
			
			// Add to history
			addHistoryEntry('ai_response', 'Applied design tokens from uploaded design', {
				aiResponse: 'Applied color palette to page components',
				previousValue: `Primary: ${primaryColor}, Secondary: ${secondaryColor}`
			})
		}, 1000)
	}

	const handleUseSuggestion = (suggestion: string) => {
		setCurrentInput(suggestion)
		setTimeout(() => {
			handleSubmit({ preventDefault: () => {} } as React.FormEvent, suggestion)
		}, 100)
	}

	useEffect(() => {
		// Auto-scroll to bottom when new messages are added
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight
			}
		}
	}, [messages])

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd/Ctrl + K to focus input
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				if (inputRef.current) {
					inputRef.current.focus()
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	// Auto-focus input when component mounts
	useEffect(() => {
		setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.focus()
			}
		}, 100)
	}, [])


	useEffect(() => {
		// Auto-start conversation for new compositions with creation context
		if (currentComposition && showWelcome) {
			// Add initial history entry for composition creation
			if (currentComposition.creationInput) {
				addHistoryEntry('conversation_started', `Composition "${currentComposition.name}" created`, {
					userInput: currentComposition.creationInput,
					componentType: currentComposition.pageType
				})
			}
			
			if (currentComposition.autoGenerated && hasComponents) {
				startContinuationConversation()
			} else if (currentComposition.creationInput && currentComposition.pageType === 'freeform') {
				// Auto-start conversation for freeform pages with draft components
				startCreationContextConversation()
			}
		}
	}, [currentComposition, hasComponents])

	const startCreationContextConversation = () => {
		setShowWelcome(false)
		
		// Start with empty conversation - let user initiate naturally
		setMessages([])
		setShowWelcome(false)
		
		// Add history entry for page setup
		addHistoryEntry('conversation_started', 'Page created with starter components', {
			userInput: currentComposition?.creationInput
		})
		
		setConversationState({
			step: 'design-partner',
			context: { creationInput: currentComposition?.creationInput, hasSmartDraft: true },
			pendingActions: []
		})
	}


	const handleQuickActionClick = (action: typeof quickActionsConfig[0]) => {
		// Hide quick actions panel when user starts interacting
		setShowQuickActions(false)
		
		// Get intelligent context-aware prompt
		const contextualPrompt = action.getPrompt ? action.getPrompt({
			hasComponents: hasComponents,
			selectedComponent: selectedComponent,
			isComponentSelected: isComponentSelected,
			conversationState: conversationState
		}) : `Execute ${action.label.toLowerCase()}`
		
		// Add the intelligent quick action as a user message
		addMessage({
			type: 'user',
			content: contextualPrompt
		})
		
		// Add to history with context information
		addHistoryEntry('user_message', `Quick action: ${action.label} (Component: ${selectedComponent?.type || 'none'}, Step: ${conversationState.step})`, {
			userInput: contextualPrompt,
			componentType: selectedComponent?.type,
			componentId: selectedComponent?.id
		})
		
		// Simulate AI response based on action type
		setTimeout(() => {
			let response = ''
			switch (action.id) {
				case 'add-component':
					// Actually add a component based on context
					const componentToAdd = hasComponents ? 'testimonials' : 'features'
					
					if (componentToAdd === 'testimonials') {
						// Add testimonials component
						onPageComponentAdd('testimonials', {
							title: 'What Our Customers Say',
							subtitle: 'Trusted by thousands of satisfied customers',
							testimonials: [
								{
									name: 'Sarah Johnson',
									role: 'Product Manager',
									content: 'These headphones have completely transformed my work-from-home experience. The noise cancellation is incredible!',
									rating: 5
								},
								{
									name: 'Mike Chen',
									role: 'Audio Engineer',
									content: 'The sound quality is pristine. Perfect for both casual listening and professional work.',
									rating: 5
								},
								{
									name: 'Emma Wilson',
									role: 'Marketing Director', 
									content: 'Stylish, comfortable, and the battery life is amazing. Highly recommend!',
									rating: 5
								}
							]
						})
						response = 'Perfect! I\'ve added a testimonials section with customer reviews. This will help build trust and credibility for your headphones. You can customize the testimonials or ask me to modify them.'
					} else {
						// Add features component
						onPageComponentAdd('features', {
							title: 'Why Choose Our Headphones?',
							features: [
								'Premium noise cancellation technology',
								'24-hour battery life with quick charge',
								'Crystal-clear audio with deep bass',
								'Comfortable over-ear design for all-day use'
							],
							layout: 'list'
						})
						response = 'Excellent! I\'ve added a features section highlighting the key benefits of your headphones. This helps visitors understand what makes your product special.'
					}
					break
				case 'change-colors':
					response = 'I can help you update the colors! Let me show you some color scheme options.'
					
					// Show color preview after response
					setTimeout(() => {
						const currentColors = {
							title: 'Current Color Scheme',
							subtitle: 'Blue and white theme',
							content: 'Professional blue tones with white background',
							styles: { backgroundColor: '#f8fafc', color: '#1e293b' }
						}

						const newColors = {
							title: 'Updated Color Scheme',
							subtitle: 'Modern dark theme',
							content: 'Rich dark background with accent colors for better contrast',
							styles: { backgroundColor: '#1e293b', color: '#f8fafc', accentColor: '#3b82f6' }
						}

						const colorPreview = createComponentPreview(
							'style_update',
							'Update Color Scheme',
							'Switch to a modern dark theme with improved contrast',
							() => {
								addMessage({
									type: 'agent',
									content: 'Great choice! I\'ve applied the dark theme to your components. The new color scheme provides better contrast and a modern look.'
								})
								addHistoryEntry('component_updated', 'Applied dark color theme', {
									componentType: 'theme',
									previousValue: 'light theme',
									newValue: 'dark theme'
								})
							},
							() => {
								addMessage({
									type: 'agent',
									content: 'No problem! Your current color scheme looks great too. Would you like to try a different color option?'
								})
							},
							currentColors,
							newColors,
							[
								{ field: 'Background', from: 'Light blue (#f8fafc)', to: 'Dark slate (#1e293b)' },
								{ field: 'Text Color', from: 'Dark slate (#1e293b)', to: 'Off white (#f8fafc)' },
								{ field: 'Accent Color', from: 'Default blue', to: 'Bright blue (#3b82f6)' }
							]
						)

						showChangePreview(colorPreview)
					}, 1200)
					break
				case 'edit-text':
					response = 'Which text would you like to edit? You can click on any component and I\'ll help you update the content, or tell me what specific text needs changing.'
					break
				case 'rearrange':
					response = 'I can help rearrange your components! Do you want to move a specific component, change the overall layout order, or restructure the page flow?'
					break
				case 'preview-changes':
					response = 'Great idea! I can show you a preview of any changes before applying them. What would you like to preview - a different layout, colors, or content changes?'
					break
				case 'undo-last':
					response = 'I can help you revert changes! Check the History tab to see recent actions, or tell me specifically what you\'d like to undo.'
					break
				default:
					response = 'How can I help you with that?'
			}
			
			addMessage({
				type: 'agent',
				content: response
			})
		}, 800)
	}


	// Preview management functions
	const showChangePreview = (preview: Omit<ChangePreview, 'id'>) => {
		const previewWithId: ChangePreview = {
			...preview,
			id: generateId()
		}
		setPendingPreviews(prev => [...prev, previewWithId])
		return previewWithId.id
	}

	const dismissPreview = (previewId: string) => {
		setPendingPreviews(prev => prev.filter(p => p.id !== previewId))
	}

	const createComponentPreview = (
		type: ChangePreview['type'],
		title: string,
		description: string,
		onApprove: () => void,
		onReject: () => void,
		beforeData?: any,
		afterData?: any,
		changes: ChangePreview['changes'] = []
	): Omit<ChangePreview, 'id'> => {
		return {
			type,
			title,
			description,
			beforePreview: beforeData ? {
				title: beforeData.title || 'Current Component',
				subtitle: beforeData.subtitle || beforeData.description,
				image: beforeData.image,
				content: beforeData.content
			} : undefined,
			afterPreview: {
				title: afterData.title || 'Updated Component',
				subtitle: afterData.subtitle || afterData.description,
				image: afterData.image,
				content: afterData.content,
				styles: afterData.styles
			},
			changes,
			onApprove,
			onReject
		}
	}



	const startContinuationConversation = () => {
		setShowWelcome(false)
		
		// Add welcome message for the created page
		const welcomeMessage: ChatMessage = {
			id: generateId(),
			type: 'agent',
			content: `Here is the first draft of your ${currentComposition?.name || 'page'}. How does it look? You can ask me to **change the hero image**, **add a testimonials section**, or **re-arrange the components**.`,
			timestamp: new Date(),
			actions: [
				{
					id: 'change-hero-image',
					label: 'Change hero image',
					type: 'button',
					onClick: () => handleQuickEdit('hero-image')
				},
				{
					id: 'add-testimonials',
					label: 'Add testimonials',
					type: 'button',
					onClick: () => handleQuickEdit('testimonials')
				},
				{
					id: 'rearrange-components',
					label: 'Re-arrange components',
					type: 'button',
					onClick: () => handleQuickEdit('rearrange')
				}
			]
		}
		setMessages([welcomeMessage])
		
		setConversationState({
			step: 'design-partner',
			context: { compositionName: currentComposition?.name },
			pendingActions: []
		})
	}

	const handleQuickEdit = async (editType: string) => {
		switch (editType) {
			case 'hero-image':
				addMessage({
					type: 'user',
					content: 'Change hero image'
				})
				await delay(600)
				addMessage({
					type: 'agent',
					content: 'Great! I can help you change the hero image. What kind of image would you like? For example: "a modern office setup", "people using headphones", or "product on a clean background".'
				})
				setConversationState({
					step: 'editing-hero-image',
					context: { compositionName: currentComposition?.name },
					pendingActions: []
				})
				break
			case 'testimonials':
				addMessage({
					type: 'user',
					content: 'Add testimonials'
				})
				await delay(600)
				await simulateThinking(['Adding testimonials section...'])
				onPageComponentAdd('testimonials', {
					title: 'What Our Customers Say',
					testimonials: [
						{ name: 'Sarah Johnson', text: 'Amazing product quality and excellent customer service!', role: 'Product Manager' },
						{ name: 'Mike Chen', text: 'Best purchase I\'ve made this year. Highly recommended!', role: 'Designer' }
					]
				})
				addMessage({
					type: 'agent',
					content: 'Perfect! I\'ve added a testimonials section with some sample customer reviews. You can edit the testimonials directly on the canvas or ask me to modify them.'
				})
				break
			case 'rearrange':
				addMessage({
					type: 'user',
					content: 'Re-arrange components'
				})
				await delay(600)
				addMessage({
					type: 'agent',
					content: 'I can help you rearrange the components! For this prototype, you can drag and drop components on the canvas. In the full version, I could automatically reorganize them based on your preferences. What layout would you prefer?'
				})
				break
		}
	}

	const simulateThinking = async (thoughts: string[]) => {
		setIsThinking(true)
		
		for (const thought of thoughts) {
			onShowThought(thought)
			await delay(1500)
		}
		
		setIsThinking(false)
	}

	const addMessage = (message: Omit<ExtendedChatMessage, 'id' | 'timestamp'>) => {
		const newMessage: ExtendedChatMessage = {
			...message,
			id: generateId(),
			timestamp: new Date()
		}
		setMessages(prev => [...prev, newMessage])
		return newMessage
	}

	// Helper function to add rich component messages
	const addRichMessage = (type: 'content-type-selection' | 'cms-entry' | 'processing-status' | 'alert', props: any) => {
		return addMessage({
			type: 'agent',
			richComponent: {
				type,
				props
			}
		})
	}

	const startConversation = (prompt?: string) => {
		setShowWelcome(false)
		if (prompt) {
			setCurrentInput(prompt)
			setTimeout(() => {
				handleSubmit({ preventDefault: () => {} } as React.FormEvent, prompt)
			}, 100)
		} else {
			// Add welcome message
			const welcomeMessage: ChatMessage = {
				id: generateId(),
				type: 'agent',
				content: "Hi! I'm Compose, your AI assistant for creating pages with natural language. What would you like to build today?",
				timestamp: new Date()
			}
			setMessages([welcomeMessage])
		}
	}

	const handleQuickAction = (action: typeof quickActions[0]) => {
		const prompt = examples.find(ex => ex.toLowerCase().includes(action.id.replace('-', ' '))) || 
						`Create a ${action.label.toLowerCase()}`
		startConversation(prompt)
	}

	const handleInitialPrompt = async (input: string) => {
		const lowerInput = input.toLowerCase()
		
		// NEW: Content-First Workflow - Check if this is a creative brief
		if (isCreativeBrief(input)) {
			await handleContentGeneration(input)
			return
		}
		
		// Phase 1: Hero section scaffolding
		if (lowerInput.includes('hero section') && lowerInput.includes('two columns')) {
			await handleHeroScaffolding(input)
		}
		// Legacy Aura landing page flow
		else if (lowerInput.includes('landing page') || lowerInput.includes('aura') || lowerInput.includes('headphones')) {
			// Start the legacy golden path scenario
			await simulateThinking([
				'Analyzing request...',
				'Searching for "Product Launch" content models...',
				'No suitable content model found.'
			])

			const clarifyingMessage = addMessage({
				type: 'agent',
				content: "I can't find a 'Product Launch' content model. To build this page, I'll need to store the product info. Can I create a new content model called 'Product Launch Pages' with fields for a Product Name, Hero Image, Key Features, and a CTA button?",
				actions: [
					{
						id: 'create-model-yes',
						label: 'Yes, create it',
						type: 'button',
						onClick: () => handleCreateContentModel()
					},
					{
						id: 'create-model-no',
						label: 'No, use existing',
						type: 'button',
						onClick: () => handleDenyModelCreation()
					}
				]
			})

			setConversationState({
				step: 'content-model-question',
				context: { productName: 'Aura Smart Headphones' },
				pendingActions: []
			})
		} else {
			// Generic response for other inputs
			addMessage({
				type: 'agent',
				content: "I can help you with that! Try asking me to 'Create a hero section for a product page' to see the assistant in action."
			})
		}
	}

	// NEW: Content-First Workflow Functions
	
	// Helper to identify creative briefs
	const isCreativeBrief = (input: string): boolean => {
		const lowerInput = input.toLowerCase()
		const briefIndicators = [
			'build a landing page',
			'create a landing page', 
			'need a landing page',
			'landing page for',
			'campaign page',
			'black friday',
			'cyber monday',
			'holiday sale',
			'product launch',
			'email capture',
			'countdown timer',
			'featured products',
			'early bird access'
		]
		
		return briefIndicators.some(indicator => lowerInput.includes(indicator)) &&
			   (lowerInput.length > 20) // Ensure it's a substantial request
	}

	// NEW: Content-First Workflow Handler
	const handleContentGeneration = async (input: string) => {
		// Step 1: Parse the creative brief
		await simulateThinking(['Analyzing your creative brief...'])
		
		const brief = ContentGenerationEngine.parseBrief(input)
		
		addMessage({
			type: 'agent',
			content: `Perfect! I understand you need a ${brief.pageType} page${brief.campaign ? ` for ${brief.campaign}` : ''}. Let me create a complete, high-fidelity draft with realistic content.`
		})

		// Step 2: Show processing status with rich card
		const processingSteps: ProcessingStep[] = [
			{ id: 'parse-brief', label: 'Analyzing creative brief', status: 'completed' },
			{ id: 'generate-content', label: 'Generating campaign-specific content', status: 'in-progress' },
			{ id: 'create-components', label: 'Building page components', status: 'pending' },
			{ id: 'optimize-seo', label: 'Optimizing for SEO and performance', status: 'pending' }
		]

		addRichMessage('processing-status', {
			steps: processingSteps,
			title: 'Creating Your Content',
			currentStep: 'generate-content'
		})

		// Step 2: Generate complete content
		await simulateThinking([
			'Generating campaign-specific content...',
			'Creating compelling headlines and copy...',
			'Selecting relevant products...',
			'Building page structure...'
		])
		
		const generatedContent = ContentGenerationEngine.generateContent(brief)
		
		// Step 3: Create components on canvas
		generatedContent.components.forEach((component, index) => {
			setTimeout(() => {
				onPageComponentAdd(component.type, component.data)
			}, index * 800) // Stagger component creation
		})
		
		// Step 4: Show completion message and trigger persistence nudge
		setTimeout(() => {
			addMessage({
				type: 'agent',
				content: `🎉 **Your ${brief.campaign ? brief.campaign : 'campaign'} page is ready!** I've created a complete page with realistic content, including headlines, product showcases, and compelling calls-to-action.`
			})
			
			// Trigger the intelligent persistence nudge
			setTimeout(() => {
				triggerPersistenceNudge(generatedContent)
			}, 2000)
			
		}, generatedContent.components.length * 800 + 1000)
		
		setConversationState({
			step: 'content-generated',
			context: { 
				brief, 
				generatedContent,
				awaitingPersistence: true
			},
			pendingActions: []
		})
		
		// Add to history
		addHistoryEntry('ai_response', 'Generated complete content from creative brief', {
			userInput: input,
			aiResponse: `Generated ${generatedContent.components.length} components for ${brief.pageType} page`,
			componentType: 'content-generation'
		})
	}

	// NEW: Handle iteration on generated content
	const handleContentIteration = async (input: string) => {
		const lowerInput = input.toLowerCase()
		
		// Handle common content iteration requests
		if (lowerInput.includes('change') && lowerInput.includes('headline')) {
			const newHeadline = extractQuotedText(input) || 'Updated headline'
			addMessage({
				type: 'agent',
				content: `Perfect! I've updated the headline to "${newHeadline}". The change is reflected across the page and will be saved in your CMS entry.`
			})
		} else if (lowerInput.includes('swap') && lowerInput.includes('product')) {
			addMessage({
				type: 'agent',
				content: 'I can help you swap out products! Which specific product would you like to replace, and what should I replace it with?'
			})
		} else {
			// Default content iteration response
			addMessage({
				type: 'agent',
				content: 'I can help you refine this content! You can ask me to change headlines, swap products, adjust colors, or modify any other aspect of the page.'
			})
		}
	}

	// Helper to extract quoted text
	const extractQuotedText = (input: string): string | null => {
		const match = input.match(/["']([^"']+)["']/)
		return match ? match[1] : null
	}

	// NEW: Intelligent Persistence Nudge
	const triggerPersistenceNudge = (generatedContent: GeneratedContent) => {
		const { contentEntry, suggestedContentType } = generatedContent
		
		// Create content type options for the rich card
		const contentTypeOptions: ContentTypeOption[] = [
			{
				id: 'existing-recommended',
				name: suggestedContentType.name,
				description: suggestedContentType.explanation,
				confidence: suggestedContentType.confidence,
				isRecommended: true,
				fieldCount: suggestedContentType.fields.length,
				icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
				benefits: [
					'Content type already exists in CMS',
					'Fields perfectly match your content',
					'Instant deployment ready'
				],
				onSelect: () => handleUseExistingContentType(generatedContent)
			},
			{
				id: 'create-new',
				name: 'Custom Content Type',
				description: 'Create a new content type tailored specifically for this content',
				confidence: 0.75,
				isRecommended: false,
				fieldCount: suggestedContentType.fields.length + 2,
				icon: <Sparkles className="w-4 h-4 text-blue-600" />,
				benefits: [
					'Customized field names and types',
					'Future-proof for similar content'
				],
				onSelect: () => handleCreateNewContentType(generatedContent)
			}
		]

		// Use rich ContentTypeSelectionCard instead of plain message
		addRichMessage('content-type-selection', {
			options: contentTypeOptions,
			title: 'Choose Content Management Approach',
			subtitle: 'I\'ve analyzed your content and found the best CMS options'
		})
	}

	// NEW: Content Persistence Handlers
	const handleUseExistingContentType = async (generatedContent: GeneratedContent) => {
		const { contentEntry, suggestedContentType } = generatedContent
		
		addMessage({
			type: 'user',
			content: `📋 Use "${suggestedContentType.name}" (Recommended)`
		})
		
		await simulateThinking([
			'Creating new entry in CMS...',
			'Mapping content to fields...',
			'Linking components to entry...'
		])
		
		// Create mock CMS entry for the rich card
		const cmsEntry: CMSEntry = {
			id: generateId(),
			title: contentEntry.title,
			contentType: suggestedContentType.name,
			status: 'ready',
			lastModified: new Date(),
			fields: suggestedContentType.fields.slice(0, 5).map(field => ({
				key: field.label,
				value: field.value || 'Auto-generated content',
				type: field.type
			}))
		}
		
		// Use rich CMSEntryCard instead of plain message
		addRichMessage('cms-entry', {
			entry: cmsEntry,
			onViewInCMS: () => {
				// Would open CMS in real implementation
				addMessage({
					type: 'agent',
					content: '🔗 Opening CMS entry... (In a real implementation, this would navigate to your CMS)'
				})
			},
			onUnlink: () => handleUnlinkPage(),
			showActions: true
		})
		
		// Add history entry
		addHistoryEntry('content_populated', 'Created CMS entry and linked to page', {
			componentType: 'cms-entry',
			previousValue: 'static content',
			newValue: `${contentEntry.title} (${suggestedContentType.name})`
		})
		
		setConversationState({
			step: 'content-persisted',
			context: { contentEntry, linkedToCMS: true },
			pendingActions: []
		})
	}

	const handleCreateNewContentType = async (generatedContent: GeneratedContent) => {
		addMessage({
			type: 'user',
			content: '🆕 Create New Content Type'
		})
		
		addMessage({
			type: 'agent',
			content: '🔧 **Creating a custom content type...** I\'ll analyze your content and create the perfect structure for future pages like this one.',
			actions: [
				{
					id: 'confirm-new-type',
					label: '✅ Create "Campaign Landing Page" Type',
					type: 'button',
					onClick: () => handleConfirmNewContentType(generatedContent)
				}
			]
		})
	}

	const handleKeepStatic = (generatedContent: GeneratedContent) => {
		addMessage({
			type: 'user',
			content: '📄 Keep as Static Content'
		})
		
		addMessage({
			type: 'agent',
			content: '📄 **Content kept as static.** This page will remain as a one-off design with the content built into the page code. You can always convert it to managed content later if needed.'
		})
		
		setConversationState({
			step: 'content-static',
			context: { contentEntry: generatedContent.contentEntry, linkedToCMS: false },
			pendingActions: []
		})
	}

	const handleConfirmNewContentType = async (generatedContent: GeneratedContent) => {
		addMessage({
			type: 'user',
			content: '✅ Create "Campaign Landing Page" Type'
		})
		
		await simulateThinking([
			'Analyzing content structure...',
			'Creating content type fields...',
			'Setting up entry template...'
		])
		
		addMessage({
			type: 'agent',
			content: '🎉 **New content type created!** "Campaign Landing Page" is now available with fields perfectly matched to your content. Future campaign pages will be much faster to create.'
		})
	}

	const handleUnlinkPage = () => {
		addMessage({
			type: 'agent',
			content: '🔗 **Page unlinked from CMS.** The content is now static again. You can re-link it anytime or create a new entry.'
		})
	}

	const handleCreateContentModel = async () => {
		await simulateThinking([
			'Creating "Product Launch Pages" content model...',
			'Adding fields: Product Name, Hero Image, Key Features, CTA Button...',
			'Creating a new entry for "Aura" smart headphones...'
		])

		addMessage({
			type: 'agent',
			content: "Great! The content model and entry are ready. Now, what are the key features for the 'Aura' headphones? You can give them to me as a bulleted list."
		})

		setConversationState({
			step: 'content-elicitation',
			context: { productName: 'Aura Smart Headphones' },
			pendingActions: []
		})
	}

	const handleDenyModelCreation = () => {
		addMessage({
			type: 'agent',
			content: "I understand. For this prototype, I need to create the content model to demonstrate the full workflow. Would you like me to proceed with creating the 'Product Launch Pages' model?",
			actions: [
				{
					id: 'create-model-yes-2',
					label: 'Yes, go ahead',
					type: 'button',
					onClick: () => handleCreateContentModel()
				}
			]
		})
	}

	const handleFeatureInput = async (features: string) => {
		if (conversationState.step === 'content-elicitation') {
			const featuresArray = features.split('\n')
				.map(f => f.replace(/^-\s*/, '').trim())
				.filter(f => f.length > 0)

			await delay(500)
			await simulateThinking(['Perfect. Building the page now...'])

			addMessage({
				type: 'agent',
				content: "Perfect! Building the page now..."
			})

			// Trigger page component creation
			setTimeout(() => {
				onPageComponentAdd('hero', {
					title: 'Aura Smart Headphones',
					subtitle: 'Experience the future of audio',
					image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=400&fit=crop'
				})
			}, 1000)

			setTimeout(() => {
				onPageComponentAdd('features', {
					title: 'Key Features',
					features: featuresArray
				})
			}, 2000)

			setTimeout(() => {
				onPageComponentAdd('cta', {
					text: 'Learn More',
					href: '#',
					variant: 'primary'
				})
			}, 3000)

			setTimeout(() => {
				addMessage({
					type: 'agent',
					content: "Here is the first draft of your landing page. You can now edit the components directly or ask me to make more changes."
				})
				setConversationState({
					step: 'complete',
					context: { productName: 'Aura Smart Headphones', features: featuresArray },
					pendingActions: []
				})
			}, 4000)

			setConversationState({
				step: 'page-building',
				context: { productName: 'Aura Smart Headphones', features: featuresArray },
				pendingActions: []
			})
		}
	}

	const handleDesignPartnerInput = async (input: string) => {
		const lowerInput = input.toLowerCase()
		
		// Context-aware responses based on selected component
		if (isComponentSelected && selectedComponent) {
			const componentType = selectedComponent.type
			const componentTitle = selectedComponent.data?.title || selectedComponent.data?.name || 'component'
			
			// Provide component-specific suggestions
			if (lowerInput.includes('change') || lowerInput.includes('update') || lowerInput.includes('edit')) {
				addMessage({
					type: 'agent',
					content: `I can see you have the ${actions.getComponentBreadcrumb()} selected. I can help you make targeted improvements to this component.`
				})
				return
			}
			
			// Component-specific responses
			if (componentType === 'hero' || componentType === 'two-column-hero') {
				if (lowerInput.includes('image') || lowerInput.includes('photo') || lowerInput.includes('picture')) {
					addMessage({
						type: 'agent',
						content: `Perfect! I can update the hero image for "${componentTitle}". What kind of image are you looking for? For example: "modern office space", "product photography", or "abstract background".`
					})
				} else if (lowerInput.includes('headline') || lowerInput.includes('title') || lowerInput.includes('text')) {
					addMessage({
						type: 'agent',
						content: `I can help refine the headline for your hero section. Would you like me to make it more compelling, shorter, or focused on a specific benefit?`
					})
				} else {
					addMessage({
						type: 'agent',
						content: `I can help you improve this hero section! I can update the image, refine the headline, adjust the layout, or add a call-to-action button. What aspect would you like to work on?`
					})
				}
			} else if (componentType === 'features') {
				addMessage({
					type: 'agent',
					content: `I can help enhance this features section! I can add icons to make features more visual, reorganize them by importance, or add new features. What would you like to focus on?`
				})
			} else {
				addMessage({
					type: 'agent',
					content: `I can help you improve this ${componentType} component. Based on what you have selected, I can suggest specific enhancements. What aspect would you like to work on?`
				})
			}
		} else {
			// Enhanced component addition logic
			if (lowerInput.includes('add') || lowerInput.includes('create') || lowerInput.includes('include')) {
				if (lowerInput.includes('testimonial') || lowerInput.includes('review')) {
					// Add testimonials component
					onPageComponentAdd('testimonials', {
						title: 'What Our Customers Say',
						subtitle: 'Trusted by thousands of satisfied customers',
						testimonials: [
							{
								name: 'Sarah Johnson',
								role: 'Product Manager',
								content: 'These headphones have completely transformed my work-from-home experience. The noise cancellation is incredible!',
								rating: 5
							},
							{
								name: 'Mike Chen',
								role: 'Audio Engineer',
								content: 'The sound quality is pristine. Perfect for both casual listening and professional work.',
								rating: 5
							}
						]
					})
					addMessage({
						type: 'agent',
						content: 'Perfect! I\'ve added a testimonials section with customer reviews. This will help build trust and social proof for your product. You can customize the testimonials or ask me to modify them.'
					})
				} else if (lowerInput.includes('feature') || lowerInput.includes('benefit')) {
					// Add features component
					onPageComponentAdd('features', {
						title: 'Key Features',
						features: [
							'Premium noise cancellation technology',
							'24-hour battery life with quick charge',
							'Crystal-clear audio with deep bass',
							'Comfortable over-ear design for all-day use'
						],
						layout: 'list'
					})
					addMessage({
						type: 'agent',
						content: 'Excellent! I\'ve added a features section highlighting the key benefits. This helps visitors understand what makes your product special.'
					})
				} else if (lowerInput.includes('cta') || lowerInput.includes('call to action') || lowerInput.includes('button')) {
					// Add CTA component
					onPageComponentAdd('cta', {
						title: 'Ready to Experience Premium Audio?',
						description: 'Join thousands of satisfied customers who have upgraded their listening experience.',
						text: 'Order Now - $299',
						variant: 'default',
						href: '#order'
					})
					addMessage({
						type: 'agent',
						content: 'Great choice! I\'ve added a call-to-action section to drive conversions. This will encourage visitors to take action.'
					})
				} else {
					// Generic add component response
					addMessage({
						type: 'agent',
						content: 'I can add various components to your page! Try asking for: "Add testimonials", "Add a features section", "Add a call-to-action button", or "Add a contact form". What type of component would you like?'
					})
				}
			} else if (lowerInput.includes('testimonial') || lowerInput.includes('review')) {
				await handleQuickEdit('testimonials')
			} else if (lowerInput.includes('hero') || lowerInput.includes('image') || lowerInput.includes('banner')) {
				await handleQuickEdit('hero-image')
			} else if (lowerInput.includes('rearrange') || lowerInput.includes('move') || lowerInput.includes('order')) {
				await handleQuickEdit('rearrange')
			} else if (lowerInput.includes('color') || lowerInput.includes('theme')) {
				addMessage({
					type: 'agent',
					content: 'I can help you adjust the colors and theme! You can select a specific component first for targeted color changes, or I can update the overall theme for the entire page.'
				})
			} else {
				// Provide general help message
				addMessage({
					type: 'agent',
					content: 'I can help you improve your page! Try selecting a component first for targeted suggestions, or ask me to add specific sections like testimonials, hero sections, or call-to-action buttons.'
				})
			}
		}
	}


	// PRD PHASE 1: Hero section scaffolding
	const handleHeroScaffolding = async (input: string) => {
		// Add history entry for conversation start
		addHistoryEntry('conversation_started', 'User requested hero section scaffolding', {
			userInput: input
		})

		addMessage({
			type: 'agent',
			content: "Okay, building a two-column hero section now..."
		})

		await delay(1000)
		onShowThought('Creating main section container...')
		
		await delay(1500)
		onShowThought('Adding two-column grid layout...')
		
		await delay(1500)
		onShowThought('Placing image component in left column...')
		
		await delay(1500)
		onShowThought('Adding header and text to right column...')

		// Create the two-column hero component with placeholder content
		setTimeout(() => {
			const componentData = {
				title: 'Your Product Title',
				description: 'This is placeholder text for your product description. Replace this with compelling copy about your product.',
				image: '', // Empty for placeholder
				buttonText: 'Learn More',
				buttonHref: '#',
				layout: 'image-left'
			}
			
			onPageComponentAdd('two-column-hero', componentData)
			
			// Add history entry for component creation
			addHistoryEntry('component_added', 'Created two-column hero section with placeholder content', {
				componentType: 'two-column-hero'
			})
		}, 6000)

		setTimeout(() => {
			addMessage({
				type: 'agent',
				content: "Perfect! I've created a two-column hero section with placeholder content. Now, what product would you like to populate it with?",
				actions: [
					{
						id: 'populate-aura',
						label: 'Aura Smart Headphones',
						type: 'button',
						onClick: () => handleDataPopulation('aura')
					},
					{
						id: 'populate-other',
						label: 'Something else',
						type: 'button',
						onClick: () => handleDataPopulation('other')
					}
				]
			})
			
			setConversationState({
				step: 'hero-scaffolding',
				context: { heroCreated: true },
				pendingActions: []
			})
		}, 7000)
	}

	// PRD PHASE 2: CMS data population
	const handleDataPopulation = async (productType: string) => {
		if (productType === 'aura') {
			addMessage({
				type: 'user',
				content: 'Aura Smart Headphones'
			})
			
			await delay(500)
			setIsThinking(true)
			onShowThought("Searching for 'Aura smart headphones' in your 'Products' Content Type...")
			
			await delay(2000)
			onShowThought("Found Aura headphones entry! Loading product data...")
			
			await delay(2000)
			onShowThought("Updating hero section with product content...")
			setIsThinking(false)

			// Update the existing hero component with Aura data
			// In a real implementation, this would update the existing component
			// For demo purposes, we'll add a new one and remove the old
			setTimeout(() => {
				const auraData = {
					title: 'Aura Smart Headphones',
					description: 'Experience True Silence with Aura. Revolutionary noise-canceling technology meets premium comfort in our latest breakthrough headphones.',
					image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
					buttonText: 'Order Now - $299',
					buttonHref: '#order',
					layout: 'image-left'
				}
				
				onPageComponentAdd('two-column-hero', auraData)
				
				// Add history entry for data population
				addHistoryEntry('content_populated', 'Populated hero section with Aura headphones data', {
					componentType: 'two-column-hero',
					previousValue: 'placeholder content',
					newValue: 'Aura Smart Headphones'
				})
			}, 1000)

			setTimeout(() => {
				addMessage({
					type: 'agent',
					content: "Done! I've linked this section to the 'Aura smart headphones' entry. The placeholder content has been replaced with real product data."
				})
				
				setConversationState({
					step: 'data-population',
					context: { productName: 'Aura Smart Headphones' },
					pendingActions: []
				})
			}, 2000)
		} else {
			addMessage({
				type: 'user',
				content: 'Something else'
			})
			
			addMessage({
				type: 'agent',
				content: "For this prototype, I'll demonstrate with the Aura headphones. In the full version, I could search and populate content from any of your products!"
			})
		}
	}

	// PRD PHASE 3: Copy refinement
	const handleCopyRefinement = async (input: string) => {
		const lowerInput = input.toLowerCase()
		
		if (lowerInput.includes('headline') || lowerInput.includes('boring') || lowerInput.includes('alternatives')) {
			await delay(500)
			
			addMessage({
				type: 'agent',
				content: "Of course! Here are a few options:",
				actions: [
					{
						id: 'headline-1',
						label: 'Aura: Hear the Unheard.',
						type: 'button',
						onClick: () => handleHeadlineChoice('Aura: Hear the Unheard.')
					},
					{
						id: 'headline-2',
						label: 'Experience True Silence with Aura.',
						type: 'button',
						onClick: () => handleHeadlineChoice('Experience True Silence with Aura.')
					},
					{
						id: 'headline-3',
						label: 'Aura Headphones: Your World, Your Sound.',
						type: 'button',
						onClick: () => handleHeadlineChoice('Aura Headphones: Your World, Your Sound.')
					}
				]
			})
		} else {
			addMessage({
				type: 'agent',
				content: "I can help you refine the copy! Try asking me to make the headline more exciting or to give you alternative options."
			})
		}
	}

	const handleHeadlineChoice = (newHeadline: string) => {
		addMessage({
			type: 'user',
			content: `Use "${newHeadline}"`
		})

		// Show preview before applying changes
		setTimeout(() => {
			const currentData = {
				title: 'Aura Smart Headphones',
				description: 'Experience True Silence with Aura. Revolutionary noise-canceling technology meets premium comfort in our latest breakthrough headphones.',
				image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'
			}

			const newData = {
				title: newHeadline,
				description: 'Experience True Silence with Aura. Revolutionary noise-canceling technology meets premium comfort in our latest breakthrough headphones.',
				image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
				styles: { fontWeight: 'bold', color: '#1e293b' }
			}

			const preview = createComponentPreview(
				'component_update',
				'Update Hero Headline',
				`Change the headline from "${currentData.title}" to "${newHeadline}"`,
				() => {
					// Apply changes
					onPageComponentAdd('two-column-hero', {
						title: newHeadline,
						description: 'Experience True Silence with Aura. Revolutionary noise-canceling technology meets premium comfort in our latest breakthrough headphones.',
						image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
						buttonText: 'Order Now - $299',
						buttonHref: '#order',
						layout: 'image-left'
					})
					
					// Add history entry for content update
					addHistoryEntry('component_updated', 'Updated hero headline based on user selection', {
						componentType: 'two-column-hero',
						previousValue: 'Aura Smart Headphones',
						newValue: newHeadline
					})

					addMessage({
						type: 'agent',
						content: `Perfect! I've updated the headline to "${newHeadline}". The change is now live on your canvas.`
					})
				},
				() => {
					// Reject changes
					addMessage({
						type: 'agent',
						content: `No worries! The headline remains as "${currentData.title}". Would you like to try a different option?`
					})
				},
				currentData,
				newData,
				[
					{
						field: 'Headline',
						from: currentData.title,
						to: newHeadline
					}
				]
			)

			showChangePreview(preview)
		}, 500)
	}

	const handleHeroImageEdit = async (input: string) => {
		await delay(600)
		await simulateThinking(['Searching for the perfect image...'])
		
		// Simulate changing the hero image based on input
		const imageDescriptions: { [key: string]: string } = {
			'office': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
			'headphones': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=400&fit=crop',
			'product': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=400&fit=crop',
			'modern': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=center',
			'clean': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop'
		}
		
		let selectedImage = imageDescriptions['headphones'] // default
		for (const [key, url] of Object.entries(imageDescriptions)) {
			if (input.toLowerCase().includes(key)) {
				selectedImage = url
				break
			}
		}
		
		// This would trigger an update to the hero component in a real implementation
		addMessage({
			type: 'agent',
			content: `Perfect! I've found a great image that matches "${input}". The hero section has been updated with the new image. How does it look?`,
			actions: [
				{
					id: 'hero-looks-good',
					label: '✅ Looks great!',
					type: 'button',
					onClick: () => {
						addMessage({
							type: 'user',
							content: '✅ Looks great!'
						})
						addMessage({
							type: 'agent',
							content: 'Awesome! What else would you like to adjust on your page?'
						})
						setConversationState({
							step: 'design-partner',
							context: { compositionName: currentComposition?.name },
							pendingActions: []
						})
					}
				},
				{
					id: 'try-different-image',
					label: '🔄 Try a different image',
					type: 'button',
					onClick: () => {
						addMessage({
							type: 'user',
							content: '🔄 Try a different image'
						})
						addMessage({
							type: 'agent',
							content: 'No problem! Describe what kind of image you\'d prefer and I\'ll find another one.'
						})
					}
				}
			]
		})
	}

	const handleSubmit = async (e: React.FormEvent, providedInput?: string) => {
		e.preventDefault()
		const input = providedInput || currentInput.trim()
		if (!input || isThinking) return

		const userMessage = addMessage({
			type: 'user',
			content: input
		})

		setCurrentInput('')

		// GHOST MODE: If a component is selected, process the command through Ghost Mode
		if (selectedComponent && ghostMode.state.selectedComponentId === selectedComponent.id) {
			// Add thinking message for Ghost Mode
			setIsThinking(true)
			addMessage({
				type: 'agent',
				content: 'Analyzing your request and preparing a visual preview...'
			})
			
			// Process the command through Ghost Mode
			ghostMode.processCommand(input)
			
			// Wait for the ghost mode to finish processing, then add response
			setTimeout(() => {
				setIsThinking(false)
				addMessage({
					type: 'agent',
					content: generateGhostModeResponse(input)
				})
			}, 1600) // Slightly longer than ghost mode processing
			
			return
		}

		// Process input based on conversation state
		switch (conversationState.step) {
			case 'initial':
				await handleInitialPrompt(input)
				break
			case 'content-generated':
				// Handle iteration on generated content
				await handleContentIteration(input)
				break
			case 'hero-scaffolding':
				// Handle data population requests
				if (input.toLowerCase().includes('aura') && input.toLowerCase().includes('populate')) {
					await handleDataPopulation('aura')
				} else {
					addMessage({
						type: 'agent',
						content: "The hero section is ready! You can ask me to populate it with product data or refine the content. Try: 'Find the Aura headphones and populate this section' or 'Make the headline more exciting'."
					})
				}
				break
			case 'data-population':
				// Handle copy refinement requests
				await handleCopyRefinement(input)
				break
			case 'content-elicitation':
				await handleFeatureInput(input)
				break
			case 'complete':
				addMessage({
					type: 'agent',
					content: "The page is complete! You can now edit the components directly or start a new conversation."
				})
				break
			case 'design-partner':
				await handleDesignPartnerInput(input)
				break
			case 'editing-hero-image':
				await handleHeroImageEdit(input)
				break
			default:
				addMessage({
					type: 'agent',
					content: "I'm not sure how to help with that right now. Could you try rephrasing your request?"
				})
		}
	}

	// Enhanced AI co-pilot response for Ghost Mode
	const generateGhostModeResponse = (command: string): string => {
		const normalizedCommand = command.toLowerCase()
		const selectedComponentType = selectedComponent?.type || 'component'
		const componentTitle = selectedComponent?.data?.title || 'this section'
		
		// Check for multi-option preview triggers
		if (normalizedCommand.includes('show me') && (normalizedCommand.includes('option') || normalizedCommand.includes('version') || normalizedCommand.includes('different'))) {
			// Trigger multi-option previews for different variations
			showMultiOptionPreview([
				{
					id: 'option-1',
					label: 'Professional & Clean',
					changes: {
						backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						buttonText: 'Get Started',
						styles: { color: '#1e293b' }
					},
					reasoning: 'Clean gradient with professional appeal, perfect for B2B audiences'
				},
				{
					id: 'option-2',
					label: 'Bold & Modern',
					changes: {
						backgroundColor: 'linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 100%)',
						buttonText: 'Shop Now',
						styles: { color: '#ffffff', fontWeight: 'bold' }
					},
					reasoning: 'Eye-catching colors that create urgency and drive conversions'
				},
				{
					id: 'option-3',
					label: 'Elegant & Premium',
					changes: {
						backgroundColor: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
						buttonText: 'Discover More',
						styles: { color: '#ffffff' }
					},
					reasoning: 'Sophisticated dark theme that conveys luxury and premium quality'
				}
			])
			return 'Great idea! I\'ve prepared 3 different design options for you to choose from. Each has been crafted for different brand personalities and audiences. Check out the preview to see them in action!'
		}
		
		// Trigger before/after preview for major changes
		if (normalizedCommand.includes('before') && normalizedCommand.includes('after') || normalizedCommand.includes('compare')) {
			if (selectedComponent) {
				showBeforeAfterPreview(selectedComponent.data)
			}
			return 'Perfect! I\'ve set up a before and after comparison so you can see exactly what changes. Use the preview to compare the original with the enhanced version.'
		}

		// Enhanced contextual responses for headphones/audio products
		if (normalizedCommand.includes('dark gradient') && normalizedCommand.includes('shop now')) {
			// Capture the current state for before/after comparison
			if (selectedComponent) {
				showBeforeAfterPreview(selectedComponent.data)
			}
			return `Excellent choice! I've applied a sophisticated dark gradient that perfectly complements the Aura headphones' premium aesthetic. The "Shop Now" button creates urgency and drives conversion. Check the before/after preview to see how this darker theme makes your product photography really pop! ✨`
		}

		// Intelligent background suggestions
		if (normalizedCommand.includes('background') || normalizedCommand.includes('gradient')) {
			if (normalizedCommand.includes('premium') || normalizedCommand.includes('luxury')) {
				return `I've crafted a premium gradient that elevates your ${selectedComponentType} section. This sophisticated color palette conveys quality and exclusivity - exactly what premium customers expect. Notice how it enhances readability while maintaining visual impact.`
			}
			if (normalizedCommand.includes('dark') || normalizedCommand.includes('night')) {
				return `Perfect for a modern, sophisticated look! I've applied a dark gradient that's on-trend and creates beautiful contrast with your content. This works especially well for tech products like headphones. The preview shows how your text will pop against this background.`
			}
			return `I've updated the background to enhance your content's visual impact. This color choice improves readability and creates better hierarchy. Take a look at the preview - notice how it draws attention to your key messaging!`
		}

		// Smart button/CTA responses
		if (normalizedCommand.includes('button') || normalizedCommand.includes('cta')) {
			if (normalizedCommand.includes('shop') || normalizedCommand.includes('buy') || normalizedCommand.includes('order')) {
				return `Great instinct! I've optimized your call-to-action for conversions. "Shop Now" creates urgency and is proven to drive action. The button placement and styling are also optimized for maximum click-through rates.`
			}
			if (normalizedCommand.includes('demo') || normalizedCommand.includes('try')) {
				return `Smart approach! Offering a trial reduces friction and builds confidence. I've updated the button to "Try for Free" - this removes barriers and lets customers experience value first-hand.`
			}
			return `I've enhanced your call-to-action button. The new text is more compelling and action-oriented, which should improve your conversion rates. The styling maintains visual hierarchy while drawing attention.`
		}

		// Content and copy improvements
		if (normalizedCommand.includes('headline') || normalizedCommand.includes('title')) {
			return `I've crafted a more compelling headline that captures attention and communicates value immediately. Notice how it addresses your audience's core desire while maintaining clarity. Headlines like this typically see 23% higher engagement!`
		}

		if (normalizedCommand.includes('features') || normalizedCommand.includes('benefits')) {
			return `Excellent! I've enhanced the features section with more compelling benefit-focused language. Instead of just listing specs, we're now clearly communicating how each feature improves the user experience. This approach typically increases conversion by 15-20%.`
		}

		// Professional/business context
		if (normalizedCommand.includes('professional') || normalizedCommand.includes('business')) {
			return `I've elevated the content to match professional standards. The language is now more authoritative and trust-building, which resonates well with business buyers. The visual hierarchy also guides readers through your value proposition more effectively.`
		}

		// Contextual understanding responses
		if (normalizedCommand.includes('more') && normalizedCommand.includes('compelling')) {
			return `I've made the content more compelling by focusing on emotional triggers and clear benefits. Notice how the new copy speaks directly to your audience's desires and pain points. This psychology-based approach typically drives much higher engagement.`
		}

		// Default intelligent response
		return `I've analyzed your request and made intelligent improvements to your ${selectedComponentType}. The changes are designed to enhance user engagement and align with current design best practices. Check out the preview - I think you'll love how it elevates "${componentTitle}"!`
	}

	const renderMessage = (message: ExtendedChatMessage) => {
		const isAgent = message.type === 'agent'
		const isUser = message.type === 'user'

		// Handle rich components
		if (message.richComponent) {
			return (
				<motion.div
					key={message.id}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.2 }}
					className="flex gap-2"
				>
					{/* Avatar */}
					<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
						<Sparkles className="w-3 h-3" />
					</div>
					{/* Rich Component */}
					<div className="flex-1">
						{message.richComponent.type === 'content-type-selection' && (
							<ContentTypeSelectionCard {...message.richComponent.props} />
						)}
						{message.richComponent.type === 'cms-entry' && (
							<CMSEntryCard {...message.richComponent.props} />
						)}
						{message.richComponent.type === 'processing-status' && (
							<ProcessingStatusCard {...message.richComponent.props} />
						)}
						{message.richComponent.type === 'alert' && (
							<AlertCard {...message.richComponent.props} />
						)}
					</div>
				</motion.div>
			)
		}

		// Handle regular messages
		return (
			<motion.div
				key={message.id}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.2 }}
				className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
			>
				{/* Avatar */}
				<div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
					isAgent ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
				}`}>
					{isAgent && <Sparkles className="w-3 h-3" />}
					{isUser && <User className="w-3 h-3" />}
				</div>

				{/* Message Content */}
				<div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end' : ''}`}>
					{/* Message Bubble */}
					{message.content && (
						<div className={`rounded-lg p-2 text-xs leading-relaxed ${
							isAgent ? 'bg-slate-100' : 'bg-blue-600 text-white'
						}`}>
							{message.content}
						</div>
					)}

					{/* Action Buttons */}
					{message.actions && message.actions.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{message.actions.map((action) => (
								<Button
									key={action.id}
									variant="outline"
									size="sm"
									onClick={action.onClick}
									className="text-xs px-2 py-1 h-6"
								>
									{action.label}
								</Button>
							))}
						</div>
					)}
				</div>
			</motion.div>
		)
	}

	if (showWelcome) {
		return (
			<ChangePreviewProvider 
				previews={pendingPreviews} 
				onDismissPreview={dismissPreview}
			>
			<div className="flex flex-col h-full">
				{/* Header */}
				<div className="p-4 border-b border-slate-200">
					<div className="flex items-center gap-2 mb-3">
						<Sparkles className="w-5 h-5 text-blue-600" />
						<span className="text-lg font-semibold text-slate-800">Compose</span>
					</div>

					{/* Context Bar - matches PRD format */}
					<div className="mb-3 text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
						{isComponentSelected && selectedComponent 
							? `Selected: ${actions.getComponentBreadcrumb()} • Page: ${currentComposition?.name || 'Landing Page'}`
							: `Page: ${currentComposition?.name || 'Landing Page'}`
						}
					</div>

					{/* Ghost Mode Status Indicators */}
					{ghostMode.state.isProcessing && (
						<div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-center gap-2 text-sm text-blue-700">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
									className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
								/>
								<span>AI is analyzing your request...</span>
							</div>
							<div className="text-xs text-blue-600 mt-1">
								This may take a moment while I process your command.
							</div>
						</div>
					)}

					{ghostMode.state.isActive && (
						<div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
							<div className="flex items-center gap-2 text-sm text-green-700">
								<CheckCircle2 className="w-4 h-4" />
								<span>Preview ready! Check the canvas and use the action buttons.</span>
							</div>
						</div>
					)}
					
					{/* Sub-tabs */}
					<div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mb-3">
						<Button
							variant={composeState.activeView === 'chat' ? "default" : "ghost"}
							size="sm"
							onClick={() => setComposeState(prev => ({ ...prev, activeView: 'chat' }))}
							className={`flex-1 text-xs px-2 py-1 h-6 gap-1 ${
								composeState.activeView === 'chat'
									? 'bg-white shadow-sm text-slate-900'
									: 'text-slate-600 hover:text-slate-900'
							}`}
						>
							<MessageCircle className="w-3 h-3" />
							Chat
						</Button>
						<Button
							variant={composeState.activeView === 'history' ? "default" : "ghost"}
							size="sm"
							onClick={() => setComposeState(prev => ({ ...prev, activeView: 'history' }))}
							className={`flex-1 text-xs px-2 py-1 h-6 gap-1 ${
								composeState.activeView === 'history'
									? 'bg-white shadow-sm text-slate-900'
									: 'text-slate-600 hover:text-slate-900'
							}`}
						>
							<Clock className="w-3 h-3" />
							History
						</Button>
					</div>
					
					<p className="text-sm text-slate-600 leading-relaxed">
						{composeState.activeView === 'chat' 
							? isComponentSelected
								? "I can see your selected component. Ask me about specific improvements!"
								: "Hi! I'm here to help you build. Select a component for targeted suggestions."
							: "Track all AI actions and changes made to this composition"
						}
					</p>
				</div>

				{/* Welcome Content */}
				<ScrollArea className="flex-1">
					{composeState.activeView === 'chat' ? (
						<div className="p-4 space-y-6">
							{/* Quick Actions Panel */}
							{showQuickActions && (
								<div>
									<h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
										<Zap className="w-4 h-4 text-blue-600" />
										{isComponentSelected ? 'Component Actions' : 'Quick Actions'}
									</h3>
									{isComponentSelected && selectedComponent && (
										<motion.div 
											className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm"
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ duration: 0.2 }}
										>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<motion.div 
														className="w-2 h-2 bg-blue-500 rounded-full"
														animate={{ scale: [1, 1.2, 1] }}
														transition={{ duration: 2, repeat: Infinity }}
													/>
													<span className="text-xs font-semibold text-blue-900">
														Currently Editing
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Sparkles className="w-3 h-3 text-purple-500" />
													<span className="text-xs text-purple-600 font-medium">AI Ready</span>
												</div>
											</div>
											<div className="text-sm font-medium text-slate-800 mb-1">
												{actions.getComponentBreadcrumb()}
											</div>
											<div className="text-xs text-slate-600 leading-relaxed">
												All commands will be scoped to this component unless you specify otherwise
											</div>
										</motion.div>
									)}
									<div className="grid grid-cols-2 gap-2">
										{quickActionsConfig.map((action) => {
											const IconComponent = action.icon
											const label = action.label
											const onClick = () => handleQuickActionClick(action)

											return (
												<Button
													key={action.id}
													variant="outline"
													size="sm"
													onClick={onClick}
													className="h-auto p-3 hover:bg-blue-50 hover:border-blue-200 flex flex-col items-center gap-2"
												>
													<IconComponent className="w-4 h-4 text-blue-600" />
													<span className="text-xs font-medium text-slate-800 text-center leading-tight">{label}</span>
												</Button>
											)
										})}
									</div>
								</div>
							)}
							
							{/* Page Progress Indicator */}
							{context.allComponents.length > 0 && (
								<div className="mb-6">
									<h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
										<Target className="w-4 h-4 text-purple-600" />
										Page Progress
									</h3>
									<PageProgressIndicator components={context.allComponents} />
								</div>
							)}
							
							{/* Intelligent contextual suggestions */}
							<div>
								<h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
									<Lightbulb className="w-4 h-4 text-green-600" />
									Smart suggestions...
								</h3>
								<div className="space-y-2">
									{/* Contextual suggestions based on current state */}
									{(() => {
										const currentContext = {
											isComponentSelected,
											selectedComponent,
											hasComponents,
											conversationStep: conversationState.step
										}
										
										// Get relevant scenarios for current context
										const relevantScenarios = actionScenarios.filter(scenario => {
											if (isComponentSelected && selectedComponent) {
												return scenario.category === 'editing' && 
													   (scenario.context === 'any' || scenario.context.includes(selectedComponent.type) || scenario.context === `${selectedComponent.type}-selected`)
											}
											if (hasComponents) {
												return scenario.context === 'has-components' || scenario.category === 'advanced'
											}
											return scenario.category === 'creation' || scenario.context === 'empty-canvas'
										}).slice(0, 3) // Show max 3 suggestions
										
										return relevantScenarios.map((scenario, index) => (
											<Button
												key={index}
												variant="ghost"
												size="sm"
												onClick={() => startConversation(scenario.text)}
												className="w-full justify-start text-xs p-2 h-auto text-left hover:bg-green-50 text-slate-600"
											>
												<div className="flex items-start gap-2">
													{scenario.category === 'editing' && <Type className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />}
													{scenario.category === 'creation' && <Plus className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />}
													{scenario.category === 'advanced' && <Target className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />}
													<span className="text-slate-700 leading-relaxed">{scenario.text.length > 65 ? scenario.text.substring(0, 65) + '...' : scenario.text}</span>
												</div>
											</Button>
										))
									})()} 
								</div>
								
								{/* Context indicator */}
								<div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-500 flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3" />
									{isComponentSelected ? `Editing ${selectedComponent?.type?.replace('-', ' ')} component` : hasComponents ? 'Page has components' : 'Starting with blank canvas'}
								</div>
							</div>
						</div>
					) : (
						<div className="p-4">
							{/* History View */}
							{composeState.conversationHistory.length === 0 ? (
								<div className="text-center py-8">
									<Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
									<p className="text-sm text-slate-500 mb-2">No history yet</p>
									<p className="text-xs text-slate-400">Start a conversation to see AI actions here</p>
								</div>
							) : (
								<div className="space-y-3">
									{composeState.conversationHistory.map((entry) => (
										<div key={entry.id} className="bg-slate-50 rounded-lg p-3 border">
											<div className="flex items-start justify-between mb-1">
												<span className="text-xs font-medium text-slate-700">
													{entry.description}
												</span>
												<span className="text-xs text-slate-400">
													{entry.timestamp.toLocaleTimeString()}
												</span>
											</div>
											<div className="text-xs text-slate-500">
												{entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
											</div>
											{entry.details && (
												<div className="mt-2 text-xs text-slate-600 bg-white rounded p-2">
													{entry.details.userInput && (
														<div><strong>Input:</strong> {entry.details.userInput}</div>
													)}
													{entry.details.componentType && (
														<div><strong>Component:</strong> {entry.details.componentType}</div>
													)}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</ScrollArea>

				{/* Enhanced Input */}
				<div className="p-4 border-t border-slate-200">
					
					{/* Enhanced Input with Visual Analysis */}
					<div className="space-y-3">
						<form onSubmit={(e) => { startConversation(); handleSubmit(e); }} className="flex gap-2 items-end">
							<div className="flex-1 relative">
								<Input
									ref={inputRef}
									value={currentInput}
									onChange={(e) => handleInputChange(e.target.value)}
									onKeyDown={handleInputKeyDown}
									placeholder="Describe what you want to create..."
									className="text-xs"
									disabled={isThinking}
									autoComplete="off"
								/>
								
								{/* Welcome state intelligent suggestions */}
								{showSuggestions && inputSuggestions.length > 0 && (
									<div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
										{inputSuggestions.map((suggestion, index) => (
											<button
												key={index}
												type="button"
												onClick={() => handleSuggestionClick(suggestion)}
												className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-b-0 ${
													index === activeSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
												}`}
											>
												<div className="flex items-center gap-2">
													<Lightbulb className="w-3 h-3 text-blue-500 flex-shrink-0" />
													<span className="leading-relaxed">{suggestion}</span>
												</div>
											</button>
										))}
									</div>
								)}
							</div>
							<Button 
								type="submit" 
								disabled={!currentInput.trim() || isThinking}
								size="sm"
								className={`h-8 w-8 p-0 transition-all ${
									currentInput.trim() && !isThinking 
										? 'bg-blue-600 hover:bg-blue-700 text-white' 
										: 'bg-slate-200 text-slate-400'
								}`}
							>
								<ArrowUp className="w-3 h-3" />
							</Button>
						</form>
						
						<EnhancedMultiModalInput
							onFilesAttached={handleFilesAttached}
							onVoiceRecording={handleVoiceRecording}
							onRemoveFile={removeFile}
							onFigmaAttached={handleFigmaAttached}
							onRemoveFigma={removeFigma}
							onApplyDesignTokens={handleApplyDesignTokens}
							onUseSuggestion={handleUseSuggestion}
							attachedFiles={attachedFiles}
							figmaAttachments={figmaAttachments}
							disabled={isThinking}
							enableVisualAnalysis={true}
							enableFigmaIntegration={true}
						/>
						
						{/* Character count and help text */}
						<div className="flex items-center justify-between text-xs text-slate-400">
							<div className="flex items-center gap-3">
								<span>Try voice input, attach images with AI analysis, connect Figma files, or type your request</span>
							</div>
							{currentInput.length > 0 && (
								<span>{currentInput.length} characters</span>
							)}
						</div>
					</div>
				</div>
			</div>
			
			{/* Enhanced Ghost Mode Preview */}
			{ghostMode.state.showPreview && ghostMode.state.proposedChange && selectedComponent && (
				<EnhancedGhostPreview
					componentId={selectedComponent.id}
					beforeState={ghostMode.state.beforeState || selectedComponent.data}
					afterState={{ ...selectedComponent.data, ...ghostMode.state.proposedChange.changes }}
					onApprove={ghostMode.acceptChange}
					onReject={ghostMode.discardChange}
				/>
			)}
			</ChangePreviewProvider>
		)
	}

	return (
		<ChangePreviewProvider 
			previews={pendingPreviews} 
			onDismissPreview={dismissPreview}
		>
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-slate-200">
				<div className="flex items-center gap-2 mb-3">
					<Sparkles className="w-4 h-4 text-blue-600" />
					<span className="text-sm font-medium text-slate-800">Compose</span>
				</div>

				{/* Context Bar - matches PRD format */}
				<div className="mb-3 text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
					{isComponentSelected && selectedComponent 
						? `Selected: ${actions.getComponentBreadcrumb()} • Page: ${currentComposition?.name || 'Landing Page'}`
						: `Page: ${currentComposition?.name || 'Landing Page'}`
					}
				</div>

				{/* Ghost Mode Status Indicators */}
				{ghostMode.state.isProcessing && (
					<div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-center gap-2 text-sm text-blue-700">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
								className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
							/>
							<span>AI is analyzing your request...</span>
						</div>
						<div className="text-xs text-blue-600 mt-1">
							This may take a moment while I process your command.
						</div>
					</div>
				)}

				{ghostMode.state.isActive && (
					<div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
						<div className="flex items-center gap-2 text-sm text-green-700">
							<CheckCircle2 className="w-4 h-4" />
							<span>Preview ready! Check the canvas and use the action buttons.</span>
						</div>
					</div>
				)}
				
				{/* Sub-tabs */}
				<div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mb-2">
					<Button
						variant={composeState.activeView === 'chat' ? "default" : "ghost"}
						size="sm"
						onClick={() => setComposeState(prev => ({ ...prev, activeView: 'chat' }))}
						className={`flex-1 text-xs px-2 py-1 h-6 gap-1 ${
							composeState.activeView === 'chat'
								? 'bg-white shadow-sm text-slate-900'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						<MessageCircle className="w-3 h-3" />
						Chat
					</Button>
					<Button
						variant={composeState.activeView === 'history' ? "default" : "ghost"}
						size="sm"
						onClick={() => setComposeState(prev => ({ ...prev, activeView: 'history' }))}
						className={`flex-1 text-xs px-2 py-1 h-6 gap-1 ${
							composeState.activeView === 'history'
								? 'bg-white shadow-sm text-slate-900'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						<Clock className="w-3 h-3" />
						History
					</Button>
				</div>
				
				<p className="text-xs text-slate-500">
					{composeState.activeView === 'chat' 
						? isComponentSelected
							? 'Context-aware AI responses'
							: 'Creating with AI'
						: 'AI Action History'
					}
				</p>
			</div>

			{/* Messages / History */}
			<ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-2">
				{composeState.activeView === 'chat' ? (
					<div className="space-y-3">
						{/* Quick Actions - Show if no messages and showQuickActions is true */}
						{messages.length === 0 && showQuickActions && (
							<div className="mb-4">
								<div className="text-xs text-slate-500 mb-2">Quick Actions:</div>
								<div className="grid grid-cols-3 gap-1">
									{quickActionsConfig.slice(0, 6).map((action) => {
										const IconComponent = action.icon
										return (
											<Button
												key={action.id}
												variant="outline"
												size="sm"
												onClick={() => handleQuickActionClick(action)}
												className="h-auto p-2 hover:bg-blue-50 hover:border-blue-200 flex flex-col items-center gap-1"
											>
												<IconComponent className="w-3 h-3 text-blue-600" />
												<span className="text-xs text-slate-800">{action.label}</span>
											</Button>
										)
									})}
								</div>
							</div>
						)}
						<AnimatePresence>
							{messages.map(renderMessage)}
						</AnimatePresence>
						
						{isThinking && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="flex gap-2"
							>
								<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
									<Sparkles className="w-3 h-3" />
								</div>
								<div className="bg-slate-100 rounded-lg p-2">
									<div className="flex items-center gap-1 text-slate-600">
										<span className="text-xs">Thinking</span>
										<div className="thinking-dots">
											<div className="thinking-dot"></div>
											<div className="thinking-dot"></div>
											<div className="thinking-dot"></div>
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</div>
				) : (
					<div className="space-y-3">
						{composeState.conversationHistory.length === 0 ? (
							<div className="text-center py-8">
								<Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
								<p className="text-sm text-slate-500 mb-2">No history yet</p>
								<p className="text-xs text-slate-400">Start a conversation to see AI actions here</p>
							</div>
						) : (
							composeState.conversationHistory.map((entry) => (
								<div key={entry.id} className="bg-slate-50 rounded-lg p-3 border">
									<div className="flex items-start justify-between mb-1">
										<span className="text-xs font-medium text-slate-700">
											{entry.description}
										</span>
										<span className="text-xs text-slate-400">
											{entry.timestamp.toLocaleTimeString()}
										</span>
									</div>
									<div className="text-xs text-slate-500">
										{entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
									</div>
									{entry.details && (
										<div className="mt-2 text-xs text-slate-600 bg-white rounded p-2">
											{entry.details.userInput && (
												<div><strong>Input:</strong> {entry.details.userInput}</div>
											)}
											{entry.details.componentType && (
												<div><strong>Component:</strong> {entry.details.componentType}</div>
											)}
										</div>
									)}
								</div>
							))
						)}
					</div>
				)}
			</ScrollArea>

			{/* Enhanced Input for Active Chat */}
			<div className="p-4 border-t border-slate-200">
				
				{/* Enhanced Input with Visual Analysis */}
				<div className="space-y-3">
					<form onSubmit={handleSubmit} className="flex gap-2 items-end">
						<div className="flex-1 relative">
							<Input
								ref={inputRef}
								value={currentInput}
								onChange={(e) => handleInputChange(e.target.value)}
								onKeyDown={handleInputKeyDown}
								placeholder={getDynamicPlaceholder()}
								disabled={isThinking}
								className="text-xs"
								autoComplete="off"
							/>
							
							{/* Intelligent Suggestions Dropdown */}
							{showSuggestions && inputSuggestions.length > 0 && (
								<div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
									{inputSuggestions.map((suggestion, index) => (
										<button
											key={index}
											type="button"
											onClick={() => handleSuggestionClick(suggestion)}
											className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-b-0 ${
												index === activeSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
											}`}
										>
											<div className="flex items-center gap-2">
												<Lightbulb className="w-3 h-3 text-blue-500 flex-shrink-0" />
												<span className="leading-relaxed">{suggestion}</span>
											</div>
										</button>
									))}
									<div className="px-3 py-1 text-xs text-slate-400 bg-slate-50 flex items-center gap-1">
										<span>↑↓ navigate • Enter select • Esc close</span>
									</div>
								</div>
							)}
						</div>
						<Button 
							type="submit" 
							disabled={!currentInput.trim() || isThinking}
							size="sm"
							className={`h-8 w-8 p-0 transition-all ${
								currentInput.trim() && !isThinking
									? 'bg-blue-600 hover:bg-blue-700 text-white' 
									: 'bg-slate-200 text-slate-400'
							}`}
						>
							{isThinking ? (
								<div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
							) : (
								<ArrowUp className="w-3 h-3" />
							)}
						</Button>
					</form>
					
					<EnhancedMultiModalInput
						onFilesAttached={handleFilesAttached}
						onVoiceRecording={handleVoiceRecording}
						onRemoveFile={removeFile}
						onFigmaAttached={handleFigmaAttached}
						onRemoveFigma={removeFigma}
						onApplyDesignTokens={handleApplyDesignTokens}
						onUseSuggestion={handleUseSuggestion}
						attachedFiles={attachedFiles}
						figmaAttachments={figmaAttachments}
						disabled={isThinking}
						enableVisualAnalysis={true}
						enableFigmaIntegration={true}
					/>
					
					{/* Character count and status */}
					<div className="flex items-center justify-between text-xs text-slate-400">
						<div className="flex items-center gap-3">
							{isThinking ? (
								<span className="text-blue-600">AI is thinking...</span>
							) : hasVisualContent || hasFigmaContent ? (
								<span className="text-purple-600 flex items-center gap-1">
									<Sparkles className="w-3 h-3" />
									{hasVisualContent && hasFigmaContent ? 'Visual & Figma analysis active' : 
									 hasVisualContent ? 'Visual analysis active' : 'Figma analysis active'}
								</span>
							) : (
								<span>Ask me anything about your design, upload images, or connect Figma files</span>
							)}
						</div>
						{currentInput.length > 0 && (
							<span>{currentInput.length} characters</span>
						)}
					</div>
				</div>
			</div>
		</div>
			
			{/* Enhanced Ghost Mode Preview */}
			{ghostMode.state.showPreview && ghostMode.state.proposedChange && selectedComponent && (
				<EnhancedGhostPreview
					componentId={selectedComponent.id}
					beforeState={ghostMode.state.beforeState || selectedComponent.data}
					afterState={{ ...selectedComponent.data, ...ghostMode.state.proposedChange.changes }}
					onApprove={ghostMode.acceptChange}
					onReject={ghostMode.discardChange}
				/>
			)}
		</ChangePreviewProvider>
	)
}

// Page Progress Indicator Component
interface PageProgressIndicatorProps {
	components: PageComponent[]
}

function PageProgressIndicator({ components }: PageProgressIndicatorProps) {
	const componentTypes = components.map(c => c.type)
	const uniqueTypes = new Set(componentTypes)

	const essentialSections: Array<{
		id: string
		name: string
		types: PageComponent['type'][]
		importance: 'high' | 'medium' | 'low'
		description: string
	}> = [
		{ 
			id: 'hero', 
			name: 'Hero Section', 
			types: ['hero', 'two-column-hero'], 
			importance: 'high',
			description: 'Grabs attention and introduces your content'
		},
		{ 
			id: 'content', 
			name: 'Main Content', 
			types: ['features', 'text', 'section'], 
			importance: 'high',
			description: 'Core information for your visitors'
		},
		{ 
			id: 'cta', 
			name: 'Call-to-Action', 
			types: ['cta'], 
			importance: 'high',
			description: 'Guides visitors to take action'
		},
		{ 
			id: 'social-proof', 
			name: 'Social Proof', 
			types: ['testimonials'], 
			importance: 'medium',
			description: 'Builds trust and credibility'
		}
	]

	const completedSections = essentialSections.filter(section => 
		section.types.some(type => uniqueTypes.has(type))
	)

	const completionPercentage = Math.round((completedSections.length / essentialSections.length) * 100)
	
	return (
		<div className="space-y-3">
			{/* Progress Bar */}
			<div className="flex items-center gap-3">
				<div className="flex-1 bg-slate-200 rounded-full h-2">
					<motion.div 
						className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
						initial={{ width: 0 }}
						animate={{ width: `${completionPercentage}%` }}
						transition={{ duration: 0.5, ease: "easeOut" }}
					/>
				</div>
				<span className="text-xs font-medium text-slate-700 min-w-[3rem]">
					{completionPercentage}%
				</span>
			</div>

			{/* Section Checklist */}
			<div className="space-y-2">
				{essentialSections.map(section => {
					const isCompleted = section.types.some(type => uniqueTypes.has(type))
					const importanceColor = section.importance === 'high' ? 'text-red-600' : 'text-yellow-600'
					
					return (
						<div key={section.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
							<div className="flex-shrink-0 mt-0.5">
								{isCompleted ? (
									<CheckCircle2 className="w-4 h-4 text-green-600" />
								) : (
									<div className={`w-4 h-4 rounded-full border-2 ${
										section.importance === 'high' ? 'border-red-300' : 'border-yellow-300'
									}`} />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className={`text-xs font-medium ${
										isCompleted ? 'text-green-700' : 'text-slate-700'
									}`}>
										{section.name}
									</span>
									{!isCompleted && (
										<span className={`text-xs px-1.5 py-0.5 rounded ${
											section.importance === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
										}`}>
											{section.importance}
										</span>
									)}
								</div>
								<p className={`text-xs mt-0.5 ${
									isCompleted ? 'text-green-600' : 'text-slate-500'
								}`}>
									{section.description}
								</p>
							</div>
						</div>
					)
				})}
			</div>

			{/* Completion Message */}
			{completionPercentage === 100 && (
				<motion.div 
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="p-3 bg-green-50 border border-green-200 rounded-lg text-center"
				>
					<div className="text-sm font-medium text-green-800 mb-1">
						🎉 Great work! Your page has all essential sections.
					</div>
					<div className="text-xs text-green-600">
						Consider adding polish with custom styling or animations.
					</div>
				</motion.div>
			)}
		</div>
	)
}
