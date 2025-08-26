'use client'

import React from 'react'
import { ArrowLeft, Search, Save, Upload, MoreHorizontal, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StudioHeaderProps {
	onBackToCompositions?: () => void
	currentComposition?: any
}

export function StudioHeader({ onBackToCompositions, currentComposition }: StudioHeaderProps) {
	
	return (
		<header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
			{/* Left Section */}
			<div className="flex items-center gap-4">
				{onBackToCompositions && (
					<Button 
						variant="ghost" 
						size="sm" 
						onClick={onBackToCompositions}
						className="text-slate-300 hover:text-white hover:bg-slate-700"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Compositions
					</Button>
				)}
				
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
						<span className="text-white text-sm font-bold">CS</span>
					</div>
					<span className="text-white font-medium">Composable Studio</span>
				</div>
				
				<div className="text-slate-400 text-sm">
					{currentComposition ? currentComposition.name : 'Project Demo'}
				</div>
			</div>

			{/* Center Section */}
			<div className="flex items-center gap-2 max-w-md flex-1 mx-8">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
					<Input 
						placeholder="Search content" 
						className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
					/>
				</div>
			</div>

			{/* Right Section */}
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" className="bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600">
					<Save className="w-4 h-4 mr-2" />
					Save
				</Button>

				<Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
					<Upload className="w-4 h-4 mr-2" />
					Deploy
				</Button>

				<Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-700">
					<MoreHorizontal className="w-4 h-4" />
				</Button>

				<Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-700">
					<User className="w-4 h-4" />
				</Button>
			</div>
		</header>
	)
}
