'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bot, User, CheckCircle, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage, DisambiguationOption } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
	message: ChatMessage
	onDisambiguationSelect?: (optionId: string) => void
}

export function MessageBubble({ message, onDisambiguationSelect }: MessageBubbleProps) {
	const isAgent = message.type === 'agent'
	const isUser = message.type === 'user'

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
		if (confidence >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200'
		return 'text-yellow-600 bg-yellow-50 border-yellow-200'
	}

	const getConfidenceIcon = (confidence: number) => {
		if (confidence >= 0.8) return Star
		if (confidence >= 0.6) return CheckCircle
		return Zap
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.3 }}
			className={cn(
				'flex items-start gap-2',
				isUser && 'flex-row-reverse'
			)}
		>
			{/* Avatar */}
			<div className={cn(
				'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
				isAgent && 'bg-blue-600 text-white',
				isUser && 'bg-slate-300 text-slate-700'
			)}>
				{isAgent && <Bot className="w-3 h-3" />}
				{isUser && <User className="w-3 h-3" />}
			</div>

			{/* Message Content */}
			<div className={cn(
				'max-w-[85%] space-y-1',
				isUser && 'items-end'
			)}>
				{/* Message Bubble */}
				<div className={cn(
					'rounded-lg p-2 break-words',
					isAgent && 'bg-slate-100',
					isUser && 'bg-blue-600 text-white ml-auto'
				)}>
					<p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
				</div>

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

				{/* Disambiguation Options */}
				{message.disambiguationOptions && message.disambiguationOptions.length > 0 && (
					<div className="space-y-2 mt-2">
						<div className="text-xs font-medium text-slate-600 mb-3">Choose the option that matches your intent:</div>
						{message.disambiguationOptions.map((option, index) => {
							const ConfidenceIcon = getConfidenceIcon(option.confidence)
							
							return (
								<motion.div
									key={option.id}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.1 }}
									onClick={() => onDisambiguationSelect?.(option.id)}
									className={cn(
										'p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm',
										getConfidenceColor(option.confidence),
										'hover:scale-[1.02]'
									)}
								>
									<div className="flex items-start gap-3">
										{/* Confidence Indicator */}
										<div className="flex-shrink-0 mt-0.5">
											<ConfidenceIcon className="w-4 h-4" />
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-medium text-xs">{option.label}</h4>
												<div className="text-[10px] opacity-70 bg-white/50 px-1.5 py-0.5 rounded-full">
													{Math.round(option.confidence * 100)}% match
												</div>
											</div>
											
											<p className="text-xs opacity-80 mb-2 leading-relaxed">
												{option.description}
											</p>

											{/* Preview of changes */}
											<div className="bg-white/40 rounded p-2 text-[10px] opacity-75">
												<div className="font-medium mb-1">Preview changes:</div>
												<div className="space-y-0.5">
													{option.previewData.title && (
														<div>• Title: "{option.previewData.title}"</div>
													)}
													{option.previewData.backgroundColor && (
														<div>• Background: New gradient applied</div>
													)}
													{option.previewData.buttonText && (
														<div>• Button: "{option.previewData.buttonText}"</div>
													)}
													{option.previewData.features && (
														<div>• Features: {option.previewData.features.length} items added</div>
													)}
													{option.previewData.testimonials && (
														<div>• Testimonials: {option.previewData.testimonials.length} reviews added</div>
													)}
													{option.previewData.stats && (
														<div>• Stats: {option.previewData.stats.length} metrics added</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							)
						})}
					</div>
				)}

				{/* Timestamp */}
				<div className={cn(
					'text-xs text-slate-400',
					isUser && 'text-right'
				)}>
					{message.timestamp.toLocaleTimeString([], { 
						hour: '2-digit', 
						minute: '2-digit' 
					})}
				</div>
			</div>
		</motion.div>
	)
}
