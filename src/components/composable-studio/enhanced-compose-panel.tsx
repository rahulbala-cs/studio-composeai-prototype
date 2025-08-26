'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Eye, EyeOff, Check, X, Lightbulb, Sparkles, Copy, Image, History, MessageSquarePlus, Figma, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, ConversationState } from '@/types'
import { generateId, delay } from '@/lib/utils'
import { useComponentContext, useSelectedComponent } from './component-context'
import { MessageBubble } from '@/components/chat/message-bubble'
import { ThinkingIndicator } from '@/components/chat/thinking-indicator'

interface EnhancedComposePanelProps {
	onPageComponentAdd: (componentType: string, data: any) => void
	onShowThought: (thought: string) => void
	currentComposition?: any
	hasComponents?: boolean
	onPreviewModeChange?: (isPreviewMode: boolean, targetComponentId?: string, changes?: Record<string, any>) => void
}

// Removed context attachment interface for prototype simplicity

// Simplified Rich AI response card types for prototype
interface InteractivePreviewCard {
	type: 'preview'
	title: string
	description: string
	targetComponent: string
	changes: Record<string, any>
	previewEnabled: boolean
	actionsEnabled: boolean
}

// Simplified suggestion system using pill buttons
interface SuggestionButton {
	id: string
	label: string
	onClick: () => void
}

interface SimplifiedResponse {
	type: 'suggestions' | 'confirmation'
	message: string
	suggestions?: SuggestionButton[]
}

// Simplified session tracking for prototype
interface SessionHistory {
	actions: Array<{
		type: 'component_added' | 'input_submitted'
		component?: string
		timestamp: Date
	}>
	assistanceEnabled: boolean
	pageType?: string
}

interface ExtendedChatMessage extends ChatMessage {
	previewCard?: InteractivePreviewCard
	simplifiedResponse?: SimplifiedResponse
}

// Component-specific suggestions for better UX
const getComponentSpecificSuggestions = (selectedComponent: any): SuggestionButton[] => {
	if (!selectedComponent) return []
	
	switch (selectedComponent.type) {
		case 'hero':
			return [
				{ id: 'hero-bg', label: 'Change background style', onClick: () => {} },
				{ id: 'hero-text', label: 'Refine the headline', onClick: () => {} },
				{ id: 'hero-cta', label: 'Improve the call-to-action', onClick: () => {} },
				{ id: 'hero-image', label: 'Update hero image', onClick: () => {} }
			]
		case 'features':
			return [
				{ id: 'add-feature', label: 'Add more features', onClick: () => {} },
				{ id: 'feature-icons', label: 'Add feature icons', onClick: () => {} },
				{ id: 'feature-layout', label: 'Change layout style', onClick: () => {} },
				{ id: 'feature-copy', label: 'Improve feature descriptions', onClick: () => {} }
			]
		case 'cta':
			return [
				{ id: 'cta-text', label: 'Make button text more compelling', onClick: () => {} },
				{ id: 'cta-color', label: 'Change button color', onClick: () => {} },
				{ id: 'cta-urgency', label: 'Add urgency or scarcity', onClick: () => {} },
				{ id: 'cta-size', label: 'Adjust button size', onClick: () => {} }
			]
		default:
			return [
				{ id: 'customize', label: 'Customize content', onClick: () => {} },
				{ id: 'styling', label: 'Update styling', onClick: () => {} }
			]
	}
}

// General page suggestions
const getContextualExamples = (hasComponents: boolean, selectedComponent: any, messages: ExtendedChatMessage[]) => {
	// If a component is selected, show component-specific suggestions
	if (selectedComponent) {
		return [] // We'll handle this with pill buttons instead
	}
	
	// If no components, show creation examples
	if (!hasComponents) {
		return [
			"Create a stunning landing page for our new headphones",
			"Build a beautiful blog template", 
			"Design a sleek product showcase",
			"Set up an engaging about us page"
		]
	}
	
	// General page enhancement suggestions
	return [
		"Add social proof with testimonials",
		"Include pricing information", 
		"Add FAQ section",
		"Create contact form"
	]
}

// Simplified page type detection for prototype
const analyzePageType = (messages: ExtendedChatMessage[], hasComponents: boolean): string => {
	if (!hasComponents) return 'empty'
	const recentContent = messages.slice(-2).map(m => m.content.toLowerCase()).join(' ')
	if (recentContent.includes('headphones') || recentContent.includes('landing')) return 'landing-page'
	if (recentContent.includes('about')) return 'about-us'
	return 'general'
}

// Dynamic placeholder texts based on context
const getDynamicPlaceholder = (hasComponents: boolean, selectedComponent: any) => {
	if (selectedComponent) {
		return `Editing ${selectedComponent.type.replace('-', ' ')}. Try "Change the background to dark blue" or "Add more content"`
	}
	
	if (hasComponents) {
		return "Ask me to refine your page, add sections, or make changes..."
	}
	
	return "What would you like to create today? Try one of the examples below..."
}

// Intelligence Features

// Simplified intent prediction for prototype
const predictIntent = (input: string, hasComponents: boolean): string[] => {
	const lowerInput = input.toLowerCase().trim()
	if (lowerInput.length < 3) return []
	
	// Simple pattern matching for demo
	const patterns = [
		{ trigger: 'add', suggestions: hasComponents ? ['add testimonials section', 'add FAQ section'] : ['add hero section', 'add features section'] },
		{ trigger: 'change', suggestions: ['change the background to dark blue', 'change the button text'] },
		{ trigger: 'create', suggestions: ['create a landing page for headphones', 'create an about page'] }
	]
	
	for (const pattern of patterns) {
		if (lowerInput.startsWith(pattern.trigger)) {
			return pattern.suggestions.slice(0, 2) // Max 2 suggestions for prototype
		}
	}
	
	return []
}

// Removed generateContextualSuggestions - using pill-style suggestions instead

// Removed multi-step flows for prototype simplicity

export function EnhancedComposePanel({ 
	onPageComponentAdd, 
	onShowThought, 
	currentComposition, 
	hasComponents,
	onPreviewModeChange
}: EnhancedComposePanelProps) {
	const { context } = useComponentContext()
	const { selectedComponent, isComponentSelected } = useSelectedComponent()
	
	const [messages, setMessages] = useState<ExtendedChatMessage[]>([])
	const [currentInput, setCurrentInput] = useState('')
	const [isThinking, setIsThinking] = useState(false)
	const [conversationState, setConversationState] = useState<ConversationState>({
		step: 'initial',
		context: {},
		pendingActions: []
	})
	const [previewMode, setPreviewMode] = useState<{
		active: boolean
		targetComponentId: string | null
		changes: Record<string, any>
	}>({
		active: false,
		targetComponentId: null,
		changes: {}
	})
	
	// Simplified context for prototype
	
	// Simplified Intelligence Features for prototype
	const [sessionHistory, setSessionHistory] = useState<SessionHistory>({
		actions: [],
		assistanceEnabled: true,
		pageType: undefined
	})
	const [inputSuggestions, setInputSuggestions] = useState<string[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	
	// Auto-scroll to bottom
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight
			}
		}
	}, [messages])

	// Initialize with welcome message
	useEffect(() => {
		// This ID helps us identify the welcome message specifically.
		const WELCOME_MESSAGE_ID = 'welcome-message'

		const currentMessageIsWelcome = messages.length === 1 && messages[0].id === WELCOME_MESSAGE_ID

		// We only proceed if there are no messages, or if the only message is a welcome message
		// that might need updating.
		if (messages.length === 0 || currentMessageIsWelcome) {
			const welcomeMessage: ExtendedChatMessage = {
				id: WELCOME_MESSAGE_ID,
				type: 'agent',
				content: hasComponents
					? "Nice work! I can see you've got some components on your canvas already. What would you like to work on next? I can help you refine what's there or add something new."
					: "Hey there! I'm your AI design assistant, ready to help you create amazing pages. Just tell me what you have in mind and I'll bring it to life. What should we build today?",
				timestamp: new Date(),
				// Add initial suggestions only for the welcome message
				simplifiedResponse: hasComponents ? {
					type: 'suggestions',
					message: 'Try these enhancement suggestions for your existing page:',
					suggestions: [
						{ id: 'dramatic-bg', label: 'Make the hero background more dramatic', onClick: () => setCurrentInput('Make the hero background more dramatic') },
						{ id: 'story-sections', label: 'Add sections that tell your story', onClick: () => setCurrentInput('Add sections that tell your story') },
						{ id: 'polish-flow', label: 'Polish the spacing and visual flow', onClick: () => setCurrentInput('Polish the spacing and visual flow') },
						{ id: 'engage-visitors', label: 'Add elements that engage visitors', onClick: () => setCurrentInput('Add elements that engage visitors') }
					]
				} : {
					type: 'suggestions',
					message: 'Try these creation examples to build something new:',
					suggestions: [
						{ id: 'headphones-landing', label: 'Create a stunning landing page for our new headphones', onClick: () => setCurrentInput('Create a stunning landing page for our new headphones') },
						{ id: 'blog-template', label: 'Build a beautiful blog template', onClick: () => setCurrentInput('Build a beautiful blog template') },
						{ id: 'product-showcase', label: 'Design a sleek product showcase', onClick: () => setCurrentInput('Design a sleek product showcase') },
						{ id: 'about-page', label: 'Set up an engaging about us page', onClick: () => setCurrentInput('Set up an engaging about us page') }
					]
				}
			}

			// If the current welcome message is out of sync with `hasComponents`, replace it.
			// Otherwise, if there are no messages at all, set the initial one.
			if (currentMessageIsWelcome && messages[0].content !== welcomeMessage.content) {
				setMessages([welcomeMessage])
			} else if (messages.length === 0) {
				setMessages([welcomeMessage])
			}
		}
	}, [hasComponents, messages])

	// Simplified intent prediction for prototype
	useEffect(() => {
		const suggestions = predictIntent(currentInput, hasComponents || false)
		setInputSuggestions(suggestions)
		setShowSuggestions(suggestions.length > 0 && currentInput.length > 3)
	}, [currentInput, hasComponents])

	// Removed proactive suggestions for prototype simplicity

	// Track user actions for intelligence
	const trackAction = (type: SessionHistory['actions'][0]['type'], component?: string, metadata?: Record<string, any>) => {
		setSessionHistory(prev => ({
			...prev,
			actions: [...prev.actions, {
				type,
				component,
				timestamp: new Date(),
				metadata
			}]
		}))
	}

	const simulateThinking = async (thoughts: string[]) => {
		setIsThinking(true)
		for (const thought of thoughts) {
			onShowThought(thought)
			await delay(800)
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

	// Handle the four scripted entry flows
	const handleScriptedFlow = async (input: string) => {
		const lowerInput = input.toLowerCase()

		if (lowerInput.includes('landing page') && lowerInput.includes('headphones')) {
			// Flow 1: Headphones landing page with intelligence
			await simulateThinking(['Analyzing your request...', 'Creating headphones landing page...', 'Adding hero section and features...'])
			
			// Track flow start
			trackAction('component_added', 'landing-page')
			
			// Create the page components
			onPageComponentAdd('hero', {
				title: 'Aura Smart Headphones',
				subtitle: 'Experience music like never before',
				description: 'Revolutionary audio technology meets premium comfort in our latest breakthrough headphones.',
				image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
				buttonText: 'Shop Now',
				buttonHref: '#shop'
			})
			trackAction('component_added', 'hero')

			setTimeout(() => {
				onPageComponentAdd('features', {
					title: 'Why Choose Aura?',
					features: [
						'Premium noise cancellation technology',
						'24-hour battery life with quick charge',
						'Crystal-clear audio with deep bass',
						'Comfortable over-ear design'
					]
				})
				trackAction('component_added', 'features')
			}, 1000)

			setTimeout(() => {
				onPageComponentAdd('cta', {
					title: 'Ready to Experience Premium Audio?',
					description: 'Join thousands of satisfied customers who have upgraded their listening experience.',
					text: 'Order Now - $299',
					href: '#order'
				})
				trackAction('component_added', 'cta')
			}, 2000)

			addMessage({
				type: 'agent',
				content: "Perfect! I've built your headphones landing page with a compelling hero section, key features, and a strong call-to-action. How does it look?",
				simplifiedResponse: {
					type: 'suggestions',
					message: 'Here are some popular enhancements for landing pages:',
					suggestions: [
						{ id: 'add-testimonials', label: 'add testimonials section', onClick: () => setCurrentInput('Add testimonials section') },
						{ id: 'add-stats', label: 'add stats section', onClick: () => setCurrentInput('Add stats section') },
						{ id: 'add-faq', label: 'add FAQ section', onClick: () => setCurrentInput('Add FAQ section') },
						{ id: 'refine-hero', label: 'refine the hero section', onClick: () => setCurrentInput('Refine the hero section') }
					]
				}
			})

		} else if (lowerInput.includes('template') && lowerInput.includes('blog')) {
			// Flow 2: Blog template
			await simulateThinking(['Understanding your template needs...', 'Checking content types...'])
			
			addMessage({
				type: 'agent',
				content: "Smart choice! Blog templates work best when they're connected to a specific content type. This keeps everything organized and consistent. Which content type should we use?",
				// Simplified for prototype
				simplifiedResponse: {
					type: 'suggestions',
					message: 'Choose a content type for your template:',
					suggestions: [
						{ id: 'blog-posts', label: 'blog posts', onClick: () => handleTemplateChoice('blog-posts') },
						{ id: 'pages', label: 'pages', onClick: () => handleTemplateChoice('pages') },
						{ id: 'other', label: 'choose another type', onClick: () => setCurrentInput('Link to a different content type') }
					]
				}
			})

		} else if (lowerInput.includes('product catalog') || lowerInput.includes('catalog page')) {
			// Flow 3: Product catalog
			await simulateThinking(['Analyzing catalog requirements...', 'Considering layout options...'])
			
			addMessage({
				type: 'agent',
				content: "Got it! For product catalogs, I'd suggest going with a freeform page. You'll have complete control over the layout and can showcase your products exactly how you want. Does that sound like the right approach?",
				// Simplified for prototype
				simplifiedResponse: {
					type: 'suggestions',
					message: 'Perfect for catalogs with custom layouts:',
					suggestions: [
						{ id: 'create-freeform', label: 'create freeform page', onClick: () => handleFreeformCreation() }
					]
				}
			})

		} else if (lowerInput.includes('about us') || lowerInput.includes('about page')) {
			// Flow 4: About us page
			await simulateThinking(['Creating about page structure...', 'Adding basic sections...'])
			
			// Create simple about page
			onPageComponentAdd('hero', {
				title: 'About Us',
				subtitle: 'Our Story',
				description: 'Learn about our journey, values, and the team that makes it all possible.',
				image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'
			})

			setTimeout(() => {
				onPageComponentAdd('text', {
					content: 'We are a passionate team dedicated to creating innovative solutions that make a difference. Founded in 2020, we have grown from a small startup to a trusted partner for businesses worldwide.\n\nOur mission is to empower organizations with cutting-edge technology while maintaining a human-centered approach to everything we do.'
				})
			}, 1000)

			addMessage({
				type: 'agent',
				content: "Absolutely! I've set up a clean About Us page with a welcoming hero section and introductory text. This gives you a solid foundation to build from. What do you think?",
				simplifiedResponse: {
					type: 'suggestions',
					message: 'Next steps for your About Us page:',
					suggestions: [
						{ id: 'customize-text', label: 'Customize the text content', onClick: () => setCurrentInput('Customize the about us text') },
						{ id: 'add-team', label: 'Add a team section', onClick: () => setCurrentInput('Add a team section') }
					]
				}
			})

		} else if (lowerInput.includes('faq') || lowerInput.includes('frequently asked')) {
			// FAQ component flow
			await simulateThinking(['Creating FAQ section...', 'Adding common questions...'])
			
			onPageComponentAdd('faq', {
				title: 'Frequently Asked Questions',
				subtitle: 'Everything you need to know',
				questions: [
					{
						question: 'How does your product work?',
						answer: 'Our product uses cutting-edge technology to deliver exceptional results. Simply follow the setup guide and you\'ll be up and running in minutes.'
					},
					{
						question: 'What is your return policy?',
						answer: 'We offer a 30-day money-back guarantee. If you\'re not completely satisfied, return the product for a full refund.'
					},
					{
						question: 'Do you offer customer support?',
						answer: 'Yes! Our support team is available 24/7 via email, chat, and phone to help with any questions or issues.'
					}
				]
			})
			trackAction('component_added', 'faq')
			
			addMessage({
				type: 'agent',
				content: "Excellent choice! I've added an FAQ section with the most common questions customers usually have. This will help build trust and reduce support queries. Feel free to customize these questions to match your specific needs!",
				simplifiedResponse: {
					type: 'suggestions',
					message: 'Ways to enhance your FAQ section:',
					suggestions: [
						{ id: 'customize-questions', label: 'Customize the questions', onClick: () => setCurrentInput('Customize the FAQ questions') },
						{ id: 'add-more-questions', label: 'Add more questions', onClick: () => setCurrentInput('Add more FAQ questions') }
					]
				}
			})
			
		} else {
			// Generic response for other inputs - simplified without duplicate suggestions
			addMessage({
				type: 'agent',
				content: hasComponents 
					? "I'm here to help enhance your existing page! What would you like to work on?"
					: "I'm here to help! What would you like to create today?"
			})
		}
	}

	// Handle visual change requests with Instant Preview for prototype
	const handleVisualChange = async (input: string) => {
		if (!selectedComponent) {
			addMessage({
				type: 'agent',
				content: "Please select a component on the canvas first, then I can help you make visual changes to it."
			})
			return
		}

		const lowerInput = input.toLowerCase()
		let changes: Record<string, any> = {}
		let responseMessage = ""

		if (lowerInput.includes('background') && lowerInput.includes('dark')) {
			changes = { backgroundColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }
			responseMessage = `Perfect! I've applied a dark gradient background to your ${selectedComponent.type}. You can see the changes on the canvas.`
		} else if (lowerInput.includes('button') && lowerInput.includes('text')) {
			changes = { buttonText: 'Get Started Now' }
			responseMessage = `Great! I've updated the button text. The change is now visible on the canvas.`
		} else {
			changes = { backgroundColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }
			responseMessage = `I've applied your requested changes to the ${selectedComponent.type}. Check out the result!`
		}

		await simulateThinking(['Analyzing your request...', 'Applying changes instantly...'])

		// Immediately activate preview mode for instant feedback
		setPreviewMode({
			active: true,
			targetComponentId: selectedComponent.id,
			changes
		})
		// Pass changes to parent so canvas can show them immediately
		if (onPreviewModeChange) {
			onPreviewModeChange(true, selectedComponent.id, changes)
		}

		addMessage({
			type: 'agent',
			content: responseMessage,
			simplifiedResponse: {
				type: 'suggestions',
				message: 'The updates are now showing on your canvas in real-time:',
				suggestions: [
					{
						id: 'accept-changes',
						label: 'Keep changes',
						onClick: () => {
							// Apply changes permanently and clear preview
							setPreviewMode({ active: false, targetComponentId: null, changes: {} })
							onPreviewModeChange?.(false)
							addMessage({
								type: 'agent',
								content: '✅ Perfect! Your changes have been saved.'
							})
						}
					},
					{
						id: 'revert-changes',
						label: 'Revert changes',
						onClick: () => {
							setPreviewMode({ active: false, targetComponentId: null, changes: {} })
							onPreviewModeChange?.(false)
							addMessage({
								type: 'agent',
								content: 'No problem! I\'ve reverted the changes.'
							})
						}
					}
				]
			}
		})
	}

	const handleTemplateChoice = async (contentType: string) => {
		await simulateThinking(['Linking to content type...', 'Setting up template structure...'])
		
		addMessage({
			type: 'agent',
			content: `Perfect! I've linked your template to ${contentType}. The template is now ready for customization.`
		})
	}

	const handleFreeformCreation = async () => {
		await simulateThinking(['Creating freeform canvas...', 'Setting up flexible layout...'])
		
		addMessage({
			type: 'agent',
			content: "Excellent! Your freeform page is ready. You can now add any components you need for your product catalog."
		})
	}

	// Removed complex toggle preview for instant preview in prototype

	// Removed complex accept changes for simplified prototype

	// Removed complex discard changes for simplified prototype

	const handleUserInput = async (input: string) => {
		// Track user input for intelligence
		trackAction('input_submitted', undefined, { input, timestamp: new Date() })
		
		addMessage({
			type: 'user',
			content: input
		})

		// Determine if this is a visual change request
		const visualChangeKeywords = ['change', 'update', 'modify', 'background', 'color', 'button', 'text']
		const isVisualChange = visualChangeKeywords.some(keyword => 
			input.toLowerCase().includes(keyword)
		) && isComponentSelected

		if (isVisualChange) {
			await handleVisualChange(input)
		} else {
			await handleScriptedFlow(input)
		}
	}

	// Simplified assistance toggle for prototype
	const toggleAssistance = () => {
		setSessionHistory(prev => ({
			...prev,
			assistanceEnabled: !prev.assistanceEnabled
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentInput.trim() || isThinking) return

		const input = currentInput.trim()
		setCurrentInput('')
		await handleUserInput(input)
	}

	const handleExampleClick = (example: string) => {
		setCurrentInput(example)
		// Auto-submit the example
		setTimeout(() => {
			handleUserInput(example)
		}, 100)
	}

	// Removed guided flow functions for prototype simplicity
	
	// Simplified context handlers for prototype
	const handleClipboardPaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			if (text) {
				setCurrentInput(prev => prev + ' ' + text)
			}
		} catch (err) {
			console.log('Clipboard access denied')
		}
	}
	
	const handleImageUpload = () => {
		console.log('Image upload placeholder for prototype')
	}

	return (
		<div className="flex flex-col h-full bg-white">
			{/* Intelligence & Assistance Header */}
			<div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Sparkles className="w-3 h-3 text-blue-500" />
						<span className="text-xs font-medium text-blue-700">
							AI Assistant {sessionHistory.assistanceEnabled ? '(Active)' : '(Off)'}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="Chat history"
						>
							<History className="w-3 h-3" />
						</button>
						<button
							className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="New chat"
						>
							<MessageSquarePlus className="w-3 h-3" />
						</button>
						<button
							onClick={toggleAssistance}
							className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="Toggle AI assistance"
						>
							{sessionHistory.assistanceEnabled ? '🤖' : '⏸️'}
						</button>
					</div>
				</div>
			</div>

			{/* Chat Messages */}
			<ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-3">
				<div className="space-y-4">
					<AnimatePresence>
						{messages.map((message) => (
							<div key={message.id}>
								<MessageBubble message={message} />
								
								{/* Pill-Style Suggestions - Consistent UX */}
								{message.simplifiedResponse && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-3 ml-8"
									>
										{message.simplifiedResponse.message && (
											<p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
												<Sparkles className="w-3 h-3" />
												{message.simplifiedResponse.message}
											</p>
										)}
										{message.simplifiedResponse.suggestions && (
											<div className="flex flex-wrap gap-2">
												{message.simplifiedResponse.suggestions.map((suggestion) => (
													<motion.button
														key={suggestion.id}
														initial={{ opacity: 0, scale: 0.9 }}
														animate={{ opacity: 1, scale: 1 }}
														onClick={suggestion.onClick}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200 transition-colors cursor-pointer"
													>
														<Sparkles className="w-3 h-3" />
														{suggestion.label}
													</motion.button>
												))}
											</div>
										)}
									</motion.div>
								)}

								{/* Removed Interactive Preview Card - using instant preview instead */}
							</div>
						))}
					</AnimatePresence>
					
					{isThinking && <ThinkingIndicator />}
				</div>
			</ScrollArea>




			{/* Component-specific suggestions when component is selected - only show if no input suggestions */}
			{isComponentSelected && selectedComponent && !showSuggestions && (
				<div className="px-5 pt-3 pb-2 border-t border-slate-100 bg-blue-50/30">
					<div className="flex items-center gap-2 mb-3">
						<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						<span className="text-xs font-medium text-blue-700">
							Editing {selectedComponent.type.replace('-', ' ')} component
						</span>
					</div>
					
					{/* Component-specific pill suggestions */}
					<div className="mb-2">
						<p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
							<Sparkles className="w-3 h-3" />
							Quick actions:
						</p>
						<div className="flex flex-wrap gap-2">
							{getComponentSpecificSuggestions(selectedComponent).map((suggestion) => (
								<motion.button
									key={suggestion.id}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									onClick={() => {
										setCurrentInput(suggestion.label)
										setShowSuggestions(false)
										// Auto-submit after a brief delay
										setTimeout(() => {
											handleUserInput(suggestion.label)
										}, 200)
									}}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full transition-colors cursor-pointer font-medium"
								>
									<Sparkles className="w-3 h-3" />
									{suggestion.label}
								</motion.button>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Intent Prediction Suggestions - prioritize these over component suggestions */}
			{showSuggestions && inputSuggestions.length > 0 && (
				<div className="px-5 pb-2 border-t border-slate-100 bg-amber-50/50">
					<div className="text-xs text-slate-600 mb-2 flex items-center gap-1">
						<Lightbulb className="w-3 h-3" />
						Smart suggestions based on your input:
					</div>
					<div className="flex flex-wrap gap-2">
						{inputSuggestions.map((suggestion, index) => (
							<motion.button
								key={suggestion}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: index * 0.05 }}
								onClick={() => {
									setCurrentInput(suggestion)
									setShowSuggestions(false)
									// Auto-submit after a brief delay
									setTimeout(() => {
										handleUserInput(suggestion)
									}, 200)
								}}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs rounded-full border border-amber-200 transition-colors font-medium"
							>
								<Lightbulb className="w-3 h-3" />
								{suggestion}
							</motion.button>
						))}
					</div>
				</div>
			)}

			{/* Input */}
			<div className="p-5 border-t border-slate-200">
				<form onSubmit={handleSubmit} className="flex gap-3">
					<Input
						ref={inputRef}
						value={currentInput}
						onChange={(e) => setCurrentInput(e.target.value)}
						placeholder={getDynamicPlaceholder(hasComponents || false, selectedComponent)}
						disabled={isThinking}
						className="text-sm h-10"
					/>
					<Button 
						type="submit" 
						disabled={!currentInput.trim() || isThinking}
						size="sm"
						className="px-4 h-10"
					>
						<Send className="w-4 h-4" />
					</Button>
				</form>
				
				{/* Context Attachments */}
				<div className="mt-3 pt-3 border-t border-slate-100">
					<div className="flex items-center gap-3">
						<span className="text-xs text-slate-500">Add context:</span>
						<button
							type="button"
							onClick={handleClipboardPaste}
							className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="Paste from clipboard"
						>
							<Copy className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={handleImageUpload}
							className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="Upload image"
						>
							<Image className="w-4 h-4" />
						</button>
						<button
							type="button"
							className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="Import from Figma"
						>
							<Figma className="w-4 h-4" />
						</button>
						<button
							type="button"
							className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
							title="Attach file"
						>
							<Paperclip className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
