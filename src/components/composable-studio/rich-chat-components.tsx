'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
	CheckCircle2, 
	FileText, 
	Database, 
	Sparkles, 
	ArrowRight, 
	ExternalLink,
	TrendingUp,
	Calendar,
	Tag,
	Users,
	Eye,
	Link,
	AlertCircle,
	Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// Rich Interactive Card Types
export interface ContentTypeOption {
	id: string
	name: string
	description: string
	confidence: number
	isRecommended: boolean
	fieldCount: number
	icon: React.ReactNode
	benefits: string[]
	onSelect: () => void
}

export interface CMSEntry {
	id: string
	title: string
	contentType: string
	status: 'draft' | 'ready' | 'published'
	lastModified: Date
	fields: {
		key: string
		value: string
		type: string
	}[]
}

export interface ProcessingStep {
	id: string
	label: string
	status: 'pending' | 'in-progress' | 'completed'
	duration?: number
}

// Rich Content Type Selection Card
interface ContentTypeSelectionProps {
	options: ContentTypeOption[]
	title: string
	subtitle?: string
}

export function ContentTypeSelectionCard({ options, title, subtitle }: ContentTypeSelectionProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 max-w-md"
		>
			{/* Header */}
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-1">
					<Database className="w-4 h-4 text-blue-600" />
					<span className="text-sm font-medium text-slate-900">{title}</span>
				</div>
				{subtitle && (
					<p className="text-xs text-slate-600">{subtitle}</p>
				)}
			</div>

			{/* Options */}
			<div className="space-y-3">
				{options.map((option, index) => (
					<motion.div
						key={option.id}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.1 }}
						className={`relative border rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
							option.isRecommended 
								? 'border-green-200 bg-green-50' 
								: 'border-slate-200'
						}`}
						onClick={option.onSelect}
					>
						{/* Recommended Badge */}
						{option.isRecommended && (
							<div className="absolute -top-2 -right-2">
								<div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3" />
									Recommended
								</div>
							</div>
						)}

						{/* Option Content */}
						<div className="flex items-start gap-3">
							<div className={`p-2 rounded-lg ${
								option.isRecommended ? 'bg-green-100' : 'bg-blue-50'
							}`}>
								{option.icon}
							</div>
							
							<div className="flex-1">
								<div className="flex items-center justify-between mb-1">
									<h4 className="text-sm font-medium text-slate-900">
										{option.name}
									</h4>
									{option.confidence > 0 && (
										<div className="flex items-center gap-1">
											<TrendingUp className="w-3 h-3 text-green-600" />
											<span className="text-xs text-green-600 font-medium">
												{Math.round(option.confidence * 100)}% match
											</span>
										</div>
									)}
								</div>
								
								<p className="text-xs text-slate-600 mb-2">
									{option.description}
								</p>

								{/* Field Count */}
								<div className="flex items-center gap-1 mb-2">
									<FileText className="w-3 h-3 text-slate-400" />
									<span className="text-xs text-slate-500">
										{option.fieldCount} fields configured
									</span>
								</div>

								{/* Benefits */}
								{option.benefits.length > 0 && (
									<div className="space-y-1">
										{option.benefits.slice(0, 2).map((benefit, i) => (
											<div key={i} className="flex items-center gap-1">
												<CheckCircle2 className="w-3 h-3 text-green-600" />
												<span className="text-xs text-slate-600">{benefit}</span>
											</div>
										))}
									</div>
								)}

								{/* Action Button */}
								<Button
									size="sm"
									className="mt-3 w-full text-xs"
									variant={option.isRecommended ? 'default' : 'outline'}
									onClick={(e) => {
										e.stopPropagation()
										option.onSelect()
									}}
								>
									{option.isRecommended ? 'Use This Type' : 'Select'}
									<ArrowRight className="w-3 h-3 ml-1" />
								</Button>
							</div>
						</div>
					</motion.div>
				))}
			</div>
		</motion.div>
	)
}

// Rich CMS Entry Card
interface CMSEntryCardProps {
	entry: CMSEntry
	onViewInCMS: () => void
	onUnlink: () => void
	showActions?: boolean
}

export function CMSEntryCard({ entry, onViewInCMS, onUnlink, showActions = true }: CMSEntryCardProps) {
	const getStatusColor = (status: CMSEntry['status']) => {
		switch (status) {
			case 'published': return 'text-green-600 bg-green-50'
			case 'ready': return 'text-blue-600 bg-blue-50'
			case 'draft': return 'text-yellow-600 bg-yellow-50'
		}
	}

	const getStatusIcon = (status: CMSEntry['status']) => {
		switch (status) {
			case 'published': return <CheckCircle2 className="w-3 h-3" />
			case 'ready': return <Eye className="w-3 h-3" />
			case 'draft': return <FileText className="w-3 h-3" />
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 max-w-md"
		>
			{/* Success Header */}
			<div className="flex items-center gap-2 mb-3">
				<div className="p-1 bg-green-100 rounded">
					<CheckCircle2 className="w-4 h-4 text-green-600" />
				</div>
				<span className="text-sm font-medium text-green-900">Content Linked Successfully!</span>
			</div>

			{/* Entry Details */}
			<div className="space-y-3">
				{/* Title and Type */}
				<div>
					<h4 className="text-sm font-medium text-slate-900 mb-1">
						{entry.title}
					</h4>
					<div className="flex items-center gap-2">
						<Database className="w-3 h-3 text-slate-400" />
						<span className="text-xs text-slate-600">{entry.contentType}</span>
					</div>
				</div>

				{/* Status and Metadata */}
				<div className="flex items-center justify-between">
					<div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(entry.status)}`}>
						{getStatusIcon(entry.status)}
						<span className="capitalize">{entry.status}</span>
					</div>
					
					<div className="flex items-center gap-1">
						<Calendar className="w-3 h-3 text-slate-400" />
						<span className="text-xs text-slate-500">
							{entry.lastModified.toLocaleDateString()}
						</span>
					</div>
				</div>

				{/* Fields Summary */}
				<div className="bg-slate-50 rounded-lg p-3">
					<div className="flex items-center gap-1 mb-2">
						<Tag className="w-3 h-3 text-slate-500" />
						<span className="text-xs font-medium text-slate-700">
							Content Fields ({entry.fields.length})
						</span>
					</div>
					<div className="space-y-1">
						{entry.fields.slice(0, 3).map((field, index) => (
							<div key={index} className="flex items-center justify-between">
								<span className="text-xs text-slate-600">{field.key}:</span>
								<span className="text-xs text-slate-800 font-mono max-w-32 truncate">
									{field.value}
								</span>
							</div>
						))}
						{entry.fields.length > 3 && (
							<div className="text-xs text-slate-500 text-center">
								+{entry.fields.length - 3} more fields
							</div>
						)}
					</div>
				</div>

				{/* Actions */}
				{showActions && (
					<div className="flex gap-2 pt-2">
						<Button
							size="sm"
							onClick={onViewInCMS}
							className="flex-1 text-xs"
						>
							<ExternalLink className="w-3 h-3 mr-1" />
							View in CMS
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={onUnlink}
							className="text-xs"
						>
							<Link className="w-3 h-3 mr-1" />
							Unlink
						</Button>
					</div>
				)}
			</div>
		</motion.div>
	)
}

// Rich Processing Status Card
interface ProcessingStatusCardProps {
	steps: ProcessingStep[]
	title: string
	currentStep?: string
}

export function ProcessingStatusCard({ steps, title, currentStep }: ProcessingStatusCardProps) {
	const completedSteps = steps.filter(s => s.status === 'completed').length
	const totalSteps = steps.length
	const progress = (completedSteps / totalSteps) * 100

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 max-w-md"
		>
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<div className="p-1 bg-blue-100 rounded animate-spin">
					<Sparkles className="w-4 h-4 text-blue-600" />
				</div>
				<span className="text-sm font-medium text-slate-900">{title}</span>
			</div>

			{/* Progress Bar */}
			<div className="mb-4">
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs text-slate-600">Progress</span>
					<span className="text-xs text-slate-800 font-medium">
						{completedSteps}/{totalSteps} steps
					</span>
				</div>
				<Progress value={progress} className="h-2" />
			</div>

			{/* Steps */}
			<div className="space-y-2">
				{steps.map((step, index) => {
					const isActive = step.id === currentStep
					const isPending = step.status === 'pending'
					const isCompleted = step.status === 'completed'
					const isInProgress = step.status === 'in-progress' || isActive

					return (
						<motion.div
							key={step.id}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							className={`flex items-center gap-3 p-2 rounded-lg ${
								isInProgress ? 'bg-blue-50' : isCompleted ? 'bg-green-50' : ''
							}`}
						>
							{/* Status Icon */}
							<div className={`flex-shrink-0 ${
								isCompleted ? 'text-green-600' :
								isInProgress ? 'text-blue-600' : 'text-slate-400'
							}`}>
								{isCompleted ? (
									<CheckCircle2 className="w-4 h-4" />
								) : isInProgress ? (
									<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
								) : (
									<div className="w-4 h-4 border-2 border-current rounded-full opacity-50" />
								)}
							</div>

							{/* Step Label */}
							<div className="flex-1">
								<span className={`text-sm ${
									isCompleted ? 'text-green-900' :
									isInProgress ? 'text-blue-900' : 'text-slate-600'
								}`}>
									{step.label}
								</span>
								{step.duration && isCompleted && (
									<span className="text-xs text-slate-500 ml-2">
										({step.duration}ms)
									</span>
								)}
							</div>
						</motion.div>
					)
				})}
			</div>

			{/* Current Step Indicator */}
			{currentStep && (
				<div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-center gap-2">
						<Info className="w-3 h-3 text-blue-600" />
						<span className="text-xs text-blue-800">
							Currently: {steps.find(s => s.id === currentStep)?.label}
						</span>
					</div>
				</div>
			)}
		</motion.div>
	)
}

// Rich Alert/Notification Card
interface AlertCardProps {
	type: 'success' | 'warning' | 'error' | 'info'
	title: string
	message: string
	actions?: {
		label: string
		onClick: () => void
		variant?: 'default' | 'outline' | 'ghost'
	}[]
	dismissable?: boolean
	onDismiss?: () => void
}

export function AlertCard({ type, title, message, actions, dismissable, onDismiss }: AlertCardProps) {
	const getTypeStyles = () => {
		switch (type) {
			case 'success':
				return {
					container: 'border-green-200 bg-green-50',
					icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
					titleColor: 'text-green-900',
					messageColor: 'text-green-800'
				}
			case 'warning':
				return {
					container: 'border-yellow-200 bg-yellow-50',
					icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
					titleColor: 'text-yellow-900',
					messageColor: 'text-yellow-800'
				}
			case 'error':
				return {
					container: 'border-red-200 bg-red-50',
					icon: <AlertCircle className="w-4 h-4 text-red-600" />,
					titleColor: 'text-red-900',
					messageColor: 'text-red-800'
				}
			default: // info
				return {
					container: 'border-blue-200 bg-blue-50',
					icon: <Info className="w-4 h-4 text-blue-600" />,
					titleColor: 'text-blue-900',
					messageColor: 'text-blue-800'
				}
		}
	}

	const styles = getTypeStyles()

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className={`border rounded-xl shadow-sm p-4 max-w-md ${styles.container}`}
		>
			{/* Header */}
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-2">
					{styles.icon}
					<h4 className={`text-sm font-medium ${styles.titleColor}`}>
						{title}
					</h4>
				</div>
				{dismissable && (
					<Button
						size="sm"
						variant="ghost"
						onClick={onDismiss}
						className="p-1 h-6 w-6 hover:bg-black/10"
					>
						<ArrowRight className="w-3 h-3" />
					</Button>
				)}
			</div>

			{/* Message */}
			<p className={`text-sm mb-3 ${styles.messageColor}`}>
				{message}
			</p>

			{/* Actions */}
			{actions && actions.length > 0 && (
				<div className="flex gap-2">
					{actions.map((action, index) => (
						<Button
							key={index}
							size="sm"
							variant={action.variant || 'default'}
							onClick={action.onClick}
							className="text-xs"
						>
							{action.label}
						</Button>
					))}
				</div>
			)}
		</motion.div>
	)
}

// Rich Metrics/Analytics Card
interface MetricsCardProps {
	title: string
	metrics: {
		label: string
		value: string | number
		change?: {
			value: number
			trend: 'up' | 'down'
		}
		icon?: React.ReactNode
	}[]
}

export function MetricsCard({ title, metrics }: MetricsCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 max-w-md"
		>
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<TrendingUp className="w-4 h-4 text-blue-600" />
				<span className="text-sm font-medium text-slate-900">{title}</span>
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-2 gap-3">
				{metrics.map((metric, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0.1 }}
						className="p-3 bg-slate-50 rounded-lg"
					>
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-slate-600">{metric.label}</span>
							{metric.icon && (
								<div className="text-slate-400">
									{metric.icon}
								</div>
							)}
						</div>
						
						<div className="flex items-center gap-2">
							<span className="text-lg font-semibold text-slate-900">
								{metric.value}
							</span>
							
							{metric.change && (
								<div className={`flex items-center gap-1 text-xs ${
									metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'
								}`}>
									<TrendingUp className={`w-3 h-3 ${
										metric.change.trend === 'down' ? 'rotate-180' : ''
									}`} />
									<span>{Math.abs(metric.change.value)}%</span>
								</div>
							)}
						</div>
					</motion.div>
				))}
			</div>
		</motion.div>
	)
}