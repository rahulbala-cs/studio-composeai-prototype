'use client'

import React, { useState } from 'react'
import { ChevronDown, Settings, Palette, Layout, Monitor, Sparkles, Wand2, Database, HelpCircle, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'

interface PropertiesPanelProps {
	selectedComponent?: any
}

type TabType = 'settings' | 'design' | 'page-data'

const mockPageEntries = [
	{ id: '1', name: 'SpendGuard', type: 'Page', status: 'published' },
	{ id: '2', name: 'Blogs', type: 'Page', status: 'draft' },
	{ id: '3', name: '©2023 SpendGuard', type: 'Footer', status: 'published' }
]

export function PropertiesPanel({ selectedComponent }: PropertiesPanelProps) {
	const [activeTab, setActiveTab] = useState<TabType>('design')

	const tabs = [
		{ id: 'settings', label: 'Settings' },
		{ id: 'design', label: 'Design' },
		{ id: 'page-data', label: 'Page Data' }
	] as const

	const renderTabContent = () => {
		switch (activeTab) {
			case 'settings':
				return renderSettingsTab()
			case 'design':
				return renderDesignTab()
			case 'page-data':
				return renderPageDataTab()
			default:
				return renderDesignTab()
		}
	}

	const renderSettingsTab = () => {
		if (!selectedComponent) {
			return (
				<div className="text-center py-8">
					<div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
						<Settings className="w-8 h-8 text-slate-400" />
					</div>
					<h3 className="font-medium text-slate-800 mb-2">No Selection</h3>
					<p className="text-sm text-slate-500">
						Select a component to view its settings
					</p>
				</div>
			)
		}

		return (
			<div className="space-y-4">
				{/* Component Info */}
				<div>
					<h3 className="text-sm font-medium text-slate-800 mb-2">
						Text Component
					</h3>
					<p className="text-xs text-slate-500">
						Configure text properties and content
					</p>
				</div>

				{/* Text Properties */}
				<Card className="p-4">
					<div className="space-y-4">
						<div>
							<label className="text-xs text-slate-600 block mb-2 flex items-center gap-2">
								<Database className="w-3 h-3" />
								Title
								<Button variant="ghost" size="sm" className="w-4 h-4 p-0">
									<MoreHorizontal className="w-3 h-3 text-slate-400" />
								</Button>
							</label>
							<Input 
								defaultValue="Title" 
								className="text-sm"
								placeholder="Enter title text"
							/>
						</div>

						<div>
							<label className="text-xs text-slate-600 block mb-2">Heading Level</label>
							<select className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
								<option value="h1">H1</option>
								<option value="h2">H2</option>
								<option value="h3" selected>H3</option>
								<option value="h4">H4</option>
								<option value="h5">H5</option>
								<option value="h6">H6</option>
							</select>
						</div>

						<div>
							<label className="text-xs text-slate-600 block mb-2">Text Content</label>
							<textarea 
								className="w-full p-2 border border-slate-200 rounded text-sm resize-none"
								rows={3}
								placeholder="Enter your text content here..."
							/>
						</div>
					</div>
				</Card>
			</div>
		)
	}

	const renderDesignTab = () => {
		if (!selectedComponent) {
			return (
				<div className="text-center py-8">
					<div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
						<Palette className="w-8 h-8 text-slate-400" />
					</div>
					<h3 className="font-medium text-slate-800 mb-2">No Selection</h3>
					<p className="text-sm text-slate-500">
						Select a component to view its design properties
					</p>
				</div>
			)
		}

		return (
			<div className="space-y-6">
				{/* Component Info */}
				<div>
					<h3 className="text-sm font-medium text-slate-800 mb-2">
						{selectedComponent.type || 'Text Component'}
					</h3>
					<p className="text-xs text-slate-500">
						Configure the design properties for this component
					</p>
				</div>

				{/* Position Section */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
							<Layout className="w-4 h-4" />
							Position
						</h4>
						<ChevronDown className="w-4 h-4 text-slate-400" />
					</div>
					
					<div className="space-y-3">
						<div>
							<label className="text-xs text-slate-600 block mb-1">Position</label>
							<select className="w-full p-2 border border-slate-200 rounded text-sm">
								<option>Relative</option>
								<option>Absolute</option>
								<option>Fixed</option>
							</select>
						</div>
					</div>
				</Card>

				{/* Transform Section */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-medium text-slate-700">Transform</h4>
						<ChevronDown className="w-4 h-4 text-slate-400" />
					</div>
					
					<div className="grid grid-cols-4 gap-2 text-center">
						<Button variant="ghost" size="sm" className="text-xs">Move</Button>
						<Button variant="outline" size="sm" className="text-xs">Rotate</Button>
						<Button variant="ghost" size="sm" className="text-xs">Scale</Button>
						<Button variant="ghost" size="sm" className="text-xs">Skew</Button>
					</div>

					<div className="grid grid-cols-3 gap-2 mt-3">
						<div>
							<label className="text-xs text-slate-600 block mb-1">X</label>
							<Input defaultValue="0" className="text-sm" />
						</div>
						<div>
							<label className="text-xs text-slate-600 block mb-1">Y</label>
							<Input defaultValue="0" className="text-sm" />
						</div>
						<div>
							<label className="text-xs text-slate-600 block mb-1">Z</label>
							<Input defaultValue="0" className="text-sm" />
						</div>
					</div>
				</Card>

				{/* Media Section */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
							<Monitor className="w-4 h-4" />
							Media
						</h4>
						<ChevronDown className="w-4 h-4 text-slate-400" />
					</div>
					
					<div className="space-y-3">
						<div>
							<label className="text-xs text-slate-600 block mb-1">Size</label>
							<select className="w-full p-2 border border-slate-200 rounded text-sm">
								<option>Cover</option>
								<option>Contain</option>
								<option>Auto</option>
							</select>
						</div>
					</div>
				</Card>

				{/* Background Section */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
							<Palette className="w-4 h-4" />
							Background
						</h4>
						<ChevronDown className="w-4 h-4 text-slate-400" />
					</div>
					
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded"></div>
							<span className="text-sm text-slate-600">Color</span>
						</div>
					</div>
				</Card>


			</div>
		)
	}

	const renderPageDataTab = () => {
		return (
			<div className="space-y-6">
				{/* Preview Entry Section */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
							Preview Entry
							<Button variant="ghost" size="sm" className="w-4 h-4 p-0">
								<HelpCircle className="w-3 h-3 text-slate-400" />
							</Button>
						</h4>
						<ChevronDown className="w-4 h-4 text-slate-400" />
					</div>

					<div className="bg-slate-50 rounded-lg p-3 border">
						<div className="flex items-center justify-between">
							<div>
								<div className="font-medium text-sm text-slate-800">SpendGuard</div>
								<div className="text-xs text-slate-500 flex items-center gap-1">
									<Database className="w-3 h-3" />
									Pa...
								</div>
							</div>
						</div>
					</div>

					{/* Tooltip simulation */}
					<div className="mt-2 p-2 bg-slate-700 text-white text-xs rounded shadow-lg">
						Select an entry to preview how it renders with this composition.
					</div>
				</div>

				{/* Page Entries Section */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
							Page Entries
							<Button variant="ghost" size="sm" className="w-4 h-4 p-0">
								<HelpCircle className="w-3 h-3 text-slate-400" />
							</Button>
						</h4>
						<ChevronDown className="w-4 h-4 text-slate-400" />
					</div>

					<div className="space-y-3">
						{mockPageEntries.map((entry) => (
							<div key={entry.id} className="bg-slate-50 rounded-lg p-3 border hover:bg-slate-100 cursor-pointer">
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-sm text-slate-800">{entry.name}</div>
										<div className="text-xs text-slate-500 flex items-center gap-1">
											<Database className="w-3 h-3" />
											{entry.type}...
										</div>
									</div>
									<div className={`text-xs px-2 py-1 rounded ${
										entry.status === 'published' 
											? 'bg-green-100 text-green-700' 
											: 'bg-yellow-100 text-yellow-700'
									}`}>
										{entry.status}
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Link Entry Button */}
					<Button variant="ghost" size="sm" className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
						<Plus className="w-4 h-4 mr-2" />
						Link Entry
					</Button>

					{/* Tooltip simulation */}
					<div className="mt-2 p-2 bg-slate-700 text-white text-xs rounded shadow-lg">
						Entries linked to this page layout. These represent dynamic content from your stack.
					</div>
				</div>
			</div>
		)
	}
	return (
		<div className="w-80 bg-white border-l border-slate-200 flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-slate-200">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-semibold text-slate-800">Properties</h2>
					<Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
						<Settings className="w-4 h-4" />
					</Button>
				</div>
				
				{/* Tabs */}
				<div className="flex rounded-lg bg-slate-100 p-1">
					{tabs.map((tab) => (
						<Button
							key={tab.id}
							variant={activeTab === tab.id ? "default" : "ghost"}
							size="sm"
							onClick={() => setActiveTab(tab.id as TabType)}
							className={`flex-1 text-xs px-2 py-1 h-7 ${
								activeTab === tab.id
									? 'bg-white shadow-sm text-slate-900'
									: 'text-slate-600 hover:text-slate-900'
							}`}
						>
							{tab.label}
						</Button>
					))}
				</div>
			</div>

			{/* Properties Content */}
			<ScrollArea className="flex-1">
				<div className="p-4">
					{renderTabContent()}
				</div>
			</ScrollArea>
		</div>
	)
}
