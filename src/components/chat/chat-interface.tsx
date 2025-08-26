'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { ChatMessage, ConversationState, MessageAction } from '@/types'
import { generateId, delay } from '@/lib/utils'
import { ThinkingIndicator } from './thinking-indicator'
import { MessageBubble } from './message-bubble'

interface ChatInterfaceProps {
	onPageComponentAdd: (componentType: string, data: any) => void
	onShowThought: (thought: string) => void
}

export function ChatInterface({ onPageComponentAdd, onShowThought }: ChatInterfaceProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [currentInput, setCurrentInput] = useState('')
	const [isThinking, setIsThinking] = useState(false)
	const [conversationState, setConversationState] = useState<ConversationState>({
		step: 'initial',
		context: {},
		pendingActions: []
	})
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		// Add initial welcome message
		const welcomeMessage: ChatMessage = {
			id: generateId(),
			type: 'agent',
			content: "Hi! I'm your AI assistant for Composable Studio. I can help you create pages, content models, and entries through conversation. What would you like to build today?",
			timestamp: new Date()
		}
		setMessages([welcomeMessage])
	}, [])

	useEffect(() => {
		// Auto-scroll to bottom when new messages are added
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
			await delay(1500)
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

	const handleInitialPrompt = async (input: string) => {
		const lowerInput = input.toLowerCase()
		
		if (lowerInput.includes('landing page') || lowerInput.includes('aura') || lowerInput.includes('headphones')) {
			// Start the golden path scenario
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
				content: "I can help you with that! However, for this prototype, I'm specifically designed to help create a product launch landing page. Try asking me to 'Create a landing page for our new Aura smart headphones launch' to see the full experience."
			})
		}
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentInput.trim() || isThinking) return

		const userMessage = addMessage({
			type: 'user',
			content: currentInput.trim()
		})

		const input = currentInput.trim()
		setCurrentInput('')

		// Process input based on conversation state
		switch (conversationState.step) {
			case 'initial':
				await handleInitialPrompt(input)
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
			default:
				addMessage({
					type: 'agent',
					content: "I'm not sure how to help with that right now. Could you try rephrasing your request?"
				})
		}
	}

	return (
		<div className="flex flex-col h-full">
			<ScrollArea ref={scrollAreaRef} className="flex-1 px-3 py-2">
				<div className="space-y-3">
					<AnimatePresence>
						{messages.map((message) => (
							<MessageBubble 
								key={message.id} 
								message={message} 
								onDisambiguationSelect={(optionId) => {
									console.log('Selected disambiguation option:', optionId)
									// Handle disambiguation selection here
								}}
							/>
						))}
					</AnimatePresence>
					
					{isThinking && <ThinkingIndicator />}
				</div>
			</ScrollArea>

			<div className="p-3 border-t border-slate-200 bg-white">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						ref={inputRef}
						value={currentInput}
						onChange={(e) => setCurrentInput(e.target.value)}
						placeholder={
							conversationState.step === 'initial' 
								? "Create a landing page..."
								: conversationState.step === 'content-elicitation'
								? "Enter features as list..."
								: "Type your message..."
						}
						disabled={isThinking}
						className="flex-1 text-sm"
					/>
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
