'use client'

import React from 'react'
import { Eye, EyeOff, Lock, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LayerItem {
	id: string
	name: string
	type: string
	visible: boolean
	locked: boolean
	children?: LayerItem[]
}

const mockLayers: LayerItem[] = [
	{
		id: '1',
		name: 'Page',
		type: 'container',
		visible: true,
		locked: false,
		children: [
			{
				id: '2',
				name: 'Header Section',
				type: 'section',
				visible: true,
				locked: false,
				children: [
					{ id: '3', name: 'Navigation', type: 'component', visible: true, locked: false },
					{ id: '4', name: 'Logo', type: 'image', visible: true, locked: false }
				]
			},
			{
				id: '5',
				name: 'Main Content',
				type: 'section',
				visible: true,
				locked: false,
				children: [
					{ id: '6', name: 'Hero Banner', type: 'component', visible: true, locked: false },
					{ id: '7', name: 'Features List', type: 'component', visible: true, locked: false }
				]
			}
		]
	}
]

export function LayersPanel() {
	const renderLayer = (layer: LayerItem, depth = 0) => (
		<div key={layer.id} className="text-sm">
			<div 
				className="flex items-center justify-between p-2 hover:bg-slate-50 rounded group"
				style={{ marginLeft: depth * 16 }}
			>
				<div className="flex items-center gap-2 flex-1 min-w-0">
					<span className="text-slate-700 truncate">{layer.name}</span>
					<span className="text-xs text-slate-400 bg-slate-100 px-1 rounded">
						{layer.type}
					</span>
				</div>
				
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						variant="ghost"
						size="sm"
						className="w-6 h-6 p-0"
					>
						{layer.visible ? (
							<Eye className="w-3 h-3 text-slate-500" />
						) : (
							<EyeOff className="w-3 h-3 text-slate-400" />
						)}
					</Button>
					
					<Button
						variant="ghost"
						size="sm"
						className="w-6 h-6 p-0"
					>
						{layer.locked ? (
							<Lock className="w-3 h-3 text-slate-500" />
						) : (
							<MoreHorizontal className="w-3 h-3 text-slate-400" />
						)}
					</Button>
				</div>
			</div>
			
			{layer.children?.map(child => renderLayer(child, depth + 1))}
		</div>
	)

	return (
		<ScrollArea className="flex-1">
			<div className="p-4">
				<div className="space-y-1">
					{mockLayers.map(layer => renderLayer(layer))}
				</div>
			</div>
		</ScrollArea>
	)
}
