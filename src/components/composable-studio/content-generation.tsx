'use client'

import { generateId } from '@/lib/utils'
import { PageComponent } from '@/types'

// Content generation types
export interface ContentBrief {
	goal: string
	pageType: 'landing' | 'campaign' | 'product' | 'blog' | 'general'
	targetAudience?: string
	campaign?: string
	deadline?: Date
	keyMessages?: string[]
	callToAction?: string
	contentRequirements: ContentRequirement[]
}

export interface ContentRequirement {
	type: 'hero' | 'features' | 'testimonials' | 'cta' | 'countdown' | 'product-grid' | 'email-capture'
	description: string
	priority: 'high' | 'medium' | 'low'
	specifications?: Record<string, any>
}

export interface GeneratedContent {
	components: PageComponent[]
	contentEntry: ContentEntry
	suggestedContentType: ContentTypeMatch
	metadata: ContentMetadata
}

export interface ContentEntry {
	id: string
	title: string
	slug: string
	contentType: string
	fields: Record<string, any>
	status: 'draft' | 'ready' | 'published'
}

export interface ContentTypeMatch {
	name: string
	confidence: number
	explanation: string
	fields: ContentField[]
	isExisting: boolean
}

export interface ContentField {
	key: string
	label: string
	type: 'text' | 'richtext' | 'image' | 'date' | 'boolean' | 'reference' | 'array'
	value: any
	required: boolean
}

export interface ContentMetadata {
	generationMethod: 'ai-complete' | 'ai-assisted' | 'template-based'
	confidence: number
	suggestions: string[]
	seoData: {
		title: string
		description: string
		keywords: string[]
	}
}

// Mock CMS data for realistic content generation
const mockProducts = [
	{
		id: 'prod-1',
		name: 'Wireless Noise-Canceling Headphones',
		price: 299.99,
		image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop',
		description: 'Premium audio experience with industry-leading noise cancellation',
		category: 'Electronics'
	},
	{
		id: 'prod-2',
		name: 'Smart Fitness Watch',
		price: 249.99,
		image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400&h=300&fit=crop',
		description: 'Track your health and fitness with advanced sensors and GPS',
		category: 'Wearables'
	},
	{
		id: 'prod-3',
		name: 'Ergonomic Office Chair',
		price: 599.99,
		image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
		description: 'Comfortable support for all-day productivity',
		category: 'Furniture'
	},
	{
		id: 'prod-4',
		name: 'Portable Coffee Maker',
		price: 89.99,
		image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
		description: 'Perfect coffee anywhere with compact, travel-friendly design',
		category: 'Kitchen'
	}
]

const mockContentTypes = [
	{
		name: 'Campaign Landing Page',
		fields: ['headline', 'subheadline', 'hero_image', 'cta_text', 'countdown_date', 'featured_products'],
		description: 'Time-sensitive promotional pages with product showcases'
	},
	{
		name: 'Product Launch Page', 
		fields: ['product_name', 'launch_date', 'key_features', 'hero_video', 'testimonials', 'pricing'],
		description: 'Dedicated pages for new product announcements'
	},
	{
		name: 'Event Landing Page',
		fields: ['event_name', 'event_date', 'location', 'speakers', 'agenda', 'registration_form'],
		description: 'Event promotion and registration pages'
	}
]

export class ContentGenerationEngine {
	// Parse creative brief from natural language input
	static parseBrief(input: string): ContentBrief {
		const lowerInput = input.toLowerCase()
		
		// Determine page type
		let pageType: ContentBrief['pageType'] = 'general'
		if (lowerInput.includes('landing page') || lowerInput.includes('campaign')) {
			pageType = 'landing'
		} else if (lowerInput.includes('product')) {
			pageType = 'product'
		} else if (lowerInput.includes('blog')) {
			pageType = 'blog'
		}

		// Extract campaign information
		const campaigns = ['black friday', 'cyber monday', 'holiday', 'summer sale', 'spring sale']
		const campaign = campaigns.find(c => lowerInput.includes(c))

		// Extract content requirements
		const requirements: ContentRequirement[] = []
		
		// Parse specific component requests
		if (lowerInput.includes('hero') || lowerInput.includes('banner')) {
			requirements.push({
				type: 'hero',
				description: 'Main hero section with compelling headline',
				priority: 'high',
				specifications: {
					includesCountdown: lowerInput.includes('countdown') || lowerInput.includes('timer')
				}
			})
		}

		if (lowerInput.includes('countdown') || lowerInput.includes('timer')) {
			requirements.push({
				type: 'countdown',
				description: 'Countdown timer for urgency',
				priority: 'high',
				specifications: {
					targetDate: this.inferTargetDate(lowerInput, campaign)
				}
			})
		}

		if (lowerInput.includes('product') && (lowerInput.includes('showcase') || lowerInput.includes('featured') || /\d+\s*products?/.test(lowerInput))) {
			const match = lowerInput.match(/(\d+)\s*(?:featured\s*)?products?/)
			const count = match ? parseInt(match[1]) : 4
			
			requirements.push({
				type: 'product-grid',
				description: `Showcase of ${count} featured products`,
				priority: 'high',
				specifications: { productCount: count }
			})
		}

		if (lowerInput.includes('email') && (lowerInput.includes('capture') || lowerInput.includes('signup') || lowerInput.includes('early bird'))) {
			requirements.push({
				type: 'email-capture',
				description: 'Email capture form for lead generation',
				priority: 'medium',
				specifications: {
					isEarlyAccess: lowerInput.includes('early bird') || lowerInput.includes('early access')
				}
			})
		}

		return {
			goal: input,
			pageType,
			campaign,
			deadline: this.inferDeadline(lowerInput, campaign),
			contentRequirements: requirements
		}
	}

	// Generate complete page content from brief
	static generateContent(brief: ContentBrief): GeneratedContent {
		const components: PageComponent[] = []
		let yPosition = 0
		
		// Generate components based on requirements
		brief.contentRequirements.forEach(requirement => {
			const component = this.generateComponent(requirement, brief)
			if (component) {
				component.position = { x: 0, y: yPosition }
				components.push(component)
				yPosition += 100
			}
		})

		// Generate content entry
		const contentEntry = this.generateContentEntry(brief, components)
		
		// Match with content type
		const suggestedContentType = this.matchContentType(brief, contentEntry)
		
		// Generate metadata
		const metadata = this.generateMetadata(brief, components)

		return {
			components,
			contentEntry,
			suggestedContentType,
			metadata
		}
	}

	// Generate individual component based on requirement
	private static generateComponent(requirement: ContentRequirement, brief: ContentBrief): PageComponent | null {
		switch (requirement.type) {
			case 'hero':
				return this.generateHeroComponent(requirement, brief)
			case 'countdown':
				return this.generateCountdownComponent(requirement, brief)
			case 'product-grid':
				return this.generateProductGridComponent(requirement, brief)
			case 'email-capture':
				return this.generateEmailCaptureComponent(requirement, brief)
			case 'cta':
				return this.generateCTAComponent(requirement, brief)
			default:
				return null
		}
	}

	private static generateHeroComponent(requirement: ContentRequirement, brief: ContentBrief): PageComponent {
		const campaign = brief.campaign || 'special offer'
		const isCountdownHero = requirement.specifications?.includesCountdown
		
		// Generate campaign-specific content
		let heroData
		if (brief.campaign === 'black friday') {
			heroData = {
				title: isCountdownHero ? 'The Clock is Ticking...' : 'Black Friday Deals Are Here!',
				subtitle: 'Massive savings on everything you love',
				description: 'Don\'t miss out on our biggest sale of the year. Limited time offers on thousands of products.',
				image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
				buttonText: 'Shop Black Friday',
				buttonHref: '#deals',
				theme: 'dark'
			}
		} else if (brief.campaign === 'cyber monday') {
			heroData = {
				title: 'Cyber Monday: Digital Deals Unleashed',
				subtitle: 'Tech savings that can\'t be beaten',
				description: 'Exclusive online offers on the latest tech, gadgets, and digital products.',
				image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
				buttonText: 'Shop Cyber Deals',
				buttonHref: '#tech-deals'
			}
		} else {
			heroData = {
				title: `${campaign.charAt(0).toUpperCase() + campaign.slice(1)} Sale`,
				subtitle: 'Limited time offer',
				description: 'Don\'t miss out on these incredible savings. Shop now while supplies last.',
				image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
				buttonText: 'Shop Now',
				buttonHref: '#sale'
			}
		}

		return {
			id: generateId(),
			type: 'two-column-hero',
			data: heroData,
			position: { x: 0, y: 0 },
			visible: true
		}
	}

	private static generateCountdownComponent(requirement: ContentRequirement, brief: ContentBrief): PageComponent {
		const targetDate = requirement.specifications?.targetDate || this.getNextFriday()
		
		return {
			id: generateId(),
			type: 'section',
			data: {
				title: 'Sale Ends Soon!',
				content: `Don't miss out - offer expires ${targetDate.toLocaleDateString()}`,
				backgroundColor: '#1e293b',
				textColor: '#ffffff',
				countdownTimer: {
					targetDate: targetDate.toISOString(),
					urgencyMessage: 'Limited time remaining!'
				}
			},
			position: { x: 0, y: 0 },
			visible: true
		}
	}

	private static generateProductGridComponent(requirement: ContentRequirement, brief: ContentBrief): PageComponent {
		const count = requirement.specifications?.productCount || 4
		const featuredProducts = mockProducts.slice(0, count)
		
		// Apply sale pricing for campaigns
		const products = featuredProducts.map(product => ({
			...product,
			originalPrice: brief.campaign ? product.price : undefined,
			salePrice: brief.campaign ? Math.round(product.price * 0.8 * 100) / 100 : product.price,
			isOnSale: !!brief.campaign
		}))

		return {
			id: generateId(),
			type: 'grid',
			data: {
				title: 'Featured Products',
				subtitle: brief.campaign ? 'Special sale pricing' : 'Our top picks for you',
				products,
				layout: 'grid',
				columns: count > 2 ? 2 : 1
			},
			position: { x: 0, y: 0 },
			visible: true
		}
	}

	private static generateEmailCaptureComponent(requirement: ContentRequirement, brief: ContentBrief): PageComponent {
		const isEarlyAccess = requirement.specifications?.isEarlyAccess
		
		let formData
		if (isEarlyAccess) {
			formData = {
				title: 'Get Early Bird Access',
				description: 'Be the first to know about our exclusive deals. Sign up for VIP early access.',
				placeholder: 'Enter your email address',
				buttonText: 'Get Early Access',
				incentive: 'Plus get 10% off your first purchase!'
			}
		} else {
			formData = {
				title: 'Stay Updated',
				description: 'Join our newsletter for the latest deals and updates.',
				placeholder: 'Your email address',
				buttonText: 'Subscribe',
				incentive: 'Exclusive offers for subscribers'
			}
		}

		return {
			id: generateId(),
			type: 'section',
			data: {
				...formData,
				formType: 'email-capture',
				backgroundColor: '#f8fafc'
			},
			position: { x: 0, y: 0 },
			visible: true
		}
	}

	private static generateCTAComponent(requirement: ContentRequirement, brief: ContentBrief): PageComponent {
		const campaign = brief.campaign || 'offer'
		
		return {
			id: generateId(),
			type: 'cta',
			data: {
				title: `Don't Wait - ${campaign} Ends Soon!`,
				description: 'Take advantage of these incredible savings while they last.',
				text: 'Shop Now',
				href: '#shop',
				variant: 'default',
				urgency: true
			},
			position: { x: 0, y: 0 },
			visible: true
		}
	}

	private static generateContentEntry(brief: ContentBrief, components: PageComponent[]): ContentEntry {
		const campaign = brief.campaign || 'campaign'
		const year = new Date().getFullYear()
		const title = `${campaign.charAt(0).toUpperCase() + campaign.slice(1)} ${year}`
		
		return {
			id: generateId(),
			title,
			slug: title.toLowerCase().replace(/\s+/g, '-'),
			contentType: 'Campaign Landing Page',
			fields: {
				headline: this.extractHeadline(components),
				subheadline: this.extractSubheadline(components),
				campaign_name: campaign,
				target_date: brief.deadline?.toISOString(),
				featured_products: this.extractProducts(components),
				cta_text: this.extractCTA(components)
			},
			status: 'draft'
		}
	}

	private static matchContentType(brief: ContentBrief, entry: ContentEntry): ContentTypeMatch {
		// Find best matching content type
		const matches = mockContentTypes.map(ct => ({
			...ct,
			confidence: this.calculateContentTypeMatch(brief, ct)
		})).sort((a, b) => b.confidence - a.confidence)

		const bestMatch = matches[0]
		
		return {
			name: bestMatch.name,
			confidence: bestMatch.confidence,
			explanation: `Based on your ${brief.pageType} page with ${brief.contentRequirements.length} components, this content type is the best fit.`,
			fields: bestMatch.fields.map(field => ({
				key: field,
				label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
				type: this.inferFieldType(field),
				value: entry.fields[field] || null,
				required: ['headline', 'product_name', 'event_name'].includes(field)
			})),
			isExisting: true
		}
	}

	private static generateMetadata(brief: ContentBrief, components: PageComponent[]): ContentMetadata {
		const headline = this.extractHeadline(components)
		const description = this.extractDescription(components)
		
		return {
			generationMethod: 'ai-complete',
			confidence: 0.85,
			suggestions: [
				'Consider adding testimonials to build trust',
				'Add social proof elements for higher conversions',
				'Include urgency messaging for time-sensitive offers'
			],
			seoData: {
				title: `${headline} | Your Store`,
				description: description || 'Discover amazing deals and offers on our latest products.',
				keywords: this.generateKeywords(brief, components)
			}
		}
	}

	// Helper methods
	private static inferTargetDate(input: string, campaign?: string): Date {
		const now = new Date()
		
		if (campaign === 'black friday') {
			return this.getBlackFriday(now.getFullYear())
		} else if (campaign === 'cyber monday') {
			return this.getCyberMonday(now.getFullYear())
		}
		
		// Default to next Friday
		return this.getNextFriday()
	}

	private static inferDeadline(input: string, campaign?: string): Date | undefined {
		return this.inferTargetDate(input, campaign)
	}

	private static getBlackFriday(year: number): Date {
		const thanksgiving = new Date(year, 10, 1) // November 1st
		thanksgiving.setDate(1 + (4 - thanksgiving.getDay() + 7) % 7 + 21) // 4th Thursday
		const blackFriday = new Date(thanksgiving)
		blackFriday.setDate(blackFriday.getDate() + 1)
		return blackFriday
	}

	private static getCyberMonday(year: number): Date {
		const blackFriday = this.getBlackFriday(year)
		const cyberMonday = new Date(blackFriday)
		cyberMonday.setDate(cyberMonday.getDate() + 3)
		return cyberMonday
	}

	private static getNextFriday(): Date {
		const now = new Date()
		const daysUntilFriday = (5 - now.getDay() + 7) % 7
		const nextFriday = new Date(now)
		nextFriday.setDate(now.getDate() + daysUntilFriday)
		return nextFriday
	}

	private static calculateContentTypeMatch(brief: ContentBrief, contentType: any): number {
		let score = 0.5 // base score
		
		if (brief.pageType === 'landing' && contentType.name.includes('Landing')) score += 0.3
		if (brief.campaign && contentType.name.includes('Campaign')) score += 0.2
		
		return Math.min(score, 1.0)
	}

	private static inferFieldType(fieldName: string): ContentField['type'] {
		if (fieldName.includes('date')) return 'date'
		if (fieldName.includes('image') || fieldName.includes('video')) return 'image'
		if (fieldName.includes('description') || fieldName.includes('content')) return 'richtext'
		if (fieldName.includes('products') || fieldName.includes('speakers')) return 'reference'
		if (fieldName.includes('features') || fieldName.includes('agenda')) return 'array'
		return 'text'
	}

	private static extractHeadline(components: PageComponent[]): string {
		const hero = components.find(c => c.type === 'hero' || c.type === 'two-column-hero')
		return hero?.data?.title || 'Welcome to Our Sale'
	}

	private static extractSubheadline(components: PageComponent[]): string {
		const hero = components.find(c => c.type === 'hero' || c.type === 'two-column-hero')
		return hero?.data?.subtitle || 'Limited time offers'
	}

	private static extractDescription(components: PageComponent[]): string {
		const hero = components.find(c => c.type === 'hero' || c.type === 'two-column-hero')
		return hero?.data?.description || ''
	}

	private static extractProducts(components: PageComponent[]): string[] {
		const grid = components.find(c => c.type === 'grid')
		return grid?.data?.products?.map((p: any) => p.id) || []
	}

	private static extractCTA(components: PageComponent[]): string {
		const cta = components.find(c => c.type === 'cta')
		return cta?.data?.text || 'Shop Now'
	}

	private static generateKeywords(brief: ContentBrief, components: PageComponent[]): string[] {
		const keywords = []
		
		if (brief.campaign) keywords.push(brief.campaign, `${brief.campaign} sale`, `${brief.campaign} deals`)
		if (brief.pageType) keywords.push(brief.pageType)
		
		// Extract keywords from content
		const headline = this.extractHeadline(components)
		keywords.push(...headline.toLowerCase().split(' ').filter(w => w.length > 3))
		
		return Array.from(new Set(keywords)).slice(0, 10) // Remove duplicates, limit to 10
	}
}