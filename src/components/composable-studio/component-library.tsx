'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Type, Image, Link, Video, Play, Code, Grid3X3, Square, Layers, Copy, GitBranch, Repeat, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ComponentItem {
	id: string
	name: string
	icon: any
}

interface ComponentCategory {
	id: string
	name: string
	items: ComponentItem[]
	expanded: boolean
}

const componentCategories: ComponentCategory[] = [
	{
		id: 'basic',
		name: 'Basic',
		expanded: true,
		items: [
			{ id: 'header', name: 'Header', icon: Type },
			{ id: 'text', name: 'Text', icon: Type },
			{ id: 'collapsible', name: 'Collapsible', icon: Layers },
			{ id: 'link', name: 'Link', icon: Link },
			{ id: 'image', name: 'Image', icon: Image },
			{ id: 'video', name: 'Video', icon: Video },
			{ id: 'youtube', name: 'Youtube', icon: Play },
			{ id: 'embed', name: 'Embed', icon: Code },
		]
	},
	{
		id: 'container',
		name: 'Container',
		expanded: true,
		items: [
			{ id: 'section', name: 'Section', icon: Square },
			{ id: 'box', name: 'Box', icon: Square },
			{ id: 'grid', name: 'Grid', icon: Grid3X3 },
			{ id: 'vstack', name: 'Vertical Stack', icon: Layers },
			{ id: 'hstack', name: 'Horizontal Stack', icon: Layers },
		]
	},
	{
		id: 'smart',
		name: 'Smart Containers',
		expanded: false,
		items: [
			{ id: 'repeater', name: 'Repeater', icon: Repeat },
			{ id: 'condition', name: 'Condition', icon: GitBranch },
			{ id: 'tabs', name: 'Tabs', icon: Layers },
		]
	},
	{
		id: 'registered',
		name: 'Registered Components',
		expanded: false,
		items: [
			{ id: 'hero-section', name: 'Hero section', icon: Layers },
			{ id: 'hero', name: 'Hero', icon: Layers },
		]
	}
]

export function ComponentLibrary() {
	const [categories, setCategories] = useState(componentCategories)

	const toggleCategory = (categoryId: string) => {
		setCategories(prev => prev.map(cat => 
			cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
		))
	}

	const handleDragStart = (e: React.DragEvent, componentId: string) => {
		e.dataTransfer.setData('text/plain', componentId)
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-4 space-y-4">
				{categories.map(category => (
					<div key={category.id} className="space-y-2">
						{/* Category Header */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => toggleCategory(category.id)}
							className="w-full justify-start text-slate-600 hover:text-slate-800 p-2 h-auto"
						>
							{category.expanded ? 
								<ChevronDown className="w-4 h-4 mr-1" /> : 
								<ChevronRight className="w-4 h-4 mr-1" />
							}
							<span className="text-sm font-medium">{category.name}</span>
						</Button>

						{/* Category Items */}
						{category.expanded && (
							<div className="grid grid-cols-3 gap-2 ml-5">
								{category.items.map(item => {
									const IconComponent = item.icon
									return (
										<div
											key={item.id}
											draggable
											onDragStart={(e) => handleDragStart(e, item.id)}
											className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100 cursor-grab active:cursor-grabbing group"
										>
											<div className="w-8 h-8 flex items-center justify-center text-slate-600 group-hover:text-slate-800 mb-1">
												<IconComponent className="w-5 h-5" />
											</div>
											<span className="text-xs text-slate-600 group-hover:text-slate-800 text-center leading-tight">
												{item.name}
											</span>
										</div>
									)
								})}
							</div>
						)}
					</div>
				))}
			</div>
		</ScrollArea>
	)
}
