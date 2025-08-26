'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Eye, ArrowRight, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ChangePreview {
	id: string
	type: 'component_update' | 'component_add' | 'layout_change' | 'style_update'
	title: string
	description: string
	beforePreview?: {
		title: string
		subtitle?: string
		image?: string
		content?: string
		styles?: Record<string, string>
	}
	afterPreview: {
		title: string
		subtitle?: string
		image?: string
		content?: string
		styles?: Record<string, string>
	}
	changes: Array<{
		field: string
		from: string
		to: string
	}>
	onApprove: () => void
	onReject: () => void
	onPreview?: () => void
}

interface ChangePreviewCardProps {
	preview: ChangePreview
	onClose: () => void
}

export function ChangePreviewCard({ preview, onClose }: ChangePreviewCardProps) {
	const [showDetails, setShowDetails] = useState(false)
	const [currentView, setCurrentView] = useState<'before' | 'after'>('after')

	const handleApprove = () => {
		preview.onApprove()
		onClose()
	}

	const handleReject = () => {
		preview.onReject()
		onClose()
	}

	const renderMiniComponent = (data: typeof preview.afterPreview, variant: 'before' | 'after') => {
		const isAfter = variant === 'after'
		const baseClasses = "rounded-lg border-2 transition-all duration-200 overflow-hidden"
		const borderColor = isAfter ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
		
		return (
			<div className={`${baseClasses} ${borderColor} relative`}>
				{/* Mini component preview */}
				<div className="p-4 space-y-2">
					{data.image && (
						<div 
							className="w-full h-16 bg-cover bg-center rounded"
							style={{ 
								backgroundImage: `url(${data.image})`,
								...data.styles
							}}
						/>
					)}
					{data.title && (
						<h3 
							className={`font-semibold text-sm ${
								isAfter ? 'text-green-900' : 'text-slate-800'
							}`}
							style={isAfter ? data.styles : undefined}
						>
							{data.title}
						</h3>
					)}
					{data.subtitle && (
						<p 
							className={`text-xs ${
								isAfter ? 'text-green-700' : 'text-slate-600'
							}`}
							style={isAfter ? data.styles : undefined}
						>
							{data.subtitle}
						</p>
					)}
					{data.content && (
						<p 
							className={`text-xs leading-relaxed ${
								isAfter ? 'text-green-600' : 'text-slate-500'
							}`}
							style={isAfter ? data.styles : undefined}
						>
							{data.content.substring(0, 80)}...
						</p>
					)}
				</div>
				
				{/* Variant label */}
				<div className="absolute top-2 right-2">
					<Badge variant={isAfter ? "default" : "secondary"} className="text-xs">
						{variant === 'before' ? 'Current' : 'Proposed'}
					</Badge>
				</div>
			</div>
		)
	}

	const getTypeIcon = () => {
		switch (preview.type) {
			case 'component_update':
				return <RefreshCw className="w-4 h-4" />
			case 'component_add':
				return <Sparkles className="w-4 h-4" />
			case 'layout_change':
				return <ArrowRight className="w-4 h-4" />
			case 'style_update':
				return <Eye className="w-4 h-4" />
			default:
				return <RefreshCw className="w-4 h-4" />
		}
	}

	const getTypeColor = () => {
		switch (preview.type) {
			case 'component_update':
				return 'text-blue-600 bg-blue-50'
			case 'component_add':
				return 'text-purple-600 bg-purple-50'
			case 'layout_change':
				return 'text-orange-600 bg-orange-50'
			case 'style_update':
				return 'text-green-600 bg-green-50'
			default:
				return 'text-gray-600 bg-gray-50'
		}
	}

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -20, scale: 0.95 }}
				className="bg-white rounded-xl border-2 border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto"
			>
				{/* Header */}
				<div className="p-4 bg-slate-50 border-b border-slate-200">
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-3">
							<div className={`p-2 rounded-lg ${getTypeColor()}`}>
								{getTypeIcon()}
							</div>
							<div>
								<h3 className="font-semibold text-slate-900">{preview.title}</h3>
								<p className="text-sm text-slate-600 mt-1">{preview.description}</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="p-1 h-6 w-6"
						>
							<X className="w-3 h-3" />
						</Button>
					</div>
				</div>

				{/* Preview Content */}
				<div className="p-6">
					{/* Before/After Toggle */}
					{preview.beforePreview && (
						<div className="flex items-center justify-center mb-6">
							<div className="flex bg-slate-100 rounded-lg p-1">
								<Button
									variant={currentView === 'before' ? "default" : "ghost"}
									size="sm"
									onClick={() => setCurrentView('before')}
									className="text-xs px-3 py-1 h-7"
								>
									Before
								</Button>
								<Button
									variant={currentView === 'after' ? "default" : "ghost"}
									size="sm"
									onClick={() => setCurrentView('after')}
									className="text-xs px-3 py-1 h-7"
								>
									After
								</Button>
							</div>
						</div>
					)}

					{/* Preview Area */}
					<div className="space-y-4">
						{preview.beforePreview ? (
							<AnimatePresence mode="wait">
								<motion.div
									key={currentView}
									initial={{ opacity: 0, x: currentView === 'after' ? 20 : -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: currentView === 'after' ? -20 : 20 }}
									transition={{ duration: 0.2 }}
								>
									{currentView === 'before' ? (
										renderMiniComponent(preview.beforePreview, 'before')
									) : (
										renderMiniComponent(preview.afterPreview, 'after')
									)}
								</motion.div>
							</AnimatePresence>
						) : (
							// Side-by-side comparison when no before state
							<div className="grid grid-cols-1 gap-4">
								{renderMiniComponent(preview.afterPreview, 'after')}
							</div>
						)}

						{/* Change Details */}
						{preview.changes.length > 0 && (
							<div className="mt-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowDetails(!showDetails)}
									className="text-xs text-slate-600 hover:text-slate-900"
								>
									{showDetails ? 'Hide' : 'Show'} change details ({preview.changes.length})
								</Button>
								
								<AnimatePresence>
									{showDetails && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className="mt-3 space-y-2"
										>
											{preview.changes.map((change, index) => (
												<div key={index} className="bg-slate-50 rounded-lg p-3 text-sm">
													<div className="flex items-center justify-between">
														<span className="font-medium text-slate-700">{change.field}</span>
														<ArrowRight className="w-3 h-3 text-slate-400" />
													</div>
													<div className="flex items-center gap-2 mt-1">
														<span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">
															{change.from}
														</span>
														<ArrowRight className="w-3 h-3 text-slate-400" />
														<span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
															{change.to}
														</span>
													</div>
												</div>
											))}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
					<div className="flex items-center gap-2">
						{preview.onPreview && (
							<Button
								variant="outline"
								size="sm"
								onClick={preview.onPreview}
								className="text-xs"
							>
								<Eye className="w-3 h-3 mr-1" />
								Live Preview
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleReject}
							className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
						>
							<X className="w-3 h-3 mr-1" />
							Reject
						</Button>
						<Button
							size="sm"
							onClick={handleApprove}
							className="text-xs bg-green-600 hover:bg-green-700 text-white"
						>
							<Check className="w-3 h-3 mr-1" />
							Apply Changes
						</Button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	)
}

interface ChangePreviewProviderProps {
	children: React.ReactNode
	previews: ChangePreview[]
	onDismissPreview: (id: string) => void
}

export function ChangePreviewProvider({ 
	children, 
	previews, 
	onDismissPreview 
}: ChangePreviewProviderProps) {
	return (
		<div className="relative">
			{children}
			
			{/* Preview Overlays */}
			<AnimatePresence>
				{previews.map((preview) => (
					<motion.div
						key={preview.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								onDismissPreview(preview.id)
							}
						}}
					>
						<ChangePreviewCard
							preview={preview}
							onClose={() => onDismissPreview(preview.id)}
						/>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	)
}