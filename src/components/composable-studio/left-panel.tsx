'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Layers, Sparkles, GripVertical, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComponentLibrary } from './component-library'
import { LayersPanel } from './layers-panel'
import { EnhancedComposePanel } from './enhanced-compose-panel'

interface LeftPanelProps {
	onPageComponentAdd: (componentType: string, data: any) => void
	onShowThought: (thought: string) => void
	currentComposition?: any
	hasComponents?: boolean
	defaultActiveTab?: TabType
	onPreviewModeChange?: (isPreviewMode: boolean, targetComponentId?: string) => void
}

type TabType = 'components' | 'layers' | 'compose'

export function LeftPanel({ onPageComponentAdd, onShowThought, currentComposition, hasComponents, defaultActiveTab = 'components', onPreviewModeChange }: LeftPanelProps) {
	const [activeTab, setActiveTab] = useState<TabType>(defaultActiveTab)
	const [panelWidth, setPanelWidth] = useState(400) // Default 400px - wider for compose panel
	const [isResizing, setIsResizing] = useState(false)
	const panelRef = useRef<HTMLDivElement>(null)
	
	const minWidth = 320 // Minimum width - increased for better chat experience
	const maxWidth = 600 // Maximum width - increased for expanded state
	
	// Handle mouse down on resize handle
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault()
		setIsResizing(true)
	}
	
	// Handle mouse move for resizing
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing || !panelRef.current) return
			
			const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX))
			setPanelWidth(newWidth)
		}
		
		const handleMouseUp = () => {
			setIsResizing(false)
		}
		
		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		}
		
		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isResizing, minWidth, maxWidth])
	
	// Quick expand/collapse functions
	const expandPanel = () => setPanelWidth(maxWidth)
	const collapsePanel = () => setPanelWidth(minWidth)
	const isExpanded = panelWidth > (minWidth + 50) // Consider expanded if > 370px
	
	// Auto-expand compose panel for better chat experience
	useEffect(() => {
		if (activeTab === 'compose' && panelWidth < 450) {
			setPanelWidth(500) // Auto-expand for compose tab
		} else if (activeTab !== 'compose' && panelWidth > 400) {
			setPanelWidth(400) // Auto-collapse for other tabs
		}
	}, [activeTab])

	const tabs = [
		{ id: 'components', label: 'Components', icon: null },
		{ id: 'layers', label: 'Layers', icon: Layers },
		{ id: 'compose', label: 'Compose', icon: Sparkles }
	] as const

	const renderTabContent = () => {
		switch (activeTab) {
			case 'components':
				return <ComponentLibrary />
			case 'layers':
				return <LayersPanel />
			case 'compose':
				return (
					<EnhancedComposePanel
						onPageComponentAdd={onPageComponentAdd}
						onShowThought={onShowThought}
						currentComposition={currentComposition}
						hasComponents={hasComponents}
						onPreviewModeChange={onPreviewModeChange}
					/>
				)
			default:
				return <ComponentLibrary />
		}
	}

	return (
		<div 
			ref={panelRef}
			className="bg-white border-r border-slate-200 flex flex-col relative"
			style={{ width: `${panelWidth}px` }}
		>
			{/* Tab Header */}
			<div className="p-4 border-b border-slate-200">
				<div className="flex items-center justify-between mb-2">
					<div className="flex space-x-1 bg-slate-100 rounded-lg p-1 flex-1">
					{tabs.map((tab) => {
						const IconComponent = tab.icon
						return (
							<Button
								key={tab.id}
								variant={activeTab === tab.id ? "default" : "ghost"}
								size="sm"
								onClick={() => setActiveTab(tab.id as TabType)}
								className={`flex-1 text-xs px-2 py-1 h-7 gap-1 ${
									activeTab === tab.id
										? 'bg-white shadow-sm text-slate-900'
										: 'text-slate-600 hover:text-slate-900'
								}`}
							>
								{IconComponent && <IconComponent className="w-3 h-3" />}
								{tab.label}
							</Button>
						)
					})}
					</div>
					
					{/* Expand/Collapse Button - Only show for Compose tab */}
					{activeTab === 'compose' && (
						<Button
							variant="ghost"
							size="sm" 
							onClick={isExpanded ? collapsePanel : expandPanel}
							className="ml-2 p-1 h-7 w-7"
							title={isExpanded ? 'Collapse panel' : 'Expand panel'}
						>
							{isExpanded ? (
								<Minimize2 className="w-3 h-3" />
							) : (
								<Maximize2 className="w-3 h-3" />
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Tab Content */}
			<div className="flex-1 min-h-0">
				{renderTabContent()}
			</div>
			
			{/* Resize Handle */}
			{activeTab === 'compose' && (
				<div
					className={`absolute right-0 top-0 bottom-0 w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors ${
						isResizing ? 'bg-blue-500' : ''
					}`}
					onMouseDown={handleMouseDown}
				>
					<div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
						<GripVertical className="w-3 h-3 text-slate-400" />
					</div>
				</div>
			)}
		</div>
	)
}
