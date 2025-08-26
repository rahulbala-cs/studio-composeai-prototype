'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, User, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateId, delay } from '@/lib/utils'

interface AICompositionModalProps {
	isOpen: boolean
	onClose: () => void
	onCompositionReady: (compositionData: any) => void
	initialPrompt?: string
}

interface ChatMessage {
	id: string
	type: 'user' | 'agent' | 'system'
	content: string
	timestamp: Date
	actions?: Array<{
		id: string
		label: string
		onClick: () => void
	}>
	status?: 'pending' | 'completed'
}

export function AICompositionModal({ 
	isOpen, 
	onClose, 
	onCompositionReady,
	initialPrompt = ''
}: AICompositionModalProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [currentInput, setCurrentInput] = useState('')
	const [isThinking, setIsThinking] = useState(false)
	const [conversationStep, setConversationStep] = useState<
		'initial' | 
		'processing' |
		'triage-question' | 
		'content-type-selection' | 
		'schema-confirmation' |
		'content-refinement' |
		'completing'
	>('initial')
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Inspiration Deck - examples that demonstrate the clear flow patterns
	const inspirationCards = [
		{ id: 1, icon: "📝", prompt: "Create a template for all our blog posts", type: "structured" }, // TEMPLATE: will auto-suggest Blog Posts CT
		{ id: 2, icon: "🎧", prompt: "Create a landing page for our new Aura smart headphones", type: "structured" }, // ONE-OFF: will find existing entry
		{ id: 3, icon: "🎨", prompt: "Start with a blank canvas", type: "blank" }, // FREEFORM: explicit freeform request
		{ id: 4, icon: "🏢", prompt: "Set up an about us page", type: "structured" }, // ONE-OFF: no matches, will recommend freeform
		{ id: 5, icon: "🛍️", prompt: "Make a product catalog page", type: "structured" }, // ONE-OFF: catalog page, will recommend freeform
		{ id: 6, icon: "👥", prompt: "Build a template for all my team members", type: "structured" }, // TEMPLATE: will auto-suggest Team Members CT
		{ id: 7, icon: "✨", prompt: "I need a custom layout without linking to anything", type: "structured" }, // FREEFORM: explicit freeform request
		{ id: 8, icon: "📞", prompt: "Make a contact page", type: "structured" } // ONE-OFF: will recommend freeform
	]

	const [currentCardIndex, setCurrentCardIndex] = useState(0)
	const [isHoveringCard, setIsHoveringCard] = useState(false)
	const [animationKey, setAnimationKey] = useState(0)

	// Mock existing content types data
	const mockExistingContentTypes = [
		{
			name: 'Products',
			uid: 'products',
			icon: '📦',
			existingEntries: ['iPhone 15', 'MacBook Pro', 'AirPods Max', 'iPad Pro', 'Aura Headphones'],
			fields: ['Product Name', 'Hero Image', 'Key Features', 'Price', 'CTA Button Text']
		},
		{
			name: 'Blog Posts',
			uid: 'blog_posts',
			icon: '📄',
			existingEntries: ['Getting Started Guide', 'Best Practices', 'New Features'],
			fields: ['Title', 'Author', 'Content', 'Featured Image', 'Published Date']
		},
		{
			name: 'Team Members',
			uid: 'team_members',
			icon: '👤',
			existingEntries: ['John Smith', 'Sarah Johnson', 'Michael Chen'],
			fields: ['Name', 'Position', 'Bio', 'Photo', 'Social Links']
		},
		{
			name: 'Events',
			uid: 'events',
			icon: '📅',
			existingEntries: ['Tech Conference 2024', 'Product Launch Event', 'Summer Workshop'],
			fields: ['Event Name', 'Date', 'Description', 'Location', 'Registration Link']
		},
		{
			name: 'Campaigns',
			uid: 'campaigns',
			icon: '📢',
			existingEntries: ['Summer Sale', 'Back to School', 'Holiday Promotion'],
			fields: ['Campaign Name', 'Start Date', 'End Date', 'Description', 'Target Audience']
		}
	]

	// Conversation state tracking
	const [userPrompt, setUserPrompt] = useState('')
	const [pageType, setPageType] = useState<'one-off' | 'template' | null>(null)
	const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
	const [proposedSchema, setProposedSchema] = useState<{
		name: string
		fields: Array<{ name: string; type: string }>
	} | null>(null)
	const [matchedContentType, setMatchedContentType] = useState<any>(null)
	const [extractedEntities, setExtractedEntities] = useState<any>(null)
	const [generatedFeatures, setGeneratedFeatures] = useState<string[]>([])
	const [finalProductName, setFinalProductName] = useState<string>('')

	useEffect(() => {
		if (isOpen) {
			if (initialPrompt) {
				// If we have an initial prompt, start processing immediately
				const userMessage: ChatMessage = {
					id: generateId(),
					type: 'user',
					content: initialPrompt,
					timestamp: new Date()
				}
				setMessages([userMessage])
				setConversationStep('processing') // Different step to avoid showing inspiration deck
				setCurrentInput('')
				// Process the initial prompt immediately
				setTimeout(() => {
					handleStructuredRequest(initialPrompt)
				}, 100)
			} else {
				// Initialize conversation with welcome message
				const welcomeMessage: ChatMessage = {
					id: generateId(),
					type: 'agent',
					content: "Describe what you want to create:",
					timestamp: new Date()
				}
				setMessages([welcomeMessage])
				setConversationStep('initial')
				setCurrentCardIndex(0)
				setAnimationKey(0)
			}
		} else {
			// Reset state when modal closes
			setMessages([])
			setCurrentInput('')
			setConversationStep('initial')
			setCurrentCardIndex(0)
			setIsHoveringCard(false)
			setUserPrompt('')
			setPageType(null)
			setSelectedContentType(null)
			setProposedSchema(null)
			setMatchedContentType(null)
			setExtractedEntities(null)
			setGeneratedFeatures([])
			setFinalProductName('')
		}
	}, [isOpen, initialPrompt])

	// Inspiration Deck cycling animation
	useEffect(() => {
		if (conversationStep === 'initial' && messages.length === 1 && !isHoveringCard && !isThinking) {
			const interval = setInterval(() => {
				setCurrentCardIndex(prev => (prev + 1) % inspirationCards.length)
				setAnimationKey(prev => prev + 1)
			}, 4500) // 4.5 seconds per card

			return () => clearInterval(interval)
		}
	}, [conversationStep, messages.length, isHoveringCard, isThinking, inspirationCards.length])

	useEffect(() => {
		// Auto-scroll to bottom
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight
			}
		}
	}, [messages])

	const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
		const newMessage: ChatMessage = {
			...message,
			id: generateId(),
			timestamp: new Date()
		}
		setMessages(prev => [...prev, newMessage])
		return newMessage
	}

	const showThinking = async (duration = 2000) => {
		setIsThinking(true)
		await delay(duration)
		setIsThinking(false)
	}

	const addStatusMessage = (content: string, status: 'pending' | 'completed' = 'completed') => {
		return addMessage({
			type: 'system',
			content,
			status
		})
	}

	// Enhanced intelligent content analysis with sophisticated matching
	const analyzeUserRequest = (prompt: string) => {
		const lowerPrompt = prompt.toLowerCase()
		
		// Keywords that suggest different content types
		const contentTypeKeywords = {
			products: ['product', 'headphones', 'phone', 'device', 'gadget', 'hardware', 'item', 'merchandise'],
			blog_posts: ['blog', 'post', 'article', 'news', 'content', 'story', 'guide'],
			team_members: ['team', 'member', 'employee', 'staff', 'person', 'people', 'author', 'contributor'],
			events: ['event', 'webinar', 'conference', 'workshop', 'meeting', 'session'],
			campaigns: ['campaign', 'marketing', 'promotion', 'launch', 'announcement']
		}
		
		// Entity extraction - look for specific product names, brands, etc.
		const extractedEntities = extractEntities(prompt)
		
		// Detect explicit user intentions
		const userIntent = detectUserIntent(prompt)
		
		// Sophisticated Content Type matching with confidence scoring
		const matches = []
		
		for (const contentType of mockExistingContentTypes) {
			const keywords = contentTypeKeywords[contentType.uid as keyof typeof contentTypeKeywords] || []
			const matchingKeywords = keywords.filter(keyword => lowerPrompt.includes(keyword))
			
			if (matchingKeywords.length > 0) {
				const confidence = matchingKeywords.length > 1 ? 'high' : 
				                 matchingKeywords.length === 1 ? 'medium' : 'low'
				
				matches.push({
					contentType,
					confidence,
					matchingKeywords,
					score: matchingKeywords.length
				})
			}
		}
		
		// Sort matches by score (number of matching keywords)
		matches.sort((a, b) => b.score - a.score)
		
		// Determine match type
		let matchType = 'none'
		let bestMatch = null
		
		if (matches.length === 0) {
			matchType = 'none'
		} else if (matches.length === 1 || (matches.length > 1 && matches[0].score > matches[1].score)) {
			matchType = 'single'
			bestMatch = matches[0]
		} else {
			matchType = 'multiple'
		}
		
		// Check for specific entry existence (e.g., "Aura headphones" in Products)
		let entryExists = false
		let existingEntry = null
		
		// Don't look for specific entries for catalog/listing pages
		const isCatalogPage = extractedEntities.productName && (
			extractedEntities.productName.toLowerCase().includes('catalog') ||
			extractedEntities.productName.toLowerCase().includes('directory') ||
			extractedEntities.productName.toLowerCase().includes('archive') ||
			extractedEntities.productName.toLowerCase().includes('listing')
		)
		
		if (bestMatch && extractedEntities.productName && !isCatalogPage) {
			const entries = bestMatch.contentType.existingEntries
			existingEntry = entries.find(entry => 
				extractedEntities.productName && (
					entry.toLowerCase().includes(extractedEntities.productName.toLowerCase()) ||
					extractedEntities.productName.toLowerCase().includes(entry.toLowerCase())
				)
			)
			entryExists = !!existingEntry
		}
		
		return {
			matchType,
			bestMatch,
			allMatches: matches,
			extractedEntities,
			userIntent,
			entryExists,
			existingEntry
		}
	}

	// Detect user intentions with improved semantic understanding
	const detectUserIntent = (prompt: string): 'template' | 'one-off' | 'freeform' => {
		const lowerPrompt = prompt.toLowerCase()
		
		// TEMPLATE INTENT: User wants reusable template for content type
		const templatePatterns = [
			'template for',
			'template for all',
			'for all my',
			'for all our', 
			'dynamic page for my',
			'reusable',
			'link to content type'
		]
		
		if (templatePatterns.some(pattern => lowerPrompt.includes(pattern))) {
			return 'template'
		}
		
		// FREEFORM INTENT: User explicitly wants blank canvas
		const freeformPatterns = [
			'blank canvas',
			'custom layout', 
			'freeform',
			'start with blank',
			'without linking',
			'maximum creative freedom'
		]
		
		if (freeformPatterns.some(pattern => lowerPrompt.includes(pattern))) {
			return 'freeform'
		}
		
		// ONE-OFF INTENT: User wants specific page (default for most descriptive requests)
		// Patterns like "landing page for X", "page for X", "about us", specific product names
		return 'one-off'
	}

	// Entity extraction function - extracts product names, brands, etc.
	const extractEntities = (prompt: string) => {
		const entities = {
			productName: null as string | null,
			brandName: null as string | null,
			pageType: null as string | null
		}
		
		const lowerPrompt = prompt.toLowerCase()
		
		// Extract quoted product names or capitalize words that might be product names
		const quotedMatches = prompt.match(/'([^']+)'/g) || prompt.match(/"([^"]+)"/g)
		if (quotedMatches) {
			entities.productName = quotedMatches[0].replace(/['"]/g, '')
		}
		
		// Handle specific common page names
		if (lowerPrompt.includes('about us') || lowerPrompt.includes('about-us')) {
			entities.productName = 'About Us'
		} else if (lowerPrompt.includes('contact us') || lowerPrompt.includes('contact')) {
			entities.productName = 'Contact'
		} else if (lowerPrompt.includes('privacy policy')) {
			entities.productName = 'Privacy Policy'
		} else if (lowerPrompt.includes('terms of service') || lowerPrompt.includes('terms')) {
			entities.productName = 'Terms of Service'
		}
		
		// Look for common page patterns if not already found
		if (!entities.productName) {
			// Handle catalog/listing pages
			if (lowerPrompt.includes('catalog') || lowerPrompt.includes('directory') || lowerPrompt.includes('listing')) {
				if (lowerPrompt.includes('product')) {
					entities.productName = 'Product Catalog'
				} else if (lowerPrompt.includes('team') || lowerPrompt.includes('member')) {
					entities.productName = 'Team Directory'
				} else if (lowerPrompt.includes('blog')) {
					entities.productName = 'Blog Archive'
				} else {
					entities.productName = 'Catalog Page'
				}
			}
			// Handle common page types
			else if (lowerPrompt.includes('homepage') || lowerPrompt.includes('home page')) {
				entities.productName = 'Homepage'
			} else if (lowerPrompt.includes('pricing')) {
				entities.productName = 'Pricing'
			} else if (lowerPrompt.includes('features')) {
				entities.productName = 'Features'
			}
			// Extract from "page for X" or "X page" patterns
			else {
				const pagePatterns = [
					/(?:set up|create|make|build)\s+(?:an?|the)?\s*(.+?)\s+page/gi, // "set up an about us page"
					/(?:set up|create|make|build)\s+(?:a|an|the)?\s*page\s+for\s+(.+?)(?:\s|$)/gi, // "create a page for X"
					/page\s+for\s+(.+?)(?:\s|$)/gi, // "page for X"
					/landing\s+page\s+for\s+(.+?)(?:\s|$)/gi, // "landing page for X"
					/(?:new|our)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "new Aura" or "our iPhone"
					/([A-Z][a-z]+)\s+(?:headphones|phone|device|product)/gi, // "Aura headphones"
					/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g // "for Aura Smart"
				]
				
				for (const pattern of pagePatterns) {
					const matches = Array.from(prompt.matchAll(pattern))
					if (matches.length > 0) {
						let extracted = matches[0][1].trim()
						// Clean up common words
						extracted = extracted.replace(/\b(an?|the)\b/gi, '').trim()
						if (extracted) {
							// Capitalize first letter of each word for display
							entities.productName = extracted.split(' ')
								.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
								.join(' ')
							break
						}
					}
				}
			}
		}
		
		// Extract page type
		if (lowerPrompt.includes('landing page')) {
			entities.pageType = 'landing page'
		} else if (lowerPrompt.includes('about page') || lowerPrompt.includes('about us')) {
			entities.pageType = 'about page'
		} else if (lowerPrompt.includes('contact page') || lowerPrompt.includes('contact')) {
			entities.pageType = 'contact page'
		}
		
		return entities
	}

	// Generate smart features based on extracted product name and context
	const generateSmartFeatures = (productName: string, prompt: string): string[] => {
		const lowerPrompt = prompt.toLowerCase()
		const lowerProductName = productName.toLowerCase()
		
		// Default features based on product type
		if (lowerProductName.includes('headphones') || lowerPrompt.includes('headphones')) {
			return [
				'Premium noise cancellation technology',
				'24-hour battery life with quick charge',
				'Crystal-clear audio with deep bass',
				'Comfortable over-ear design',
				'Wireless Bluetooth 5.0 connectivity'
			]
		} else if (lowerProductName.includes('phone') || lowerPrompt.includes('phone')) {
			return [
				'Advanced camera system',
				'All-day battery life',
				'Premium display technology',
				'Fast and secure performance',
				'5G connectivity'
			]
		} else if (lowerPrompt.includes('blog') || lowerPrompt.includes('article')) {
			return [
				'SEO-optimized content',
				'Engaging multimedia support',
				'Social sharing capabilities',
				'Comment and discussion system',
				'Mobile-responsive design'
			]
		} else {
			// Generic high-quality features
			return [
				'Premium quality materials',
				'User-friendly design',
				'Advanced technology integration',
				'Excellent performance',
				'Outstanding customer support'
			]
		}
	}

	// Show content refinement step (User-in-the-Loop)
	const showContentRefinementStep = async (contentType: any) => {
		const featuresList = generatedFeatures.map((feature, index) => `${index + 1}. ${feature}`).join('\n')
		
		addMessage({
			type: 'agent',
			content: `Here's what I've prepared for '${finalProductName}':

**Key Features:**
${featuresList}

I'll use these features to build your page. Would you like to use these, or would you prefer to customize them?`,
			actions: [
				{
					id: 'use-generated-features',
					label: '✅ Looks good, build it!',
					onClick: () => proceedWithGeneratedContent(contentType)
				},
				{
					id: 'customize-features',
					label: '✏️ Let me customize the features',
					onClick: () => showFeatureCustomization(contentType)
				}
			]
		})
		
		setConversationStep('content-refinement')
	}

	// Proceed with the generated content
	const proceedWithGeneratedContent = async (contentType: any) => {
		addMessage({
			type: 'user',
			content: '✅ Looks good, build it!'
		})

		await delay(600)
		
		// Proceed to build the page with generated content
		handleExistingContentTypeConfirmation(contentType.name)
	}

	// Show feature customization option
	const showFeatureCustomization = async (contentType: any) => {
		addMessage({
			type: 'user',
			content: '✏️ Let me customize the features'
		})

		await delay(600)
		
		addMessage({
			type: 'agent',
			content: `Great! Please provide your custom features for '${finalProductName}'. You can list them one per line or as bullet points.`,
		})
		
		// This would transition to allowing user input for custom features
		// For now, we'll provide a fallback that uses the generated features
		setTimeout(() => {
			addMessage({
				type: 'agent',
				content: "For this prototype, I'll continue with the generated features, but in the full version you'd be able to customize them here!",
				actions: [
					{
						id: 'continue-with-defaults',
						label: 'Continue with generated features',
						onClick: () => proceedWithGeneratedContent(contentType)
					}
				]
			})
		}, 2000)
	}

	// Path A: The Guided, Structured-First Approach (Enhanced with Intelligence)
	const handleStructuredRequest = async (userInput: string) => {
		setUserPrompt(userInput)
		
		// Phase 1: Intent & Analysis
		setIsThinking(true)
		await delay(1000)
		addStatusMessage("Analyzing your request...")
		
		await delay(800)
		addStatusMessage("Searching existing content structure...")
		
		// Perform intelligent analysis
		const analysis = analyzeUserRequest(userInput)
		setMatchedContentType(analysis.bestMatch?.contentType || null)
		setExtractedEntities(analysis.extractedEntities)
		
		// Create a smart product name based on extracted entities
		let productName = analysis.extractedEntities.productName
		
		// Better fallback logic if entity extraction failed
		if (!productName) {
			const lowerInput = userInput.toLowerCase()
			
			if (lowerInput.includes('aura')) {
				productName = 'Aura'
			} else if (lowerInput.includes('about us') || lowerInput.includes('about-us')) {
				productName = 'About Us'
			} else if (lowerInput.includes('contact')) {
				productName = 'Contact'
			} else if (lowerInput.includes('catalog')) {
				productName = 'Catalog Page'
			} else if (lowerInput.includes('homepage') || lowerInput.includes('home page')) {
				productName = 'Homepage'
			} else {
				// Last resort: try to extract any meaningful word
				const words = userInput.split(' ').filter(word => 
					word.length > 2 && 
					!['create', 'make', 'build', 'set', 'up', 'page', 'for', 'the', 'our', 'new', 'a', 'an'].includes(word.toLowerCase())
				)
				productName = words.length > 0 ? words.join(' ') : 'New Page'
			}
		}
		
		setFinalProductName(productName)
		
		await delay(1200)
		setIsThinking(false)

		await delay(600)

		// Route based on detected user intent
		switch (analysis.userIntent) {
			case 'template':
				await handleTemplateRequest(userInput, analysis, productName)
				break
			case 'freeform':
				await handleFreeformRequest(userInput, analysis, productName)
				break
			case 'one-off':
			default:
				await handleOneOffRequest(userInput, analysis, productName)
				break
		}
	}

	// TEMPLATE REQUEST: User wants reusable template for content type
	const handleTemplateRequest = async (userInput: string, analysis: any, productName: string) => {
		// Try to extract content type name from the template request
		const suggestedContentType = extractContentTypeFromTemplate(userInput)
		
		if (suggestedContentType) {
			// Smart suggestion - identified the Content Type
			addMessage({
				type: 'agent',
				content: `I understand you want to create a reusable template for your '${suggestedContentType.name}'. Should I link this template to your existing '${suggestedContentType.name}' Content Type?`
			})

			await delay(500)

			// Show smart suggestion with other options
			const otherContentTypes = mockExistingContentTypes.filter(ct => ct.uid !== suggestedContentType.uid)
			const otherButtons = otherContentTypes.map(ct => ({
				id: `select-other-ct-${ct.uid}`,
				label: `${ct.icon} ${ct.name}`,
				onClick: () => handleContentTypeSelectedForTemplate(ct)
			}))

			addMessage({
				type: 'agent',
				content: `Here are your options:`,
				actions: [
					{
						id: 'use-suggested-ct',
						label: `✅ Yes, use '${suggestedContentType.name}'`,
						onClick: () => handleContentTypeSelectedForTemplate(suggestedContentType)
					},
					...otherButtons,
					{
						id: 'show-all-cts-template',
						label: 'Show all...',
						onClick: () => showAllContentTypes()
					}
				]
			})
		} else {
			// No match found - show all options
			addMessage({
				type: 'agent',
				content: `I understand you want to create a reusable template. Which Content Type should this template be linked to?`
			})

			await delay(500)

			// Show Content Type selection for template creation
			showContentTypeSelectionForTemplate()
		}
	}

	// Extract Content Type name from template request
	const extractContentTypeFromTemplate = (prompt: string): any | null => {
		const lowerPrompt = prompt.toLowerCase()
		
		// Create mapping of keywords to Content Types
		const contentTypeMap: { [key: string]: any } = {}
		
		mockExistingContentTypes.forEach(ct => {
			const ctName = ct.name.toLowerCase()
			const ctSingular = ctName.replace(/s$/, '') // Remove plural 's'
			
			contentTypeMap[ctName] = ct
			contentTypeMap[ctSingular] = ct
			
			// Add specific mappings
			if (ct.uid === 'blog_posts') {
				contentTypeMap['blog'] = ct
				contentTypeMap['blogs'] = ct
				contentTypeMap['blog post'] = ct
				contentTypeMap['blog posts'] = ct
				contentTypeMap['articles'] = ct
				contentTypeMap['article'] = ct
			} else if (ct.uid === 'team_members') {
				contentTypeMap['team'] = ct
				contentTypeMap['members'] = ct
				contentTypeMap['team member'] = ct
				contentTypeMap['team members'] = ct
				contentTypeMap['people'] = ct
				contentTypeMap['staff'] = ct
			} else if (ct.uid === 'products') {
				contentTypeMap['product'] = ct
				contentTypeMap['products'] = ct
			} else if (ct.uid === 'events') {
				contentTypeMap['event'] = ct
				contentTypeMap['events'] = ct
			} else if (ct.uid === 'campaigns') {
				contentTypeMap['campaign'] = ct
				contentTypeMap['campaigns'] = ct
			}
		})
		
		// Look for content type mentions in the prompt
		for (const [keyword, contentType] of Object.entries(contentTypeMap)) {
			if (lowerPrompt.includes(keyword)) {
				return contentType
			}
		}
		
		return null
	}

	// FREEFORM REQUEST: User wants blank canvas
	const handleFreeformRequest = async (userInput: string, analysis: any, productName: string) => {
		// Use the passed productName which has all fallback logic applied
		
		addMessage({
			type: 'agent',
			content: `Perfect! I'll create a freeform page where you can design freely without any content coupling.`,
			actions: [
				{
					id: 'create-freeform-page',
					label: 'Create Freeform Page →',
					onClick: () => {
						onCompositionReady({
							name: `${productName}`,
							pageType: 'freeform',
							contentType: null,
							urlSlug: `/${productName.toLowerCase().replace(/\s+/g, '-')}`,
							autoGenerated: false,
							isDynamic: false,
							creationInput: userInput
						})
					}
				}
			]
		})
	}

	// ONE-OFF REQUEST: User wants specific page for specific item/topic
	const handleOneOffRequest = async (userInput: string, analysis: any, productName: string) => {
		// Use the passed productName which has all fallback logic applied
		
		// Handle different match scenarios for one-off pages
		switch (analysis.matchType) {
			case 'none':
				// No relevant Content Type found → offer freeform
				addMessage({
					type: 'agent',
					content: `Okay, a page for '${productName}'. I don't see any existing Content Types that match this. Would you like to create a freeform page where you can add content later?`,
					actions: [
						{
							id: 'create-freeform-oneoff',
							label: '✅ Yes, create freeform page',
							onClick: () => handleCreateFreeformPage(productName)
						},
						{
							id: 'link-existing-ct-oneoff',
							label: '🔗 Actually, link to existing Content Type',
							onClick: () => showContentTypeSelection(productName)
						}
					]
				})
				break
				
			case 'single':
				// Single Content Type match → check for specific entry
				const ct = analysis.bestMatch.contentType
				
				// Check if this is a catalog/listing page
				const isCatalogPage = productName && (
					productName.toLowerCase().includes('catalog') ||
					productName.toLowerCase().includes('directory') ||
					productName.toLowerCase().includes('archive') ||
					productName.toLowerCase().includes('listing')
				)
				
				if (isCatalogPage) {
					// For catalog pages, recommend freeform since they show multiple entries
					addMessage({
						type: 'agent',
						content: `I see you want to create a '${productName}' page. Since this is a listing page that would show multiple ${ct.name.toLowerCase()}, I recommend creating a freeform page where you can design the catalog layout.`,
						actions: [
							{
								id: 'create-catalog-freeform',
								label: '✅ Create freeform catalog page',
								onClick: () => handleCreateFreeformPage(productName)
							},
							{
								id: 'use-existing-entry-instead',
								label: '🔄 Actually, use specific entry',
								onClick: () => showExistingEntriesSelection(ct)
							}
						]
					})
				} else if (analysis.entryExists && analysis.existingEntry) {
					// Found specific entry
					addMessage({
						type: 'agent',
						content: `Great! I found '${analysis.existingEntry}' in your '${ct.name}' Content Type. Should I create a page specifically for this entry?`,
						actions: [
							{
								id: 'use-existing-entry-oneoff',
								label: `✅ Yes, use '${analysis.existingEntry}'`,
								onClick: () => handleUseExistingEntryOneOff(ct, analysis.existingEntry)
							},
							{
								id: 'create-freeform-instead',
								label: '🎨 Create freeform page instead',
								onClick: () => handleCreateFreeformPage(productName)
							}
						]
					})
				} else {
					// No specific entry found
					addMessage({
						type: 'agent',
						content: `I found your '${ct.name}' Content Type, but I don't see an entry for '${productName}'. Would you like to create a freeform page or use an existing entry?`,
						actions: [
							{
								id: 'create-freeform-oneoff',
								label: '✅ Create freeform page',
								onClick: () => handleCreateFreeformPage(productName)
							},
							{
								id: 'use-different-entry',
								label: '🔄 Use existing entry',
								onClick: () => showExistingEntriesSelection(ct)
							}
						]
					})
				}
				break
				
			case 'multiple':
				// Multiple possible matches → ask for clarification
				await handleMultipleMatchesFound(productName, analysis)
				break
				
			default:
				// Unclear intent → offer options
				addMessage({
					type: 'agent',
					content: `I'm not sure I understand '${userInput}'. Would you like to create a freeform page or link to an existing Content Type?`,
					actions: [
						{
							id: 'create-freeform-fallback',
							label: '🎨 Create freeform page',
							onClick: () => handleCreateFreeformPage(productName)
						},
						{
							id: 'link-existing-ct-fallback',
							label: '🔗 Link to existing Content Type',
							onClick: () => showContentTypeSelection(productName)
						}
					]
				})
				break
		}
	}



	// Multiple possible matches → ask for clarification
	const handleMultipleMatchesFound = async (productName: string, analysis: any) => {
		const topMatches = analysis.allMatches.slice(0, 3) // Show top 3 matches
		const matchOptions = topMatches.map((match: any) => ({
			id: `select-match-${match.contentType.uid}`,
			label: `${match.contentType.icon} ${match.contentType.name}`,
			onClick: () => handleContentTypeConfirmed(match.contentType, analysis, productName, false) // One-off page
		}))

		const ctNames = topMatches.map((m: any) => m.contentType.name).join(' or ')
		
		addMessage({
			type: 'agent',
			content: `Okay, a page for '${productName}'. This could be a ${ctNames}. Which is a better fit?`,
			actions: [
				...matchOptions,
				{
					id: 'none-of-these',
					label: '✨ None of these - create freeform page',
					onClick: () => handleCreateFreeformPage(productName)
				}
			]
		})
	}



	// Handle Content Type confirmation - routes to template or one-off setup
	const handleContentTypeConfirmed = async (contentType: any, analysis: any, productName: string, isTemplate: boolean = false) => {
		// Use the passed productName which has all fallback logic applied
		
		addMessage({
			type: 'user',
			content: `${contentType.icon} ${contentType.name}`
		})

		await delay(600)

		if (isTemplate) {
			// TEMPLATE PAGE: Use existing entry to preview template
			await handleTemplatePageSetup(contentType)
		} else {
			// ONE-OFF PAGE: Find specific entry or offer options
			await handleOneOffPageSetup(contentType, analysis, productName)
		}
	}

	// Handle template page setup (dynamic page for all entries)
	const handleTemplatePageSetup = async (contentType: any) => {
		const previewEntry = contentType.existingEntries[0] // Use first entry for preview
		
		addMessage({
			type: 'agent',
			content: `Perfect! I'll create a template that works with all your '${contentType.name}' entries. Let me use '${previewEntry}' to preview how the template will look.`,
			actions: [
				{
					id: 'create-template',
					label: 'Create Template →',
					onClick: () => {
						onCompositionReady({
							name: `${contentType.name} Template`,
							pageType: 'template',
							contentType: contentType.name,
							previewEntry: previewEntry,
							urlSlug: `/${contentType.name.toLowerCase().replace(' ', '-')}/*`,
							autoGenerated: false,
							isDynamic: true,
							creationInput: initialPrompt
						})
					}
				}
			]
		})
	}

	// Handle one-off page setup (specific entry or freeform)
	const handleOneOffPageSetup = async (contentType: any, analysis: any, productName: string) => {
		// Check if specific entry exists for one-off page
		if (analysis.entryExists && analysis.existingEntry) {
			addMessage({
				type: 'agent',
				content: `Great! I found an existing entry for '${analysis.existingEntry}' in your '${contentType.name}' Content Type. Should I create a page specifically for this entry?`,
				actions: [
					{
						id: 'use-existing-entry-oneoff',
						label: `✅ Yes, use '${analysis.existingEntry}'`,
						onClick: () => handleUseExistingEntryOneOff(contentType, analysis.existingEntry)
					},
					{
						id: 'create-freeform-instead',
						label: '🎨 Actually, create freeform page',
						onClick: () => handleCreateFreeformPage(productName)
					}
				]
			})
		} else {
			// Entry doesn't exist - offer freeform or different options
			addMessage({
				type: 'agent',
				content: `I don't see an entry for '${productName}' in your '${contentType.name}' Content Type. Would you like me to create a freeform page where you can add content later on the canvas?`,
				actions: [
					{
						id: 'create-freeform-page',
						label: '✅ Yes, create freeform page',
						onClick: () => handleCreateFreeformPage(productName)
					},
					{
						id: 'use-different-entry',
						label: '🔄 Use a different existing entry',
						onClick: () => showExistingEntriesSelection(contentType)
					},
					{
						id: 'use-different-ct',
						label: '📁 Use different Content Type',
						onClick: () => showContentTypeSelection(finalProductName || 'Custom Page')
					}
				]
			})
		}
	}

	// Show Content Type selection for template creation
	const showContentTypeSelectionForTemplate = () => {
		const ctButtons = mockExistingContentTypes.map(ct => ({
			id: `select-ct-template-${ct.uid}`,
			label: `${ct.icon} ${ct.name}`,
			onClick: () => handleContentTypeSelectedForTemplate(ct)
		}))

		addMessage({
			type: 'agent',
			content: `Here are your existing Content Types:`,
			actions: [
				...ctButtons,
				{
					id: 'show-all-cts-template',
					label: 'Show all...',
					onClick: () => showAllContentTypes()
				}
			]
		})
	}

	// Show Content Type selection for one-off pages (when no match found)
	const showContentTypeSelection = (productName: string) => {
		const ctButtons = mockExistingContentTypes.map(ct => ({
			id: `select-ct-oneoff-${ct.uid}`,
			label: `${ct.icon} ${ct.name}`,
			onClick: () => {
				// Create mock analysis for one-off page
				const mockAnalysis = {
					userIntent: 'one-off',
					entryExists: false,
					existingEntry: null,
					extractedEntities: { productName: finalProductName }
				}
				handleContentTypeConfirmed(ct, mockAnalysis, productName, false) // Pass isTemplate=false
			}
		}))

		addMessage({
			type: 'agent',
			content: `Here are your existing Content Types:`,
			actions: [
				...ctButtons,
				{
					id: 'show-all-cts-oneoff',
					label: 'Show all...',
					onClick: () => showAllContentTypes()
				}
			]
		})
	}

	// Handle Content Type selection for template creation
	const handleContentTypeSelectedForTemplate = async (contentType: any) => {
		// Create mock analysis for template
		const mockAnalysis = {
			userIntent: 'template',
			entryExists: false, // Templates don't need specific entries
			existingEntry: null,
			extractedEntities: { productName: finalProductName }
		}

		await handleContentTypeConfirmed(contentType, mockAnalysis, finalProductName || 'Template', true) // Pass isTemplate=true
	}







	// Handle template setup process
	const handleTemplateSetup = async (contentType: any) => {
		setConversationStep('completing')
		
		const structureSteps = [
			`New template composition created`,
			`Linked to '${contentType.name}' Content Type`,
			`Dynamic URL slug configured: /${contentType.name.toLowerCase().replace(' ', '-')}/*`,
			`Template ready for design`
		]

		for (let i = 0; i < structureSteps.length; i++) {
			await delay(800)
			addStatusMessage(structureSteps[i])
		}

		await delay(1000)

		addMessage({
			type: 'agent',
			content: `Excellent! Your template is ready. You can now design the layout, and it will automatically work with all entries in your '${contentType.name}' Content Type.`,
			actions: [
				{
					id: 'start-designing',
					label: 'Start Designing →',
					onClick: () => {
						onCompositionReady({
							name: `${contentType.name} Template`,
							pageType: 'template',
							contentType: contentType.name,
							urlSlug: `/${contentType.name.toLowerCase().replace(' ', '-')}/*`,
							autoGenerated: false,
							creationInput: initialPrompt
						})
					}
				}
			]
		})
	}



	// Show all Content Types (placeholder for prototype)
	const showAllContentTypes = () => {
		addMessage({
			type: 'agent',
			content: `Here are all your Content Types. In the full version, this would show a searchable list of all available Content Types in your space.`,
			actions: [
				{
					id: 'create-new-ct',
					label: '✨ Create new Content Type',
					onClick: () => handleCreateNewContentType()
				}
			]
		})
	}

	// Handle using existing entry for one-off page
	const handleUseExistingEntryOneOff = async (contentType: any, entryName: string) => {
		addMessage({
			type: 'user',
			content: `✅ Yes, use '${entryName}'`
		})

		await delay(600)

		addMessage({
			type: 'agent',
			content: `Perfect! I'll create a one-off page for '${entryName}' using the data from your '${contentType.name}' Content Type.`,
			actions: [
				{
					id: 'create-oneoff-page',
					label: 'Create page →',
					onClick: () => {
						onCompositionReady({
							name: `${entryName} Landing Page`,
							pageType: 'one-off',
							contentType: contentType.name,
							specificEntry: entryName,
							urlSlug: `/${entryName.toLowerCase().replace(/\s+/g, '-')}`,
							autoGenerated: true, // Will pre-populate with entry data
							isDynamic: false,
							creationInput: initialPrompt
						})
					}
				}
			]
		})
	}

	// Handle creating freeform page (no Content Type coupling)
	const handleCreateFreeformPage = async (productName: string) => {
		addMessage({
			type: 'user',
			content: '✅ Yes, create freeform page'
		})

		await delay(600)

		addMessage({
			type: 'agent',
			content: `Perfect! I'll create a freeform page for '${productName}' where you can add and structure content directly on the canvas. Data can be coupled to Content Types later if needed.`,
			actions: [
				{
					id: 'create-freeform',
					label: 'Create freeform page →',
					onClick: () => {
						onCompositionReady({
							name: `${productName} Page`,
							pageType: 'freeform',
							contentType: null,
							urlSlug: `/${productName.toLowerCase().replace(/\s+/g, '-')}`,
							autoGenerated: false,
							isDynamic: false,
							creationInput: initialPrompt
						})
					}
				}
			]
		})
	}

	// Show existing entries for selection (when user wants to use different entry)
	const showExistingEntriesSelection = (contentType: any) => {
		const entryButtons = contentType.existingEntries.map((entry: string) => ({
			id: `select-entry-${entry.replace(/\s+/g, '-')}`,
			label: `📄 ${entry}`,
			onClick: () => handleUseExistingEntryOneOff(contentType, entry)
		}))

		addMessage({
			type: 'agent',
			content: `Here are the existing entries in your '${contentType.name}' Content Type:`,
			actions: [
				...entryButtons,
				{
					id: 'back-to-freeform',
					label: '🎨 Create freeform page instead',
					onClick: () => handleCreateFreeformPage('Custom Page')
				}
			]
		})
	}

	// Handle creating new entry
	const handleCreateNewEntry = async (contentType: any, productName: string) => {
		addMessage({
			type: 'user',
			content: '✅ Yes, create new entry'
		})

		await delay(600)

		// Generate smart default content and show refinement option
		const smartFeatures = generateSmartFeatures(productName, userPrompt)
		setGeneratedFeatures(smartFeatures)
		
		addMessage({
			type: 'agent',
			content: `Excellent! I'll create a new entry for '${productName}' in your '${contentType.name}' Content Type. I've generated some smart default content based on your request.`
		})

		await delay(1000)
		
		// Show content refinement option
		showContentRefinementStep(contentType)
	}

	// Handle creating new Content Type
	const handleCreateNewContentType = async () => {
		addMessage({
			type: 'agent',
			content: `I don't see a Content Type that fits your needs. Would you like me to create a new one?`,
			actions: [
				{
					id: 'yes-create-new-ct',
					label: '✅ Yes, create new Content Type',
					onClick: () => showSchemaConfirmation()
				},
				{
					id: 'use-existing-anyway',
					label: '🔄 Actually, use existing Content Type',
					onClick: () => showContentTypeSelection(finalProductName || 'Custom Page')
				}
			]
		})
	}

	// Enhanced schema confirmation with clearer messaging
	const showSchemaConfirmation = () => {
		const productName = finalProductName || 'New Product'
		const suggestedCtName = userPrompt.includes('blog') ? 'Blog Posts' :
		                       userPrompt.includes('team') || userPrompt.includes('author') ? 'Team Members' :
		                       userPrompt.includes('event') ? 'Events' :
		                       userPrompt.includes('product') || userPrompt.includes('headphones') ? 'Products' :
		                       'Custom Content'

		const suggestedFields = userPrompt.includes('blog') ? ['Title', 'Author', 'Content', 'Featured Image', 'Published Date'] :
		                       userPrompt.includes('team') ? ['Name', 'Position', 'Bio', 'Photo', 'Social Links'] :
		                       userPrompt.includes('event') ? ['Event Name', 'Date', 'Description', 'Location', 'Registration Link'] :
		                       ['Product Name', 'Description', 'Images', 'Features', 'Price']

		setProposedSchema({
			name: suggestedCtName,
			fields: suggestedFields.map(field => ({ name: field, type: 'Text' }))
		})

		const fieldsDisplay = suggestedFields.map((field, index) => `${index + 1}. ${field} (Text)`).join('\n')

		addMessage({
			type: 'agent',
			content: `Based on your request, here's a suggested Content Type structure. Please review it before I proceed:

**Proposed New Content Type: "${suggestedCtName}"**

Here are the fields I'll create for it:
${fieldsDisplay}`,
			actions: [
				{
					id: 'confirm-schema',
					label: '✅ Confirm & Create Structure',
					onClick: () => handleSchemaConfirmation()
				},
				{
					id: 'edit-fields',
					label: '✏️ Edit Fields',
					onClick: () => handleEditFields()
				}
			]
		})

		setConversationStep('schema-confirmation')
	}

	// Handle field editing (simplified for prototype)
	const handleEditFields = () => {
		addMessage({
			type: 'user',
			content: '✏️ Edit Fields'
		})

		addMessage({
			type: 'agent',
			content: `For this prototype, I'll continue with the suggested fields, but in the full version you'd be able to customize them here!`,
			actions: [
				{
					id: 'continue-with-suggested',
					label: 'Continue with suggested fields',
					onClick: () => handleSchemaConfirmation()
				}
			]
		})
	}

	// Handle smart suggestion acceptance (PRIMARY SCENARIO) - Updated to use new flow
	const handleSmartSuggestionAccepted = async (contentType: any) => {
		setSelectedContentType(contentType.name)
		setPageType('template') // Using existing CT implies template creation
		
		// Re-analyze to get entry information
		const analysis = analyzeUserRequest(userPrompt)
		
		// Use the same flow as Content Type confirmation
		await handleContentTypeConfirmed(contentType, analysis, finalProductName || 'Custom Page')
	}

	// Handle smart suggestion rejection
	const handleSmartSuggestionRejected = async () => {
		addMessage({
			type: 'user',
			content: '✏️ No, I have something else in mind'
		})

		await delay(600)

		addMessage({
			type: 'agent',
			content: "No problem. Is this more of a one-of-a-kind page for a marketing campaign, or did you want to create a new reusable template for a different category?",
			actions: [
				{
					id: 'one-off-page-alt',
					label: 'One-of-a-kind Page',
					onClick: () => handlePageTypeSelection('one-off')
				},
				{
					id: 'new-template-alt',
					label: 'New Reusable Template',
					onClick: () => handlePageTypeSelection('template')
				}
			]
		})

		setConversationStep('triage-question')
	}

	// Handle page type selection (one-off vs template)
	const handlePageTypeSelection = async (type: 'one-off' | 'template') => {
		setPageType(type)
		
		addMessage({
			type: 'user',
			content: type === 'one-off' ? 'One-of-a-kind Page' : 'Reusable Template'
		})

		await delay(600)

		if (type === 'template') {
			// Branch A1: Reusable Template Path
			addMessage({
				type: 'agent',
				content: "Okay, a reusable template. Let's link it to a Content Type. I found a few that might be a good fit. Should we use one of these, or create a new one?",
				actions: [
					{
						id: 'content-type-product',
						label: '📦 Product',
						onClick: () => handleContentTypeSelection('Product')
					},
					{
						id: 'content-type-campaign',
						label: '📣 Marketing Campaign',
						onClick: () => handleContentTypeSelection('Marketing Campaign')
					},
					{
						id: 'content-type-new',
						label: '✨ Create a new Content Type',
						onClick: () => handleContentTypeSelection('new')
					}
				]
			})
			setConversationStep('content-type-selection')
		} else {
			// Branch A2: One-of-a-kind Page Path
			addMessage({
				type: 'agent',
				content: "Okay, a one-of-a-kind page. To keep your content organized, I'll still create a single entry to hold the page's content. Is that okay?",
				actions: [
					{
						id: 'confirm-one-off',
						label: 'Yes, that\'s fine',
						onClick: () => showSchemaConfirmation()
					}
				]
			})
		}
	}

	// Handle content type selection for templates
	const handleContentTypeSelection = async (contentType: string) => {
		setSelectedContentType(contentType)
		
		addMessage({
			type: 'user',
			content: contentType === 'new' ? '✨ Create a new Content Type' : `📦 ${contentType}`
		})

		await delay(600)

		if (contentType === 'new') {
			// Show schema confirmation for new content type
			await showSchemaConfirmation()
		} else {
			// Use existing content type
			addMessage({
				type: 'agent',
				content: `Perfect. I'll create a new entry for 'Aura smart headphones' within the '${contentType}' Content Type and link this page to it. Sound good?`,
				actions: [
					{
						id: 'proceed-existing-ct',
						label: 'Yes, proceed',
						onClick: () => handleExistingContentTypeConfirmation(contentType)
					}
				]
			})
		}
	}



	// Handle schema confirmation
	const handleSchemaConfirmation = async () => {
		// Safety check: ensure we have a proposed schema
		if (!proposedSchema) {
			console.warn('proposedSchema is null, creating fallback schema')
			const isOneOff = pageType === 'one-off'
			setProposedSchema({
				name: isOneOff ? "Page Content" : "Products",
				fields: [
					{ name: "Product Name", type: "Text" },
					{ name: "Hero Image", type: "File" },
					{ name: "Key Features", type: "Rich Text" },
					{ name: "Price", type: "Number" },
					{ name: "CTA Button Text", type: "Text" }
				]
			})
		}

		addMessage({
			type: 'user',
			content: '✅ Confirm & Create Structure'
		})

		await delay(600)

		addMessage({
			type: 'agent',
			content: "Perfect! Creating the structure now..."
		})

		await delay(800)

		// Show step-by-step creation with null checks and fallbacks
		const isOneOff = pageType === 'one-off'
		const schemaName = proposedSchema?.name || (isOneOff ? 'Page Content' : 'Products')
		const fieldCount = proposedSchema?.fields?.length || 5
		
		// Ensure we have a valid schema name
		const safeName = schemaName || (isOneOff ? 'Page Content' : 'Products')
		
		const structureSteps = isOneOff ? [
			`Content structure '${safeName}' created`,
			`New entry 'Aura smart headphones' created`,
			`Page linked to content entry`
		] : [
			`Content Type '${safeName}' created with ${fieldCount} fields`,
			`New entry 'Aura smart headphones' created within the '${safeName}' model`,
			`Template page linked to Content Type`
		]

		for (const step of structureSteps) {
			await delay(1000)
			addStatusMessage(`✅ ${step}`)
		}

		await delay(1000)

		// Generate smart default content automatically instead of asking
		const productName = userPrompt.includes('Aura') ? 'Aura smart headphones' : 'New product'
		const defaultFeatures = productName.includes('headphones') ? [
			'Premium noise cancellation',
			'24-hour battery life', 
			'Crystal-clear audio quality',
			'Comfortable over-ear design'
		] : [
			'High-quality materials',
			'User-friendly design',
			'Advanced technology',
			'Excellent performance'
		]
		
		addMessage({
			type: 'agent',
			content: `Great! The structure is ready. I'm now creating the '${productName}' entry with smart default content and building your page.`
		})

		await delay(1500)

		// Show content creation process
		const contentSteps = [
			`Content entry '${productName}' created`,
			`Hero section configured with product details`,
			`Features section populated with key benefits`,
			`Page composition finalized`
		]

		for (const step of contentSteps) {
			await delay(800)
			addStatusMessage(`✅ ${step}`)
		}

		await delay(1000)

		const finalMessage = isOneOff 
			? `Done! Your landing page is built and pre-populated with content. The page includes hero section and features list with smart suggestions that you can customize.`
			: `Excellent! Your template is built and ready. I've populated it with smart default content. All future entries in this Content Type will work with this layout.`

		addMessage({
			type: 'agent',
			content: finalMessage,
			actions: [
				{
					id: 'go-to-canvas-final',
					label: isOneOff ? 'See the page →' : 'Design template →',
					onClick: () => {
						const schemaName = proposedSchema?.name || 'Content'
						const schemaUid = schemaName.toLowerCase().replace(/\s+/g, '_')
						
						onCompositionReady({
							name: isOneOff ? `${productName} Landing Page` : `${schemaName} Template`,
							uid: isOneOff ? `${productName.toLowerCase().replace(/\s+/g, '_')}_page` : `${schemaUid}_template`,
							urlSlug: isOneOff ? `/${productName.toLowerCase().replace(/\s+/g, '-')}` : `/${schemaUid}/*`,
							type: isOneOff ? 'structured' : 'template',
							linkedContentType: selectedContentType || schemaName || 'Product',
							features: defaultFeatures,
							pageType: pageType,
							autoGenerated: true,
							creationInput: initialPrompt
						})
					}
				}
			]
		})

		setConversationStep('completing')
	}

	// Handle schema editing
	const handleSchemaEdit = async () => {
		addMessage({
			type: 'user',
			content: '✏️ Edit Fields'
		})

		await delay(600)

		addMessage({
			type: 'agent',
			content: "I'll open a simplified field editor for you to customize the structure. For now, let's continue with the suggested fields and you can refine them later on the canvas.",
			actions: [
				{
					id: 'proceed-with-suggested',
					label: 'Proceed with suggested fields',
					onClick: () => handleSchemaConfirmation()
				}
			]
		})
	}

	// Handle existing content type confirmation
	const handleExistingContentTypeConfirmation = async (contentType: string) => {
		addMessage({
			type: 'user',
			content: 'Yes, proceed'
		})

		await delay(600)

		addMessage({
			type: 'agent',
			content: "Excellent! Setting up everything now..."
		})

		await delay(800)

		// Use the extracted product name and generated features
		const productName = finalProductName || 'New product'
		const defaultFeatures = generatedFeatures.length > 0 ? generatedFeatures : [
			'Premium quality materials',
			'User-friendly design', 
			'Advanced technology',
			'Excellent performance'
		]

		const structureSteps = [
			`New entry '${productName}' created within '${contentType}' Content Type`,
			`Default content populated with smart suggestions`,
			`Template page linked to ${contentType} entries`,
			`Hero section configured with product details`,
			`Features section populated with key benefits`
		]

		for (const step of structureSteps) {
			await delay(1000)
			addStatusMessage(`✅ ${step}`)
		}

		await delay(1000)
		
		addMessage({
			type: 'agent',
			content: `Perfect! I've created the '${productName}' entry with smart default content and built your landing page. The page includes a hero section and features list with suggested content that you can customize later.`,
			actions: [
				{
					id: 'go-to-canvas-final',
					label: 'See the page →',
					onClick: () => {
						onCompositionReady({
							name: `${productName} Landing Page`,
							uid: `${productName.toLowerCase().replace(/\s+/g, '_')}_landing`,
							urlSlug: `/${productName.toLowerCase().replace(/\s+/g, '-')}`,
							type: 'template',
							linkedContentType: contentType,
							features: defaultFeatures,
							pageType: 'template',
							autoGenerated: true,
							creationInput: initialPrompt
						})
					}
				}
			]
		})

		setConversationStep('completing')
	}

	// Path B: Quick, Canvas-First Approach
	const handleBlankCanvasRequest = async () => {
		addMessage({
			type: 'agent',
			content: "You got it. Starting with a blank, custom layout. You can design freely, and if you decide to link it to a content structure later, you can do that from the canvas.",
			actions: [
				{
					id: 'blank-canvas-go',
					label: "Let's Go!",
					onClick: () => {
						onCompositionReady({
							name: 'Blank Page',
							uid: 'blank_page',
							urlSlug: '/blank',
							type: 'blank',
							linkedContentType: null
						})
					}
				}
			]
		})
	}



	// Removed: handleContentElicitation - now handled automatically in schema confirmation



	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentInput.trim() || isThinking) return

		const userMessage = addMessage({
			type: 'user',
			content: currentInput.trim()
		})

		const input = currentInput.trim().toLowerCase()
		const originalInput = currentInput.trim()
		setCurrentInput('')

		// Handle different conversation steps
		switch (conversationStep) {
			case 'initial':
				// Detect Path B: Blank Canvas requests
				if (input.includes('blank canvas') || input.includes('blank page') || input.includes('just give me a blank') || input.includes('start with a blank')) {
					await handleBlankCanvasRequest()
				} else if (originalInput.trim()) {
					// Path A: Structured request - any descriptive input
					await handleStructuredRequest(originalInput)
				} else {
					// Generic response
					await showThinking(1000)
					addMessage({
						type: 'agent',
						content: "I can help you with that! Could you be more specific? Try describing what kind of page you want to create, or just ask for a 'blank canvas'."
					})
				}
				break

			// Removed: content-elicitation case - now handled automatically

			default:
				// For other steps, provide generic response
				addMessage({
					type: 'agent',
					content: "I'm not sure how to help with that right now. Let's focus on the current step."
				})
				break
		}
	}

	// Handle inspiration card click - copy prompt to input
	const handleCardClick = (prompt: string) => {
		setCurrentInput(prompt)
		if (inputRef.current) {
			inputRef.current.focus()
			// Set cursor to end of input
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.setSelectionRange(prompt.length, prompt.length)
				}
			}, 0)
		}
	}

	// Get visible cards for the deck (current + next 2)
	const getVisibleCards = () => {
		const cards = []
		for (let i = 0; i < 3; i++) {
			const index = (currentCardIndex + i) % inspirationCards.length
			cards.push({
				...inspirationCards[index],
				stackIndex: i
			})
		}
		return cards
	}

	const renderMessage = (message: ChatMessage) => {
		if (message.type === 'system') {
			return (
				<motion.div
					key={message.id}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					className="flex items-center gap-2 text-sm py-1"
				>
					<Check className="w-4 h-4 text-green-600" />
					<span className="text-slate-700">{message.content}</span>
				</motion.div>
			)
		}

		const isAgent = message.type === 'agent'
		const isUser = message.type === 'user'

		return (
			<motion.div
				key={message.id}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
			>
				{/* Avatar */}
				<div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
					isAgent ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
				}`}>
					{isAgent && <Sparkles className="w-4 h-4" />}
					{isUser && <User className="w-4 h-4" />}
				</div>

				{/* Message Content */}
				<div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : ''}`}>
					{/* Message Bubble */}
					<div className={`rounded-lg p-3 ${
						isAgent ? 'bg-slate-100' : 'bg-blue-600 text-white'
					}`}>
						<p className="text-sm whitespace-pre-wrap leading-relaxed">
							{message.content}
						</p>
					</div>

					{/* Action Buttons */}
					{message.actions && message.actions.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{message.actions.map((action) => (
								<Button
									key={action.id}
									variant="outline"
									size="sm"
									onClick={action.onClick}
									className="text-xs"
								>
									{action.label}
								</Button>
							))}
						</div>
					)}

					{/* Timestamp */}
					<div className={`text-xs text-slate-400 ${isUser ? 'text-right' : ''}`}>
						{message.timestamp.toLocaleTimeString([], { 
							hour: '2-digit', 
							minute: '2-digit' 
						})}
					</div>
				</div>
			</motion.div>
		)
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 20 }}
				className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 h-[700px] flex flex-col"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-slate-200">
					<div className="flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-blue-600" />
																			<h2 className="text-lg font-semibold text-slate-800">
							New Composition
						</h2>
					</div>
					<Button variant="ghost" size="sm" onClick={onClose}>
						<X className="w-4 h-4" />
					</Button>
				</div>

				{/* Main Content Area */}
				{conversationStep === 'initial' && messages.length === 1 && !initialPrompt ? (
					/* Initial State: Action Zone + Inspiration Deck */
					<div className="flex-1 flex flex-col">
						{/* Action Zone */}
						<div className="p-6 border-b border-slate-100">
							<div className="space-y-4">
								{/* Welcome Message */}
								<div className="flex gap-3">
									<div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
										<Sparkles className="w-4 h-4" />
									</div>
									<div className="bg-slate-100 rounded-lg p-3 flex-1">
										<p className="text-sm text-slate-700">Describe what you want to create:</p>
									</div>
								</div>

								{/* Input Field */}
								<form onSubmit={handleSubmit} className="flex gap-2">
									<Input
										ref={inputRef}
										value={currentInput}
										onChange={(e) => setCurrentInput(e.target.value)}
										placeholder="E.g., 'Create a landing page for our new headphones' or 'blank canvas'"
										disabled={isThinking}
										className="flex-1 text-base"
									/>
									<Button 
										type="submit" 
										disabled={!currentInput.trim() || isThinking}
										size="default"
									>
										<Send className="w-4 h-4" />
									</Button>
								</form>
							</div>
						</div>

						{/* Inspiration Zone */}
						<div className="flex-1 p-6">
							<div className="space-y-4">
								<h3 className="text-sm font-medium text-slate-700">Here are some things you can do:</h3>
								
								{/* Inspiration Deck */}
								<div className="relative h-48 perspective-1000">
									{getVisibleCards().map((card, index) => (
										<motion.div
											key={`${card.id}-${animationKey}`}
											initial={{ 
												opacity: index === 0 ? 1 : 0.7,
												scale: 1 - (index * 0.05),
												y: index * 8,
												z: -index * 10
											}}
											animate={{ 
												opacity: index === 0 ? 1 : 0.7,
												scale: 1 - (index * 0.05),
												y: index * 8,
												z: -index * 10
											}}
											transition={{ 
												duration: 0.6,
												ease: "easeInOut"
											}}
											className={`absolute inset-0 cursor-pointer transform-gpu ${
												index === 0 ? 'z-30' : index === 1 ? 'z-20' : 'z-10'
											}`}
											onClick={() => index === 0 && handleCardClick(card.prompt)}
											onMouseEnter={() => index === 0 && setIsHoveringCard(true)}
											onMouseLeave={() => index === 0 && setIsHoveringCard(false)}
											whileHover={index === 0 ? { 
												scale: 1.02,
												y: -4,
												transition: { duration: 0.2 }
											} : {}}
										>
											<div className={`
												w-full h-24 bg-white border-2 rounded-lg p-4 shadow-lg
												${card.type === 'blank' 
													? (index === 0 ? 'border-purple-300 shadow-purple-100' : 'border-slate-200 shadow-slate-100')
													: (index === 0 ? 'border-blue-300 shadow-blue-100' : 'border-slate-200 shadow-slate-100')
												}
												${index === 0 && isHoveringCard ? 'shadow-xl' : ''}
											`}>
												<div className="flex items-center gap-3 h-full">
													<span className="text-2xl">{card.icon}</span>
													<p className="text-sm font-medium text-slate-700 flex-1 overflow-hidden"
														style={{
															display: '-webkit-box',
															WebkitLineClamp: 2,
															WebkitBoxOrient: 'vertical'
														}}
													>
														{card.prompt}
													</p>
												</div>
											</div>
										</motion.div>
									))}
								</div>

								<div className="text-xs text-slate-500 text-center">
									Click a card to copy its prompt, or write your own above
								</div>
							</div>
						</div>
					</div>
				) : (
					/* Conversation State: Chat Messages */
					<ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
						<div className="space-y-4">
							<AnimatePresence>
								{messages.map(renderMessage)}
							</AnimatePresence>
							
							{isThinking && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="flex gap-3"
								>
									<div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
										<Sparkles className="w-4 h-4" />
									</div>
									<div className="bg-slate-100 rounded-lg p-3 flex items-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin text-slate-600" />
										<span className="text-sm text-slate-600">Thinking...</span>
									</div>
								</motion.div>
							)}
						</div>
					</ScrollArea>
				)}

				{/* Input - Only show during conversation */}
				{!(conversationStep === 'initial' && messages.length === 1 && !initialPrompt) && conversationStep !== 'processing' && (
					<div className="p-4 border-t border-slate-200">
						<form onSubmit={handleSubmit} className="flex gap-2">
							<Input
								ref={inputRef}
								value={currentInput}
								onChange={(e) => setCurrentInput(e.target.value)}
																	placeholder="Describe what you want to create..."
								disabled={isThinking}
								className="flex-1"
							/>
							<Button 
								type="submit" 
								disabled={!currentInput.trim() || isThinking}
								size="default"
							>
								<Send className="w-4 h-4" />
							</Button>
						</form>

					</div>
				)}
			</motion.div>
		</div>
	)
}
