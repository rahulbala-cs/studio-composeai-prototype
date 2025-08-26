'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Sparkles, Layout, FileText, Lightbulb, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, ConversationState } from '@/types'
import { generateId, delay } from '@/lib/utils'
import { useComponentContext, useSelectedComponent } from './component-context'
import { MessageBubble } from '@/components/chat/message-bubble'
import { ThinkingIndicator } from '@/components/chat/thinking-indicator'

interface SimplifiedComposePanelProps {
	onPageComponentAdd: (componentType: string, data: any) => void
	onShowThought: (thought: string) => void
	currentComposition?: any
	hasComponents?: boolean
}

// Simplified quick actions - focus on the most common use cases
const quickActions = [
	{ id: 'landing-page', label: 'Landing Page', icon: Layout, description: 'Product or service page' },
	{ id: 'blog-post', label: 'Blog Post', icon: FileText, description: 'Article or content' },
	{ id: 'get-suggestions', label: 'Get Ideas', icon: Lightbulb, description: 'I need inspiration' }
]

// Smart examples that are contextual and helpful
const getContextualExamples = (hasComponents: boolean, selectedComponent: any) => {
	if (selectedComponent) {
		const componentType = selectedComponent.type
		const examples: Record<string, string[]> = {
			'hero': [
				"Change the background to a gradient",
				"Make the button text 'Get Started'",
				"Add a subtitle below the headline"
			],
			'features': [
				"Add icons to each feature",
				"Add a pricing feature",
				"Make this into a comparison table"
			],
			'cta': [
				"Change button to 'Start Free Trial'",
				"Make this button larger",
				"Add urgency text above the button"
			]
		}
		return examples[componentType] || [
			"Change the color scheme",
			"Add more content",
			"Improve the layout"
		]
	}
	
	if (hasComponents) {
		return [
			"Add a testimonials section",
			"Change the overall color scheme",
			"Add a pricing section"
		]
	}
	
	return [
		"Create a landing page for a SaaS product",
		"Build a portfolio page for a designer",
		"Make a product announcement page"
	]
}

export function SimplifiedComposePanel({ 
	onPageComponentAdd, 
	onShowThought, 
	currentComposition, 
	hasComponents 
}: SimplifiedComposePanelProps) {
	const { context } = useComponentContext()
	const { selectedComponent, isComponentSelected } = useSelectedComponent()
	
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [currentInput, setCurrentInput] = useState('')
	const [isThinking, setIsThinking] = useState(false)
	const [showWelcome, setShowWelcome] = useState(true)
	const [conversationState, setConversationState] = useState<ConversationState>({
		step: 'initial',
		context: {},
		pendingActions: []
	})
	
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const [hasAttachments, setHasAttachments] = useState(false)
	
	// Get contextual examples based on current state
	const contextualExamples = getContextualExamples(hasComponents || false, selectedComponent)
	
	// Smart placeholder text
	const getSmartPlaceholder = () => {
		if (isComponentSelected && selectedComponent) {
			const componentName = selectedComponent.type.replace('-', ' ')
			return `Editing ${componentName}. Try "Change the background" or "Add more content"`
		}
		
		if (hasComponents) {
			return "Select a component to edit it, or ask me to add something new..."
		}
		
		return "What would you like to build today?"
	}

	// Initialize with welcome message
	useEffect(() => {
		if (currentComposition && hasComponents && showWelcome) {
			const welcomeMessage: ChatMessage = {
				id: generateId(),
				type: 'agent',
				content: `Here's your ${currentComposition.name || 'page'}! How does it look? I can help you refine it further.`,
				timestamp: new Date(),
				actions: [
					{
						id: 'add-testimonials',
						label: 'Add testimonials',
						type: 'button',
						onClick: () => handleQuickAction('add-testimonials')
					},
					{
						id: 'change-colors',
						label: 'Change colors',
						type: 'button',
						onClick: () => handleQuickAction('change-colors')
					}
				]
			}
			setMessages([welcomeMessage])
			setShowWelcome(false)
		} else if (!hasComponents && showWelcome) {
			const welcomeMessage: ChatMessage = {
				id: generateId(),
				type: 'agent',
				content: "Hi! I'm your AI design assistant. I can help you create pages, add content, and refine your design. What would you like to build?",
				timestamp: new Date()
			}
			setMessages([welcomeMessage])
			setShowWelcome(false)
		}
	}, [currentComposition, hasComponents, showWelcome])

	// Auto-scroll to bottom
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight
			}
		}
	}, [messages])

	const simulateThinking = async (thoughts: string[]) => {
		setIsThinking(true)
		for (const thought of thoughts) {
			onShowThought(thought)
			await delay(1200)
		}
		setIsThinking(false)
	}

	const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
		const newMessage: ChatMessage = {
			...message,
			id: generateId(),
			timestamp: new Date()
		}
		setMessages(prev => [...prev, newMessage])
		return newMessage
	}

	const handleQuickAction = async (actionType: string) => {
		switch (actionType) {
			case 'landing-page':
				setCurrentInput('Create a landing page')
				break
			case 'blog-post':
				setCurrentInput('Create a blog post')
				break
			case 'get-suggestions':
				addMessage({
					type: 'agent',
					content: "Here are some ideas based on what you're working on:",
					actions: contextualExamples.map((example, index) => ({
						id: `suggestion-${index}`,
						label: example,
						type: 'button',
						onClick: () => setCurrentInput(example)
					}))
				})
				break
			case 'add-testimonials':
				await handleUserInput('Add a testimonials section')
				break
			case 'change-colors':
				await handleUserInput('Change the color scheme to something more modern')
				break
		}
	}

	const handleDisambiguation = (userInput: string) => {
		// Simple disambiguation logic - just provide 2-3 focused options
		const disambiguationOptions = [
			{
				id: 'content-improve',
				label: 'Improve Content & Copy',
				description: 'Enhanced headlines and more compelling descriptions',
				confidence: 0.85,
				previewData: {
					title: "Transform Your Experience Today",
					buttonText: "Start Your Transformation"
				}
			},
			{
				id: 'visual-design',
				label: 'Improve Visual Design',
				description: 'Better colors, spacing, and visual hierarchy',
				confidence: 0.75,
				previewData: {
					backgroundColor: "gradient"
				}
			}
		]

		addMessage({
			type: 'agent',
			content: `Your request "${userInput}" could mean several things. Which option matches your intent?`,
			disambiguationOptions
		})
	}

	const handleUserInput = async (input: string) => {
		addMessage({
			type: 'user',
			content: input
		})

		// Simple logic to determine if disambiguation is needed
		const ambiguousKeywords = ['better', 'improve', 'make it', 'enhance', 'fix']
		const needsDisambiguation = ambiguousKeywords.some(keyword => 
			input.toLowerCase().includes(keyword)
		) && !isComponentSelected

		if (needsDisambiguation) {
			await delay(500)
			handleDisambiguation(input)
			return
		}

		// Process the input directly
		await simulateThinking(['Analyzing your request...', 'Preparing changes...'])
		
		if (input.toLowerCase().includes('landing page')) {
			addMessage({
				type: 'agent',
				content: "Great! I'll create a landing page for you. What's the product or service this is for?"
			})
		} else if (input.toLowerCase().includes('testimonials')) {
			onPageComponentAdd('testimonials', {
				title: 'What Our Customers Say',
				testimonials: [
					{ name: 'Sarah Johnson', text: 'Amazing product! Highly recommended.', role: 'Product Manager' },
					{ name: 'Mike Chen', text: 'Best purchase I made this year.', role: 'Designer' }
				]
			})
			addMessage({
				type: 'agent',
				content: "Perfect! I've added a testimonials section. You can edit the testimonials directly or ask me to modify them."
			})
		} else {
			addMessage({
				type: 'agent',
				content: "I understand! Let me help you with that. Could you be a bit more specific about what you'd like me to do?"
			})
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentInput.trim() || isThinking) return

		const input = currentInput.trim()
		setCurrentInput('')
		await handleUserInput(input)
	}

	const handleDisambiguationSelect = async (optionId: string) => {
		console.log('Selected option:', optionId)
		
		await simulateThinking(['Applying changes...'])
		
		addMessage({
			type: 'agent',
			content: "Perfect! I've applied those changes. How does it look now?"
		})
	}

	return (
		<div className="flex flex-col h-full bg-white">
			{/* Header with context indicator */}
			{isComponentSelected && selectedComponent && (
				<div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
						<span className="text-xs font-medium text-blue-700">
							Editing {selectedComponent.type.replace('-', ' ')}
						</span>
					</div>
				</div>
			)}

			{/* Chat Messages */}
			<ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-3">
				<div className="space-y-4">
					<AnimatePresence>
						{messages.map((message) => (
							<MessageBubble 
								key={message.id} 
								message={message} 
								onDisambiguationSelect={handleDisambiguationSelect}
							/>
						))}
					</AnimatePresence>
					
					{isThinking && <ThinkingIndicator />}
				</div>
			</ScrollArea>

			{/* Quick Actions - only show when no components and not thinking */}
			{!hasComponents && !isThinking && messages.length <= 1 && (
				<div className="px-4 py-3 border-t border-slate-100">
					<div className="text-xs text-slate-500 mb-2">Quick start:</div>
					<div className="flex gap-2">
						{quickActions.map((action) => {
							const Icon = action.icon
							return (
								<Button
									key={action.id}
									variant="outline"
									size="sm"
									onClick={() => handleQuickAction(action.id)}
									className="text-xs h-8 px-3 flex items-center gap-1.5"
								>
									<Icon className="w-3 h-3" />
									{action.label}
								</Button>
							)
						})}
					</div>
				</div>
			)}

			{/* Example suggestions - contextual */}
			{messages.length <= 1 && !isThinking && (
				<div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
					<div className="text-xs text-slate-500 mb-2">Try asking:</div>
					<div className="flex flex-wrap gap-1">
						{contextualExamples.slice(0, 2).map((example, index) => (
							<button
								key={index}
								onClick={() => setCurrentInput(example)}
								className="text-xs text-slate-600 bg-white border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 transition-colors"
							>
								"{example}"
							</button>
						))}
					</div>
				</div>
			)}

			{/* Input */}
			<div className="p-4 border-t border-slate-200">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<div className="flex-1 relative">
						<Input
							ref={inputRef}
							value={currentInput}
							onChange={(e) => setCurrentInput(e.target.value)}
							placeholder={getSmartPlaceholder()}
							disabled={isThinking}
							className="text-sm pr-8"
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 p-0 text-slate-400 hover:text-slate-600"
							onClick={() => setHasAttachments(!hasAttachments)}
						>
							<Paperclip className="w-3 h-3" />
						</Button>
					</div>
					<Button 
						type="submit" 
						disabled={!currentInput.trim() || isThinking}
						size="sm"
						className="px-3"
					>
						<Send className="w-3 h-3" />
					</Button>
				</form>
			</div>
		</div>
	)
}
