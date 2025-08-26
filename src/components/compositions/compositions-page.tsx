'use client'

import React, { useState } from 'react'
import { Plus, Search, RefreshCw, Settings, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AICompositionModal } from '@/components/composition-creation/ai-composition-modal'
import { CompositionChoiceModal } from '@/components/composition-creation/composition-choice-modal'
import { ManualCompositionModal } from '@/components/composition-creation/manual-composition-modal'

interface Composition {
	id: string
	name: string
	linkedContentType: string | null
	url: string
	modifiedAt: string
	modifiedBy: string
}

const mockCompositions: Composition[] = [
	{
		id: '1',
		name: 'Aura Headphones Landing',
		linkedContentType: null,
		url: '-',
		modifiedAt: 'Aug 21, 2025 11:23 AM',
		modifiedBy: 'Me'
	},
	{
		id: '2',
		name: 'iPad Pro Product Details',
		linkedContentType: null,
		url: '/ipaddetail',
		modifiedAt: 'Aug 21, 2025 11:11 AM',
		modifiedBy: 'Me'
	},
	{
		id: '3',
		name: 'Home Page',
		linkedContentType: 'homepage',
		url: '-',
		modifiedAt: 'Aug 20, 2025 03:05 PM',
		modifiedBy: 'Ravi Lamkoti'
	},
	{
		id: '4',
		name: 'Enterprise Solutions Portfolio',
		linkedContentType: 'enterprise_solutions',
		url: 'https://www.google.com',
		modifiedAt: 'Aug 20, 2025 10:13 AM',
		modifiedBy: 'Ravi Lamkoti'
	},
	{
		id: '5',
		name: 'About Our Company',
		linkedContentType: 'about_us',
		url: '/custom',
		modifiedAt: 'Aug 19, 2025 06:18 PM',
		modifiedBy: 'Abhijit Turate'
	},
	{
		id: '6',
		name: 'Homepage Design',
		linkedContentType: null,
		url: '/',
		modifiedAt: 'Aug 19, 2025 03:34 PM',
		modifiedBy: 'Ankita Dodamani'
	},
	{
		id: '7',
		name: 'Tech Blog Template',
		linkedContentType: 'blogs',
		url: '-',
		modifiedAt: 'Aug 19, 2025 02:36 PM',
		modifiedBy: 'Ravi Lamkoti'
	},
	{
		id: '8',
		name: 'Corporate Homepage',
		linkedContentType: 'homepage',
		url: '-',
		modifiedAt: 'Aug 19, 2025 01:53 PM',
		modifiedBy: 'Ravi Lamkoti'
	}
]

interface CompositionsPageProps {
	onNavigateToCanvas: (compositionData: any) => void
}

export function CompositionsPage({ onNavigateToCanvas }: CompositionsPageProps) {
	const [showAIModal, setShowAIModal] = useState(false)
	const [showChoiceModal, setShowChoiceModal] = useState(false)
	const [showManualModal, setShowManualModal] = useState(false)
	const [initialPrompt, setInitialPrompt] = useState('')

	const handleNewComposition = () => {
		setInitialPrompt('')
		setShowChoiceModal(true)
	}

	const handleCreateWithAI = (prompt: string) => {
		setInitialPrompt(prompt)
		setShowChoiceModal(false)
		setShowAIModal(true)
	}

	const handleCreateManually = () => {
		setShowChoiceModal(false)
		setShowManualModal(true)
		setInitialPrompt('')
	}

	const handleCompositionReady = (compositionData: any) => {
		// Close all modals
		setShowAIModal(false)
		setShowChoiceModal(false)
		setShowManualModal(false)
		setInitialPrompt('')
		
		// Navigate to canvas with the composition data
		onNavigateToCanvas(compositionData)
	}

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Header */}
			<div className="bg-white border-b border-slate-200 px-6 py-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
								<span className="text-white text-xs font-bold">CS</span>
							</div>
							<span className="text-lg font-semibold text-slate-800">Composable Studio</span>
						</div>
						<div className="text-sm text-slate-500 flex items-center gap-2">
							<span>🚀 TechFlow - Composable Studio</span>
						</div>
					</div>
					
					<div className="flex items-center gap-4">
						<div className="w-8 h-8 bg-slate-200 rounded-full"></div>
						<div className="w-8 h-8 bg-slate-200 rounded-full"></div>
						<div className="w-8 h-8 bg-slate-200 rounded-full"></div>
						<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
							<span className="text-white text-xs font-bold">CS</span>
						</div>
						<div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
							<span className="text-slate-600 text-xs font-bold">RB</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-6 py-6">
				{/* Page Header */}
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-slate-900">Compositions</h1>
					<Button 
						onClick={handleNewComposition}
						className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
					>
						<Plus className="w-4 h-4" />
						New Composition
					</Button>
				</div>

				{/* Search and Actions */}
				<div className="flex items-center justify-between mb-6">
					<div className="relative w-80">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							placeholder="Search compositions"
							className="pl-10"
						/>
					</div>
					
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm">
							<RefreshCw className="w-4 h-4" />
						</Button>
						<Button variant="ghost" size="sm">
							<Settings className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{/* Table */}
				<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
					{/* Table Header */}
					<div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
						<div className="col-span-3">Compositions</div>
						<div className="col-span-3">Linked Content Type</div>
						<div className="col-span-2">URL</div>
						<div className="col-span-3">Modified At</div>
						<div className="col-span-1">Actions</div>
					</div>

					{/* Table Body */}
					<div className="divide-y divide-slate-200">
						{mockCompositions.map((composition, index) => (
							<div key={composition.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer">
								<div className="col-span-3">
									<div className="font-medium text-slate-900 truncate pr-2">
										{composition.name}
									</div>
									<div className="text-sm text-slate-500 truncate pr-2">
										{composition.name.toLowerCase().replace(/\s+/g, '')}
									</div>
								</div>
								
								<div className="col-span-3">
									<span className="text-slate-700">
										{composition.linkedContentType || '-'}
									</span>
								</div>
								
								<div className="col-span-2">
									<span className="text-slate-700 truncate block">
										{composition.url}
									</span>
								</div>
								
								<div className="col-span-3">
									<div className="text-slate-700">
										{composition.modifiedAt}
									</div>
									<div className="text-sm text-slate-500">
										{composition.modifiedBy}
									</div>
								</div>
								
								<div className="col-span-1 flex justify-end">
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between mt-4 text-sm text-slate-600">
					<div className="flex items-center gap-2">
						<span>Showing</span>
						<select className="border border-slate-300 rounded px-2 py-1 text-sm">
							<option>10</option>
							<option>25</option>
							<option>50</option>
						</select>
						<span>1 to 10 of 36 records</span>
					</div>
					
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" disabled>
							Previous
						</Button>
						<div className="flex items-center gap-1">
							<Button variant="default" size="sm" className="w-8 h-8 p-0">
								1
							</Button>
							<Button variant="ghost" size="sm" className="w-8 h-8 p-0">
								2
							</Button>
							<Button variant="ghost" size="sm" className="w-8 h-8 p-0">
								3
							</Button>
							<Button variant="ghost" size="sm" className="w-8 h-8 p-0">
								4
							</Button>
						</div>
						<Button variant="outline" size="sm">
							Next
						</Button>
					</div>
				</div>
			</div>

			{/* Modals */}
			<CompositionChoiceModal
				isOpen={showChoiceModal}
				onClose={() => {
					setShowChoiceModal(false)
					setInitialPrompt('')
				}}
				onCreateWithAI={handleCreateWithAI}
				onCreateManually={handleCreateManually}
			/>

			<AICompositionModal
				isOpen={showAIModal}
				onClose={() => {
					setShowAIModal(false)
					setInitialPrompt('')
				}}
				onCompositionReady={handleCompositionReady}
				initialPrompt={initialPrompt}
			/>

			<ManualCompositionModal
				isOpen={showManualModal}
				onClose={() => {
					setShowManualModal(false)
					setInitialPrompt('')
				}}
				onCompositionReady={handleCompositionReady}
			/>
		</div>
	)
}
