'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageComponent } from '@/types'
import { HeroComponent } from '@/components/page-components/hero-component'
import { FeaturesComponent } from '@/components/page-components/features-component'
import { CtaComponent } from '@/components/page-components/cta-component'
import { TwoColumnHero } from '@/components/page-components/two-column-hero'
import { TestimonialsComponent } from '@/components/page-components/testimonials-component'
import { Button } from '@/components/ui/button'
import { Plus, Smartphone, Tablet, Monitor } from 'lucide-react'
import { AISpark } from '@/components/ghost-mode/ai-spark'
import { GhostPreviewOverlay } from '@/components/ghost-mode/ghost-preview-overlay'

import { useGhostMode } from '@/contexts/ghost-mode-context'
import { useComponentContext } from './component-context'

interface StudioCanvasProps {
	components: PageComponent[]
	onComponentSelect?: (component: PageComponent | null) => void
	selectedComponent?: PageComponent | null
	currentThought?: string
	currentComposition?: any
	previewMode?: {
		active: boolean
		targetComponentId: string | null
		changes: Record<string, any>
	}
}

export function StudioCanvas({ 
	components, 
	onComponentSelect, 
	selectedComponent,
	currentThought,
	currentComposition,
	previewMode
}: StudioCanvasProps) {
	const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
	const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null)
	const { context, actions } = useComponentContext()
	const ghostMode = useGhostMode()

	const renderComponent = (component: PageComponent) => {
		const isSelected = selectedComponent?.id === component.id
		const isHovered = hoveredComponentId === component.id
		const isGhostActive = ghostMode.state.isActive && ghostMode.state.selectedComponentId === component.id
		
		// Enhanced preview mode logic
		const isPreviewTarget = previewMode?.active && previewMode.targetComponentId === component.id
		const isPreviewNonTarget = previewMode?.active && previewMode.targetComponentId !== component.id
		
		// Apply preview changes if this component is the target
		const componentData = isPreviewTarget && previewMode?.changes
			? { ...component.data, ...previewMode.changes }
			: isGhostActive && ghostMode.state.proposedChange 
			? { ...component.data, ...ghostMode.state.proposedChange.changes }
			: component.data
		
		const componentElement = (() => {
			switch (component.type) {
				case 'hero':
					return <HeroComponent data={{
						title: componentData.title || 'Untitled',
						subtitle: componentData.subtitle,
						image: componentData.image,
						description: componentData.description,
						backgroundColor: componentData.backgroundColor,
						buttonText: componentData.buttonText
					}} />
				case 'two-column-hero':
					return <TwoColumnHero data={{
						title: componentData.title || 'Untitled',
						description: componentData.description,
						image: componentData.image,
						buttonText: componentData.buttonText || 'Get Started',
						buttonHref: componentData.buttonHref,
						layout: componentData.layout,
						backgroundColor: componentData.backgroundColor
					}} />
				case 'features':
					return <FeaturesComponent data={{
						title: componentData.title || 'Features',
						features: componentData.features || [],
						layout: componentData.layout,
						backgroundColor: componentData.backgroundColor
					}} />
				case 'cta':
					return <CtaComponent data={{
						text: componentData.buttonText || componentData.text || 'Click me',
						href: componentData.href,
						variant: componentData.variant === 'primary' ? 'default' : componentData.variant,
						size: componentData.size,
						title: componentData.title,
						description: componentData.description,
						backgroundColor: componentData.backgroundColor
					}} />
				case 'testimonials':
					return <TestimonialsComponent data={{
						title: componentData.title,
						subtitle: componentData.subtitle,
						backgroundColor: componentData.backgroundColor,
						testimonials: componentData.testimonials || []
					}} />
				case 'stats':
					return (
						<div className="bg-white p-8 rounded-lg shadow-sm border">
							<div className="text-center mb-8">
								<h2 className="text-3xl font-bold text-slate-800 mb-2">
									{componentData.title || 'Our Impact'}
								</h2>
								<p className="text-slate-600">
									{componentData.subtitle || 'Numbers that tell our story'}
								</p>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
								{(componentData.stats || [
									{ number: '10K+', label: 'Happy Customers' },
									{ number: '50+', label: 'Countries Served' },
									{ number: '99%', label: 'Satisfaction Rate' },
									{ number: '24/7', label: 'Support Available' }
								]).map((stat: { number: string; label: string }, index: number) => (
									<div key={index} className="text-center">
										<div className="text-3xl font-bold text-blue-600 mb-1">
											{stat.number}
										</div>
										<div className="text-sm text-slate-600">
											{stat.label}
										</div>
									</div>
								))}
							</div>
						</div>
					)
				case 'faq':
					return (
						<div className="bg-white p-8 rounded-lg shadow-sm border">
							<div className="text-center mb-8">
								<h2 className="text-3xl font-bold text-slate-800 mb-2">
									{componentData.title || 'Frequently Asked Questions'}
								</h2>
								<p className="text-slate-600">
									{componentData.subtitle || 'Everything you need to know'}
								</p>
							</div>
							<div className="space-y-4 max-w-3xl mx-auto">
								{(componentData.questions || [
									{
										question: 'How does your product work?',
										answer: 'Our product uses cutting-edge technology to deliver exceptional results.'
									},
									{
										question: 'What is your return policy?',
										answer: 'We offer a 30-day money-back guarantee for your peace of mind.'
									},
									{
										question: 'Do you offer customer support?',
										answer: 'Yes! Our support team is available 24/7 to help with any questions.'
									}
								]).map((faq: { question: string; answer: string }, index: number) => (
									<div key={index} className="border border-slate-200 rounded-lg p-4">
										<h3 className="font-medium text-slate-800 mb-2">
											{faq.question}
										</h3>
										<p className="text-sm text-slate-600 leading-relaxed">
											{faq.answer}
										</p>
									</div>
								))}
							</div>
						</div>
					)
				default:
					return null
			}
		})()

		const handleComponentClick = () => {
			// Only select for canvas editing - don't activate Ghost Mode
			onComponentSelect?.(component)
			actions.selectComponent(component.id)
		}
		
		const handleComponentDoubleClick = () => {
			// Double-click activates Ghost Mode for AI editing
			onComponentSelect?.(component)
			actions.selectComponent(component.id)
			ghostMode.setSelectedComponent(component.id)
		}

		const handleComponentHover = () => {
			if (!ghostMode.state.isActive) {
				setHoveredComponentId(component.id)
				actions.hoverComponent(component.id)
			}
		}

		const handleComponentLeave = () => {
			setHoveredComponentId(null)
			actions.hoverComponent(null)
		}

		const handleAISparkClick = () => {
			// AI Spark always activates Ghost Mode
			onComponentSelect?.(component)
			actions.selectComponent(component.id)
			ghostMode.setSelectedComponent(component.id)
		}

		return (
			<motion.div
				key={component.id}
				data-component-id={component.id}
				onClick={handleComponentClick}
				onDoubleClick={handleComponentDoubleClick}
				onMouseEnter={handleComponentHover}
				onMouseLeave={handleComponentLeave}
				className="relative cursor-pointer group"
				initial={{ opacity: 0, y: 20 }}
				animate={{ 
					opacity: isPreviewNonTarget ? 0.4 : 1, 
					y: 0,
					scale: isPreviewTarget ? 1.02 : 1
				}}
				transition={{ 
					duration: 0.3,
					opacity: { duration: 0.3 },
					scale: { duration: 0.3 }
				}}
				style={{
					filter: isPreviewTarget ? 'brightness(1.1) saturate(1.1) drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' : 'none'
				}}
			>
				{componentElement}

				{/* AI Spark - shows on hover when not selected and ghost mode not active */}
				<AISpark
					isVisible={isHovered && !isSelected && !ghostMode.state.isActive}
					onClick={handleAISparkClick}
					position="top-right"
				/>
				
				{/* Interaction Hints */}
				{isHovered && !ghostMode.state.isActive && (
					<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 opacity-80">
						Double-click for AI editing • Single-click to select
					</div>
				)}
				
				{/* Simple Selection Border */}
				{isSelected && (
					<div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none" />
				)}

				{/* Enhanced Hover Overlay */}
				<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
					{!isSelected && (
						<>
							<div className="absolute inset-0 bg-blue-500/5 rounded-lg border border-blue-300/30" />
							<div className="absolute top-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
								{component.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
							</div>
						</>
					)}
				</div>
			</motion.div>
		)
	}

	const getCanvasWidth = () => {
		switch (viewMode) {
			case 'mobile': return 'max-w-sm'
			case 'tablet': return 'max-w-2xl'
			case 'desktop': return 'max-w-7xl' // Increased for zoom-out effect
			default: return 'max-w-7xl'
		}
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		const componentType = e.dataTransfer.getData('text/plain')
		console.log('Dropped component:', componentType)
		// This would typically trigger component creation
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
	}

	return (
		<div className="flex-1 bg-slate-50 flex flex-col">
			{/* Canvas Header */}
			<div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4">
				{/* Left: Page Info */}
				<div className="flex items-center gap-4">
					<span className="text-sm text-slate-600">
						{currentComposition?.name || 'Untitled Page'}
					</span>
					<div className="flex items-center gap-1 text-sm text-slate-500">
						<span>{currentComposition?.urlSlug || '/page'}</span>
					</div>
				</div>

				{/* Center: Current Thought */}
				{currentThought && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200"
					>
						<div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
						{currentThought}
					</motion.div>
				)}

				{/* Right: View Controls */}
				<div className="flex items-center gap-2">
					<div className="flex items-center border border-slate-200 rounded-md">
						<Button
							variant={viewMode === 'mobile' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setViewMode('mobile')}
							className="rounded-r-none border-r"
						>
							<Smartphone className="w-4 h-4" />
						</Button>
						<Button
							variant={viewMode === 'tablet' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setViewMode('tablet')}
							className="rounded-none border-r"
						>
							<Tablet className="w-4 h-4" />
						</Button>
						<Button
							variant={viewMode === 'desktop' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setViewMode('desktop')}
							className="rounded-l-none"
						>
							<Monitor className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Canvas Area */}
			<div className="flex-1 overflow-auto p-6 relative" style={{
				paddingTop: viewMode === 'desktop' ? '12px' : '24px',
				paddingBottom: viewMode === 'desktop' ? '60px' : '24px'
			}}>
				{/* AI Working Overlay */}
				{currentThought && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-blue-50/30 backdrop-blur-sm z-10 flex items-center justify-center"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							className="bg-white rounded-lg shadow-lg border border-blue-200 p-6 max-w-md mx-4"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
									<motion.div
										animate={{ rotate: 360 }}
										transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
										className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
									/>
								</div>
								<div>
									<h3 className="font-medium text-slate-800">AI Working</h3>
									<p className="text-sm text-blue-600">{currentThought}</p>
								</div>
							</div>
							<div className="w-full bg-blue-100 rounded-full h-2">
								<motion.div
									className="bg-blue-600 h-2 rounded-full"
									initial={{ width: "0%" }}
									animate={{ width: "100%" }}
									transition={{ duration: 1.5, ease: "easeInOut" }}
								/>
							</div>
						</motion.div>
					</motion.div>
				)}

				<GhostPreviewOverlay components={components}>
					<div 
						className={`mx-auto bg-white rounded-lg shadow-sm border border-slate-200 min-h-full transition-all duration-300 ${getCanvasWidth()}`}
						style={{
							transform: viewMode === 'desktop' ? 'scale(0.85)' : 'scale(1)',
							transformOrigin: 'top center',
							marginTop: viewMode === 'desktop' ? '20px' : '0px',
							marginBottom: viewMode === 'desktop' ? '40px' : '0px'
						}}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
					>
					{components.length === 0 ? (
						<div className="h-full min-h-96 flex items-center justify-center p-8">
							<div className="text-center space-y-4">
								<div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
									<Plus className="w-8 h-8 text-slate-400" />
								</div>
								<div>
									<h3 className="font-medium text-slate-800 mb-2">Start Building Your Page</h3>
									<p className="text-slate-500 text-sm max-w-sm">
										Drag components from the left panel or use the Compose tab to create your page with natural language.
									</p>
								</div>
								<div className="pt-4">
									<Button variant="outline" size="sm">
										<Plus className="w-4 h-4 mr-2" />
										Add Component
									</Button>
								</div>
							</div>
						</div>
					) : (
						<div className="p-6 space-y-6">
							<AnimatePresence>
								{components
									.filter(component => component.visible)
									.map((component, index) => (
										<motion.div
											key={component.id}
											initial={{ opacity: 0, y: 50, scale: 0.9 }}
											animate={{ 
												opacity: 1, 
												y: 0, 
												scale: 1,
												transition: { 
													delay: index * 0.3,
													duration: 0.6,
													type: "spring",
													bounce: 0.3
												}
											}}
											exit={{ opacity: 0, y: -50, scale: 0.9 }}
										>
											{renderComponent(component)}
										</motion.div>
									))}
							</AnimatePresence>
						</div>
					)}
					</div>
				</GhostPreviewOverlay>
			</div>

			{/* Canvas Footer */}
			<div className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-4 text-xs text-slate-500">
				<span>
					{components.filter(c => c.visible).length} components
					{currentComposition?.autoGenerated && (
						<span className="ml-2 text-blue-600 font-medium">• AI Generated</span>
					)}
				</span>
				<span>Composable Studio - AI Enhanced</span>
			</div>


		</div>
	)
}
