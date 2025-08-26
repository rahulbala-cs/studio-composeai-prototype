import { ImageAnalysisResult } from '@/utils/visual-analysis'

export interface ChatMessage {
	id: string
	type: 'user' | 'agent' | 'system'
	content: string
	timestamp: Date
	isThinking?: boolean
	actions?: MessageAction[]
	attachments?: MessageAttachment[]
	visualAnalysis?: ImageAnalysisResult[]
	disambiguationOptions?: DisambiguationOption[]
}

export interface MessageAction {
	id: string
	label: string
	type: 'button' | 'input'
	value?: string
	onClick?: () => void
}

export interface MessageAttachment {
	id: string
	type: 'image' | 'document' | 'audio' | 'video' | 'code' | 'archive' | 'other'
	name: string
	size: string
	url?: string
	preview?: string
	analysisResult?: ImageAnalysisResult
}

export interface PageComponent {
	id: string
	type: 'hero' | 'features' | 'cta' | 'text' | 'image' | 'two-column-hero' | 'section' | 'grid' | 'testimonials' | 'stats' | 'faq'
	data: Record<string, any>
	position: { x: number; y: number }
	visible: boolean
}

export interface ContentModel {
	id: string
	name: string
	fields: ContentField[]
	createdAt: Date
}

export interface ContentField {
	id: string
	name: string
	type: 'text' | 'image' | 'textarea' | 'select' | 'boolean'
	required: boolean
	options?: string[]
}

export interface ContentEntry {
	id: string
	modelId: string
	data: Record<string, any>
	createdAt: Date
	updatedAt: Date
}

export interface ConversationState {
	step: 'initial' | 'content-model-question' | 'content-elicitation' | 'page-building' | 'complete' | 'assistant-welcome' | 'hero-scaffolding' | 'data-population' | 'copy-refinement' | 'design-partner' | 'editing-hero-image' | 'content-generated' | 'content-persisted' | 'content-static'
	context: Record<string, any>
	pendingActions: string[]
}

export interface AgentThought {
	id: string
	content: string
	duration: number
	completed: boolean
}

export interface ConversationHistory {
	id: string
	compositionId: string
	timestamp: Date
	action: 'component_added' | 'component_updated' | 'content_populated' | 'conversation_started' | 'user_message' | 'ai_response' | 'file_attached' | 'voice_input'
	description: string
	details?: {
		componentType?: string
		componentId?: string
		previousValue?: string
		newValue?: string
		userInput?: string
		aiResponse?: string
		fileType?: string
		fileSize?: string
		inputType?: string
		duration?: number
	}
}

export interface ComposeState {
	activeView: 'chat' | 'history'
	conversationHistory: ConversationHistory[]
	currentMessages: ChatMessage[]
}

export interface DisambiguationOption {
	id: string
	label: string
	description: string
	confidence: number
	previewData: {
		title?: string
		description?: string
		buttonText?: string
		backgroundColor?: string
		features?: string[]
		testimonials?: any[]
		stats?: any[]
		styles?: Record<string, any>
	}
}
